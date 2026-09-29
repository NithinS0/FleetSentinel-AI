"""
FleetSentinel AI — WebSocket Router
Real-time fleet updates pushed to the dashboard.
"""

import asyncio
import json
import logging
from typing import Dict, Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import redis.asyncio as aioredis

from core.config import settings
from core.security import decode_token

log = logging.getLogger("ws")
router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections per tenant."""

    def __init__(self):
        self._connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, tenant_id: str):
        await websocket.accept()
        if tenant_id not in self._connections:
            self._connections[tenant_id] = set()
        self._connections[tenant_id].add(websocket)
        log.info(f"WS connected: tenant={tenant_id}, total={len(self._connections[tenant_id])}")

    def disconnect(self, websocket: WebSocket, tenant_id: str):
        if tenant_id in self._connections:
            self._connections[tenant_id].discard(websocket)
        log.info(f"WS disconnected: tenant={tenant_id}")

    async def broadcast_to_tenant(self, tenant_id: str, message: dict):
        conns = self._connections.get(tenant_id, set())
        if not conns:
            return
        dead = set()
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)
        for ws in dead:
            conns.discard(ws)

    async def broadcast_all(self, message: dict):
        for tenant_id in list(self._connections.keys()):
            await self.broadcast_to_tenant(tenant_id, message)


manager = ConnectionManager()


@router.websocket("/fleet")
async def fleet_websocket(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time fleet updates.
    Client must send JWT token as query param: ws://host/ws/fleet?token=<jwt>
    """
    try:
        payload = decode_token(token)
        tenant_id = payload["tenant_id"]
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    await manager.connect(websocket, tenant_id)

    # Subscribe to Redis pub/sub for this tenant
    redis_conn = await aioredis.from_url(
        settings.REDIS_URL,
        password=settings.REDIS_PASSWORD,
        decode_responses=True,
    )
    pubsub = redis_conn.pubsub()
    await pubsub.subscribe(
        f"fleet:updates:{tenant_id}",
        f"fleet:alerts:{tenant_id}",
        f"fleet:metrics:{tenant_id}",
    )

    async def listen_redis():
        async for message in pubsub.listen():
            if message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    await websocket.send_json(data)
                except Exception as e:
                    log.warning(f"WS send error: {e}")
                    break

    try:
        redis_task = asyncio.create_task(listen_redis())
        while True:
            # Keep connection alive with ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        redis_task.cancel()
        manager.disconnect(websocket, tenant_id)
        await pubsub.unsubscribe()
        await redis_conn.close()
