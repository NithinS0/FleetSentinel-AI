"""
Unit Tests for FleetSentinel AI Health Scoring & Risk Engine
"""

import pytest


def calculate_vehicle_health(telemetry: dict) -> dict:
    """
    Core vehicle health calculation algorithm.
    Health score ranges 0 - 100.
    Risk score ranges 0 - 100.
    """
    health = 100.0
    anomalies = []

    # 1. Thermal checks
    engine_temp = telemetry.get("engine_temp_c", 85.0)
    if engine_temp > 102.0:
        health -= min(40.0, (engine_temp - 100.0) * 8.0)
        anomalies.append(f"CRITICAL_OVERHEAT_{engine_temp}C")
    elif engine_temp > 95.0:
        health -= 15.0
        anomalies.append("ELEVATED_TEMPERATURE")

    # 2. DTC diagnostic trouble codes
    dtcs = telemetry.get("dtc_codes", [])
    if dtcs:
        misfires = [c for c in dtcs if c.startswith("P03")]
        if misfires:
            health -= min(35.0, len(misfires) * 12.0)
            anomalies.append(f"CYLINDER_MISFIRE_DTC_{len(misfires)}")
        else:
            health -= len(dtcs) * 5.0

    # 3. EV battery State-of-Health (if EV)
    if telemetry.get("vehicle_type") == "EV":
        soh = telemetry.get("soh_pct", 100.0)
        if soh < 65.0:
            health -= 45.0
            anomalies.append(f"BATTERY_SOH_DEGRADED_{soh}%")
        elif soh < 80.0:
            health -= 20.0

    # Clamp health between 0 and 100
    final_health = max(0.0, min(100.0, round(health, 1)))
    failure_risk = max(0.0, min(100.0, round(100.0 - final_health, 1)))

    status = "NORMAL"
    if final_health < 40.0:
        status = "CRITICAL"
    elif final_health < 75.0:
        status = "DEGRADING"

    return {
        "vehicle_id": telemetry.get("vehicle_id"),
        "health_score": final_health,
        "failure_risk_score": failure_risk,
        "status": status,
        "anomalies": anomalies,
    }


def test_healthy_vehicle_nominal_telemetry():
    telemetry = {
        "vehicle_id": "TN03CD2345",
        "vehicle_type": "ICE",
        "engine_temp_c": 88.0,
        "dtc_codes": [],
    }
    result = calculate_vehicle_health(telemetry)
    assert result["health_score"] == 100.0
    assert result["failure_risk_score"] == 0.0
    assert result["status"] == "NORMAL"
    assert len(result["anomalies"]) == 0


def test_hero_vehicle_critical_misfire_and_overheat():
    telemetry = {
        "vehicle_id": "TN01AB1234",
        "vehicle_type": "ICE",
        "engine_temp_c": 104.5,
        "dtc_codes": ["P0300", "P0301", "P0302"],
    }
    result = calculate_vehicle_health(telemetry)
    assert result["health_score"] < 40.0
    assert result["status"] == "CRITICAL"
    assert result["failure_risk_score"] > 60.0
    assert any("CRITICAL_OVERHEAT" in a for a in result["anomalies"])
    assert any("CYLINDER_MISFIRE" in a for a in result["anomalies"])


def test_ev_battery_degradation_alert():
    telemetry = {
        "vehicle_id": "KA04CD5678",
        "vehicle_type": "EV",
        "soh_pct": 58.0,
        "dtc_codes": ["P0A80"],
    }
    result = calculate_vehicle_health(telemetry)
    assert result["health_score"] <= 55.0
    assert result["status"] in ["DEGRADING", "CRITICAL"]
    assert any("BATTERY_SOH_DEGRADED" in a for a in result["anomalies"])
