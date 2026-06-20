# End-to-End Flow Spec — HR & Candidate Journeys

This doc exists so the routes, data model, and screens all connect into ONE coherent
app. Read this alongside `project_brief.md` (architecture/stack/live layer) and
`hr_dashboard_spec.md` (the analysis view design rules). This doc is the map of how
those pieces get wired together end to end.

---

## Two separate user types, two separate experiences

- **HR** — creates an account, creates assessments, sends links, views results.
  Never sees a candidate mid-session. Only sees the post-session dashboard.
- **Candidate** — no account. Opens a link, types their name, does the task.
  Never sees the HR-facing analysis. Possibly sees a live text response if they
  ask a question (open decision — see "Open Decisions" at the bottom).

---

## HR Journey

1. **Sign up / log in**
   - Use a drop-in auth provider (e.g. Clerk) — don't build auth from scratch.
   - Route: `/signup`, `/login`

2. **Dashboard / home**
   - Route: `/dashboard`
   - Shows a list of this HR account's assessments (`hr:{hr_id}:assessments`)
   - Button: "Create new assessment"

3. **Create an assessment**
   - Route: `/assessments/new`
   - For now: just names the assessment and confirms the (single, fixed) coding
     problem — no need to build a problem-authoring UI tonight, the problem itself
     is hardcoded/fixed for the demo
   - On submit: generates `assessment:{assessment_id}:meta` in Redis (problem
     statement, created_by = hr_id, created_at) and a unique slug for the
     candidate-facing link
   - Returns a shareable link: `/take/{assessment_id}`

4. **View an assessment's sessions**
   - Route: `/assessments/{assessment_id}`
   - Lists every candidate session taken under this assessment
     (`assessment:{assessment_id}:sessions`), with candidate name + completion time
   - Click a session → goes to the HR Dashboard view (see `hr_dashboard_spec.md`)
   - Route: `/assessments/{assessment_id}/sessions/{session_id}`

---

## Candidate Journey

1. **Opens the unique link**
   - Route: `/take/{assessment_id}`
   - No login. No account. Just this page.

2. **Enters their name**
   - Simple input, no validation needed beyond "not empty"
   - On submit: creates a new `session:{session_id}:meta` in Redis
     (`assessment_id`, `candidate_name`, `started_at`), appends `session_id` to
     `assessment:{assessment_id}:sessions`

3. **Sees the problem + editor**
   - Route: `/take/{assessment_id}/session/{session_id}`
   - Problem statement (from `assessment:{assessment_id}:meta`) shown alongside
     a CodeMirror/Monaco editor
   - "Begin" button — starts mic recording + code snapshot polling + live
     streaming transcription, all timestamped against one clock (t=0 at this click)

4. **Works through the problem**
   - Code snapshots poll every 3-5 sec (only logged on real change)
   - Mic streams continuously
   - Pauses get checked against the Live Reactive Layer's rule-gate
     (see `project_brief.md` → "Live Reactive Layer" section)
   - If a rule fires + the bounded LLM call doesn't return `NONE` → a short text
     response renders **[OPEN DECISION — see bottom of this doc]**
   - Every live-layer event also gets logged to `session:{session_id}:events`
     immediately as it happens (don't wait until session end to write these)

5. **Clicks "I'm done"**
   - Recording stops, audio file finalized, code snapshot log finalized
   - Candidate sees a simple "You're done — thanks!" screen. Nothing else.
     No score, no feedback, no indication of what was detected.

6. **Backend post-processing kicks off** (invisible to candidate, can take a
   few seconds to a minute — no UI needs to wait on this)
   - Full audio → Deepgram BATCH transcription (separate from the live
     streaming pass)
   - Merge code snapshots + batch transcript into one timeline
   - Run the 5 moment-type detectors over the full timeline
   - Bounded LLM calls label any detected self-correction/justification moments
   - Write/merge all detected events into `session:{session_id}:events`
     (alongside whatever the live layer already wrote)
   - Mark `session:{session_id}:meta` as `status: complete`

---

## Data model (Redis only — see `project_brief.md` for full rationale)

```
hr:{hr_id}:meta                      → account info (if not fully handled by auth provider)
hr:{hr_id}:assessments               → list of assessment_ids

assessment:{assessment_id}:meta      → { problem_statement, created_by (hr_id), created_at }
assessment:{assessment_id}:sessions  → list of session_ids

session:{session_id}:meta            → { assessment_id, candidate_name, started_at, status }
session:{session_id}:events          → list of JSON events:
                                        { type, t_start, t_end, quote, label, source: "live" | "batch" }
session:{session_id}:transcript      → (optional) full transcript JSON
```

Every event gets a `source` field (`"live"` or `"batch"`) so the HR dashboard can
show whether something was caught in the moment or found afterward — useful for
your pitch ("here's something we caught live, here's something we found in
deeper post-session analysis").

---

## Route summary

| Route | Who | Purpose |
|---|---|---|
| `/signup`, `/login` | HR | Auth |
| `/dashboard` | HR | List of assessments |
| `/assessments/new` | HR | Create an assessment |
| `/assessments/{assessment_id}` | HR | List of sessions for one assessment |
| `/assessments/{assessment_id}/sessions/{session_id}` | HR | The analysis dashboard (see `hr_dashboard_spec.md`) |
| `/take/{assessment_id}` | Candidate | Name entry |
| `/take/{assessment_id}/session/{session_id}` | Candidate | The coding/talking session itself |

---

## Open decisions (resolve before/while building, not mid-demo)

1. **Does the candidate see the live agent's text response, or only HR (after the
   fact)?** This changes what renders on the candidate's screen during step 4 above.
   - If YES (candidate sees it): build a small response panel/toast on the
     candidate's session screen.
   - If NO (HR-only): the live layer still runs and logs to Redis, but nothing
     ever renders on the candidate's screen — it's a silent live-detection layer
     whose results only surface afterward.
   - **Recommendation if undecided under time pressure: default to NO (HR-only).**
     It's strictly simpler to build (no candidate-facing UI for it) and avoids
     the live-layer latency being visible/awkward to the candidate in real time.

2. **Go/no-go cutoff for the Live Reactive Layer** (see `project_brief.md`) —
   pick a real hour tonight/tomorrow; if it's not reliable by then, ship the
   batch-only flow (steps 4-6 above minus live rendering) as the complete product.
