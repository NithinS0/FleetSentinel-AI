-- ─────────────────────────────────────────────────────────────────
-- FleetSentinel AI — Production Database Architecture
-- PostgreSQL / Supabase Complete Migration
-- ─────────────────────────────────────────────────────────────────

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS prediction_outcomes CASCADE;
DROP TABLE IF EXISTS model_versions CASCADE;
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ai_action_logs CASCADE;
DROP TABLE IF EXISTS copilot_messages CASCADE;
DROP TABLE IF EXISTS copilot_conversations CASCADE;
DROP TABLE IF EXISTS maintenance_scenarios CASCADE;
DROP TABLE IF EXISTS maintenance_recommendations CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS fingerprint_matches CASCADE;
DROP TABLE IF EXISTS failure_fingerprints CASCADE;
DROP TABLE IF EXISTS prediction_evidence CASCADE;
DROP TABLE IF EXISTS failure_predictions CASCADE;
DROP TABLE IF EXISTS failure_types CASCADE;
DROP TABLE IF EXISTS vehicle_health CASCADE;
DROP TABLE IF EXISTS diagnostic_events CASCADE;
DROP TABLE IF EXISTS vehicle_telemetry CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS vehicle_driver_assignments CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicle_current_state CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS fleets CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Also clean up legacy prototype table names
DROP TABLE IF EXISTS vehicle_health_scores CASCADE;
DROP TABLE IF EXISTS telemetry_readings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 2. ORGANIZATIONS
CREATE TABLE organizations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    slug              TEXT UNIQUE NOT NULL,
    industry          TEXT,
    country           TEXT DEFAULT 'India',
    timezone          TEXT DEFAULT 'Asia/Kolkata',
    subscription_plan TEXT DEFAULT 'enterprise',
    status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 3. ORGANIZATION MEMBERS
CREATE TABLE organization_members (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL, -- references auth.users(id) when auth account is provisioned
    role              TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'fleet_manager', 'maintenance_manager', 'analyst', 'viewer')),
    status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- 4. FLEETS
