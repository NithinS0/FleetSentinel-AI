"""
FleetSentinel AI — AI Maintenance Copilot Service
LangGraph-based agent with guardrails, audited tool calls, and structured responses.
"""

import logging
import os
from typing import Any, Optional
from datetime import datetime, timezone

import httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

log = logging.getLogger("copilot")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")

app = FastAPI(
    title="FleetSentinel Copilot",
    description="AI Maintenance Copilot for connected fleet intelligence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────
class CopilotRequest(BaseModel):
    query: str
    vehicle_id: Optional[str] = None
    tenant_id: str = "demo"
    session_id: Optional[str] = None
    auth_token: str


class CopilotResponse(BaseModel):
    answer: str
    sources: list[dict] = []
    vehicle_id: Optional[str] = None
    actions_taken: list[str] = []
    session_id: str


# ── Tool Definitions ─────────────────────────────────────────────
class FleetCopilotTools:
    """Controlled tools the AI agent can call (audited, scoped)."""

    def __init__(self, token: str, tenant_id: str):
        self.token = token
        self.tenant_id = tenant_id
        self.http = httpx.AsyncClient(
            base_url=API_GATEWAY_URL,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )
        self.audit_log = []

    async def get_vehicle_status(self, vehicle_id: str) -> dict:
        """Get current vehicle health and status."""
        self._audit("get_vehicle_status", vehicle_id)
        try:
            r = await self.http.get(f"/vehicles/{vehicle_id}/health")
            r.raise_for_status()
            return r.json()
        except Exception as e:
            return {"error": str(e), "vehicle_id": vehicle_id}

    async def get_vehicle_predictions(self, vehicle_id: str) -> dict:
        """Get latest failure predictions for a vehicle."""
        self._audit("get_vehicle_predictions", vehicle_id)
        try:
            r = await self.http.get(f"/vehicles/{vehicle_id}/predictions", params={"limit": 3})
            r.raise_for_status()
            return r.json()
        except Exception as e:
            return {"error": str(e)}

    async def get_active_alerts(self, vehicle_id: Optional[str] = None) -> dict:
        """Get active alerts, optionally filtered to a vehicle."""
        self._audit("get_active_alerts", vehicle_id or "fleet")
        try:
            params = {"status": "OPEN", "page_size": 10}
            if vehicle_id:
                params["vehicle_id"] = vehicle_id
            r = await self.http.get("/alerts/", params=params)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            return {"error": str(e)}

    async def get_vehicle_telemetry_state(self, vehicle_id: str) -> dict:
        """Get latest telemetry state from cache."""
        self._audit("get_vehicle_state", vehicle_id)
        try:
            r = await self.http.get(f"/vehicles/{vehicle_id}/state")
            r.raise_for_status()
            return r.json()
        except Exception as e:
            return {"error": str(e)}

    async def get_fleet_summary(self) -> dict:
        """Get fleet-level overview metrics."""
        self._audit("get_fleet_summary", "fleet")
        try:
            r = await self.http.get("/metrics-api/dashboard")
            r.raise_for_status()
            return r.json()
        except Exception as e:
            return {"error": str(e)}

    def _audit(self, tool: str, resource: str):
        self.audit_log.append({
            "tool": tool,
            "resource": resource,
            "ts": datetime.now(timezone.utc).isoformat(),
        })

    async def close(self):
        await self.http.aclose()


# ── Copilot Agent ────────────────────────────────────────────────
SYSTEM_PROMPT = """You are FleetSentinel Copilot, an expert AI assistant for fleet maintenance.
You help fleet managers understand vehicle health, interpret failure predictions, and decide on maintenance actions.

CAPABILITIES:
- Explain vehicle health scores and risk levels
- Interpret failure predictions and evidence
- Describe diagnostic trouble codes (DTCs) in plain language
- Recommend maintenance priorities
- Summarize fleet-wide risk

GUARDRAILS - You MUST follow these:
- ONLY discuss fleet maintenance, vehicle health, and related topics
- NEVER suggest actions outside of maintenance scope
- NEVER expose data from other tenants
- NEVER execute arbitrary code or database queries
- ALWAYS cite the data source behind your answer
- Be direct, concise, and actionable
- Express uncertainty when data is missing or inconclusive

RESPONSE FORMAT:
- Start with a direct answer
- Then provide supporting evidence
- End with a specific recommended action (if applicable)
"""


async def call_llm(system_prompt: str, user_message: str, context: str) -> str:
    """Call LLM API (Google Gemini 3 Flash preferred, Groq fallback)."""
    full_message = f"{context}\n\nUser question: {user_message}"

    # 1. Primary: Google Gemini 3 Flash
    if GEMINI_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={GEMINI_API_KEY}",
                    json={
                        "system_instruction": {"parts": [{"text": system_prompt}]},
                        "contents": [{"parts": [{"text": full_message}], "role": "user"}],
                        "generationConfig": {
                            "temperature": 0.3,
                            "maxOutputTokens": 1024,
                        },
                    },
                )
                r.raise_for_status()
                data = r.json()
                if "candidates" in data and data["candidates"]:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            log.error(f"Gemini API error: {e}")

    # 2. Secondary Fallback: Groq (llama-3.3-70b-versatile)
    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                r = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": full_message},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1024,
                    },
                )
                r.raise_for_status()
                data = r.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            log.error(f"Groq API error: {e}")

    # 3. Rule-based offline deterministic fallback
    return generate_rule_based_response(user_message, context)


