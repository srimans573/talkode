import asyncio
import json
import os
import time

from deepgram import DeepgramClient, LiveOptions, LiveTranscriptionEvents
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.redis_client import get_redis

router = APIRouter(tags=["interview"])

DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")


@router.websocket("/interview/{session_id}")
async def interview_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    r = get_redis()

    raw = await r.get(f"session:{session_id}:meta")
    if not raw:
        await websocket.send_json({"type": "error", "text": "Session not found"})
        await websocket.close()
        return

    meta = json.loads(raw)

    from services.tts import synthesize
    from services.agent import extract_first_rubric_question, log_agent_turn

    first_question = extract_first_rubric_question(meta.get("question_guidelines", ""))
    opening = (
        first_question
        if first_question
        else "Let's start with the README — what is this project, and what's the first thing you'd look at to understand how it's built?"
    )

    intro = (
        f"Hi {meta['candidate_name']}, I'm your AI technical interviewer. "
        f"Today's session is {meta['problem_title']}. "
        f"You have the codebase open in front of you — ask me if you get stuck. "
        f"{opening}"
    )

    intro_audio = await synthesize(intro)
    if intro_audio:
        await websocket.send_json({"type": "agent_audio", "audio_b64": intro_audio})
    else:
        await websocket.send_json({"type": "agent_intro", "text": intro})

    # Seed conversation history with the agent's opening turn
    await log_agent_turn(session_id, r, intro)

    # Queue bridges Deepgram async callbacks → our async agent logic.
    # Buffers is_final segments and flushes on UtteranceEnd.
    transcript_queue: asyncio.Queue[str | None] = asyncio.Queue()
    utterance_buffer: list[str] = []

    # response_lock: True while agent audio is playing on the frontend.
    # Cleared by the audio_ended signal from the frontend.
    # Prevents generating a second response while the first is still playing.
    # last_utterance: deduplicates consecutive identical transcript segments
    # (Deepgram occasionally fires UtteranceEnd twice for the same speech).
    state = {"response_lock": False, "last_utterance": ""}

    deepgram = DeepgramClient(DEEPGRAM_API_KEY)
    dg_connection = deepgram.listen.asyncwebsocket.v("1")

    async def on_transcript(self, result, **kwargs):
        try:
            sentence = result.channel.alternatives[0].transcript
            if not sentence:
                return
            if result.is_final:
                utterance_buffer.append(sentence)
                print(f"[transcript] buffered: {sentence!r}")
            else:
                await websocket.send_json({"type": "transcript_chunk", "text": sentence, "is_final": False})
        except Exception as e:
            print(f"[transcript] error: {e}")

    async def on_utterance_end(self, **kwargs):
        try:
            if not utterance_buffer:
                return
            full_utterance = " ".join(utterance_buffer).strip()
            utterance_buffer.clear()
            if full_utterance:
                print(f"[utterance_end] flushing: {full_utterance!r}")
                await transcript_queue.put(full_utterance)
        except Exception as e:
            print(f"[utterance_end] error: {e}")

    dg_connection.on(LiveTranscriptionEvents.Transcript, on_transcript)
    dg_connection.on(LiveTranscriptionEvents.UtteranceEnd, on_utterance_end)

    options = LiveOptions(
        model="nova-2",
        language="en-US",
        punctuate=True,
        interim_results=True,
        utterance_end_ms="2500",
        vad_events=True,
        encoding="linear16",
        sample_rate=16000,
    )

    await dg_connection.start(options)

    async def agent_loop():
        from services.agent import maybe_respond
        while True:
            sentence = await transcript_queue.get()
            if sentence is None:
                break

            # Block until previous agent audio has finished playing on the frontend,
            # preventing a second utterance from generating a response while the first
            # is still mid-playback. Frontend signals completion via "audio_ended".
            # 12s timeout guards against lost signals (network drop, JS error, etc.).
            lock_deadline = time.time() + 12.0
            while state["response_lock"] and time.time() < lock_deadline:
                await asyncio.sleep(0.05)
            state["response_lock"] = False  # ensure cleared after timeout

            # Drop consecutive duplicates — Deepgram occasionally fires
            # UtteranceEnd twice for the same segment.
            if sentence == state["last_utterance"]:
                print(f"[agent_loop] dedup: dropping repeated utterance {sentence!r}")
                continue
            state["last_utterance"] = sentence

            chunk = {"text": sentence, "timestamp_ms": int(time.time() * 1000), "is_final": True}
            await r.rpush(f"session:{session_id}:transcript_chunks", json.dumps(chunk))
            await websocket.send_json({"type": "transcript_chunk", "text": sentence, "is_final": True})

            try:
                response, challenge_ready = await maybe_respond(session_id, r)

                # When the challenge fires, skip the agent's verbal response —
                # the challenge intro from startCodingChallenge is the transition.
                # Sending both causes the candidate to hear a codebase question
                # AND the challenge intro back-to-back, which is confusing.
                if response and not challenge_ready:
                    from services.tts import synthesize
                    audio_b64 = await synthesize(response)

                    if audio_b64:
                        state["response_lock"] = True
                        utterance_buffer.clear()  # discard any speech captured during response gen
                        await websocket.send_json({
                            "type": "agent_audio",
                            "audio_b64": audio_b64,
                        })
                    await websocket.send_json({"type": "agent_response", "text": response})

                if challenge_ready:
                    await websocket.send_json({"type": "coding_challenge_ready"})

                if await r.get(f"session:{session_id}:interview_complete"):
                    await websocket.send_json({"type": "interview_complete"})
            except Exception as e:
                print(f"[agent] error: {e}")

    async def keepalive_loop():
        """Send a KeepAlive to Deepgram every 10s so it doesn't time out during silence."""
        while True:
            await asyncio.sleep(10)
            try:
                await dg_connection.keep_alive()
            except Exception:
                break

    agent_task = asyncio.create_task(agent_loop())
    keepalive_task = asyncio.create_task(keepalive_loop())

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break
            elif message.get("bytes"):
                # Always forward mic audio — keeps Deepgram connection alive
                await dg_connection.send(message["bytes"])
            elif message.get("text"):
                try:
                    msg = json.loads(message["text"])
                    if msg.get("type") == "audio_ended":
                        state["response_lock"] = False
                except Exception:
                    pass
    except WebSocketDisconnect:
        pass
    finally:
        keepalive_task.cancel()
        await transcript_queue.put(None)
        await agent_task
        await dg_connection.finish()