CREATE TABLE fleets (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    description       TEXT,
    region            TEXT,
    vehicle_count     INTEGER DEFAULT 0 CHECK (vehicle_count >= 0),
    status            TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fleets_org ON fleets(organization_id);
CREATE INDEX idx_fleets_status ON fleets(status);

-- 5. VEHICLES
CREATE TABLE vehicles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id            UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
    vin                 TEXT NOT NULL UNIQUE,
    registration_number TEXT UNIQUE,
    make                TEXT NOT NULL,
    model               TEXT NOT NULL,
    model_year          INTEGER CHECK (model_year BETWEEN 1990 AND 2035),
    vehicle_type        TEXT NOT NULL CHECK (vehicle_type IN ('car', 'suv', 'van', 'truck', 'bus', 'motorcycle')),
    fuel_type           TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'cng')),
    device_id           TEXT,
    status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
    health_score        NUMERIC(5,2) DEFAULT 100.00 CHECK (health_score BETWEEN 0 AND 100),
    risk_score          NUMERIC(5,2) DEFAULT 0.00 CHECK (risk_score BETWEEN 0 AND 100),
    last_seen_at        TIMESTAMPTZ DEFAULT now(),
    latitude            NUMERIC(10,7) CHECK (latitude BETWEEN -90 AND 90),
    longitude           NUMERIC(10,7) CHECK (longitude BETWEEN -180 AND 180),
    odometer_km         NUMERIC(12,2) DEFAULT 0.00 CHECK (odometer_km >= 0),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vehicles_fleet_id ON vehicles(fleet_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_risk_score ON vehicles(risk_score DESC);
CREATE INDEX idx_vehicles_health_score ON vehicles(health_score ASC);
CREATE INDEX idx_vehicles_last_seen_at ON vehicles(last_seen_at DESC);

-- 6. VEHICLE CURRENT STATE (Operational Fast-Read Table)
CREATE TABLE vehicle_current_state (
    vehicle_id          UUID PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude            NUMERIC(10,7) CHECK (latitude BETWEEN -90 AND 90),
    longitude           NUMERIC(10,7) CHECK (longitude BETWEEN -180 AND 180),
    speed_kmh           NUMERIC(8,2) DEFAULT 0 CHECK (speed_kmh >= 0),
    engine_temp_c       NUMERIC(8,2),
    battery_soc         NUMERIC(5,2) CHECK (battery_soc BETWEEN 0 AND 100),
    health_score        NUMERIC(5,2) CHECK (health_score BETWEEN 0 AND 100),
    risk_score          NUMERIC(5,2) CHECK (risk_score BETWEEN 0 AND 100),
    risk_level          TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    last_event_at       TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vcs_risk_level ON vehicle_current_state(risk_level);
CREATE INDEX idx_vcs_health_score ON vehicle_current_state(health_score);

-- 7. DRIVERS
CREATE TABLE drivers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    employee_code       TEXT,
    phone               TEXT,
    email               TEXT,
    status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_drivers_org ON drivers(organization_id);

-- 8. VEHICLE DRIVER ASSIGNMENT
CREATE TABLE vehicle_driver_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id           UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at            TIMESTAMPTZ,
    is_current          BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vda_vehicle ON vehicle_driver_assignments(vehicle_id);
CREATE INDEX idx_vda_driver ON vehicle_driver_assignments(driver_id);
CREATE INDEX idx_vda_current ON vehicle_driver_assignments(is_current);

-- 9. TRIPS
CREATE TABLE trips (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id           UUID REFERENCES drivers(id) ON DELETE SET NULL,
    started_at          TIMESTAMPTZ NOT NULL,
    ended_at            TIMESTAMPTZ,
    start_latitude      NUMERIC(10,7) CHECK (start_latitude BETWEEN -90 AND 90),
    start_longitude     NUMERIC(10,7) CHECK (start_longitude BETWEEN -180 AND 180),
    end_latitude        NUMERIC(10,7) CHECK (end_latitude BETWEEN -90 AND 90),
    end_longitude       NUMERIC(10,7) CHECK (end_longitude BETWEEN -180 AND 180),
    distance_km         NUMERIC(12,2) DEFAULT 0 CHECK (distance_km >= 0),
    duration_seconds    INTEGER DEFAULT 0 CHECK (duration_seconds >= 0),
    avg_speed_kmh       NUMERIC(8,2) CHECK (avg_speed_kmh >= 0),
    max_speed_kmh       NUMERIC(8,2) CHECK (max_speed_kmh >= 0),
    energy_consumed     NUMERIC(12,3) CHECK (energy_consumed >= 0),
    fuel_consumed       NUMERIC(12,3) CHECK (fuel_consumed >= 0),
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_started ON trips(started_at DESC);
CREATE INDEX idx_trips_driver ON trips(driver_id);

-- 10. VEHICLE TELEMETRY (Operational Ingestion Window)
CREATE TABLE vehicle_telemetry (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    event_time          TIMESTAMPTZ NOT NULL,
    sequence_number     BIGINT,
    latitude            NUMERIC(10,7) CHECK (latitude BETWEEN -90 AND 90),
    longitude           NUMERIC(10,7) CHECK (longitude BETWEEN -180 AND 180),
    speed_kmh           NUMERIC(8,2) CHECK (speed_kmh >= 0),
    engine_temp_c       NUMERIC(8,2),
    rpm                 INTEGER CHECK (rpm >= 0),
    battery_soc         NUMERIC(5,2) CHECK (battery_soc BETWEEN 0 AND 100),
    battery_soh         NUMERIC(5,2) CHECK (battery_soh BETWEEN 0 AND 100),
    fuel_efficiency     NUMERIC(8,2) CHECK (fuel_efficiency >= 0),
    odometer_km         NUMERIC(12,2) CHECK (odometer_km >= 0),
    voltage             NUMERIC(8,2),
    current_amp         NUMERIC(8,2),
    harsh_braking       BOOLEAN DEFAULT false,
    harsh_acceleration  BOOLEAN DEFAULT false,
    source              TEXT DEFAULT 'edge_gateway',
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_telemetry_veh_time ON vehicle_telemetry(vehicle_id, event_time DESC);
CREATE INDEX idx_telemetry_event_time ON vehicle_telemetry(event_time DESC);

-- 11. DIAGNOSTIC EVENTS
CREATE TABLE diagnostic_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    event_time          TIMESTAMPTZ NOT NULL,
    dtc_code            TEXT NOT NULL,
    severity            TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description         TEXT,
    status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'cleared', 'archived')),
    source              TEXT DEFAULT 'can_bus',
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diag_veh_time ON diagnostic_events(vehicle_id, event_time DESC);
CREATE INDEX idx_diag_dtc ON diagnostic_events(dtc_code);
CREATE INDEX idx_diag_severity ON diagnostic_events(severity);

-- 12. VEHICLE HEALTH
CREATE TABLE vehicle_health (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    health_score        NUMERIC(5,2) NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    risk_score          NUMERIC(5,2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level          TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    health_status       TEXT,
    calculated_at       TIMESTAMPTZ NOT NULL,
    model_version       TEXT DEFAULT 'rul_xgb_v1.2',
    confidence          NUMERIC(5,4) CHECK (confidence BETWEEN 0 AND 1),
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vh_veh_calc ON vehicle_health(vehicle_id, calculated_at DESC);
CREATE INDEX idx_vh_risk_level ON vehicle_health(risk_level);
CREATE INDEX idx_vh_risk_score ON vehicle_health(risk_score DESC);

-- 13. FAILURE TYPES
CREATE TABLE failure_types (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT UNIQUE NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    severity            TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category            TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- 14. FAILURE PREDICTIONS
CREATE TABLE failure_predictions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    failure_type_id     UUID REFERENCES failure_types(id) ON DELETE SET NULL,
    probability         NUMERIC(5,4) NOT NULL CHECK (probability BETWEEN 0 AND 1),
    risk_level          TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    expected_start_at   TIMESTAMPTZ,
    expected_end_at     TIMESTAMPTZ,
    model_version       TEXT DEFAULT 'rul_xgb_v1.2',
    confidence          NUMERIC(5,4) CHECK (confidence BETWEEN 0 AND 1),
    status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'mitigated', 'confirmed', 'false_positive')),
    predicted_at        TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fp_veh_pred ON failure_predictions(vehicle_id, predicted_at DESC);
CREATE INDEX idx_fp_risk_prob ON failure_predictions(risk_level, probability DESC);
CREATE INDEX idx_fp_failure_type ON failure_predictions(failure_type_id);
CREATE INDEX idx_fp_status ON failure_predictions(status);

-- 15. PREDICTION EVIDENCE
CREATE TABLE prediction_evidence (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id       UUID NOT NULL REFERENCES failure_predictions(id) ON DELETE CASCADE,
    signal_name         TEXT NOT NULL,
    signal_value        TEXT,
    baseline_value      TEXT,
    change_percentage   NUMERIC(8,2),
    importance_score    NUMERIC(8,4) CHECK (importance_score BETWEEN 0 AND 1),
    description         TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pe_prediction ON prediction_evidence(prediction_id);

-- 16. FAILURE FINGERPRINTS (Vector Archetypes)
CREATE TABLE failure_fingerprints (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    failure_type_id        UUID REFERENCES failure_types(id) ON DELETE SET NULL,
    name                   TEXT NOT NULL,
    description            TEXT,
    symptoms               JSONB DEFAULT '[]'::jsonb,
    dtc_patterns           JSONB DEFAULT '[]'::jsonb,
    telemetry_patterns     JSONB DEFAULT '{}'::jsonb,
    historical_case_count  INTEGER DEFAULT 0 CHECK (historical_case_count >= 0),
    similarity_threshold   NUMERIC(5,4) DEFAULT 0.7500 CHECK (similarity_threshold BETWEEN 0 AND 1),
    embedding              vector(128),
    created_at             TIMESTAMPTZ DEFAULT now(),
    updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ff_failure_type ON failure_fingerprints(failure_type_id);
CREATE INDEX idx_ff_embedding ON failure_fingerprints USING hnsw (embedding vector_cosine_ops);

-- 17. FINGERPRINT MATCHES
CREATE TABLE fingerprint_matches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id       UUID NOT NULL REFERENCES failure_predictions(id) ON DELETE CASCADE,
    fingerprint_id      UUID NOT NULL REFERENCES failure_fingerprints(id) ON DELETE CASCADE,
    similarity_score    NUMERIC(5,4) NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
    matching_signals    JSONB DEFAULT '[]'::jsonb,
    matched_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fm_prediction ON fingerprint_matches(prediction_id);
CREATE INDEX idx_fm_fingerprint ON fingerprint_matches(fingerprint_id);
CREATE INDEX idx_fm_similarity ON fingerprint_matches(similarity_score DESC);

-- 18. ALERTS
CREATE TABLE alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fleet_id            UUID REFERENCES fleets(id) ON DELETE SET NULL,
    vehicle_id          UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    prediction_id       UUID REFERENCES failure_predictions(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    severity            TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'investigating', 'resolved', 'dismissed')),
    source              TEXT DEFAULT 'telemetry_anomaly_engine',
    assigned_to         UUID, -- references auth.users(id)
    acknowledged_at     TIMESTAMPTZ,
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_alerts_org_status_time ON alerts(organization_id, status, created_at DESC);
CREATE INDEX idx_alerts_vehicle ON alerts(vehicle_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- 19. MAINTENANCE RECORDS
CREATE TABLE maintenance_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    maintenance_type    TEXT NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    scheduled_at        TIMESTAMPTZ,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    technician_name     TEXT,
    service_center      TEXT,
    cost                NUMERIC(12,2) CHECK (cost >= 0),
    odometer_km         NUMERIC(12,2) CHECK (odometer_km >= 0),
    failure_type_id     UUID REFERENCES failure_types(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_maint_veh_sched ON maintenance_records(vehicle_id, scheduled_at DESC);
CREATE INDEX idx_maint_org_status ON maintenance_records(organization_id, status);
CREATE INDEX idx_maint_completed ON maintenance_records(completed_at DESC);

-- 20. MAINTENANCE RECOMMENDATIONS
CREATE TABLE maintenance_recommendations (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id               UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    prediction_id            UUID REFERENCES failure_predictions(id) ON DELETE SET NULL,
    recommended_action       TEXT NOT NULL,
    priority                 TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    recommended_by           TEXT DEFAULT 'FleetSentinel AI Copilot',
    reason                   TEXT,
    estimated_downtime_hours NUMERIC(8,2) CHECK (estimated_downtime_hours >= 0),
    estimated_cost           NUMERIC(12,2) CHECK (estimated_cost >= 0),
    status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'scheduled', 'completed', 'rejected')),
    created_at               TIMESTAMPTZ DEFAULT now(),
    updated_at               TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rec_vehicle ON maintenance_recommendations(vehicle_id);
CREATE INDEX idx_rec_prediction ON maintenance_recommendations(prediction_id);
CREATE INDEX idx_rec_status ON maintenance_recommendations(status);

-- 21. MAINTENANCE SCENARIOS (What-If Simulation Engine)
CREATE TABLE maintenance_scenarios (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id               UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    prediction_id            UUID REFERENCES failure_predictions(id) ON DELETE SET NULL,
    delay_days               INTEGER NOT NULL CHECK (delay_days >= 0),
    predicted_risk           NUMERIC(5,4) NOT NULL CHECK (predicted_risk BETWEEN 0 AND 1),
    estimated_downtime_hours NUMERIC(8,2) CHECK (estimated_downtime_hours >= 0),
    estimated_cost           NUMERIC(12,2) CHECK (estimated_cost >= 0),
    model_version            TEXT DEFAULT 'rul_monte_carlo_v1.0',
    created_at               TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ms_vehicle ON maintenance_scenarios(vehicle_id);

-- 22. AI COPILOT CONVERSATIONS
CREATE TABLE copilot_conversations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id           UUID, -- references auth.users(id)
    title             TEXT NOT NULL DEFAULT 'New Fleet Query',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cc_org ON copilot_conversations(organization_id);

-- 23. AI COPILOT MESSAGES
CREATE TABLE copilot_messages (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
    role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content           TEXT NOT NULL,
    model             TEXT DEFAULT 'gemini-3-flash-preview',
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cm_conversation ON copilot_messages(conversation_id, created_at ASC);

-- 24. AI TOOL / ACTION AUDIT
CREATE TABLE ai_action_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id           UUID,
    conversation_id   UUID REFERENCES copilot_conversations(id) ON DELETE SET NULL,
    tool_name         TEXT NOT NULL,
    input             JSONB DEFAULT '{}'::jsonb,
    output            JSONB DEFAULT '{}'::jsonb,
    status            TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'timeout')),
    duration_ms       INTEGER CHECK (duration_ms >= 0),
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_aal_org ON ai_action_logs(organization_id);
CREATE INDEX idx_aal_tool ON ai_action_logs(tool_name);

-- 25. AUDIT LOGS
CREATE TABLE audit_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id           UUID,
    action            TEXT NOT NULL,
    entity_type       TEXT,
    entity_id         UUID,
    metadata          JSONB DEFAULT '{}'::jsonb,
    ip_address        INET,
    user_agent        TEXT,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_al_org_action ON audit_logs(organization_id, action, created_at DESC);

-- 26. NOTIFICATIONS
CREATE TABLE notifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID,
    organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type              TEXT NOT NULL,
    title             TEXT NOT NULL,
    message           TEXT NOT NULL,
    entity_type       TEXT,
    entity_id         UUID,
    is_read           BOOLEAN DEFAULT false,
    created_at        TIMESTAMPTZ DEFAULT now(),
    read_at           TIMESTAMPTZ
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notif_org ON notifications(organization_id);

-- 27. SYSTEM METRICS
CREATE TABLE system_metrics (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name       TEXT NOT NULL,
    metric_value      NUMERIC NOT NULL,
    unit              TEXT,
    recorded_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata          JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sm_name_time ON system_metrics(metric_name, recorded_at DESC);

-- 28. MODEL VERSIONS
CREATE TABLE model_versions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name        TEXT NOT NULL,
    version           TEXT NOT NULL,
    model_type        TEXT NOT NULL,
    metrics           JSONB DEFAULT '{}'::jsonb,
    status            TEXT NOT NULL DEFAULT 'deployed' CHECK (status IN ('deployed', 'staged', 'deprecated', 'evaluating')),
    trained_at        TIMESTAMPTZ,
    deployed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_mv_name_version ON model_versions(model_name, version);

-- 29. PREDICTION OUTCOMES (Model Feedback Loop)
CREATE TABLE prediction_outcomes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id         UUID NOT NULL REFERENCES failure_predictions(id) ON DELETE CASCADE,
    actual_failure        BOOLEAN NOT NULL,
    actual_failure_type   UUID REFERENCES failure_types(id) ON DELETE SET NULL,
    actual_failure_at     TIMESTAMPTZ,
    maintenance_record_id UUID REFERENCES maintenance_records(id) ON DELETE SET NULL,
    outcome_notes         TEXT,
    created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_po_prediction ON prediction_outcomes(prediction_id);

-- ─────────────────────────────────────────────────────────────────
-- 30. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orgs_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_org_members_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_fleets_updated_at BEFORE UPDATE ON fleets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_vcs_updated_at BEFORE UPDATE ON vehicle_current_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ff_updated_at BEFORE UPDATE ON failure_fingerprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_maint_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_rec_updated_at BEFORE UPDATE ON maintenance_recommendations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cc_updated_at BEFORE UPDATE ON copilot_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────
-- 31. ROW LEVEL SECURITY (RLS) & MULTI-TENANCY
-- ─────────────────────────────────────────────────────────────────

-- Helper function to return user organizations based on membership table
CREATE OR REPLACE FUNCTION current_user_org_ids()
RETURNS TABLE(org_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_current_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE fingerprint_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_outcomes ENABLE ROW LEVEL SECURITY;

-- 1. Organizations Policy: Members can view their organization
CREATE POLICY org_member_select ON organizations
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        id IN (SELECT current_user_org_ids())
    );

CREATE POLICY org_member_update ON organizations
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
    WITH CHECK (
        id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- 2. Organization Members Policy
CREATE POLICY org_members_select ON organization_members
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    );

-- 3. Fleets Policy
CREATE POLICY fleets_select ON fleets
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    );

CREATE POLICY fleets_all_admin ON fleets
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'fleet_manager'))
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'fleet_manager'))
    );

