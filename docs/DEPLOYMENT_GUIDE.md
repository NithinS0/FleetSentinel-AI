# FleetSentinel AI — Production Deployment Guide

## 1. Is Vercel Enough?

| Component | Can it run on Vercel? | Recommended Production Host | Why? |
| :--- | :--- | :--- | :--- |
| **Frontend UI (React + Vite)** | **YES (Ideal)** | **Vercel** or **Cloudflare Pages** | Lightning-fast Global Edge CDN, sub-second TTFB, automatic SSL, zero-config Vite support, preview deployments. |
| **Backend API Gateway (FastAPI)** | **NO** | **Render**, **Railway**, or **Fly.io** | FleetSentinel relies on **persistent WebSockets** (`ws://...`) for live telemetry stream updates and continuous connection pooling. Vercel Serverless terminates connections after 10–60 seconds. |
| **AI Copilot Service (Gemini)** | **NO** | **Render**, **Railway**, or **Fly.io** | Requires long-running Python FastAPI runtime with async connection pools. |
| **Kafka Stream Consumers & Simulator** | **NO** | **Render Worker** or **Railway** | Continuous background daemons processing Aiven Kafka topics cannot run on serverless. |
| **PostgreSQL Database + pgvector** | **N/A (External)** | **Supabase** (Already Live!) | Managed cloud PostgreSQL with pgvector, Row Level Security, Auth, and Realtime replication. |
| **Message Broker & Cache** | **N/A (External)** | **Aiven Kafka & Upstash Redis** (Already Live!) | Cloud-managed streaming broker and low-latency cache. |

---

## 2. Production Architecture

```
                    ┌──────────────────────────────┐
                    │      Clients / Browsers      │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │ HTTPS                                   │ WSS / REST
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │    Vercel (Edge)     │                  │  Render / Railway    │
   │ React + Vite SPA     │                  │ FastAPI API Gateway  │
   │ Dashboard & Landing  │                  │ & Copilot Service    │
   └──────────────────────┘                  └──────────┬───────────┘
                                                        │
                      ┌─────────────────────────────────┼─────────────────────────────────┐
                      ▼                                 ▼                                 ▼
           ┌──────────────────────┐          ┌──────────────────────┐          ┌──────────────────────┐
           │       Supabase       │          │     Aiven Kafka      │          │    Upstash Redis     │
           │ PostgreSQL + pgvector│          │ 100K+ evt/s Streaming│          │ Low-latency Buffer   │
           │ 28 Tables + RLS      │          │ Partitioned by VIN   │          │ Hot Telemetry Cache  │
           └──────────────────────┘          └──────────────────────┘          └──────────────────────┘
```

---

## 3. Step 1: Deploy Frontend to Vercel (5 Minutes)

### Option A: Via Vercel Web Dashboard (Recommended)
1. Push your repository to **GitHub**.
2. Go to [https://vercel.com/new](https://vercel.com/new) and import your repository.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` *(Click Edit and select the `frontend` folder)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables** in Vercel:
   ```env
   VITE_API_URL=https://your-api-gateway.onrender.com
   VITE_COPILOT_URL=https://your-copilot-service.onrender.com
   VITE_WS_URL=wss://your-api-gateway.onrender.com
   VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_MAPTILER_KEY=5tT0gM0nX5N39k8ZyjfH
   VITE_MAP_TILE_URL=https://api.maptiler.com/maps/basic-v2-dark/256/{z}/{x}/{y}.png?key=5tT0gM0nX5N39k8ZyjfH
   ```
5. Click **Deploy**. Vercel will build and provide your production URL (e.g., `https://fleetsentinel-ai.vercel.app`).
   - The included [`frontend/vercel.json`](file:///d:/FleetSentinel%20AI/frontend/vercel.json) ensures all SPA routes (`/dashboard`, `/landing`, `/vehicles/:id`, etc.) resolve properly without 404 errors on browser refresh.

---

## 4. Step 2: Deploy Backend Services to Render or Railway

### Deploying with Render (Using Blueprint `render.yaml`)
1. Create a free account at [https://render.com](https://render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect [`render.yaml`](file:///d:/FleetSentinel%20AI/render.yaml) and configure:
   - `fleetsentinel-api-gateway` (FastAPI on Port 8000)
   - `fleetsentinel-copilot-service` (FastAPI on Port 8001)
4. Populate the environment variables prompted by Render:
   - `DATABASE_URL`: `postgresql://postgres:<YOUR_DB_PASSWORD>@db.<YOUR_PROJECT_REF>.supabase.co:5432/postgres`
   - `SUPABASE_URL`: `https://<YOUR_PROJECT_REF>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your-supabase-service-role-key`
   - `REDIS_REST_URL`: `https://your-upstash-instance.upstash.io`
   - `KAFKA_BOOTSTRAP_SERVERS`: `your-kafka-broker.aivencloud.com:25243`
   - `GEMINI_API_KEY`: `your-gemini-api-key`
5. Click **Apply**. Both backend services will deploy with automatic HTTPS and persistent WebSocket support.

---

## 5. Security & Secret Hygiene Checklist

- [x] **Never expose `service_role` key in frontend**: The frontend uses only the publishable `anon` key.
- [x] **Row Level Security (RLS)**: Enforced across all 28 Supabase tables.
- [x] **CORS Origins**: Add your Vercel production domain (`https://*.vercel.app`) to CORS allowed origins in `services/api-gateway/core/config.py`.
