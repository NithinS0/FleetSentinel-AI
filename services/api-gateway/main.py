"""
FleetSentinel AI — API Gateway
FastAPI application entry point.
"""

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from core.config import settings
from core.database import engine, Base
from core.redis_client import redis_client
from routers import auth, vehicles, alerts, predictions, maintenance, fingerprints, metrics, ws, copilot


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Startup
    try:
        await redis_client.connect()
    except Exception as e:
        import logging
        logging.getLogger("api_gateway").warning(f"Redis connection postponed/failed: {e}")
    yield
    # Shutdown
    try:
        await redis_client.close()
    except Exception:
        pass


app = FastAPI(
    title="FleetSentinel AI",
    description="Real-Time Predictive Failure & Root-Cause Intelligence for Connected Fleets",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Prometheus ───────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/auth",         tags=["Authentication"])
app.include_router(vehicles.router,     prefix="/vehicles",     tags=["Vehicles"])
app.include_router(alerts.router,       prefix="/alerts",       tags=["Alerts"])
app.include_router(predictions.router,  prefix="/predictions",  tags=["Predictions"])
app.include_router(maintenance.router,  prefix="/maintenance",  tags=["Maintenance"])
app.include_router(fingerprints.router, prefix="/fingerprints", tags=["Fingerprints"])
app.include_router(metrics.router,      prefix="/metrics-api",  tags=["Metrics"])
app.include_router(ws.router,           prefix="/ws",           tags=["WebSocket"])
app.include_router(copilot.router,      prefix="/copilot",      tags=["Copilot"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "api-gateway", "version": "1.0.0"}


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": "FleetSentinel AI",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        log_level="info",
    )
