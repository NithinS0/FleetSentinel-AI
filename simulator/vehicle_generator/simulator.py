"""
FleetSentinel AI — Vehicle Simulator
Generates realistic telemetry for 100,000+ vehicles at 100K+ events/sec.
"""

import asyncio
import json
import logging
import math
import os
import random
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from aiokafka import AIOKafkaProducer
from prometheus_client import Counter, Gauge, start_http_server

# ─── Logging ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
log = logging.getLogger("simulator")

# ─── Config ──────────────────────────────────────────────────────
VEHICLE_COUNT = int(os.getenv("VEHICLE_COUNT", "100000"))
EVENTS_PER_SECOND = int(os.getenv("EVENTS_PER_SECOND", "100000"))
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC_TELEMETRY", "vehicle.telemetry")
FAULT_INJECTION_RATE = float(os.getenv("FAULT_INJECTION_RATE", "0.05"))
BATCH_SIZE = 500

# ─── Prometheus Metrics ──────────────────────────────────────────
EVENTS_SENT = Counter("simulator_events_sent_total", "Total events sent")
EVENTS_PER_SEC = Gauge("simulator_events_per_second", "Events per second")
KAFKA_ERRORS = Counter("simulator_kafka_errors_total", "Kafka send errors")


# ─── Enums ───────────────────────────────────────────────────────
class VehicleType(str, Enum):
    ICE = "ICE"
    EV = "EV"
    HYBRID = "HYBRID"


class VehicleStatus(str, Enum):
    NORMAL = "NORMAL"
    DEGRADING = "DEGRADING"
    CRITICAL = "CRITICAL"
    FAILED = "FAILED"


class FaultType(str, Enum):
    ENGINE_MISFIRE = "ENGINE_MISFIRE"
    COOLING_FAILURE = "COOLING_FAILURE"
    BATTERY_DEGRADATION = "BATTERY_DEGRADATION"
    BRAKE_ISSUE = "BRAKE_ISSUE"
    SENSOR_FAULT = "SENSOR_FAULT"
    CHARGING_ISSUE = "CHARGING_ISSUE"
    TRANSMISSION_FAULT = "TRANSMISSION_FAULT"
    OIL_PRESSURE_LOW = "OIL_PRESSURE_LOW"


# DTC codes mapped to fault types
DTC_MAP = {
    FaultType.ENGINE_MISFIRE: ["P0300", "P0301", "P0302", "P0303", "P0304"],
    FaultType.COOLING_FAILURE: ["P0115", "P0116", "P0125", "P0128"],
    FaultType.BATTERY_DEGRADATION: ["P0A7F", "P0A80", "P0A94"],
    FaultType.BRAKE_ISSUE: ["C0031", "C0034", "C0040"],
    FaultType.SENSOR_FAULT: ["P0100", "P0105", "P0110", "P0335"],
    FaultType.CHARGING_ISSUE: ["P0560", "P0562", "P0620"],
    FaultType.TRANSMISSION_FAULT: ["P0700", "P0715", "P0720", "P0730"],
    FaultType.OIL_PRESSURE_LOW: ["P0520", "P0521", "P0522"],
}

# ─── Indian Cities Fleet ──────────────────────────────────────────
CITY_REGIONS = [
    {"name": "Chennai", "lat_center": 13.0827, "lon_center": 80.2707, "prefix": "TN"},
    {"name": "Bangalore", "lat_center": 12.9716, "lon_center": 77.5946, "prefix": "KA"},
    {"name": "Mumbai", "lat_center": 19.0760, "lon_center": 72.8777, "prefix": "MH"},
    {"name": "Delhi", "lat_center": 28.7041, "lon_center": 77.1025, "prefix": "DL"},
    {"name": "Hyderabad", "lat_center": 17.3850, "lon_center": 78.4867, "prefix": "TS"},
    {"name": "Pune", "lat_center": 18.5204, "lon_center": 73.8567, "prefix": "MH"},
    {"name": "Kolkata", "lat_center": 22.5726, "lon_center": 88.3639, "prefix": "WB"},
    {"name": "Ahmedabad", "lat_center": 23.0225, "lon_center": 72.5714, "prefix": "GJ"},
]


