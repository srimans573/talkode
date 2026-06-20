import json
import os
import time

from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents, LiveResultResponse
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.redis_client import get_redis

router = APIRouter(tags=["interview"])

DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")


@router.websocket("/interview/{session_id}")
async def interview_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    r = get_redis()

    # Load session meta
    raw = await r.get(f"session:{session_id}:meta")
    if not raw:
        await websocket.send_json({"type": "error", "text": "Session not found"})
        await websocket.close()
        return

    meta = json.loads(raw)

    # Send agent intro — interviewer mode
    intro = (
        f"Hi {meta['candidate_name']}, I'm your technical interviewer today. "
        f"Here's your problem:\n\n"
        f"**{meta['problem_title']}**\n\n"
        f"{meta['problem_statement']}\n\n"
        f"Take your time, think out loud, and let me know if you have any questions."
    )
    await websocket.send_json({"type": "agent_intro", "text": intro})

    # Open Deepgram streaming connection
    deepgram = DeepgramClient(DEEPGRAM_API_KEY)
    dg_connection = deepgram.listen.asyncwebsocket.v("1")

    async def on_transcript(self, result, **kwargs):
        sentence = result.channel.alternatives[0].transcript
        if not sentence:
            return

        is_final = result.is_final
        chunk = {
            "text": sentence,
            "timestamp_ms": int(time.time() * 1000),
            "is_final": is_final,
        }

        # Store final chunks in Redis for batch processing + rolling window
        if is_final:
            await r.rpush(f"session:{session_id}:transcript_chunks", json.dumps(chunk))

        # Echo transcript to frontend so candidate sees what was heard
        await websocket.send_json({"type": "transcript_chunk", "text": sentence, "is_final": is_final})

    async def on_utterance_end(self, utterance_end, **kwargs):
        # Silence threshold crossed — run rule-gate + maybe call LLM
        from services.agent import maybe_respond
        response = await maybe_respond(session_id, r)
        if response:
            await websocket.send_json({"type": "agent_response", "text": response})

    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)
    dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

    options = LiveOptions(
        model="nova-2",
        language="en-US",
        punctuate=True,
        interim_results=True,
        utterance_end_ms="2000",
        vad_events=True,
        encoding="linear16",
        sample_rate=16000,
    )

    await dg_connection.start(options)

    try:
        async for message in websocket.iter_bytes():
            await dg_connection.send(message)
    except WebSocketDisconnect:
        pass
    finally:
        await dg_connection.finish()