-- 4. Vehicles Policy
CREATE POLICY vehicles_select ON vehicles
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        fleet_id IN (SELECT id FROM fleets WHERE organization_id IN (SELECT current_user_org_ids()))
    );

CREATE POLICY vehicles_manage ON vehicles
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        fleet_id IN (SELECT id FROM fleets WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'fleet_manager')))
    )
    WITH CHECK (
        fleet_id IN (SELECT id FROM fleets WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'fleet_manager')))
    );

-- 5. Vehicle Current State Policy
CREATE POLICY vcs_select ON vehicle_current_state
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

-- 6. Alerts Policy
CREATE POLICY alerts_select ON alerts
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    );

CREATE POLICY alerts_update ON alerts
    FOR UPDATE
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    )
    WITH CHECK (
        organization_id IN (SELECT current_user_org_ids())
    );

-- 7. Failure Predictions & Evidence
CREATE POLICY fp_select ON failure_predictions
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

CREATE POLICY pe_select ON prediction_evidence
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        prediction_id IN (
            SELECT p.id FROM failure_predictions p
            JOIN vehicles v ON p.vehicle_id = v.id
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

-- 8. Failure Types & Fingerprints (Global Library readable by all authenticated tenant members)
CREATE POLICY ft_select ON failure_types FOR SELECT USING (true);
CREATE POLICY ff_select ON failure_fingerprints FOR SELECT USING (true);
CREATE POLICY fm_select ON fingerprint_matches FOR SELECT USING (true);

-- 9. Maintenance Records & Recommendations
CREATE POLICY mr_select ON maintenance_records
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    );

