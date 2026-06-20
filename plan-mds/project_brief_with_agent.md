# Project Brief — Voice + Code Insight Tool for Technical Hiring
### (working name: Chayote)

## ⚠️ MAJOR PLAN CHANGE — READ THIS FIRST
We are now building a **hybrid system**: a live, reactive component DURING the session,
plus the original passive HR dashboard AFTER the session. Both layers share the same
underlying detection/evidence philosophy. See "Live Reactive Layer" section below —
this is now part of the core build, not a stretch goal.

## One-line pitch
HR can't technically evaluate engineering candidates — they only see a pass/fail score, never *how* the candidate actually thought and coded. We capture a candidate's voice + code during a technical interview. **Live, during the session**, a senior-engineer-like agent listens for pauses and responds (as text, not voice) only when the candidate actually asks something or states they're stuck — staying silent during normal thinking pauses. **After the session**, HR sees a full evidence-linked timeline of what happened — without the candidate ever seeing that HR-facing analysis.

**Track:** Toolbox
**Anchor sponsors:** Deepgram (voice is essential, not bolted on — now used for BOTH streaming live transcription AND/OR batch, see below), Redis (Agent Memory — session storage, now also used as ROLLING LIVE CONTEXT during the session, not just a final report store)
**Build tool:** Claude Code

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React** (teammate's boilerplate repo) | Reuse existing scaffold; matches past experience (Spolm) |
| Code editor component | **CodeMirror** or **Monaco** | Drop-in editor for candidate's coding screen |
| Backend | **Python + FastAPI** | Fast to write detection/merge logic; clean SDKs for Deepgram + Anthropic |
| Voice transcription | **Deepgram Python SDK — batch endpoint** (not streaming) | Simple REST call, timestamped JSON back, no real-time infra needed |
| LLM labeling calls | **Anthropic API (Claude)** | Narrow, bounded calls only — never open-ended judgment |
| Memory / data store | **Redis** (Redis Cloud, hackathon credits) — used as **primary datastore, not just a cache** | Matches sponsor's "Agent Memory" prize criteria directly; no second DB needed |
| Audio capture | Browser **MediaRecorder API** | Records mic to a file, sent to backend after session ends |
| Code capture | Simple `fetch` POST on save/run | Logs timestamped code snapshots to backend |

### Redis data model (no schema, just keys)
- `session:{id}:meta` → JSON string: candidate name, problem ID, timestamps
- `session:{id}:events` → Redis list (`rpush`/`lrange`), each item a JSON string: `{type, t_start, t_end, quote, label}`
- `session:{id}:transcript` (optional) → full transcript JSON, for re-deriving evidence without re-calling Deepgram
- `sessions:all` → Redis list/set of session IDs, so the HR dashboard landing page can list all candidates

No Postgres/Mongo. No TTL on these keys — Redis is the permanent store here, not a cache layer in front of something else.

---

## Core design principle (repeat this if anyone asks "how do you know it's accurate")
We never ask the AI to make an open-ended judgment ("is this candidate good?").
We detect a **fixed, known taxonomy of moments** using simple rules first, and only use a narrow LLM call to *label evidence we already found* — never to *decide* something on its own. Every output is clickable back to the exact transcript/code evidence it came from.

---

## The 5 moment types we detect

| # | Moment | Trigger (rule-based) | LLM needed? |
|---|--------|----------------------|-------------|
| 1 | Stuck statement | Phrase match: "I'm stuck", "I don't know", "not sure how to..." | No — pure keyword match |
| 2 | Hint/help request | Phrase match: "can I get a hint", "is this the right direction", "what should I look at" | No — pure keyword match |
| 3 | Self-correction | No-code-change gap (>N sec) → cue phrase ("wait", "actually", "oh") → code change follows | Yes — 1 sentence: "what did they notice and fix?" |
| 4 | Architecture/approach justification | Sustained speech chunk → followed by a meaningful code change | Yes — "does this explanation justify the change? quote the key phrase" |
| 5 | Confidence/decision statement | Phrase match: "I'll go with...", "I'm choosing X over Y" | Minimal — mostly just surfaces the quote |

**Build priority if time-constrained:** types 1, 2, 5 first (near-free, pure phrase matching), then type 3 (the strongest single demo moment), then type 4 only if time allows.

**Important:** the candidate-facing screen shows NOTHING. No flags, no live feedback, no overlay. It's just a plain code editor + mic, so the interview experience is unchanged. All insight only appears later, on a separate HR dashboard, which reads from the same Redis keys the pipeline wrote.

---

## NEW: Live Reactive Layer (during the session)

### Why this exists
The candidate may pause speaking for their own thought process — no intervention needed.
But if they ask a genuine question or state they're stuck, a senior-engineer-like agent
should respond. The hard problem: deciding which kind of pause this is, fast, with the
right context, without it feeling laggy or broken.

### Key decision: TEXT output, NOT voice (TTS)
- TTS adds latency SEQUENTIALLY on top of LLM latency (can't speak until text is generated)
- Silence → voice feels "broken/laggy" to a listener; silence → text fading in feels normal
- TTS is also a second live system that can fail independently (playback, autoplay issues)
- Net: same underlying delay, much worse PERCEIVED experience with voice vs. text
- **Decision: agent response renders as text on screen, not spoken aloud**

### Trigger logic — when do we call the LLM?
1. Stream transcript via Deepgram **streaming** API (not batch) for this live layer
2. Track time since last transcript chunk ended
3. When silence crosses a threshold (~2-3 sec) → candidate pause detected
4. **Cheap rule check FIRST** (no LLM call yet): does the recent transcript window contain
   a question-like phrase ("does this need to," "should I," "what if," "?") or an explicit
   stuck statement ("I'm stuck," "not sure")?
5. **Only if a rule fires** → make the LLM call. If no rule fires → do nothing, no LLM call.
   (This keeps LLM calls rare/bounded — most pauses are just thinking, handled for free.)

### What context gets sent in that LLM call (keep each piece SMALL)
1. **Problem statement** — static, same every call, essentially free
2. **Current code snapshot** — most recent polled snapshot (see snapshot strategy below)
3. **Recent transcript window** — last ~30-45 sec ending at the pause, NOT the whole session
4. **Rolling memory notes from Redis** — short running list of what's already been covered
   this session (e.g. "already discussed: time complexity at 2:14") so the agent doesn't
   repeat itself or re-answer something already handled

### Prompt shape (the actual change from the old batch-labeling prompt)
```
You are observing a technical coding interview. Here is the problem: {problem_statement}
Current code: {code_snapshot}
The candidate just paused after saying: "{recent_transcript_window}"
Already covered this session: {rolling_memory_notes}

If the candidate asked a direct question or stated they are stuck,
respond as a senior engineer would — briefly, like a real mentor,
not a lecture. If this is just a normal thinking pause with no
question or stuck statement, respond with exactly: NONE
```
The `NONE` sentinel is the LLM's own second-layer filter — catches ambiguous cases the
keyword rules missed, without needing a separate yes/no call before the content call.
`if response.strip() == "NONE": display nothing`

### Snapshot strategy (needed for live context, also fixes old batch detection gap)
- Don't rely only on explicit save/run events — poll the editor every 3-5 sec and log
  a new snapshot only if the code actually changed since the last one
- This guarantees there's always a recent code picture available for the live context
  bundle, regardless of whether the candidate remembers to hit save/run
- Also fixes a gap in the original "stuck" detector: "stuck" should mean no MEANINGFUL
  code change across snapshots, not "no save/run event"

### Honest risk profile (don't pretend this away tomorrow)
- Real-time streaming transcription is genuinely new infra vs. the original batch plan —
  this is the part most likely to eat build time
- Latency budget realistically: transcript lag (~1s) + LLM call (~1-4s) ≈ 2-5 sec before
  text appears. This is fine for TEXT, would NOT be fine for voice (see above)
- Network conditions at the venue tomorrow are unknown — rehearse on venue wifi if possible,
  not home wifi
- If this live layer breaks or feels unreliable during build, the FALLBACK is to cut it
  and present the original batch/passive HR-dashboard version alone — that version is
  still a complete, demoable, real product on its own. Don't let the live layer become
  a single point of failure for the whole project.

### How this connects to the original (still-built) passive layer
- Every live response + every rule-trigger gets logged to Redis exactly like the original
  moment-detection events (same `session:{id}:events` pattern)
- So the HR dashboard, after the session, still shows a full evidence-linked timeline —
  the live layer ADDS to this data, it doesn't replace the HR-facing analysis
- Redis is now doing double duty: (a) rolling live context during the session, AND
  (b) the permanent event log for the HR dashboard afterward

---

## Architecture (batch, NOT real-time streaming — deliberately simplified)

```
1. RECORD
   - Candidate codes in the React + CodeMirror/Monaco editor
   - Code snapshot logged (timestamp + diff) via fetch POST on every run/save
   - Browser MediaRecorder records mic continuously to one audio file
   - Both start at the same t=0

2. STOP
   - Candidate clicks "I'm done" (or time's up)
   - Audio file + code snapshot log finalized, sent to FastAPI backend

3. TRANSCRIBE (Deepgram BATCH API)
   - Backend sends full audio file → gets back timestamped transcript chunks

4. MERGE
   - Combine code snapshots + transcript chunks into ONE sorted timeline
   - [{t, type: "code", diff}, {t, type: "speech", text}, ...]

5. DETECT (rules-based scan over the merged timeline)
   - Run all 5 moment-type checks against the timeline
   - Types 1, 2, 5: pure phrase matching, fires immediately
   - Types 3, 4: rule finds the window, THEN triggers one narrow Claude API call

6. LABEL (narrow Claude API call, only on a detected window)
   - Send ONLY the bounded transcript + code diff for that window
   - Prompt asks for ONE sentence + a quoted phrase as evidence
   - Never feed full session history — keeps every call cheap & fast

7. STORE (Redis)
   - session:{id}:meta, session:{id}:events, sessions:all
   - (Roadmap, NOT built tonight: long-term/vector memory for cross-candidate
     pattern detection — "70% of candidates get stuck here too")

8. DISPLAY (HR dashboard ONLY — candidate never sees this)
   - React page reads session:{id}:meta + session:{id}:events via a FastAPI GET route
   - Timeline bar showing the session with each moment marked
   - Click a moment → see transcript snippet + code diff + label + quote
   - Summary line composed FROM the detected events, not freely generated
```

---

## Why batch instead of real-time streaming (don't second-guess this tomorrow)
- Candidate never sees live output anyway → there is NO use case for real-time processing
- Batch = no clock-drift risk, no streaming infra, fully debuggable (print the merged timeline and eyeball it)
- Demo can pre-record the real session hours before judging — zero live-failure risk at the table
- Looks IDENTICAL to a judge either way — they only ever see the finished HR dashboard

---

## Demo plan for the 4-minute table pitch
1. **(0:00–0:30)** Problem statement: HR approves technical hires they can't technically evaluate
2. **(0:30–2:00)** Walk through a pre-recorded real session (sped up 5x through the boring parts, slowed to normal speed exactly at a flagged moment so the judge hears it clearly) → cut to HR dashboard → click the flag → show evidence
3. **(2:00–2:45)** Optional: tiny live mini-demo (NOT the full problem, just a 60-90 sec toy snippet) to prove it's real, not canned
4. **(2:45–3:30)** Mention Redis Agent Memory (session memory, built) + long-term/vector memory (roadmap — be ready to explain in one sentence: "embed each labeled moment, retrieve semantically similar moments across sessions")
5. **(3:30–4:00)** Close: reiterate this augments HR, doesn't replace judgment — "we surface the moments a senior engineer would catch, with the receipts to prove it"

**Originality framing to say explicitly (don't let this stay implicit):** "Most AI eval tools give you a black-box score. We deliberately rejected that — we built a fixed vocabulary of recognizable engineering moments, each with receipts, because that's what makes the output trustworthy."

---

## What to explicitly NOT build (cut these without guilt)
- Any single overall "competency score" — least defensible, not needed
- **Text-to-speech / voice output for the live agent — text response only, see Live Reactive Layer section**
- Live feedback shown to the CANDIDATE during their own session (the live agent's text response — TBD whether candidate or only HR sees it live; default to candidate seeing it only if it's a direct answer to their own question, otherwise nothing renders)
- Redis long-term/vector cross-candidate memory (roadmap only — have the one-sentence explanation ready if asked)
- Postgres/Mongo or any second database — Redis is the only datastore
- More than 1-2 of the 5 moment types fully working for the HR dashboard, if time is short
- **An open-ended "should I respond?" LLM call with no rule-gate first** — always cheap-rule-check before calling the LLM live

## Fallback plan if the live layer isn't working reliably by a hard cutoff (suggest: hour 16-18)
**Cut the live layer entirely and present the original batch/passive HR-dashboard version.**
That version is a complete, real, demoable product on its own — don't let the live layer's
added risk sink the whole project. Decide on a hard go/no-go time tonight as a team.

---

## Build order for tomorrow
1. Get teammate's frontend boilerplate running; confirm folder structure
2. Code editor (CodeMirror/Monaco) + audio capture, synced to one clock
3. FastAPI backend skeleton + Redis Cloud connection (get credits, plug in host/port/password)
4. **Decide go/no-go on live layer early** — if pursuing it, prioritize Deepgram STREAMING setup first since it's the riskiest new piece
5. Snapshot polling (every 3-5 sec, only log on real change) — needed by BOTH layers
6. Deepgram batch transcription path (for the HR dashboard / fallback) — confirm timestamps make sense
7. Merge script (sort code + speech events into one timeline) — test by printing it
8. Phrase-match detectors for moment types 1, 2, 5 (cheap, do these first)
9. Self-correction detector (type 3) + one narrow Claude API labeling call
10. Wire detected events into Redis (`session:{id}:events`)
11. **Live layer**: pause detection on streaming transcript → rule-gate → bounded LLM call → text render
12. HR dashboard UI (timeline + click-to-expand evidence) — give this real polish time
13. Record the real demo session, pick/edit the clip
14. Rehearse the 4-minute pitch — decide how you'll demo the live layer (live at the table vs. pre-recorded) given the latency/network risk
