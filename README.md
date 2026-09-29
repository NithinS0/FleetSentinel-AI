# FleetSentinel AI

> **Real-Time Predictive Failure & Root-Cause Intelligence for Connected Fleets**
>
> Motorq Connected Vehicle Intelligence Hackathon

---

## One-Line Pitch

> FleetSentinel AI predicts vehicle failures **before they happen**, explains **why** they're likely, and tells fleet operators **what to do next**.

---

## Architecture

```
100K Vehicle Simulator
        ↓
  MQTT / Kafka
        ↓
 Stream Processor  ← Bloom filter dedup, sliding-window features
        ↓
ML Prediction Engine ← Isolation Forest + XGBoost + Random Forest
        ↓
Failure Fingerprint Engine ← pgvector similarity search
        ↓
Decision Engine → Alert Service → Redis → WebSocket → Dashboard
        ↓
AI Copilot (Gemini/OpenAI with guardrails)
```

---

## Quick Start (One Command)

### Prerequisites
- Docker Desktop ≥ 4.x
- `make` (optional — can run docker compose directly)

```bash
# 1. Clone
git clone <repo-url>
cd fleetsentinel-ai

# 2. Setup env
make setup          # copies .env.example → .env
# Edit .env and add GEMINI_API_KEY if you want the AI Copilot

# 3. Start everything
make up

# 4. (Optional) Train ML models
make train-models

# 5. Open the dashboard
# http://localhost:3000
# Login: admin@fleetsentinel.ai
```

### Without make:
```bash
cp .env.example .env
docker compose up -d --build
```

---

## Service URLs

| Service | URL |
|---|---|
| 🌐 Dashboard | http://localhost:3000 |
| 🔌 API Docs | http://localhost:8000/docs |
| 📊 Kafka UI | http://localhost:8090 |
| 📈 Grafana | http://localhost:3001 (admin/fleetsentinel) |
| 🔴 Prometheus | http://localhost:9090 |

---

## Services

| Service | Description | Port |
|---|---|---|
| `api-gateway` | FastAPI REST + WebSocket | 8000 |
| `copilot-service` | AI Maintenance Copilot | 8001 |
| `stream-processor` | Kafka consumer, feature engineering | — |
| `prediction-service` | ML prediction pipeline | — |
| `simulator` | 100K vehicle telemetry generator | — |
| `kafka` | Event streaming | 9092 |
| `postgres` | Primary + TimescaleDB | 5432 |
| `mongo` | Raw telemetry documents | 27017 |
| `redis` | Vehicle state cache + pub/sub | 6379 |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend API | Python 3.12, FastAPI, SQLAlchemy async |
| Streaming | Apache Kafka (Confluent) |
| Stream Processing | Custom Python consumers with sliding windows |
| ML | scikit-learn, XGBoost, Isolation Forest |
| Anomaly Detection | Isolation Forest (unsupervised) |
| Failure Prediction | XGBoost binary + multiclass classifier |
| Failure Fingerprints | pgvector cosine similarity |
| AI Copilot | Google Gemini 1.5 Flash + guardrails |
| Databases | PostgreSQL/TimescaleDB, MongoDB, Redis |
| Frontend | React 18, Recharts, Leaflet, Framer Motion |
| Observability | Prometheus, Grafana, OpenTelemetry |
| Containers | Docker, Docker Compose |

---

## Key Features

### 🎯 Failure Fingerprint Engine
Maps multi-signal combinations to historical failure patterns using vector similarity. Each vehicle's current telemetry is compared against a library of failure fingerprints stored in pgvector.

### 🤖 AI Maintenance Copilot
Natural-language interface. Ask: *"Why is TN01AB1234 at high risk?"* and get an evidence-backed explanation with a maintenance recommendation.

### ⚡ Real-Time Processing
- 100,000+ events/second from the vehicle simulator
- Bloom filter deduplication (O(1) lookup)
- Sliding window feature aggregation
- Dashboard latency target: < 2 seconds

### 🔒 Security
- JWT + OAuth2, RBAC (admin/fleet_manager/analyst/viewer)
- Multi-tenant isolation (tenant data never crosses)
- AI Copilot guardrails (no SQL execution, no cross-tenant access)
- Audit logging for all AI agent actions

---

## Deliverables Checklist

- [x] Solution Document (`FleetSentinel_AI_Complete_Solution.md`)
- [x] Git repository structure
- [x] README
- [x] One-command local setup (`make up`)
- [x] Docker Compose (full stack)
- [x] Architecture diagrams (see `docs/architecture/`)
- [x] 3NF ER diagram
- [x] Database schema (PostgreSQL + TimescaleDB)
- [x] Vehicle simulator (100K vehicles)
- [x] Stream processing with deduplication
- [x] ML pipeline (anomaly + prediction + classification)
- [x] Failure Fingerprint Engine (pgvector)
- [x] AI Copilot with guardrails
- [x] FastAPI REST API with JWT auth
- [x] React dashboard (dark mode, glassmorphism)
- [x] WebSocket real-time updates
- [ ] Unit tests (80%+ coverage) — `tests/`
- [ ] Integration tests — `tests/integration/`
- [ ] Load test results — `tests/performance/`
- [ ] Kubernetes/Helm manifests — `deployment/kubernetes/`
- [ ] Terraform — `deployment/terraform/`
- [ ] CI/CD pipeline — `.github/workflows/`
- [ ] STRIDE threat model — `docs/architecture/threat-model.md`
- [ ] ADRs — `docs/adr/`

---

## Demo Credentials

```
Email:    admin@fleetsentinel.ai
Password: FleetAdmin@2026
```

---

## License

MIT — Hackathon submission. Uses only synthetic data.
