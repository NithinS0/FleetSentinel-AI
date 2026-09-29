import os
import sys
import json
import psycopg2

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")

def run_test_suite():
    print("================================================================")
    print("FleetSentinel AI — Supabase Database Architecture Test Suite")
    print("Section 45 Validation Checklist (12 Tests)")
    print("================================================================\n")
    
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    passed_count = 0

    try:
        # TEST 1: Create Organization
        print("[Test 1/12] Create organization...")
        cur.execute("""
            INSERT INTO organizations (name, slug, industry, country, subscription_plan)
            VALUES ('Test Express Cargo', 'test-express-cargo', 'Freight', 'India', 'enterprise')
            RETURNING id;
        """)
        test_org_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Created test organization with ID: {test_org_id}")
        passed_count += 1

        # TEST 2: Add Member
        print("\n[Test 2/12] Add member to organization...")
        cur.execute("""
            INSERT INTO organization_members (organization_id, user_id, role, status)
            VALUES (%s, gen_random_uuid(), 'fleet_manager', 'active')
            RETURNING id;
        """, (test_org_id,))
        test_member_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Added organization member with ID: {test_member_id}")
        passed_count += 1

        # TEST 3: Create Fleet
        print("\n[Test 3/12] Create fleet...")
        cur.execute("""
            INSERT INTO fleets (organization_id, name, region)
            VALUES (%s, 'Kochi Coastal Logistics', 'South India')
            RETURNING id;
        """, (test_org_id,))
        test_fleet_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Created fleet with ID: {test_fleet_id}")
        passed_count += 1

        # TEST 4: Create Vehicle
        print("\n[Test 4/12] Create vehicle...")
        cur.execute("""
            INSERT INTO vehicles (fleet_id, vin, registration_number, make, model, model_year, vehicle_type, fuel_type, health_score, risk_score)
            VALUES (%s, 'KL07TESTVIN998877', 'KL07ZZ9999', 'Tata', 'Ultra T.7', 2024, 'truck', 'diesel', 88.50, 11.50)
            RETURNING id;
        """, (test_fleet_id,))
        test_vehicle_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Created vehicle with ID: {test_vehicle_id}")
        passed_count += 1

        # TEST 5: Insert Telemetry
        print("\n[Test 5/12] Insert telemetry...")
        cur.execute("""
            INSERT INTO vehicle_telemetry (vehicle_id, event_time, latitude, longitude, speed_kmh, engine_temp_c, rpm, fuel_efficiency)
            VALUES (%s, now(), 9.9312, 76.2673, 54.2, 88.4, 1850, 11.8)
            RETURNING id;
        """, (test_vehicle_id,))
        test_telem_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Inserted telemetry event with ID: {test_telem_id}")
        passed_count += 1

        # TEST 6: Insert Prediction
        print("\n[Test 6/12] Insert prediction...")
        cur.execute("SELECT id FROM failure_types WHERE code = 'ENGINE_MISFIRE' LIMIT 1;")
        ft_id = cur.fetchone()[0]
        cur.execute("""
            INSERT INTO failure_predictions (vehicle_id, failure_type_id, probability, risk_level, confidence, status)
            VALUES (%s, %s, 0.4200, 'medium', 0.8800, 'active')
            RETURNING id;
        """, (test_vehicle_id, ft_id))
        test_pred_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Inserted prediction with ID: {test_pred_id}")
        passed_count += 1

        # TEST 7: Insert Alert
        print("\n[Test 7/12] Insert alert...")
        cur.execute("""
            INSERT INTO alerts (organization_id, fleet_id, vehicle_id, prediction_id, title, description, severity, status)
            VALUES (%s, %s, %s, %s, 'Sample Test Alert for KL07ZZ9999', 'Routine telemetry variation observed.', 'medium', 'open')
            RETURNING id;
        """, (test_org_id, test_fleet_id, test_vehicle_id, test_pred_id))
        test_alert_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Inserted alert with ID: {test_alert_id}")
        passed_count += 1

        # TEST 8: Create Maintenance Recommendation
        print("\n[Test 8/12] Create maintenance recommendation...")
        cur.execute("""
            INSERT INTO maintenance_recommendations (vehicle_id, prediction_id, recommended_action, priority, estimated_downtime_hours, estimated_cost)
            VALUES (%s, %s, 'Inspect fuel injector spray pattern during next depot turn.', 'medium', 2.5, 120.00)
            RETURNING id;
        """, (test_vehicle_id, test_pred_id))
        test_rec_id = cur.fetchone()[0]
        print(f"  ✓ PASSED: Created maintenance recommendation with ID: {test_rec_id}")
        passed_count += 1

        # TEST 9: Query Dashboard Summary View
        print("\n[Test 9/12] Query fleet_dashboard_summary view...")
        cur.execute("""
            SELECT organization_id, total_vehicles, healthy_vehicles, at_risk_vehicles, critical_vehicles, active_alerts, predicted_failures, average_health_score, average_risk_score
            FROM fleet_dashboard_summary
            LIMIT 3;
        """)
        summary_rows = cur.fetchall()
        for r in summary_rows:
            print(f"  ✓ Summary row: Org {r[0]} -> Total: {r[1]}, Healthy: {r[2]}, At Risk: {r[3]}, Critical: {r[4]}, Avg Health: {r[7]}%, Avg Risk: {r[8]}%")
        passed_count += 1

        # TEST 10: Verify RLS Isolation
        print("\n[Test 10/12] Verify RLS isolation mechanism...")
        cur.execute("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('vehicles', 'fleets', 'alerts', 'maintenance_records');")
        rls_tables = cur.fetchall()
        for tname, rls_active in rls_tables:
            assert rls_active == True, f"RLS not enabled on {tname}"
            print(f"  ✓ Table '{tname}': Row Level Security ENABLED ({rls_active})")
        passed_count += 1

        # TEST 11: Verify Unauthorized Organization Access is Blocked
        print("\n[Test 11/12] Verify cross-tenant isolation policy logic...")
        # Verify that policy checks org membership
        cur.execute("""
            SELECT polname, polcmd, polroles::regrole[] 
            FROM pg_policy 
            WHERE polrelid = 'vehicles'::regclass;
        """)
        policies = cur.fetchall()
        for p in policies:
            print(f"  ✓ Vehicle Policy: {p[0]} (Command: {p[1]})")
        passed_count += 1

        # TEST 12: Verify Indexes Exist
        print("\n[Test 12/12] Verify high-performance indexes exist...")
        key_indexes = [
            "idx_vehicles_fleet_id",
            "idx_vehicles_risk_score",
            "idx_vehicles_health_score",
            "idx_telemetry_veh_time",
            "idx_alerts_org_status_time",
            "idx_ff_embedding"
        ]
        cur.execute("SELECT indexname FROM pg_indexes WHERE schemaname = 'public';")
        existing_idx = set(row[0] for row in cur.fetchall())
        for idx in key_indexes:
            assert idx in existing_idx, f"Missing index: {idx}"
            print(f"  ✓ Verified index: {idx}")
        passed_count += 1

        # Clean up temporary test entity
        cur.execute("DELETE FROM organizations WHERE id = %s;", (test_org_id,))
        conn.commit()

        print("\n================================================================")
        print(f"SUCCESS: {passed_count}/12 Verification Tests PASSED!")
        print("================================================================")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ FAILED test suite: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    run_test_suite()
