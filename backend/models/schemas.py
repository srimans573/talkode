from pydantic import BaseModel
from typing import Literal


class SessionMeta(BaseModel):
    session_id: str
    candidate_name: str
    problem_id: str
    problem_title: str
    started_at: str


class CodeSnapshot(BaseModel):
    session_id: str
    code: str
    timestamp_ms: int


class SessionEvent(BaseModel):
    type: Literal["stuck", "hint_request", "decision", "self_correction", "arch_justification", "agent_response"]
    t_start: float
    t_end: float
    quote: str
    label: str


# WebSocket message types (backend → frontend)
class AgentMessage(BaseModel):
    type: Literal["agent_intro", "agent_response", "transcript_chunk", "session_started"]
    text: str
    timestamp_ms: int | None = None
