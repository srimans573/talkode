"use client";

import { useMemo, useState } from "react";
import { assessments, type AssessmentStatus } from "@/app/dashboard/data";

const statusOptions: Array<"All" | AssessmentStatus> = [
  "All",
  "Draft",
  "Live",
  "Reviewing",
  "Complete",
];

function statusClass(status: AssessmentStatus) {
  if (status === "Live") {
    return "bg-[#d7ff5a] text-[#202322]";
  }

  if (status === "Draft") {
    return "bg-[#efeeeb] text-[#555a51]";
  }

  if (status === "Reviewing") {
    return "bg-[#202322] text-white";
  }

  return "bg-[#e5e8df] text-[#4f564a]";
}

export default function AssessmentsPage() {
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All");

  const visibleAssessments = useMemo(() => {
    if (status === "All") {
      return assessments;
    }

    return assessments.filter((assessment) => assessment.status === status);
  }, [status]);

  return (
    <>
      <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[28px] font-black leading-tight text-[#202322]">
            Assessments
          </h1>
          <p className="mt-2 text-sm text-[#55594f]">
            Build, launch, and review candidate assessments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              className={
                status === option
                  ? "h-8 rounded-[3px] bg-[#202322] px-3 text-xs font-semibold text-white"
                  : "h-8 rounded-[3px] border border-[#dedbd5] px-3 text-xs font-medium text-[#4f554d] transition duration-150 hover:border-[#bfbab1] hover:text-[#202322]"
              }
              key={option}
              onClick={() => setStatus(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {visibleAssessments.map((assessment) => (
          <article className="rounded-[8px] bg-white p-4" key={assessment.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#62675e]">
                  {assessment.id}
                </p>
                <h2 className="mt-2 text-xl font-bold">{assessment.title}</h2>
                <p className="mt-2 text-sm text-[#62675e]">{assessment.role}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                  assessment.status,
                )}`}
              >
                {assessment.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-semibold text-[#6b7067]">
                  Candidates
                </p>
                <p className="mt-2 text-2xl font-bold">{assessment.candidates}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6b7067]">
                  Completion
                </p>
                <p className="mt-2 text-2xl font-bold">{assessment.completion}%</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6b7067]">
                  Median
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {assessment.medianScore || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#efeeeb]">
              <div
                className="h-full rounded-full bg-[#c8f23d]"
                style={{ width: `${assessment.completion}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-[#62675e]">Due {assessment.due}</p>
              <div className="flex gap-2">
                <button
                  className="h-8 rounded-[3px] border border-[#dedbd5] px-3 text-[13px] font-medium"
                  type="button"
                >
                  Preview
                </button>
                <button
                  className="h-8 rounded-[3px] bg-primary px-3 text-[13px] font-bold transition duration-150 hover:bg-[#d7ff5a]"
                  type="button"
                >
                  Open
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