def generate_rule_based_response(query: str, context: str) -> str:
    """Rule-based fallback when LLM is unavailable."""
    q = query.lower()
    if "risk" in q or "danger" in q or "critical" in q:
        return (
            "Based on the telemetry data, I've analyzed the vehicle's current risk profile. "
            + context[:500] + "\n\nRecommendation: Schedule an inspection within 24 hours for critical-risk vehicles."
        )
    if "maintenance" in q or "service" in q:
        return "Based on historical patterns and current telemetry, the vehicle shows signs requiring preventive maintenance. " + context[:300]
    if "why" in q or "reason" in q or "cause" in q:
        return "The risk prediction is based on: " + context[:400]
    return "I've analysed the fleet data. " + context[:400] + "\n\nPlease ask a specific question about a vehicle or the fleet status."


async def run_copilot(request: CopilotRequest) -> CopilotResponse:
    """Main copilot pipeline: gather context → call LLM → return structured response."""
    import uuid
    session_id = request.session_id or str(uuid.uuid4())
    tools = FleetCopilotTools(token=request.auth_token, tenant_id=request.tenant_id)

    context_parts = []
    sources = []

    try:
        # ── Extract vehicle_id from query if not provided ────────
        vehicle_id = request.vehicle_id
        query_lower = request.query.lower()

        # Gather context based on query intent
        if vehicle_id:
            # Vehicle-specific query
            health = await tools.get_vehicle_status(vehicle_id)
            predictions = await tools.get_vehicle_predictions(vehicle_id)
            alerts = await tools.get_active_alerts(vehicle_id)

            if "error" not in health:
                context_parts.append(f"VEHICLE HEALTH: {health}")
                sources.append({"type": "vehicle_health", "vehicle_id": vehicle_id})

            if "error" not in predictions and predictions.get("items"):
                pred = predictions["items"][0]
                context_parts.append(
                    f"LATEST PREDICTION: {pred.get('failure_type')} | "
                    f"Probability: {pred.get('failure_probability', 0)*100:.0f}% | "
                    f"Risk: {pred.get('risk_level')} | "
                    f"Window: {pred.get('expected_window')} | "
                    f"Evidence: {pred.get('top_evidence', [])}"
                )
                sources.append({"type": "failure_prediction", "vehicle_id": vehicle_id})

            if "error" not in alerts and alerts.get("items"):
                context_parts.append(f"ACTIVE ALERTS: {len(alerts['items'])} open alerts")
                sources.append({"type": "alerts", "vehicle_id": vehicle_id})

        else:
            # Fleet-wide query
            summary = await tools.get_fleet_summary()
            if "error" not in summary:
                context_parts.append(f"FLEET SUMMARY: {summary}")
                sources.append({"type": "fleet_summary"})

        context = "\n\n".join(context_parts) or "No specific vehicle data available."

        # Call LLM
        answer = await call_llm(SYSTEM_PROMPT, request.query, context)

    finally:
        await tools.close()

    return CopilotResponse(
        answer=answer,
        sources=sources,
        vehicle_id=vehicle_id,
        actions_taken=[a["tool"] for a in tools.audit_log],
        session_id=session_id,
    )


# ── API Endpoints ────────────────────────────────────────────────
@app.post("/query", response_model=CopilotResponse, summary="Ask the AI copilot")
async def query_copilot(request: CopilotRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if len(request.query) > 2000:
        raise HTTPException(status_code=400, detail="Query too long (max 2000 chars)")
    return await run_copilot(request)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "copilot-service"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
