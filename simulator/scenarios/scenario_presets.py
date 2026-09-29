"""
FleetSentinel AI — Failure Scenario Presets
Provides reproducible failure injection profiles for hackathon demos and automated testing.
"""

SCENARIOS = {
    "SCENARIO_HERO_ENGINE_MISFIRE": {
        "scenario_id": "SCEN_001",
        "title": "Hero Vehicle P0301 Cylinder Misfire Cascade",
        "target_vehicle": "TN01AB1234",
        "vehicle_type": "ICE",
        "make_model": "Toyota HiAce Fleet",
        "initial_health": 82,
        "degradation_trajectory": [
            {"time_min": 0, "health": 82, "temp_c": 89.0, "rpm_var": 50, "dtc": []},
            {"time_min": 15, "health": 74, "temp_c": 93.5, "rpm_var": 180, "dtc": ["P0300"]},
            {"time_min": 30, "health": 58, "temp_c": 98.2, "rpm_var": 420, "dtc": ["P0300", "P0301"]},
            {"time_min": 45, "health": 41, "temp_c": 101.8, "rpm_var": 890, "dtc": ["P0301", "P0302"]},
            {"time_min": 60, "health": 27, "temp_c": 104.5, "rpm_var": 1240, "dtc": ["P0301", "P0302", "P0300"]},
        ],
        "fingerprint_code": "ENGINE_MISFIRE",
        "expected_risk_score": 87,
        "expected_failure_horizon_hours": 24,
        "recommended_action": "Replace cylinder #1 ignition coil and inspect spark plug gap.",
    },

    "SCENARIO_EV_BATTERY_DEGRADATION": {
        "scenario_id": "SCEN_002",
        "title": "Commercial EV Battery Pack SOH Loss & Thermal Runaway",
        "target_vehicle": "KA04CD5678",
        "vehicle_type": "EV",
        "make_model": "Tata Winger EV",
        "initial_health": 76,
        "degradation_trajectory": [
            {"time_min": 0, "health": 76, "soh_pct": 72.0, "cell_delta_mv": 45, "dtc": []},
            {"time_min": 20, "health": 64, "soh_pct": 68.5, "cell_delta_mv": 95, "dtc": ["P0A80"]},
            {"time_min": 40, "health": 48, "soh_pct": 63.0, "cell_delta_mv": 140, "dtc": ["P0A80", "P0A7F"]},
            {"time_min": 60, "health": 31, "soh_pct": 58.0, "cell_delta_mv": 185, "dtc": ["P0A80", "P0A7F", "P0A94"]},
        ],
        "fingerprint_code": "BATTERY_DEGRADATION",
        "expected_risk_score": 81,
        "expected_failure_horizon_hours": 72,
        "recommended_action": "Schedule cell balancing cycle and conduct DC internal resistance diagnostics.",
    },

    "SCENARIO_COOLING_SYSTEM_FAILURE": {
        "scenario_id": "SCEN_003",
        "title": "Delivery Van Radiator Core Blockage & Impeller Cavitation",
        "target_vehicle": "MH12EF9012",
        "vehicle_type": "ICE",
        "make_model": "Mahindra Supro",
        "initial_health": 85,
        "degradation_trajectory": [
            {"time_min": 0, "health": 85, "temp_c": 88.0, "fan_duty": 40, "dtc": []},
            {"time_min": 25, "health": 71, "temp_c": 96.0, "fan_duty": 80, "dtc": ["P0115"]},
            {"time_min": 50, "health": 58, "temp_c": 103.2, "fan_duty": 100, "dtc": ["P0115", "P0128"]},
        ],
        "fingerprint_code": "COOLING_FAILURE",
        "expected_risk_score": 76,
        "expected_failure_horizon_hours": 96,
        "recommended_action": "Inspect auxiliary water pump relay and test radiator pressure cap.",
    },
}

if __name__ == "__main__":
    import json
    print(f"FleetSentinel AI: {len(SCENARIOS)} scenario profiles loaded.")
    for key, sc in SCENARIOS.items():
        print(f"  • [{sc['scenario_id']}] {sc['title']} -> Target: {sc['target_vehicle']}")
