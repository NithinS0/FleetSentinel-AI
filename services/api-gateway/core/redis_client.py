"""
FleetSentinel AI — Redis client wrapper
"""

from typing import Any, Optional
import json

import redis.asyncio as aioredis

from core.config import settings


class RedisClient:
    def __init__(self):
        self._client: Optional[aioredis.Redis] = None

    async def connect(self):
        self._client = await aioredis.from_url(
            settings.REDIS_URL,
            password=settings.REDIS_PASSWORD,
            decode_responses=True,
            max_connections=100,
        )

    async def close(self):
        if self._client:
            await self._client.close()

    @property
    def client(self) -> aioredis.Redis:
        if not self._client:
            raise RuntimeError("Redis not connected")
        return self._client

    # ── Vehicle State Cache ───────────────────────────────────────

    async def set_vehicle_state(self, vehicle_id: str, state: dict, ttl: int = 300):
        await self.client.setex(
            f"vehicle:state:{vehicle_id}",
            ttl,
            json.dumps(state),
        )

    async def get_vehicle_state(self, vehicle_id: str) -> Optional[dict]:
        raw = await self.client.get(f"vehicle:state:{vehicle_id}")
        return json.loads(raw) if raw else None

    async def set_vehicle_health(self, vehicle_id: str, health: dict, ttl: int = 60):
        await self.client.setex(
            f"vehicle:health:{vehicle_id}",
            ttl,
            json.dumps(health),
        )

    async def get_vehicle_health(self, vehicle_id: str) -> Optional[dict]:
        raw = await self.client.get(f"vehicle:health:{vehicle_id}")
        return json.loads(raw) if raw else None

    # ── Dashboard Metrics Cache ───────────────────────────────────

    async def set_dashboard_metrics(self, tenant_id: str, metrics: dict, ttl: int = 10):
        await self.client.setex(
            f"dashboard:metrics:{tenant_id}",
            ttl,
            json.dumps(metrics),
        )

    async def get_dashboard_metrics(self, tenant_id: str) -> Optional[dict]:
        raw = await self.client.get(f"dashboard:metrics:{tenant_id}")
        return json.loads(raw) if raw else None

    # ── Active Alerts Cache ───────────────────────────────────────

    async def get_active_alerts_count(self, tenant_id: str) -> int:
        val = await self.client.get(f"alerts:count:{tenant_id}")
        return int(val) if val else 0

    async def set_active_alerts_count(self, tenant_id: str, count: int, ttl: int = 30):
        await self.client.setex(f"alerts:count:{tenant_id}", ttl, str(count))

    # ── Rate Limiting ─────────────────────────────────────────────

    async def check_rate_limit(self, key: str, limit: int, window: int = 60) -> bool:
        """Returns True if within limit, False if rate-limited."""
        pipe = self.client.pipeline()
        pipe.incr(key)
        pipe.expire(key, window)
        results = await pipe.execute()
        count = results[0]
        return count <= limit

    # ── WebSocket Pub/Sub ─────────────────────────────────────────

    async def publish(self, channel: str, message: dict):
        await self.client.publish(channel, json.dumps(message))


redis_client = RedisClient()
