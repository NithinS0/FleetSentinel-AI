"""
FleetSentinel AI — Vehicles Router
GET /vehicles, GET /vehicles/{id}, GET /vehicles/{id}/health, etc.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user, require_role
from core.redis_client import redis_client
from models.vehicle import Vehicle
from models.user import User

router = APIRouter()


@router.get("/", summary="List vehicles in the tenant fleet")
async def list_vehicles(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * page_size
    query = select(Vehicle).where(Vehicle.tenant_id == current_user.tenant_id)

    if status:
        query = query.where(Vehicle.status == status.upper())
    if search:
        query = query.where(
            Vehicle.vehicle_id.ilike(f"%{search}%")
            | Vehicle.vin.ilike(f"%{search}%")
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(Vehicle.vehicle_id).offset(offset).limit(page_size)
    result = await db.execute(query)
    vehicles = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [v.to_dict() for v in vehicles],
    }


@router.get("/{vehicle_id}", summary="Get vehicle detail")
async def get_vehicle(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Vehicle).where(
            and_(
                Vehicle.vehicle_id == vehicle_id,
                Vehicle.tenant_id == current_user.tenant_id,
            )
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle.to_dict()


@router.get("/{vehicle_id}/health", summary="Get vehicle real-time health")
async def get_vehicle_health(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
):
    """Returns real-time health from Redis cache (low latency)."""
    # Try cache first
    cached = await redis_client.get_vehicle_health(vehicle_id)
    if cached:
        return cached

    # Fallback placeholder when cache is empty
    return {
        "vehicle_id": vehicle_id,
        "health_score": None,
        "risk_score": None,
        "status": "UNKNOWN",
        "last_seen": None,
        "cached": False,
    }


@router.get("/{vehicle_id}/state", summary="Get latest vehicle telemetry state")
async def get_vehicle_state(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
):
    state = await redis_client.get_vehicle_state(vehicle_id)
    if not state:
        raise HTTPException(status_code=404, detail="No recent telemetry for vehicle")
    return state


@router.get("/{vehicle_id}/predictions", summary="Get failure predictions for vehicle")
async def get_vehicle_predictions(
    vehicle_id: str,
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from models.prediction import FailurePrediction
    result = await db.execute(
        select(FailurePrediction)
        .where(
            and_(
                FailurePrediction.vehicle_id == vehicle_id,
                FailurePrediction.tenant_id == current_user.tenant_id,
            )
        )
        .order_by(FailurePrediction.predicted_at.desc())
        .limit(limit)
    )
    predictions = result.scalars().all()
    return {"items": [p.to_dict() for p in predictions]}


@router.get("/{vehicle_id}/alerts", summary="Get active alerts for vehicle")
async def get_vehicle_alerts(
    vehicle_id: str,
    status: Optional[str] = Query("OPEN"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from models.alert import Alert
    query = select(Alert).where(
        and_(
            Alert.vehicle_id == vehicle_id,
            Alert.tenant_id == current_user.tenant_id,
        )
    )
    if status:
        query = query.where(Alert.status == status.upper())

    result = await db.execute(query.order_by(Alert.created_at.desc()).limit(50))
    alerts = result.scalars().all()
    return {"items": [a.to_dict() for a in alerts]}
