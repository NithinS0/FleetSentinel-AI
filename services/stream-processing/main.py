"""
FleetSentinel AI — Stream Processing Service
Consumes raw telemetry → validates → deduplicates → computes sliding-window features
→ publishes to vehicle.features topic.
"""

import asyncio
import json
import logging
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Dict, Deque, Optional

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

log = logging.getLogger("stream-processor")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
KAFKA_TELEMETRY_TOPIC = os.getenv("KAFKA_TOPIC_TELEMETRY", "vehicle.telemetry")
KAFKA_FEATURES_TOPIC = os.getenv("KAFKA_TOPIC_FEATURES", "vehicle.features")
KAFKA_ANOMALIES_TOPIC = os.getenv("KAFKA_TOPIC_ANOMALIES", "vehicle.anomalies")
KAFKA_GROUP_ID = os.getenv("KAFKA_GROUP_ID", "stream-processor")
WINDOW_SIZE_SEC = int(os.getenv("WINDOW_SIZE_SECONDS", "3600"))   # 1 hour
DEDUP_WINDOW_SEC = 30


class BloomFilter:
    """Simple probabilistic deduplication (production: use Redis Bloom)."""

    def __init__(self, capacity: int = 500_000, error_rate: float = 0.01):
        import math
        self._size = int(-capacity * math.log(error_rate) / (math.log(2) ** 2))
        self._hash_count = int(self._size / capacity * math.log(2))
        self._bit_array = bytearray(self._size // 8 + 1)

    def _hashes(self, item: str):
        import hashlib
        h1 = int(hashlib.md5(item.encode()).hexdigest(), 16)
        h2 = int(hashlib.sha1(item.encode()).hexdigest(), 16)
        for i in range(self._hash_count):
            yield (h1 + i * h2) % self._size

    def add(self, item: str):
        for bit in self._hashes(item):
            self._bit_array[bit // 8] |= 1 << (bit % 8)

    def __contains__(self, item: str) -> bool:
        return all(
            self._bit_array[bit // 8] & (1 << (bit % 8))
            for bit in self._hashes(item)
        )


class SlidingWindowAggregator:
    """
    Maintains a per-vehicle sliding window of telemetry events.
    Computes aggregated feature vectors for the ML prediction layer.
    """

    def __init__(self, window_sec: int = WINDOW_SIZE_SEC):
        self.window_sec = window_sec
        # vehicle_id → deque of (timestamp, event)
        self._windows: Dict[str, Deque] = defaultdict(lambda: deque(maxlen=10000))
        self._dtc_history: Dict[str, Deque] = defaultdict(lambda: deque(maxlen=500))
        self._anomaly_counts: Dict[str, int] = defaultdict(int)
        self._harsh_brakes: Dict[str, int] = defaultdict(int)
        self._last_maintenance: Dict[str, Optional[float]] = defaultdict(lambda: None)

    def add_event(self, event: dict):
        vid = event["vehicle_id"]
        now = time.time()
        self._windows[vid].append((now, event))

        if event.get("dtc"):
            for code in event["dtc"]:
                self._dtc_history[vid].append((now, code))

        if event.get("harsh_brake"):
            self._harsh_brakes[vid] += 1

    def _prune_window(self, vid: str):
        cutoff = time.time() - self.window_sec
        w = self._windows[vid]
        while w and w[0][0] < cutoff:
            w.popleft()

    def compute_features(self, vehicle_id: str, latest: dict) -> Optional[dict]:
        """Compute feature vector for the ML model from the sliding window."""
        self._prune_window(vehicle_id)
        window = self._windows[vehicle_id]

        if len(window) < 5:
            return None  # Not enough data yet

        events = [e for _, e in window]
        now = time.time()

        # Temperature
        temps = [e.get("engine_temp_c", 0) for e in events if e.get("engine_temp_c")]
        temp_avg = sum(temps) / len(temps) if temps else 85
        temp_max = max(temps) if temps else 85
        # Trend: linear regression slope over time
        temp_trend = self._slope([e.get("engine_temp_c", 85) for e in events[-20:]])

        # RPM
        rpms = [e.get("rpm", 800) for e in events if e.get("rpm", 0) > 0]
        rpm_avg = sum(rpms) / len(rpms) if rpms else 800
        rpm_var = self._variance(rpms)

        # Speed
        speeds = [e.get("speed_kmh", 0) for e in events]
        speed_avg = sum(speeds) / len(speeds) if speeds else 0
        speed_max = max(speeds) if speeds else 0

        # Fuel
        fuels = [e.get("fuel_efficiency", 15) for e in events if e.get("fuel_efficiency")]
        fuel_avg = sum(fuels) / len(fuels) if fuels else 15
        fuel_trend = self._slope([e.get("fuel_efficiency", 15) for e in events[-20:]])

        # DTCs in last 1h and 24h
        cutoff_1h = now - 3600
        cutoff_24h = now - 86400
        dtcs_1h = [c for t, c in self._dtc_history[vehicle_id] if t > cutoff_1h]
        dtcs_24h = [c for t, c in self._dtc_history[vehicle_id] if t > cutoff_24h]

        return {
            "vehicle_id": vehicle_id,
            "tenant_id": latest.get("tenant_id"),
            "fleet_id": latest.get("fleet_id"),
            "computed_at": datetime.now(timezone.utc).isoformat(),
            # Engine
            "engine_temp_avg_1h": round(temp_avg, 2),
            "engine_temp_trend_1h": round(temp_trend, 4),
            "engine_temp_max_1h": round(temp_max, 2),
            # RPM
            "rpm_avg_1h": round(rpm_avg, 2),
            "rpm_variance_1h": round(rpm_var, 2),
            # Speed
            "speed_avg_1h": round(speed_avg, 2),
            "speed_max_1h": round(speed_max, 2),
            # Fuel
            "fuel_efficiency_avg": round(fuel_avg, 3),
            "fuel_efficiency_trend": round(fuel_trend, 4),
            # Battery
            "soc_pct": latest.get("soc_pct", 100),
            "soh_pct": latest.get("soh_pct", 95),
            # Odometer
            "odo_km": latest.get("odo_km", 0),
            # DTCs
            "dtc_count_1h": len(dtcs_1h),
            "dtc_count_24h": len(dtcs_24h),
            "dtc_codes": list(set(dtcs_1h)),
            # Behaviour
            "anomaly_count_24h": self._anomaly_counts.get(vehicle_id, 0),
            "harsh_brakes_24h": self._harsh_brakes.get(vehicle_id, 0),
            # Derived (mocked pending DB enrichment)
            "trips_7d": 7,
            "daily_distance_km_7d": 120,
            "vehicle_age_days": 365,
            "maintenance_days_ago": 60,
            # Raw latest
            "vehicle_type": latest.get("vehicle_type", "ICE"),
            "current_status": latest.get("status", "NORMAL"),
        }

    @staticmethod
    def _slope(values: list) -> float:
        n = len(values)
        if n < 2:
            return 0.0
        x = list(range(n))
        mean_x = sum(x) / n
        mean_y = sum(values) / n
        num = sum((x[i] - mean_x) * (values[i] - mean_y) for i in range(n))
        den = sum((x[i] - mean_x) ** 2 for i in range(n))
        return num / den if den != 0 else 0.0

    @staticmethod
    def _variance(values: list) -> float:
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        return sum((v - mean) ** 2 for v in values) / len(values)


def validate_event(event: dict) -> tuple[bool, Optional[str]]:
    """Schema validation for incoming telemetry events."""
    required = ["vehicle_id", "ts", "lat", "lon"]
    for field in required:
        if field not in event:
            return False, f"Missing field: {field}"

    if not isinstance(event.get("lat"), (int, float)):
        return False, "Invalid lat"
    if not (-90 <= event["lat"] <= 90):
        return False, f"Lat out of range: {event['lat']}"
    if not (-180 <= event.get("lon", 0) <= 180):
        return False, f"Lon out of range: {event.get('lon')}"
    if event.get("speed_kmh", 0) > 250:
        return False, f"Unrealistic speed: {event['speed_kmh']}"
    if event.get("engine_temp_c", 85) > 200:
        return False, f"Unrealistic temp: {event['engine_temp_c']}"

    return True, None


class StreamProcessor:
    def __init__(self):
        self.dedup = BloomFilter(capacity=2_000_000)
        self.aggregator = SlidingWindowAggregator()
        self.consumer: Optional[AIOKafkaConsumer] = None
        self.producer: Optional[AIOKafkaProducer] = None
        self._stats = {"received": 0, "valid": 0, "deduped": 0, "features_published": 0}

    async def start(self):
        self.consumer = AIOKafkaConsumer(
            KAFKA_TELEMETRY_TOPIC,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=KAFKA_GROUP_ID,
            value_deserializer=lambda v: json.loads(v.decode()),
            auto_offset_reset="latest",
            max_poll_records=1000,
            fetch_max_bytes=52428800,
        )
        self.producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode(),
            key_serializer=lambda k: k.encode() if k else None,
            compression_type="lz4",
            acks=1,
            linger_ms=10,
        )
        await self.consumer.start()
        await self.producer.start()
        log.info(f"Stream processor connected to {KAFKA_BOOTSTRAP_SERVERS}")

    async def stop(self):
        if self.consumer:
            await self.consumer.stop()
        if self.producer:
            await self.producer.stop()

    async def process(self, event: dict):
        vid = event.get("vehicle_id", "unknown")
        seq = event.get("seq", 0)

        # Deduplication using Bloom filter
        dedup_key = f"{vid}:{seq}"
        if dedup_key in self.dedup:
            self._stats["deduped"] += 1
            return
        self.dedup.add(dedup_key)

        # Validation
        valid, error = validate_event(event)
        if not valid:
            log.debug(f"Invalid event from {vid}: {error}")
            return

        self._stats["valid"] += 1

        # Update sliding window
        self.aggregator.add_event(event)

        # Publish features every ~10 events per vehicle (rate control)
        if seq % 10 == 0:
            features = self.aggregator.compute_features(vid, event)
            if features:
                await self.producer.send(
                    KAFKA_FEATURES_TOPIC,
                    key=vid,
                    value=features,
                )
                self._stats["features_published"] += 1

    async def run(self):
        await self.start()
        log.info("Stream processor running")
        last_log = time.time()

        async for message in self.consumer:
            self._stats["received"] += 1
            try:
                await self.process(message.value)
            except Exception as e:
                log.error(f"Error: {e}", exc_info=True)

            # Log stats every 10s
            if time.time() - last_log > 10:
                log.info(
                    f"Stats: received={self._stats['received']:,} "
                    f"valid={self._stats['valid']:,} "
                    f"deduped={self._stats['deduped']:,} "
                    f"features={self._stats['features_published']:,}"
                )
                last_log = time.time()


async def main():
    processor = StreamProcessor()
    try:
        await processor.run()
    except KeyboardInterrupt:
        log.info("Shutting down stream processor...")
    finally:
        await processor.stop()


if __name__ == "__main__":
    asyncio.run(main())
