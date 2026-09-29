import os
import sys
import json
import random
import math
import psycopg2
from psycopg2.extras import execute_values

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

def generate_random_vector(dim=128, seed_val=42):
    random.seed(seed_val)
    vec = [random.gauss(0, 1) for _ in range(dim)]
    norm = math.sqrt(sum(x*x for x in vec))
    return [round(x / norm, 6) for x in vec]

def main():
    print("================================================================")
    print("FleetSentinel AI — Supabase Database Architecture Deployment")
    print("================================================================")
    
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # Step 1: Execute Migration DDL
        print("\n[1/4] Applying 001_production_schema.sql DDL...")
        schema_path = os.path.join(os.path.dirname(__file__), "migrations", "001_production_schema.sql")
        with open(schema_path, "r", encoding="utf-8") as f:
            ddl_sql = f.read()
        cur.execute(ddl_sql)
        conn.commit()
        print("  ✓ Schema migration successfully applied (28 tables, views, RLS, triggers, functions).")

        # Step 2: Seed Organizations & Fleets
        print("\n[2/4] Seeding Multi-Tenant Organizations, Fleets & Members...")
        orgs = [
            ("FleetOps India", "fleetops-india", "Logistics & Freight", "India", "Asia/Kolkata", "enterprise"),
            ("Metro Mobility", "metro-mobility", "Passenger Transit & EV Cabs", "India", "Asia/Kolkata", "enterprise"),
            ("Urban Logistics", "urban-logistics", "Last-Mile E-Commerce Delivery", "India", "Asia/Kolkata", "growth"),
        ]
        org_ids = {}
        for name, slug, ind, country, tz, plan in orgs:
            cur.execute("""
                INSERT INTO organizations (name, slug, industry, country, timezone, subscription_plan, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'active')
                RETURNING id, slug;
            """, (name, slug, ind, country, tz, plan))
            oid, s = cur.fetchone()
            org_ids[s] = oid
            print(f"  ✓ Organization: {name} (ID: {oid})")

        # Create Demo User in auth.users if not present, then assign to org_members
        cur.execute("SELECT id FROM auth.users WHERE email = 'admin@fleetsentinel.ai' LIMIT 1;")
        admin_user_row = cur.fetchone()
        if admin_user_row:
            admin_uid = admin_user_row[0]
        else:
            cur.execute("""
                INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
                VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@fleetsentinel.ai', crypt('Sentinel@2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fleet Director"}', now(), now())
                RETURNING id;
            """)
            admin_uid = cur.fetchone()[0]

        # Add Organization Memberships for admin
        for slug, oid in org_ids.items():
            cur.execute("""
                INSERT INTO organization_members (organization_id, user_id, role, status)
                VALUES (%s, %s, 'owner', 'active')
                ON CONFLICT (organization_id, user_id) DO NOTHING;
            """, (oid, admin_uid))

        # Fleets
        fleets_data = [
            (org_ids["fleetops-india"], "Chennai Metro Delivery", "Urban medium-duty trucks and vans serving Greater Chennai", "South India"),
            (org_ids["fleetops-india"], "Mumbai Freight Network", "Heavy commercial vehicles connecting JNPT port to distribution centers", "West India"),
            (org_ids["metro-mobility"], "Bangalore EV Fleet", "Electric multi-utility vans and passenger shuttles across Electronic City", "South India"),
            (org_ids["metro-mobility"], "Delhi NCR Regional Transit", "Inter-city commercial express vans serving Delhi-Gurgaon-Noida corridor", "North India"),
            (org_ids["urban-logistics"], "Gujarat Industrial Logistics", "CNG and diesel logistics fleet operating across Ahmedabad and Sanand", "West India"),
            (org_ids["urban-logistics"], "Hyderabad Express Linehaul", "High-velocity delivery fleet serving Hyderabad-Secunderabad pharma hub", "South India"),
        ]
        fleet_ids = []
        for org_id, fname, fdesc, fregion in fleets_data:
            cur.execute("""
                INSERT INTO fleets (organization_id, name, description, region, status)
                VALUES (%s, %s, %s, %s, 'active')
                RETURNING id, name;
            """, (org_id, fname, fdesc, fregion))
            fid, fn = cur.fetchone()
            fleet_ids.append((fid, fn, org_id))
            print(f"  ✓ Fleet: {fname}")

        # Step 3: Failure Types & Fingerprints Library
        print("\n[3/4] Seeding Failure Types & 128-D Vector Fingerprints...")
        failure_types_data = [
            ("ENGINE_MISFIRE", "Engine Misfire & Cylinder Imbalance", "Cylinder combustion failure causing power loss, unburnt fuel exhaust, and catalytic overheating.", "critical", "Powertrain"),
            ("BATTERY_DEGRADATION", "Lithium-Ion Battery Degradation", "Irreversible loss of battery capacity and internal resistance surge across EV battery modules.", "critical", "Energy Storage"),
            ("COOLING_SYSTEM", "Cooling System & Thermostat Failure", "Coolant circulation failure, stuck thermostat, or radiator thermal saturation causing engine overheating.", "high", "Thermal"),
            ("BRAKE_SYSTEM", "Brake Pad Wear & Hydraulic Fade", "Friction lining wear exceeding minimum thickness with brake fluid boiling point degradation.", "high", "Safety / Chassis"),
            ("TRANSMISSION", "Automatic Transmission Slip", "Torque converter clutch slippage and hydraulic line pressure degradation during ratio changes.", "high", "Drivetrain"),
            ("SENSOR_FAILURE", "CAN-Bus MAF / O2 Sensor Drift", "Mass Air Flow or Heated Oxygen Sensor signal drift exceeding adaptive trim thresholds.", "medium", "Electrical"),
            ("CHARGING_SYSTEM", "Onboard Charger / Inverter Thermal Stress", "High AC/DC ripple voltage and switching thermal overload during DC fast charging.", "medium", "EV Electronics"),
        ]
        ft_ids = {}
        for code, name, desc, sev, cat in failure_types_data:
            cur.execute("""
                INSERT INTO failure_types (code, name, description, severity, category)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, code;
            """, (code, name, desc, sev, cat))
            ft_id, ft_code = cur.fetchone()
            ft_ids[ft_code] = ft_id

        # Failure Fingerprints with 128-D vectors
        fingerprints = [
            (
                ft_ids["ENGINE_MISFIRE"],
                "Engine Misfire Prototype ENG-01",
                "Characteristic multi-sensor signature: engine temperature elevation + crank speed micro-fluctuations + P0301/P0302 DTC codes + fuel efficiency decline.",
                json.dumps(["Rough idling", "Exhaust backfire", "Loss of acceleration under load"]),
                json.dumps(["P0300", "P0301", "P0302", "P0171"]),
                json.dumps({"temp_rise_pct": 12.4, "rpm_variance_pct": 27.0, "fuel_drop_pct": 14.0}),
                142,
                0.7800,
                generate_random_vector(128, 101)
            ),
            (
                ft_ids["BATTERY_DEGRADATION"],
                "EV Battery Electrochemical Degradation Prototype EV-BMS-02",
                "Cell voltage delta exceeding 180mV under discharge + rapid voltage drop during high regenerative braking + SOH below 65%.",
                json.dumps(["Reduced range", "Premature power limiting (turtle mode)", "Extended charging time"]),
                json.dumps(["BMS04", "BMS18", "P0A7F", "P0A80"]),
                json.dumps({"soh_below": 65, "cell_delta_mv": 180, "dcir_surge_pct": 22}),
                97,
                0.8000,
                generate_random_vector(128, 102)
            ),
            (
                ft_ids["COOLING_SYSTEM"],
                "Cooling System Saturation CLG-01",
                "Coolant temperature exceeding 102°C while radiator core delta remains below 3°C indicating water pump impeller slip or thermostat stuck closed.",
                json.dumps(["Temperature gauge pegged", "Coolant boiling in expansion tank", "AC compressor cut-off"]),
                json.dumps(["P00B7", "P0128", "P0217"]),
                json.dumps({"temp_above_c": 102, "radiator_delta_below_c": 3, "fan_duty_pct": 100}),
                63,
                0.7500,
                generate_random_vector(128, 103)
            ),
            (
                ft_ids["BRAKE_SYSTEM"],
                "Brake Hydraulic Degradation & Rotor Fade BRK-03",
                "Stopping distance increase combined with wheel speed sensor deceleration variance during sustained grade descent.",
                json.dumps(["Spongy brake pedal", "Steering pull under braking", "ABS indicator lamp"]),
                json.dumps(["C0035", "C0040", "C1201"]),
                json.dumps({"fluid_temp_c": 140, "pad_thickness_mm": 2.2, "decel_variance": 0.18}),
                54,
                0.7400,
                generate_random_vector(128, 104)
            ),
            (
                ft_ids["TRANSMISSION"],
                "Automatic Transmission Slippage TRN-02",
                "Engine RPM spike between 2nd and 3rd gear shift with hydraulic line pressure drop below 80 PSI.",
                json.dumps(["Delayed upshift", "Harsh engagement into drive", "Burnt ATF odor"]),
                json.dumps(["P0730", "P0732", "P0741"]),
                json.dumps({"slip_ratio": 1.34, "line_pressure_psi": 72, "fluid_temp_c": 115}),
                41,
                0.7200,
                generate_random_vector(128, 105)
            ),
        ]
        fp_ids = {}
        for ft_id, name, desc, sym, dtc_pat, tel_pat, count, sim, vec in fingerprints:
            cur.execute("""
                INSERT INTO failure_fingerprints (failure_type_id, name, description, symptoms, dtc_patterns, telemetry_patterns, historical_case_count, similarity_threshold, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, name;
            """, (ft_id, name, desc, sym, dtc_pat, tel_pat, count, sim, vec))
            fpid, fpname = cur.fetchone()
            fp_ids[name] = fpid
            print(f"  ✓ Fingerprint Archetype: {name} (128-D vector indexed)")

        # Step 4: Seed 100+ Vehicles with Realistic Telemetry & Specific Demo Highlights
        print("\n[4/4] Seeding 100+ Vehicles, Drivers, Trips, Predictions & Alerts...")
        
        # Drivers (25 drivers)
        driver_names = [
            ("Rajesh Kumar", "EMP-1001", "+91 98401 23456", "rajesh.k@fleetops.in"),
            ("Suresh Menon", "EMP-1002", "+91 98402 34567", "suresh.m@fleetops.in"),
            ("Anand Ramanathan", "EMP-1003", "+91 98403 45678", "anand.r@fleetops.in"),
            ("Vikram Singh", "EMP-1004", "+91 98404 56789", "vikram.s@metromobility.in"),
            ("Priya Sundaram", "EMP-1005", "+91 98405 67890", "priya.s@metromobility.in"),
            ("Mohammed Farooq", "EMP-1006", "+91 98406 78901", "farooq.m@urbanlogistics.in"),
            ("Amit Sharma", "EMP-1007", "+91 98407 89012", "amit.s@urbanlogistics.in"),
            ("Kavitha Reddy", "EMP-1008", "+91 98408 90123", "kavitha.r@fleetops.in"),
            ("Gopalakrishnan N.", "EMP-1009", "+91 98409 01234", "gopal.n@fleetops.in"),
            ("Deepak Verma", "EMP-1010", "+91 98410 12345", "deepak.v@metromobility.in"),
            ("Ramesh Patel", "EMP-1011", "+91 98411 23456", "ramesh.p@urbanlogistics.in"),
            ("Arjun Nair", "EMP-1012", "+91 98412 34567", "arjun.n@fleetops.in"),
            ("Sanjay Joshi", "EMP-1013", "+91 98413 45678", "sanjay.j@fleetops.in"),
            ("Manoj Tiwari", "EMP-1014", "+91 98414 56789", "manoj.t@metromobility.in"),
            ("Sunil Rao", "EMP-1015", "+91 98415 67890", "sunil.r@metromobility.in"),
            ("Vijay Merchant", "EMP-1016", "+91 98416 78901", "vijay.m@urbanlogistics.in"),
            ("Prashant Kadam", "EMP-1017", "+91 98417 89012", "prashant.k@fleetops.in"),
            ("Harish Iyer", "EMP-1018", "+91 98418 90123", "harish.i@fleetops.in"),
            ("Naveen Chawla", "EMP-1019", "+91 98419 01234", "naveen.c@metromobility.in"),
            ("Kiran Deshmukh", "EMP-1020", "+91 98420 12345", "kiran.d@urbanlogistics.in"),
            ("Ashok Jadhav", "EMP-1021", "+91 98421 23456", "ashok.j@urbanlogistics.in"),
            ("Dinesh Pillai", "EMP-1022", "+91 98422 34567", "dinesh.p@fleetops.in"),
            ("Raghavendra B.", "EMP-1023", "+91 98423 45678", "raghu.b@metromobility.in"),
            ("Santosh Gaikwad", "EMP-1024", "+91 98424 56789", "santosh.g@fleetops.in"),
            ("Karthik Natarajan", "EMP-1025", "+91 98425 67890", "karthik.n@fleetops.in"),
        ]
        driver_ids = []
        for dname, code, phone, email in driver_names:
            cur.execute("""
                INSERT INTO drivers (organization_id, name, employee_code, phone, email, status)
                VALUES (%s, %s, %s, %s, %s, 'active')
                RETURNING id;
            """, (org_ids["fleetops-india"], dname, code, phone, email))
            driver_ids.append(cur.fetchone()[0])

        # Specific Highlighted Vehicles Specs (Section 38 & prompt requirements)
        special_vehicles = [
            {
                "reg": "TN01AB1234",
                "vin": "MA3EKB12S00101234",
                "make": "Toyota", "model": "HiAce Super GL", "year": 2023,
                "type": "van", "fuel": "diesel", "fleet_idx": 0,
                "health": 27.00, "risk": 87.00, "risk_level": "critical",
                "lat": 13.0827, "lng": 80.2707, "speed": 42.5, "temp": 104.5, "soc": 84.0, "odo": 48210.5,
                "failure_code": "ENGINE_MISFIRE", "dtc": "P0301",
                "failure_prob": 0.8740, "confidence": 0.9450,
                "alert_title": "Severe Cylinder #1 Misfire & Thermal Stress (P0301)",
                "alert_sev": "critical",
                "evidence": [
                    ("engine_temperature", "104.5°C", "88.0°C", 12.4, 0.91, "Engine coolant temperature elevated significantly above normal operating range."),
                    ("p0301_frequency", "38 count/hr", "0 count/hr", 38.0, 0.88, "High frequency of intermittent misfire counts recorded on cylinder #1."),
                    ("rpm_crank_variance", "27.0%", "4.2%", 27.0, 0.82, "Abnormal crankshaft rotational speed micro-fluctuations during acceleration."),
                    ("fuel_efficiency", "8.4 km/L", "11.2 km/L", -14.0, 0.65, "Thermal loss and incomplete combustion reducing fuel efficiency.")
                ]
            },
            {
                "reg": "KA04CD5678",
                "vin": "MAT612045P0025678",
                "make": "Tata", "model": "Winger EV Commercial", "year": 2024,
                "type": "van", "fuel": "electric", "fleet_idx": 2,
                "health": 31.00, "risk": 81.00, "risk_level": "critical",
                "lat": 12.9716, "lng": 77.5946, "speed": 34.0, "temp": 46.2, "soc": 48.0, "odo": 32410.0,
                "failure_code": "BATTERY_DEGRADATION", "dtc": "BMS04",
                "failure_prob": 0.8120, "confidence": 0.9100,
                "alert_title": "BMS Cell Delta Exceeds 180mV Safety Threshold (BMS04)",
                "alert_sev": "critical",
                "evidence": [
                    ("cell_voltage_delta", "192 mV", "28 mV", 580.0, 0.94, "Cell group #14 exhibits rapid voltage drop under 80kW acceleration load."),
                    ("state_of_health", "62.4%", "95.0%", -34.3, 0.89, "Calculated usable cell capacity severely degraded."),
                    ("internal_resistance_dcir", "4.8 mΩ", "2.1 mΩ", 128.0, 0.79, "Internal impedance buildup causing cell overheating.")
                ]
            },
            {
                "reg": "MH12EF9012",
                "vin": "MA1PA2300N0039012",
                "make": "Mahindra", "model": "Supro Maxi Truck", "year": 2023,
                "type": "truck", "fuel": "diesel", "fleet_idx": 1,
                "health": 58.00, "risk": 76.00, "risk_level": "high",
                "lat": 19.0760, "lng": 72.8777, "speed": 58.0, "temp": 99.8, "soc": 88.0, "odo": 61200.0,
                "failure_code": "COOLING_SYSTEM", "dtc": "P00B7",
                "failure_prob": 0.7600, "confidence": 0.8750,
                "alert_title": "Low Radiator Flow Differential & Thermostat Lag (P00B7)",
                "alert_sev": "high",
                "evidence": [
                    ("radiator_core_delta", "2.8°C", "16.5°C", -83.0, 0.92, "Radiator inlet/outlet temperature differential critically low, indicating coolant pump slip."),
                    ("cooling_fan_duty", "100%", "45%", 122.0, 0.78, "Primary electric cooling fan operating continuously at maximum duty cycle.")
                ]
            },
            {
                "reg": "DL09GH3456",
                "vin": "MBL402100R0043456",
                "make": "Force", "model": "Traveller 3050", "year": 2022,
                "type": "van", "fuel": "diesel", "fleet_idx": 3,
                "health": 62.00, "risk": 71.00, "risk_level": "high",
                "lat": 28.6139, "lng": 77.2090, "speed": 51.0, "temp": 92.4, "soc": 86.0, "odo": 89450.0,
                "failure_code": "TRANSMISSION", "dtc": "P0730",
                "failure_prob": 0.7100, "confidence": 0.8400,
                "alert_title": "Automatic Transmission Gear Ratio Slip (P0730)",
                "alert_sev": "high",
                "evidence": [
                    ("clutch_slip_ratio", "1.28", "1.00", 28.0, 0.86, "Torque converter clutch slip observed during 2nd to 3rd gear upshift."),
                    ("atf_temperature", "118.0°C", "85.0°C", 38.8, 0.74, "Transmission fluid temperature running hot.")
                ]
            },
            {
                "reg": "KA03IJ7890",
                "vin": "MB1LE2400S0057890",
                "make": "Ashok Leyland", "model": "DOST Strong", "year": 2023,
                "type": "truck", "fuel": "diesel", "fleet_idx": 2,
                "health": 61.00, "risk": 68.00, "risk_level": "high",
                "lat": 13.0500, "lng": 77.5200, "speed": 48.0, "temp": 89.0, "soc": 85.0, "odo": 54200.0,
                "failure_code": "BRAKE_SYSTEM", "dtc": "C0035",
                "failure_prob": 0.6800, "confidence": 0.8200,
                "alert_title": "Brake Lining Wear & ABS Speed Sensor Glitch (C0035)",
                "alert_sev": "high",
                "evidence": [
                    ("front_pad_thickness", "2.1 mm", "10.0 mm", -79.0, 0.90, "Front disc brake friction pads worn past 3mm replacement threshold.")
                ]
            }
        ]

        # Generate 102 total vehicles (5 special + 97 generated)
        indian_cities = [
            ("Chennai", 13.0827, 80.2707),
            ("Bangalore", 12.9716, 77.5946),
            ("Mumbai", 19.0760, 72.8777),
            ("Delhi", 28.6139, 77.2090),
            ("Ahmedabad", 23.0225, 72.5714),
            ("Hyderabad", 17.3850, 78.4867),
            ("Pune", 18.5204, 73.8567),
            ("Coimbatore", 11.0168, 76.9558),
            ("Jaipur", 26.9124, 75.7873),
            ("Kolkata", 22.5726, 88.3639),
        ]
        makes_models = [
            ("Tata", "Ace Gold", "truck", "diesel"),
            ("Tata", "Nexon EV", "suv", "electric"),
            ("Mahindra", "Bolero Maxi Truck", "truck", "diesel"),
            ("Ashok Leyland", "Bada Dost", "truck", "diesel"),
            ("Force", "Urbania", "van", "diesel"),
            ("Eicher", "Pro 2049", "truck", "diesel"),
            ("Maruti Suzuki", "Super Carry", "truck", "cng"),
            ("Toyota", "Innova Crysta", "car", "diesel"),
            ("Piaggio", "Ape E-City", "motorcycle", "electric"),
            ("Tata", "Ultra T.7", "truck", "diesel"),
        ]

        all_vehicles_inserted = []

        # Insert 5 special vehicles first
        for sv in special_vehicles:
            fleet_id = fleet_ids[sv["fleet_idx"]][0]
            cur.execute("""
                INSERT INTO vehicles (fleet_id, vin, registration_number, make, model, model_year, vehicle_type, fuel_type, status, health_score, risk_score, last_seen_at, latitude, longitude, odometer_km)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active', %s, %s, now(), %s, %s, %s)
                RETURNING id;
            """, (fleet_id, sv["vin"], sv["reg"], sv["make"], sv["model"], sv["year"], sv["type"], sv["fuel"], sv["health"], sv["risk"], sv["lat"], sv["lng"], sv["odo"]))
            vid = cur.fetchone()[0]
            all_vehicles_inserted.append((vid, sv["reg"], sv))

            # Current state
            cur.execute("""
                INSERT INTO vehicle_current_state (vehicle_id, latitude, longitude, speed_kmh, engine_temp_c, battery_soc, health_score, risk_score, risk_level, last_event_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now());
            """, (vid, sv["lat"], sv["lng"], sv["speed"], sv["temp"], sv["soc"], sv["health"], sv["risk"], sv["risk_level"]))

            # Failure prediction
            ftype_id = ft_ids[sv["failure_code"]]
            cur.execute("""
                INSERT INTO failure_predictions (vehicle_id, failure_type_id, probability, risk_level, expected_start_at, expected_end_at, model_version, confidence, status, predicted_at)
                VALUES (%s, %s, %s, %s, now() + interval '2 days', now() + interval '5 days', 'rul_xgb_v1.2', %s, 'active', now())
                RETURNING id;
            """, (vid, ftype_id, sv["failure_prob"], sv["risk_level"], sv["confidence"]))
            pred_id = cur.fetchone()[0]

            # Evidence
            for sname, sval, bval, cpct, iscore, desc in sv["evidence"]:
                cur.execute("""
                    INSERT INTO prediction_evidence (prediction_id, signal_name, signal_value, baseline_value, change_percentage, importance_score, description)
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                """, (pred_id, sname, sval, bval, cpct, iscore, desc))

            # Fingerprint match
            if sv["reg"] == "TN01AB1234":
                cur.execute("""
                    INSERT INTO fingerprint_matches (prediction_id, fingerprint_id, similarity_score, matching_signals, matched_at)
                    VALUES (%s, %s, 0.9140, %s, now());
                """, (pred_id, fp_ids["Engine Misfire Prototype ENG-01"], json.dumps(["engine_temp_rise", "p0301_dtc_count", "rpm_variance"])))

            # Alert
            org_id = fleet_ids[sv["fleet_idx"]][2]
            cur.execute("""
                INSERT INTO alerts (organization_id, fleet_id, vehicle_id, prediction_id, title, description, severity, status, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'open', 'telemetry_anomaly_engine')
                RETURNING id;
            """, (org_id, fleet_id, vid, pred_id, sv["alert_title"], f"Predictive model flagged {sv['failure_code']} with {int(sv['failure_prob']*100)}% probability.", sv["alert_sev"]))
            alt_id = cur.fetchone()[0]

            # Maintenance Recommendation
            cur.execute("""
                INSERT INTO maintenance_recommendations (vehicle_id, prediction_id, recommended_action, priority, recommended_by, reason, estimated_downtime_hours, estimated_cost, status)
                VALUES (%s, %s, %s, %s, 'FleetSentinel AI Copilot', %s, 4.5, 380.00, 'pending');
            """, (vid, pred_id, f"Inspect and replace cylinder #1 spark plug and ignition coil assembly on {sv['reg']}.", sv["alert_sev"], sv["evidence"][0][5]))

            # What-If Delay Scenarios
            scenarios = [
                (0, sv["failure_prob"] * 0.35, 2.1, 340.00),
                (1, sv["failure_prob"] * 0.55, 5.7, 780.00),
                (3, sv["failure_prob"] * 0.85, 8.9, 1420.00),
                (7, min(1.0, sv["failure_prob"] * 1.15), 11.4, 2850.00),
            ]
            for delay, prisk, dt_h, cost in scenarios:
                cur.execute("""
                    INSERT INTO maintenance_scenarios (vehicle_id, prediction_id, delay_days, predicted_risk, estimated_downtime_hours, estimated_cost, model_version)
                    VALUES (%s, %s, %s, %s, %s, %s, 'rul_monte_carlo_v1.0');
                """, (vid, pred_id, delay, round(prisk, 4), dt_h, cost))

            # Diagnostic Event
            cur.execute("""
                INSERT INTO diagnostic_events (vehicle_id, event_time, dtc_code, severity, description, status)
                VALUES (%s, now() - interval '20 minutes', %s, %s, %s, 'active');
            """, (vid, sv["dtc"], sv["alert_sev"], sv["alert_title"]))

        # Now insert 97 more realistic commercial fleet vehicles
        print("  ✓ Inserting 97 additional commercial vehicles to reach 102 active assets...")
        rto_codes = ["TN02", "TN05", "KA01", "KA05", "MH14", "MH43", "DL01", "DL03", "GJ01", "TS07", "AP09", "HR26"]
        
        for i in range(1, 98):
            rto = random.choice(rto_codes)
            reg = f"{rto}{chr(65 + (i % 26))}{chr(65 + ((i*3) % 26))}{random.randint(1000, 9999)}"
            vin = f"MAT{random.randint(100000, 999999)}P{random.randint(10000, 99999)}"
            make, model, vtype, ftype = random.choice(makes_models)
            fl_idx = i % len(fleet_ids)
            fleet_id = fleet_ids[fl_idx][0]
            org_id = fleet_ids[fl_idx][2]
            
            # Health distribution: ~85% healthy (82-99), ~12% at risk (50-78), ~3% critical (<50)
            rand_roll = random.random()
            if rand_roll < 0.85:
                health = round(random.uniform(82.0, 98.5), 2)
                raw_risk = round(100.0 - health + random.uniform(-2, 2), 2)
                risk = max(1.00, min(99.00, raw_risk))
                r_level = "low" if risk < 20 else "medium"
            elif rand_roll < 0.96:
                health = round(random.uniform(50.0, 78.0), 2)
                risk = max(1.00, min(99.00, round(random.uniform(45.0, 68.0), 2)))
                r_level = "high"
            else:
                health = round(random.uniform(28.0, 48.0), 2)
                risk = max(1.00, min(99.00, round(random.uniform(72.0, 89.0), 2)))
                r_level = "critical"

            city, base_lat, base_lng = random.choice(indian_cities)
            lat = round(base_lat + random.uniform(-0.15, 0.15), 6)
            lng = round(base_lng + random.uniform(-0.15, 0.15), 6)
            speed = round(random.uniform(0.0, 75.0), 1)
            temp = round(random.uniform(78.0, 96.0), 1)
            soc = round(random.uniform(25.0, 98.0), 1)
            odo = round(random.uniform(12000.0, 185000.0), 1)

            cur.execute("""
                INSERT INTO vehicles (fleet_id, vin, registration_number, make, model, model_year, vehicle_type, fuel_type, status, health_score, risk_score, last_seen_at, latitude, longitude, odometer_km)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'active', %s, %s, now() - interval '%s minutes', %s, %s, %s)
                RETURNING id;
            """, (fleet_id, vin, reg, make, model, random.randint(2020, 2024), vtype, ftype, health, risk, random.randint(1, 120), lat, lng, odo))
            vid = cur.fetchone()[0]
            all_vehicles_inserted.append((vid, reg, None))

            # Current state
            cur.execute("""
                INSERT INTO vehicle_current_state (vehicle_id, latitude, longitude, speed_kmh, engine_temp_c, battery_soc, health_score, risk_score, risk_level, last_event_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now());
            """, (vid, lat, lng, speed, temp, soc, health, risk, r_level))

            # Assign driver
            driver_id = random.choice(driver_ids)
            cur.execute("""
                INSERT INTO vehicle_driver_assignments (vehicle_id, driver_id, started_at, is_current)
                VALUES (%s, %s, now() - interval '30 days', true);
            """, (vid, driver_id))

            # Generate a trip
            cur.execute("""
                INSERT INTO trips (vehicle_id, driver_id, started_at, ended_at, start_latitude, start_longitude, end_latitude, end_longitude, distance_km, duration_seconds, avg_speed_kmh, max_speed_kmh, fuel_consumed)
                VALUES (%s, %s, now() - interval '4 hours', now() - interval '1 hour', %s, %s, %s, %s, %s, 10800, %s, %s, %s);
            """, (vid, driver_id, lat - 0.05, lng - 0.05, lat, lng, round(random.uniform(25.0, 120.0), 1), speed, speed + 15, round(random.uniform(3.5, 14.0), 1)))

            # Insert sample telemetry readings (3 events per vehicle)
            for t_step in range(3):
                cur.execute("""
                    INSERT INTO vehicle_telemetry (vehicle_id, event_time, latitude, longitude, speed_kmh, engine_temp_c, rpm, battery_soc, fuel_efficiency, odometer_km)
                    VALUES (%s, now() - interval '%s minutes', %s, %s, %s, %s, %s, %s, %s, %s);
                """, (vid, (t_step + 1) * 15, lat, lng, speed, temp, random.randint(1200, 2800), soc, round(random.uniform(9.0, 15.0), 1), odo - t_step))

            # Alerts for high/critical vehicles
            if r_level in ('critical', 'high'):
                cur.execute("""
                    INSERT INTO alerts (organization_id, fleet_id, vehicle_id, title, description, severity, status, source)
                    VALUES (%s, %s, %s, %s, %s, %s, 'open', 'telemetry_anomaly_engine');
                """, (org_id, fleet_id, vid, f"Abnormal sensor drift detected on {reg}", f"Telemetry rolling z-score exceeded threshold across multiple dimensions.", r_level))

        # Update vehicle counts on fleets
        cur.execute("""
            UPDATE fleets f
            SET vehicle_count = (SELECT COUNT(*) FROM vehicles v WHERE v.fleet_id = f.id);
        """)

        # System Metrics & Model Versions
        print("\n[5/5] Seeding System Metrics, AI Conversations & Model Metadata...")
        metrics = [
            ("events_per_second", 103482, "events/sec"),
            ("kafka_consumer_lag", 14, "messages"),
            ("api_p95_ms", 38.4, "ms"),
            ("api_p99_ms", 84.1, "ms"),
            ("prediction_latency_ms", 42.0, "ms"),
            ("active_alerts", 184, "alerts"),
            ("healthy_fleet_pct", 91.2, "%"),
        ]
        for mname, mval, unit in metrics:
            cur.execute("""
                INSERT INTO system_metrics (metric_name, metric_value, unit, recorded_at, metadata)
                VALUES (%s, %s, %s, now(), '{"cluster":"prod-asia-south1"}');
            """, (mname, mval, unit))

        # Model Versions
        models = [
            ("rul_xgb_regressor", "v1.2.0", "xgboost", json.dumps({"f1": 0.925, "precision": 0.94, "recall": 0.91, "roc_auc": 0.962})),
            ("telemetry_anomaly_isoforest", "v2.1.0", "isolation_forest", json.dumps({"accuracy": 0.981, "contamination": 0.05})),
            ("pgvector_hnsw_prototype_matcher", "v1.0.0", "vector_embeddings", json.dumps({"dimensions": 128, "index_type": "HNSW", "m": 16, "ef_construction": 64})),
        ]
        for mname, mver, mtype, mmets in models:
            cur.execute("""
                INSERT INTO model_versions (model_name, version, model_type, metrics, status, deployed_at)
                VALUES (%s, %s, %s, %s, 'deployed', now());
            """, (mname, mver, mtype, mmets))

        # AI Copilot Conversation for admin
        cur.execute("""
            INSERT INTO copilot_conversations (organization_id, user_id, title)
            VALUES (%s, %s, 'Root Cause Investigation for TN01AB1234')
            RETURNING id;
        """, (org_ids["fleetops-india"], admin_uid))
        conv_id = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO copilot_messages (conversation_id, role, content, model)
            VALUES (%s, %s, %s, %s);
        """, (conv_id, 'user', 'Why is vehicle TN01AB1234 exhibiting an 87% failure risk?', 'user_prompt'))

        cur.execute("""
            INSERT INTO copilot_messages (conversation_id, role, content, model)
            VALUES (%s, %s, %s, %s);
        """, (conv_id, 'assistant', 'Vehicle **TN01AB1234** (Toyota HiAce) has an **87% predicted failure risk** for **Engine Misfire** within 2–5 days.\n\n### 3 Strong Signals Detected:\n1. **Engine Coolant Temperature**: 104.5°C (+12.4% abnormal rise)\n2. **DTC P0301 Frequency**: 38 pending events/hour on cylinder #1\n3. **Crankshaft RPM Variance**: +27% micro-fluctuation during acceleration\n\n### Vector Fingerprint Match:\n- 91.4% Cosine Similarity to ground-truth **Engine Misfire Prototype (ENG-01)**.\n\n### Recommended Action:\nDispatch preventive work order to verify spark plug electrode gap and ignition coil resistance on cylinder #1 within 24 hours.', 'gemini-3-flash-preview'))

        cur.execute("""
            INSERT INTO ai_action_logs (organization_id, user_id, conversation_id, tool_name, input, output, status, duration_ms)
            VALUES (%s, %s, %s, 'query_vehicle_telemetry', '{"vehicle_id":"TN01AB1234","window_hours":24}', '{"signals_analyzed":14,"anomalies_found":3}', 'success', 184);
        """, (org_ids["fleetops-india"], admin_uid, conv_id))

        conn.commit()
        print("\n================================================================")
        print("✓ All 28 Tables, Views, Realtime Publications & Seed Data Deployed!")
        print("  Total vehicles inserted:", len(all_vehicles_inserted))
        print("  Hero vehicle ready: TN01AB1234 (87% risk, 91.4% fingerprint similarity)")
        print("================================================================")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERROR during database setup: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