@dataclass
class VehicleState:
    """Stateful vehicle model – one per simulated vehicle."""
    vehicle_id: str
    vin: str
    vehicle_type: VehicleType
    region: dict
    fleet_id: str
    tenant_id: str

    # Position
    lat: float = 0.0
    lon: float = 0.0
    heading: float = 0.0

    # Dynamics
    speed_kmh: float = 0.0
    rpm: float = 800.0
    engine_temp_c: float = 85.0
    fuel_efficiency: float = 15.0  # km/l

    # Battery (EVs/Hybrids)
    soc_pct: float = 80.0
    soh_pct: float = 95.0

    # Trip
    odo_km: float = 0.0
    trip_distance_km: float = 0.0
    in_trip: bool = False

    # Health
    status: VehicleStatus = VehicleStatus.NORMAL
    fault_type: Optional[FaultType] = None
    fault_severity: float = 0.0  # 0.0–1.0
    fault_progression: float = 0.0  # how far along the fault is

    # Counters
    seq: int = 0
    harsh_brakes_trip: int = 0

    def __post_init__(self):
        region = self.region
        self.lat = region["lat_center"] + random.uniform(-0.3, 0.3)
        self.lon = region["lon_center"] + random.uniform(-0.3, 0.3)
        self.heading = random.uniform(0, 360)
        self.odo_km = random.uniform(1000, 150000)
        self.engine_temp_c = random.uniform(78, 92)
        self.soc_pct = random.uniform(20, 100) if self.vehicle_type != VehicleType.ICE else 100.0
        self.soh_pct = max(70, 100 - (self.odo_km / 200000) * 30 + random.uniform(-5, 5))


