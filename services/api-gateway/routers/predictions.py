"""
FleetSentinel AI — Predictions Router
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, and_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import get_current_user
from models.user import User

router = APIRouter()


@router.get("/", summary="Get failure predictions across the fleet")
async def list_predictions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    risk_level: Optional[str] = Query(None),
    failure_type: Optional[str] = Query(None),
    min_probability: float = Query(0.0, ge=0, le=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from models.prediction import FailurePrediction

    query = select(FailurePrediction).where(
        FailurePrediction.tenant_id == current_user.tenant_id
    )

    if risk_level:
        query = query.where(FailurePrediction.risk_level == risk_level.upper())
    if failure_type:
        query = query.where(FailurePrediction.failure_type == failure_type.upper())
    if min_probability > 0:
        query = query.where(FailurePrediction.failure_probability >= min_probability)

    total = (await db.execute(
        select(func.count()).select_from(query.subquery())
    )).scalar_one()

    offset = (page - 1) * page_size
    query = (
        query
        .order_by(desc(FailurePrediction.failure_probability))
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    predictions = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [p.to_dict() for p in predictions],
    }


@router.get("/high-risk", summary="Get high-risk vehicles (probability ≥ 75%)")
async def high_risk_vehicles(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from models.prediction import FailurePrediction
    from datetime import datetime, timedelta, timezone

    since = datetime.now(timezone.utc) - timedelta(hours=1)
    result = await db.execute(
        select(FailurePrediction)
        .where(
            and_(
                FailurePrediction.tenant_id == current_user.tenant_id,
                FailurePrediction.failure_probability >= 0.75,
                FailurePrediction.predicted_at >= since,
            )
        )
        .order_by(desc(FailurePrediction.failure_probability))
        .limit(limit)
    )
    items = result.scalars().all()
    return {"items": [p.to_dict() for p in items], "count": len(items)}
