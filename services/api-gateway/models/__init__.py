"""
FleetSentinel AI — SQLAlchemy ORM Models
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id     = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    fleet_id      = Column(UUID(as_uuid=True), ForeignKey("fleets.id"), nullable=False)
    vehicle_id    = Column(String(20), nullable=False, index=True)
    vin           = Column(String(17), unique=True)
    vehicle_type  = Column(String(20), default="ICE")
    make          = Column(String(100))
    model         = Column(String(100))
    year          = Column(Integer)
    odo_km        = Column(Numeric(12, 1), default=0)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())

    # Runtime properties (not in DB — from Redis/computed)
    status: Optional[str] = None
    health_score: Optional[float] = None

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "vehicle_id": self.vehicle_id,
            "vin": self.vin,
            "vehicle_type": self.vehicle_type,
            "make": self.make,
            "model": self.model,
            "year": self.year,
            "odo_km": float(self.odo_km or 0),
            "fleet_id": str(self.fleet_id),
            "is_active": self.is_active,
            "status": getattr(self, "status", None),
            "health_score": getattr(self, "health_score", None),
        }


class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id     = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    email         = Column(String(320), nullable=False, index=True)
    hashed_pw     = Column(Text, nullable=False)
    full_name     = Column(String(255))
    role          = Column(String(50), default="fleet_manager")
    is_active     = Column(Boolean, default=True)
    last_login_at = Column(DateTime(timezone=True))
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id       = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    vehicle_id      = Column(String(50), nullable=False, index=True)
    prediction_id   = Column(UUID(as_uuid=True), nullable=True)
    alert_type      = Column(String(50), nullable=False)
    severity        = Column(String(20), nullable=False)
    title           = Column(String(500), nullable=False)
    description     = Column(Text)
    status          = Column(String(20), default="OPEN", index=True)
    priority_score  = Column(Numeric(8, 4), default=0)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_at     = Column(DateTime(timezone=True))
    resolved_by     = Column(UUID(as_uuid=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "vehicle_id": self.vehicle_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority_score": float(self.priority_score or 0),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class FailurePrediction(Base):
    __tablename__ = "failure_predictions"

    id                  = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id           = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    vehicle_id          = Column(String(50), nullable=False, index=True)
    predicted_at        = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    failure_type        = Column(String(100), nullable=False)
    failure_probability = Column(Numeric(5, 4), nullable=False)
    risk_level          = Column(String(20), nullable=False, index=True)
    expected_window     = Column(String(50))
    top_evidence        = Column(JSONB, default=list)
    model_version       = Column(String(50))
    is_confirmed        = Column(Boolean)
    confirmed_at        = Column(DateTime(timezone=True))
    actual_failure_type = Column(String(100))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "vehicle_id": self.vehicle_id,
            "predicted_at": self.predicted_at.isoformat() if self.predicted_at else None,
            "failure_type": self.failure_type,
            "failure_probability": float(self.failure_probability or 0),
            "risk_level": self.risk_level,
            "expected_window": self.expected_window,
            "top_evidence": self.top_evidence or [],
            "model_version": self.model_version,
        }