CREATE POLICY mr_manage ON maintenance_records
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'maintenance_manager'))
    )
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'maintenance_manager'))
    );

CREATE POLICY rec_select ON maintenance_recommendations
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

CREATE POLICY ms_select ON maintenance_scenarios
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

-- 10. Telemetry & Diagnostics
CREATE POLICY telemetry_select ON vehicle_telemetry
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

CREATE POLICY diag_select ON diagnostic_events
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

CREATE POLICY vh_select ON vehicle_health
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

-- 11. Drivers & Trips
CREATE POLICY drivers_select ON drivers
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    );

CREATE POLICY trips_select ON trips
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        vehicle_id IN (
            SELECT v.id FROM vehicles v
            JOIN fleets f ON v.fleet_id = f.id
            WHERE f.organization_id IN (SELECT current_user_org_ids())
        )
    );

-- 12. Copilot Conversations & Messages
CREATE POLICY cc_select ON copilot_conversations
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    );

CREATE POLICY cc_manage ON copilot_conversations
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        organization_id IN (SELECT current_user_org_ids())
    )
    WITH CHECK (
        organization_id IN (SELECT current_user_org_ids())
    );

CREATE POLICY cm_select ON copilot_messages
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        conversation_id IN (
            SELECT id FROM copilot_conversations WHERE organization_id IN (SELECT current_user_org_ids())
        )
    );