def make_vehicle_id(prefix: str, idx: int) -> str:
    num = str(idx % 10000).zfill(4)
    letters = "ABCDEFGH"
    l1, l2 = letters[(idx // 10000) % 8], letters[(idx // 80000) % 8]
    return f"{prefix}{l1}{l2}{num}"


def build_fleet(count: int) -> list[VehicleState]:
    """Build the initial fleet of `count` vehicles."""
    fleet = []
    vehicles_per_region = count // len(CITY_REGIONS)
    tenant_ids = [f"tenant_{i:03d}" for i in range(10)]
    fleet_ids = [f"fleet_{i:04d}" for i in range(50)]

    for r_idx, region in enumerate(CITY_REGIONS):
        for i in range(vehicles_per_region):
            global_idx = r_idx * vehicles_per_region + i
            vtype = random.choices(
                [VehicleType.ICE, VehicleType.EV, VehicleType.HYBRID],
                weights=[0.60, 0.25, 0.15],
            )[0]
            v = VehicleState(
                vehicle_id=make_vehicle_id(region["prefix"], global_idx),
                vin=f"1HG{region['prefix']}{str(global_idx).zfill(9)}",
                vehicle_type=vtype,
                region=region,
                fleet_id=random.choice(fleet_ids),
                tenant_id=random.choice(tenant_ids),
            )
            # Seed faults
            if random.random() < FAULT_INJECTION_RATE:
                v.fault_type = random.choice(list(FaultType))
                v.fault_severity = random.uniform(0.1, 0.6)
                v.fault_progression = random.uniform(0.1, 0.5)
                v.status = VehicleStatus.DEGRADING
            fleet.append(v)

    return fleet


def step_vehicle(v: VehicleState, dt: float = 1.0) -> dict:
    """Advance vehicle state by `dt` seconds and return a telemetry event."""
    v.seq += 1
    now = datetime.now(timezone.utc).isoformat()

    # ── Trip management ───────────────────────────────────────────
    if not v.in_trip and random.random() < 0.001:
        v.in_trip = True
        v.harsh_brakes_trip = 0
    if v.in_trip and random.random() < 0.0005:
        v.in_trip = False

    # ── Motion ────────────────────────────────────────────────────
    if v.in_trip:
        target_speed = random.gauss(55, 15)
        target_speed = max(0, min(120, target_speed))
    else:
        target_speed = 0.0

    v.speed_kmh += (target_speed - v.speed_kmh) * 0.1 + random.gauss(0, 1)
    v.speed_kmh = max(0, min(130, v.speed_kmh))

    # Position update
    v.heading += random.gauss(0, 2)
    dist_m = v.speed_kmh * dt / 3.6
    v.lat += dist_m * math.cos(math.radians(v.heading)) / 111320
    v.lon += dist_m * math.sin(math.radians(v.heading)) / (111320 * math.cos(math.radians(v.lat)))
    v.odo_km += dist_m / 1000

    # ── Engine / Powertrain ───────────────────────────────────────
    if v.in_trip:
        v.rpm = random.gauss(2200, 400) + v.speed_kmh * 12
    else:
        v.rpm = random.gauss(800, 50)
    v.rpm = max(0, min(6500, v.rpm))

    # Temperature
    load_heat = (v.speed_kmh / 120) * 15
    fault_heat = v.fault_severity * 25 if v.fault_type == FaultType.COOLING_FAILURE else 0
    v.engine_temp_c += load_heat * dt * 0.05 - (v.engine_temp_c - 82) * 0.02 + fault_heat * dt * 0.1 + random.gauss(0, 0.3)
    v.engine_temp_c = max(60, min(135, v.engine_temp_c))

    # Fuel efficiency degradation
    v.fuel_efficiency = 15.0 - v.fault_severity * 4 + random.gauss(0, 0.2)
    v.fuel_efficiency = max(4, min(25, v.fuel_efficiency))

    # Battery
    if v.vehicle_type != VehicleType.ICE:
        discharge = v.speed_kmh * 0.0002 * dt
        v.soc_pct = max(0, v.soc_pct - discharge)
        if v.soc_pct < 10:
            v.soc_pct = 90.0  # simulated recharge

    # ── Fault Progression ─────────────────────────────────────────
    dtcs = []
    evt = None
    harsh_brake = False

    if v.fault_type:
        v.fault_progression = min(1.0, v.fault_progression + random.uniform(0, 0.003))
        v.fault_severity = min(1.0, v.fault_severity + random.uniform(0, 0.002))

        if v.fault_progression > 0.3:
            dtc_list = DTC_MAP.get(v.fault_type, [])
            if dtc_list and random.random() < v.fault_severity:
                dtcs = random.sample(dtc_list, k=min(2, len(dtc_list)))

        if v.fault_progression >= 1.0:
            v.status = VehicleStatus.FAILED
        elif v.fault_severity > 0.7:
            v.status = VehicleStatus.CRITICAL
        elif v.fault_severity > 0.3:
            v.status = VehicleStatus.DEGRADING

    # ── Events ───────────────────────────────────────────────────
    if v.in_trip and v.speed_kmh > 40 and random.random() < 0.002:
        harsh_brake = True
        v.harsh_brakes_trip += 1
        evt = "HARSH_BRAKE"
    elif not v.in_trip and random.random() < 0.001:
        evt = "ENGINE_START" if random.random() < 0.5 else "ENGINE_STOP"

    return {
        "vehicle_id": v.vehicle_id,
        "vin": v.vin,
        "tenant_id": v.tenant_id,
        "fleet_id": v.fleet_id,
        "ts": now,
        "lat": round(v.lat, 6),
        "lon": round(v.lon, 6),
        "heading": round(v.heading % 360, 1),
        "speed_kmh": round(v.speed_kmh, 1),
        "rpm": round(v.rpm, 0),
        "engine_temp_c": round(v.engine_temp_c, 1),
        "fuel_efficiency": round(v.fuel_efficiency, 2),
        "soc_pct": round(v.soc_pct, 1),
        "soh_pct": round(v.soh_pct, 1),
        "odo_km": round(v.odo_km, 1),
        "dtc": dtcs,
        "evt": evt,
        "harsh_brake": harsh_brake,
        "vehicle_type": v.vehicle_type.value,
        "status": v.status.value,
        "fault_type": v.fault_type.value if v.fault_type else None,
        "fault_severity": round(v.fault_severity, 3),
        "in_trip": v.in_trip,
        "seq": v.seq,
    }


class FleetSimulator:
    """Main simulator orchestrating the entire fleet."""

    def __init__(self):
        self.fleet = build_fleet(VEHICLE_COUNT)
        log.info(f"Fleet built: {len(self.fleet):,} vehicles")
        self.producer: Optional[AIOKafkaProducer] = None
        self._start_time = time.time()
        self._total_sent = 0

    async def start(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode(),
            key_serializer=lambda k: k.encode() if k else None,
            compression_type="lz4",
            acks="all",
            max_batch_size=1_048_576,
            linger_ms=5,
            max_request_size=10_485_760,
        )
        await self.producer.start()
        log.info(f"Kafka producer connected to {KAFKA_BOOTSTRAP_SERVERS}")

    async def stop(self):
        if self.producer:
            await self.producer.stop()

    async def run_batch(self, batch: list[VehicleState]):
        """Step and publish a batch of vehicles."""
        events = [step_vehicle(v) for v in batch]
        tasks = [
            self.producer.send(
                KAFKA_TOPIC,
                key=e["vehicle_id"],
                value=e,
            )
            for e in events
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        sent = sum(1 for r in results if not isinstance(r, Exception))
        errors = len(results) - sent
        EVENTS_SENT.inc(sent)
        KAFKA_ERRORS.inc(errors)
        self._total_sent += sent
        return sent

    async def run(self):
        """Main simulation loop — maintains target events/sec."""
        await self.start()
        start_http_server(8080)  # Prometheus metrics
        log.info("Simulator running. Prometheus metrics on :8080")

        interval = 1.0  # seconds per tick
        target_per_tick = EVENTS_PER_SECOND * interval
        vehicle_count = len(self.fleet)

        # How many ticks we need to cover all vehicles
        ticks_per_vehicle = vehicle_count / target_per_tick
        vehicles_per_tick = int(target_per_tick)

        log.info(f"Target: {EVENTS_PER_SECOND:,} events/sec | Vehicles/tick: {vehicles_per_tick:,}")

        tick = 0
        while True:
            tick_start = time.monotonic()

            # Round-robin through the fleet
            start_idx = (tick * vehicles_per_tick) % vehicle_count
            batch = []
            for i in range(min(vehicles_per_tick, vehicle_count)):
                batch.append(self.fleet[(start_idx + i) % vehicle_count])

            sent = await self.run_batch(batch)
            elapsed = time.monotonic() - tick_start
            actual_rps = sent / max(elapsed, 0.001)
            EVENTS_PER_SEC.set(actual_rps)

            if tick % 10 == 0:
                total_elapsed = time.time() - self._start_time
                avg_rps = self._total_sent / max(total_elapsed, 1)
                log.info(
                    f"Tick {tick:6d} | Sent: {sent:5d} | "
                    f"Actual: {actual_rps:7,.0f}/s | "
                    f"Avg: {avg_rps:7,.0f}/s | "
                    f"Total: {self._total_sent:,}"
                )

            # Sleep to maintain target rate
            sleep_time = interval - elapsed
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

            tick += 1


async def main():
    sim = FleetSimulator()
    try:
        await sim.run()
    except KeyboardInterrupt:
        log.info("Shutting down simulator...")
    finally:
        await sim.stop()


if __name__ == "__main__":
    asyncio.run(main())
