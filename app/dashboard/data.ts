export type RoleStatus = "Active" | "Sourcing" | "Paused";
export type AssessmentStatus = "Draft" | "Live" | "Reviewing" | "Complete";
export type CandidateStage = "Applied" | "Assessment" | "Interview" | "Offer";

export const roles = [
  {
    id: "REQ-8492",
    title: "Senior Rust Engineer",
    team: "Core Systems",
    location: "Remote",
    status: "Active" as RoleStatus,
    pipeline: { applied: 12, assessment: 4, interview: 1 },
    owner: "Maya Chen",
    updated: "12m ago",
  },
  {
    id: "REQ-8501",
    title: "Product Designer",
    team: "Design Ops",
    location: "New York",
    status: "Sourcing" as RoleStatus,
    pipeline: { applied: 45, assessment: 12, interview: 0 },
    owner: "Priya Shah",
    updated: "1h ago",
  },
  {
    id: "REQ-8510",
    title: "ML Platform Lead",
    team: "Applied AI",
    location: "San Francisco",
    status: "Active" as RoleStatus,
    pipeline: { applied: 18, assessment: 6, interview: 2 },
    owner: "Theo Martin",
    updated: "2h ago",
  },
  {
    id: "REQ-8516",
    title: "Customer Engineer",
    team: "Revenue",
    location: "Austin",
    status: "Paused" as RoleStatus,
    pipeline: { applied: 28, assessment: 8, interview: 3 },
    owner: "Sam Rivera",
    updated: "Yesterday",
  },
];

export const assessments = [
  {
    id: "ASM-1048",
    title: "Rust Core Systems",
    role: "Senior Rust Engineer",
    status: "Live" as AssessmentStatus,
    candidates: 16,
    completion: 72,
    medianScore: 86,
    due: "May 30",
  },
  {
    id: "ASM-1052",
    title: "Product Critique",
    role: "Product Designer",
    status: "Reviewing" as AssessmentStatus,
    candidates: 12,
    completion: 58,
    medianScore: 79,
    due: "Jun 2",
  },
  {
    id: "ASM-1059",
    title: "ML Systems Design",
    role: "ML Platform Lead",
    status: "Draft" as AssessmentStatus,
    candidates: 0,
    completion: 0,
    medianScore: 0,
    due: "Unscheduled",
  },
  {
    id: "ASM-1031",
    title: "Customer Debugging",
    role: "Customer Engineer",
    status: "Complete" as AssessmentStatus,
    candidates: 22,
    completion: 100,
    medianScore: 83,
    due: "Closed",
  },
];

export const candidates = [
  {
    id: "CAN-2091",
    name: "Elena Chen",
    role: "Data Scientist",
    stage: "Assessment" as CandidateStage,
    score: 92,
    risk: "High",
    lastActivity: "48h ago",
  },
  {
    id: "CAN-2104",
    name: "Marco Silva",
    role: "Senior Rust Engineer",
    stage: "Interview" as CandidateStage,
    score: 98,
    risk: "Low",
    lastActivity: "1h ago",
  },
  {
    id: "CAN-2112",
    name: "Nora Patel",
    role: "Product Designer",
    stage: "Assessment" as CandidateStage,
    score: 84,
    risk: "Medium",
    lastActivity: "3h ago",
  },
  {
    id: "CAN-2120",
    name: "Ibrahim Noor",
    role: "ML Platform Lead",
    stage: "Applied" as CandidateStage,
    score: 0,
    risk: "Low",
    lastActivity: "Today",
  },
  {
    id: "CAN-2135",
    name: "Avery Brooks",
    role: "Customer Engineer",
    stage: "Offer" as CandidateStage,
    score: 89,
    risk: "Low",
    lastActivity: "Yesterday",
  },
];

export const pulseEvents = [
  {
    id: "pulse-1",
    action: "Nudge Candidate",
    label: "Flight Risk",
    text: "Elena Chen has delayed assessment completion by 48h.",
    time: "10m ago",
    tone: "warning",
  },
  {
    id: "pulse-2",
    label: "Top Score",
    text: "Marco Silva scored 98/100 on Rust Core Systems.",
    time: "1h ago",
    tone: "success",
  },
  {
    id: "pulse-3",
    label: "Pipeline",
    text: "Product Designer moved 3 candidates into assessment.",
    time: "2h ago",
    tone: "neutral",
  },
];

export const insights = [
  { label: "Pass-through rate", value: "41%", change: "+6%" },
  { label: "Avg completion", value: "3.2d", change: "-0.8d" },
  { label: "Quality signal", value: "94%", change: "+3%" },
  { label: "Candidate NPS", value: "72", change: "+8" },
];

export const searchItems = [
  ...roles.map((role) => ({
    href: "/dashboard/roles",
    label: role.title,
    meta: role.id,
    type: "Role",
  })),
  ...assessments.map((assessment) => ({
    href: "/dashboard/assessments",
    label: assessment.title,
    meta: assessment.id,
    type: "Assessment",
  })),
  ...candidates.map((candidate) => ({
    href: "/dashboard/candidates",
    label: candidate.name,
    meta: candidate.role,
    type: "Candidate",
  })),
];
