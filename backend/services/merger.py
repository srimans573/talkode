import json

import redis.asyncio as redis


async def build_timeline(session_id: str, utterances: list[dict], r: redis.Redis) -> list[dict]:
    """Merge Deepgram utterances + code snapshots into one sorted timeline."""

    # Pull code snapshots from Redis
    raw_snapshots = await r.lrange(f"session:{session_id}:code_snapshots", 0, -1)
    code_events = []
    for raw in raw_snapshots:
        snap = json.loads(raw)
        code_events.append({
            "type": "code",
            "start_ms": snap["timestamp_ms"],
            "end_ms": snap["timestamp_ms"],
            "text": snap["code"],
        })

    # Normalise speech utterances
    speech_events = [
        {
            "type": "speech",
            "start_ms": u["start_ms"],
            "end_ms": u["end_ms"],
            "text": u["text"],
        }
        for u in utterances
    ]

    timeline = sorted(speech_events + code_events, key=lambda e: e["start_ms"])
    return timeline
