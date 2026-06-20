import json
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.redis_client import get_redis

router = APIRouter(tags=["snapshot"])


class SnapshotRequest(BaseModel):
    code: str
    timestamp_ms: int | None = None


@router.post("/snapshot/{session_id}")
async def post_snapshot(session_id: str, body: SnapshotRequest):
    r = get_redis()

    # Confirm session exists
    if not await r.exists(f"session:{session_id}:meta"):
        raise HTTPException(status_code=404, detail="Session not found")

    # Only write if code actually changed since last snapshot
    last = await r.get(f"session:{session_id}:latest_code")
    if last == body.code:
        return {"stored": False, "reason": "no change"}

    timestamp_ms = body.timestamp_ms or int(time.time() * 1000)

    snapshot = {
        "code": body.code,
        "timestamp_ms": timestamp_ms,
    }

    # latest_code — what the live agent reads for context
    await r.set(f"session:{session_id}:latest_code", body.code)

    # code_snapshots list — what the batch merge script reads
    await r.rpush(f"session:{session_id}:code_snapshots", json.dumps(snapshot))

    return {"stored": True, "timestamp_ms": timestamp_ms}
