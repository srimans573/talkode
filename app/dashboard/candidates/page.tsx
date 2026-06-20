"use client";

import { useMemo, useState } from "react";
import { candidates, type CandidateStage } from "@/app/dashboard/data";
import { RiskBadge } from "@/components/dashboard/RiskBadge";

const stageOptions: Array<"All" | CandidateStage> = [
  "All",
  "Applied",
  "Assessment",
  "Interview",
  "Offer",
];

export default function CandidatesPage() {
  const [stage, setStage] = useState<(typeof stageOptions)[number]>("All");
  const [query, setQuery] = useState("");

  const visibleCandidates = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const stageMatch = stage === "All" || candidate.stage === stage;
      const queryMatch =
        !normalized ||
        `${candidate.name} ${candidate.role} ${candidate.id}`
          .toLowerCase()
          .includes(normalized);

      return stageMatch && queryMatch;
    });
  }, [query, stage]);

  return (
    <>
      <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[28px] font-black leading-tight text-[#202322]">
            Candidates
          </h1>
          <p className="mt-2 text-sm text-[#55594f]">
            Review candidate progress across every active role.
          </p>
        </div>
        <input
          className="h-9 w-full rounded-full border border-[#dedbd5] bg-white px-3 text-[13px] outline-none focus:border-[#202322] focus:ring-2 focus:ring-[#d7ff5a] xl:w-[280px]"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search candidates..."
          type="search"
          value={query}
        />
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        {stageOptions.map((option) => (
          <button
            className={
              stage === option
                ? "h-8 rounded-[3px] bg-[#202322] px-3 text-xs font-semibold text-white"
                : "h-8 rounded-[3px] border border-[#dedbd5] px-3 text-xs font-medium text-[#4f554d] transition duration-150 hover:border-[#bfbab1] hover:text-[#202322]"
            }
            key={option}
            onClick={() => setStage(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-[8px] bg-white">
        <div className="grid grid-cols-[1fr_1fr_0.65fr_0.45fr_0.5fr_0.7fr] border-b border-[#f0eeea] px-4 py-3 text-xs font-semibold text-[#4d5148]">
          <span>Candidate</span>
          <span>Role</span>
          <span>Stage</span>
          <span>Score</span>
          <span>Risk</span>
          <span>Activity</span>
        </div>
        {visibleCandidates.map((candidate) => (
          <div
            className="grid min-h-[72px] grid-cols-[1fr_1fr_0.65fr_0.45fr_0.5fr_0.7fr] items-center border-b border-[#f0eeea] px-4 last:border-b-0"
            key={candidate.id}
          >
            <div>
              <p className="font-semibold">{candidate.name}</p>
              <p className="mt-1 text-xs text-[#62675e]">
                {candidate.id}
              </p>
            </div>
            <p className="text-sm text-[#51564d]">{candidate.role}</p>
            <p className="text-sm font-medium">{candidate.stage}</p>
            <p className="text-sm font-semibold">{candidate.score || "—"}</p>
            <RiskBadge risk={candidate.risk} />
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-[#62675e]">{candidate.lastActivity}</span>
              <button
                className="h-8 rounded-[3px] border border-[#dedbd5] px-3 text-xs font-semibold"
                type="button"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
