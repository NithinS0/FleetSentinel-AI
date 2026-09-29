"""Fingerprints router — searches historical failure fingerprints."""
from fastapi import APIRouter, Depends
from core.security import get_current_user

router = APIRouter()

@router.get("/", summary="List failure fingerprints")
async def list_fingerprints(current_user=Depends(get_current_user)):
    return {"items": [], "total": 0}
