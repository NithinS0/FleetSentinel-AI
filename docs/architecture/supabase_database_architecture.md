# FleetSentinel AI — Supabase Database Architecture

## 1. Executive Summary

The **FleetSentinel AI** database architecture is designed as a mission-critical, enterprise-grade operational data platform for connected vehicle fleets. It implements multi-tenancy, Row Level Security (RLS), high-dimensional vector similarity search via `pgvector`, and real-time streaming notifications over Supabase Realtime.

```
                    ┌─────────────────────────┐
                    │      organizations      │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │         fleets          │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │        vehicles         │
                    └───────────┬─────────────┘
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│vehicle_telemetry │   │failure_prediction│   │      trips       │
└──────────────────┘   └────────┬─────────┘   └──────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│prediction_evidenc│   │fingerprint_match │   │      alerts      │
└──────────────────┘   └────────┬─────────┘   └──────────────────┘
                                │
                       ┌────────▼─────────┐
                       │failure_fingerprin│ (128-D Vector Embeddings)
                       └──────────────────┘
```

---

## 2. Relational Domains & Tables (28 Total)

### A. Multi-Tenancy & Authorization
1. **`organizations`**: Master tenant entity (`id`, `name`, `slug`, `industry`, `subscription_plan`, `status`).
2. **`organization_members`**: Membership mapping with role-based access control (`owner`, `admin`, `fleet_manager`, `maintenance_manager`, `analyst`, `viewer`).
3. **`fleets`**: Sub-fleets partitioned by region or operating depot.

### B. Fleet Assets & Operational State
4. **`vehicles`**: 100,000+ vehicle metadata records (`vin`, `registration_number`, `make`, `model`, `health_score`, `risk_score`, `odometer_km`).
5. **`vehicle_current_state`**: Single-row-per-vehicle operational state for sub-second dashboard rendering (`speed_kmh`, `engine_temp_c`, `battery_soc`, `health_score`, `risk_score`).
6. **`drivers`**: Commercial drivers assigned to fleets.
7. **`vehicle_driver_assignments`**: Historical and active vehicle-to-driver mappings.
8. **`trips`**: Route segments with GPS bounds, duration, average speed, and fuel/energy metrics.

### C. Telemetry Ingestion & Diagnostics
9. **`vehicle_telemetry`**: Operational rolling telemetry window (`event_time`, `speed_kmh`, `engine_temp_c`, `rpm`, `battery_soc`, `battery_soh`, `fuel_efficiency`, `odometer_km`).
10. **`diagnostic_events`**: CAN-bus DTC diagnostic trouble codes (`P0301`, `BMS04`, `P00B7`, etc.) with severity flags.
11. **`vehicle_health`**: Historical timeline of calculated composite health scores and model confidence.

### D. Failure Intelligence & pgvector Pattern Matching
12. **`failure_types`**: Catalog of breakdown categories (`ENGINE_MISFIRE`, `BATTERY_DEGRADATION`, `COOLING_SYSTEM`, `BRAKE_SYSTEM`, `TRANSMISSION`).
13. **`failure_predictions`**: RUL and probability predictions with time horizons (`2–5 days`).
14. **`prediction_evidence`**: Explainable AI evidence signals (`signal_name`, `signal_value`, `baseline_value`, `change_percentage`, `importance_score`).
15. **`failure_fingerprints`**: Ground-truth mathematical failure archetypes with **128-dimensional normalized vectors** indexed with HNSW (`vector_cosine_ops`).
16. **`fingerprint_matches`**: Real-time cosine similarity matches linking predictions to historical ground-truth cases.

### E. Operational Interventions & Maintenance
17. **`alerts`**: Operational inbox triage records with four severities (`critical`, `high`, `medium`, `low`).
18. **`maintenance_records`**: Workshop job cards, parts replacement logs, and technician sign-offs.
19. **`maintenance_recommendations`**: AI-generated action plans with estimated downtime and cost projections.
20. **`maintenance_scenarios`**: Monte Carlo delay simulation engine (0, 1, 3, and 7 day deferral curves).
21. **`prediction_outcomes`**: Continuous model feedback loop connecting completed repairs to original predictions.

### F. AI Copilot, Audit & System Observability
22. **`copilot_conversations`**: Threaded conversations initiated by operators.
23. **`copilot_messages`**: Context-grounded conversational turns with Google Gemini.
24. **`ai_action_logs`**: Full auditability of all AI tool executions with inputs, outputs, and latencies.
25. **`audit_logs`**: Administrative audit trail (`LOGIN`, `RESOLVE_ALERT`, `CREATE_MAINTENANCE`, etc.).
26. **`notifications`**: User-specific in-app and dispatch alerts.
27. **`system_metrics`**: Operational ingestion health (`events_per_second`, `kafka_consumer_lag`, `api_p95_ms`).
28. **`model_versions`**: ML model lineage tracking (`xgboost_rul_regressor`, `isolation_forest_anomaly`).

---

## 3. Row Level Security (RLS) & Multi-Tenant Boundary

Row Level Security is enabled on **all 28 tables**. Access control is enforced using trusted database membership:
- A user can only access rows belonging to organizations where their `auth.uid()` has an active entry in `organization_members`.
- Service-role workers and ingestion pipelines bypass RLS safely using the Supabase service key.
- All mutating policies enforce strict `USING` and `WITH CHECK` conditions.

---

## 4. Security-Invoker Dashboard Views

1. **`fleet_dashboard_summary`**: Aggregates total vehicles, health tiers, active alerts, and predicted breakdowns per tenant.
2. **`vehicle_risk_overview`**: Joins current vehicle risk, highest failure probability, and expected breakdown horizon.
3. **`recent_critical_alerts`**: High-priority alert queue for operations centers.

---

## 5. Supabase Realtime Channels

The following tables are published to the `supabase_realtime` replication slot:
- `alerts`
- `notifications`
- `vehicle_current_state`
