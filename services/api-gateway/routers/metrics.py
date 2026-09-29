"""Metrics router — dashboard KPIs from Redis cache."""
import random
from fastapi import APIRouter, Depends
from core.security import get_current_user
from core.redis_client import redis_client

router = APIRouter()

@router.get("/dashboard", summary="Fleet dashboard metrics")
async def dashboard_metrics(current_user=Depends(get_current_user)):
    # Try Redis cache first
    cached = await redis_client.get_dashboard_metrics(str(current_user.tenant_id))
    if cached:
        return cached

    # Fallback: generate mock metrics (production: query DB)
    metrics = {
        "total_vehicles": 100000,
        "healthy": 89423,
        "at_risk": 8721,
        "critical": 1856,
        "events_per_sec": random.randint(95000, 105000),
        "active_alerts": random.randint(280, 350),
        "predicted_failures": random.randint(40, 60),
        "fleet_health_score": 82,
        "vehicles_at_risk": 1856,
    }
    await redis_client.set_dashboard_metrics(str(current_user.tenant_id), metrics)
    return metrics