CREATE POLICY cm_insert ON copilot_messages
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role' OR
        conversation_id IN (
            SELECT id FROM copilot_conversations WHERE organization_id IN (SELECT current_user_org_ids())
        )
    );

-- 13. System Metrics, Models & Audit
CREATE POLICY sm_select ON system_metrics FOR SELECT USING (true);
CREATE POLICY mv_select ON model_versions FOR SELECT USING (true);
CREATE POLICY po_select ON prediction_outcomes FOR SELECT USING (true);
CREATE POLICY al_select ON audit_logs FOR SELECT USING (auth.role() = 'service_role' OR organization_id IN (SELECT current_user_org_ids()));
CREATE POLICY aal_select ON ai_action_logs FOR SELECT USING (auth.role() = 'service_role' OR organization_id IN (SELECT current_user_org_ids()));
CREATE POLICY notif_select ON notifications FOR SELECT USING (auth.role() = 'service_role' OR user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- 32. DASHBOARD DATABASE VIEWS (Security Invoker)
-- ─────────────────────────────────────────────────────────────────

-- 1. Fleet Dashboard Summary View
CREATE OR REPLACE VIEW fleet_dashboard_summary
WITH (security_invoker = true) AS
SELECT 
    f.organization_id,
    COUNT(DISTINCT v.id) AS total_vehicles,
    COUNT(DISTINCT CASE WHEN v.health_score >= 80 THEN v.id END) AS healthy_vehicles,
    COUNT(DISTINCT CASE WHEN v.health_score BETWEEN 40 AND 79.99 THEN v.id END) AS at_risk_vehicles,
    COUNT(DISTINCT CASE WHEN v.health_score < 40 THEN v.id END) AS critical_vehicles,
    (SELECT COUNT(*) FROM alerts a WHERE a.organization_id = f.organization_id AND a.status IN ('open', 'acknowledged', 'investigating')) AS active_alerts,
    (SELECT COUNT(*) FROM failure_predictions p JOIN vehicles v2 ON p.vehicle_id = v2.id JOIN fleets f2 ON v2.fleet_id = f2.id WHERE f2.organization_id = f.organization_id AND p.status = 'active') AS predicted_failures,
    COALESCE(ROUND(AVG(v.health_score), 2), 100.00) AS average_health_score,
    COALESCE(ROUND(AVG(v.risk_score), 2), 0.00) AS average_risk_score
FROM fleets f
LEFT JOIN vehicles v ON f.id = v.fleet_id AND v.status != 'decommissioned'
GROUP BY f.organization_id;

-- 2. Vehicle Risk Overview View
CREATE OR REPLACE VIEW vehicle_risk_overview
WITH (security_invoker = true) AS
SELECT 
    v.id AS vehicle_id,
    v.vin,
    v.registration_number,
    f.name AS fleet_name,
    v.health_score,
    v.risk_score,
    CASE 
        WHEN v.risk_score >= 75 THEN 'critical'
        WHEN v.risk_score >= 45 THEN 'high'
        WHEN v.risk_score >= 20 THEN 'medium'
        ELSE 'low'
    END AS risk_level,
    ft.name AS predicted_failure,
    p.probability AS failure_probability,
    CASE 
        WHEN p.expected_start_at IS NOT NULL AND p.expected_end_at IS NOT NULL THEN
            CONCAT(ROUND(EXTRACT(EPOCH FROM (p.expected_start_at - now())) / 86400)::text, '–', ROUND(EXTRACT(EPOCH FROM (p.expected_end_at - now())) / 86400)::text, ' days')
        ELSE '2–5 days'
    END AS expected_failure_window
FROM vehicles v
JOIN fleets f ON v.fleet_id = f.id
LEFT JOIN LATERAL (
    SELECT fp.failure_type_id, fp.probability, fp.expected_start_at, fp.expected_end_at
    FROM failure_predictions fp
    WHERE fp.vehicle_id = v.id AND fp.status = 'active'
    ORDER BY fp.probability DESC
    LIMIT 1
) p ON true
LEFT JOIN failure_types ft ON p.failure_type_id = ft.id;

-- 3. Recent Critical Alerts View
CREATE OR REPLACE VIEW recent_critical_alerts
WITH (security_invoker = true) AS
SELECT 
    a.id AS alert_id,
    a.vehicle_id,
    v.vin,
    v.registration_number,
    a.title,
    a.severity,
    a.status,
    a.created_at
FROM alerts a
JOIN vehicles v ON a.vehicle_id = v.id
WHERE a.severity IN ('critical', 'high') AND a.status IN ('open', 'acknowledged', 'investigating')
ORDER BY a.created_at DESC;

-- ─────────────────────────────────────────────────────────────────
-- 33. STORED FUNCTIONS (Safe & Authorized)
-- ─────────────────────────────────────────────────────────────────

-- 1. Get Fleet Summary
CREATE OR REPLACE FUNCTION get_fleet_summary(p_fleet_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'fleet_id', f.id,
        'fleet_name', f.name,
        'region', f.region,
        'total_vehicles', COUNT(v.id),
        'healthy', COUNT(CASE WHEN v.health_score >= 80 THEN 1 END),
        'at_risk', COUNT(CASE WHEN v.health_score BETWEEN 40 AND 79.99 THEN 1 END),
        'critical', COUNT(CASE WHEN v.health_score < 40 THEN 1 END),
        'avg_health', COALESCE(ROUND(AVG(v.health_score), 1), 100.0),
        'avg_risk', COALESCE(ROUND(AVG(v.risk_score), 1), 0.0)
    ) INTO result
    FROM fleets f
    LEFT JOIN vehicles v ON f.id = v.fleet_id AND v.status != 'decommissioned'
    WHERE f.id = p_fleet_id
    GROUP BY f.id, f.name, f.region;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Get Vehicle Health
CREATE OR REPLACE FUNCTION get_vehicle_health(p_vehicle_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'vehicle_id', v.id,
        'vin', v.vin,
        'registration_number', v.registration_number,
        'health_score', v.health_score,
        'risk_score', v.risk_score,
        'odometer_km', v.odometer_km,
        'last_seen_at', v.last_seen_at,
        'current_state', (
            SELECT to_jsonb(cs) FROM vehicle_current_state cs WHERE cs.vehicle_id = v.id
        ),
        'latest_prediction', (
            SELECT jsonb_build_object(
                'failure_type', ft.name,
                'probability', fp.probability,
                'risk_level', fp.risk_level,
                'confidence', fp.confidence,
                'evidence', (
                    SELECT jsonb_agg(jsonb_build_object(
                        'signal', pe.signal_name,
                        'value', pe.signal_value,
                        'change_pct', pe.change_percentage,
                        'importance', pe.importance_score
                    ))
                    FROM prediction_evidence pe WHERE pe.prediction_id = fp.id
                )
            )
            FROM failure_predictions fp
            LEFT JOIN failure_types ft ON fp.failure_type_id = ft.id
            WHERE fp.vehicle_id = v.id AND fp.status = 'active'
            ORDER BY fp.probability DESC
            LIMIT 1
        )
    ) INTO result
    FROM vehicles v
    WHERE v.id = p_vehicle_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Get Vehicle Prediction
CREATE OR REPLACE FUNCTION get_vehicle_prediction(p_vehicle_id UUID)
RETURNS TABLE(
    prediction_id UUID,
    failure_type_code TEXT,
    failure_type_name TEXT,
    probability NUMERIC,
    risk_level TEXT,
    predicted_at TIMESTAMPTZ,
    evidence JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fp.id AS prediction_id,
        ft.code AS failure_type_code,
        ft.name AS failure_type_name,
        fp.probability,
        fp.risk_level,
        fp.predicted_at,
        COALESCE(
            (SELECT jsonb_agg(to_jsonb(pe)) FROM prediction_evidence pe WHERE pe.prediction_id = fp.id),
            '[]'::jsonb
        ) AS evidence
    FROM failure_predictions fp
    JOIN failure_types ft ON fp.failure_type_id = ft.id
    WHERE fp.vehicle_id = p_vehicle_id AND fp.status = 'active'
    ORDER BY fp.probability DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. Get Maintenance History
CREATE OR REPLACE FUNCTION get_maintenance_history(p_vehicle_id UUID)
RETURNS TABLE(
    record_id UUID,
    title TEXT,
    maintenance_type TEXT,
    status TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cost NUMERIC,
    technician_name TEXT,
    service_center TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.id AS record_id,
        mr.title,
        mr.maintenance_type,
        mr.status,
        mr.scheduled_at,
        mr.completed_at,
        mr.cost,
        mr.technician_name,
        mr.service_center
    FROM maintenance_records mr
    WHERE mr.vehicle_id = p_vehicle_id
    ORDER BY COALESCE(mr.completed_at, mr.scheduled_at, mr.created_at) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─────────────────────────────────────────────────────────────────
-- 34. SUPABASE REALTIME CONFIGURATION
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE alerts, notifications, vehicle_current_state;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
END $$;
