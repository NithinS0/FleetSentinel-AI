"""
FleetSentinel AI — Alerts Router
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user, require_role
from models.alert import Alert
from models.user import User

router = APIRouter()


class AlertAcknowledgeRequest(BaseModel):
    note: Optional[str] = None


class AlertResolveRequest(BaseModel):
    resolution_note: Optional[str] = None


@router.get("/", summary="List alerts for the tenant")
async def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query("OPEN"),
    severity: Optional[str] = Query(None),
    vehicle_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Alert).where(Alert.tenant_id == current_user.tenant_id)

    if status:
        query = query.where(Alert.status == status.upper())
    if severity:
        query = query.where(Alert.severity == severity.upper())
    if vehicle_id:
        query = query.where(Alert.vehicle_id == vehicle_id)

    total = (await db.execute(
        select(func.count()).select_from(query.subquery())
    )).scalar_one()

    offset = (page - 1) * page_size
    query = query.order_by(Alert.priority_score.desc(), Alert.created_at.desc())
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    alerts = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [a.to_dict() for a in alerts],
    }


@router.get("/stats", summary="Alert statistics for dashboard")
async def alert_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import case
    result = await db.execute(
        select(
            func.count().label("total"),
            func.sum(case((Alert.severity == "CRITICAL", 1), else_=0)).label("critical"),
            func.sum(case((Alert.severity == "HIGH", 1), else_=0)).label("high"),
            func.sum(case((Alert.severity == "MEDIUM", 1), else_=0)).label("medium"),
        ).where(
            and_(
                Alert.tenant_id == current_user.tenant_id,
                Alert.status == "OPEN",
            )
        )
    )
    row = result.one()
    return {
        "open_total": row.total or 0,
        "critical": row.critical or 0,
        "high": row.high or 0,
        "medium": row.medium or 0,
    }


@router.get("/{alert_id}", summary="Get alert details")
async def get_alert(
    alert_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Alert).where(
            and_(Alert.id == alert_id, Alert.tenant_id == current_user.tenant_id)
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert.to_dict()


@router.post("/{alert_id}/acknowledge", summary="Acknowledge alert")
async def acknowledge_alert(
    alert_id: UUID,
    body: AlertAcknowledgeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timezone
    result = await db.execute(
        select(Alert).where(
            and_(Alert.id == alert_id, Alert.tenant_id == current_user.tenant_id)
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status != "OPEN":
        raise HTTPException(status_code=400, detail="Alert is not in OPEN state")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Alert acknowledged", "alert_id": str(alert_id)}


@router.post("/{alert_id}/resolve", summary="Resolve alert")
async def resolve_alert(
    alert_id: UUID,
    body: AlertResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timezone
    result = await db.execute(
        select(Alert).where(
            and_(Alert.id == alert_id, Alert.tenant_id == current_user.tenant_id)
        )
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = current_user.id
    await db.commit()
    return {"message": "Alert resolved", "alert_id": str(alert_id)}
