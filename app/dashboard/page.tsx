import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, RefreshCw, SlidersVertical } from "lucide-react";
import { assessments, candidates, pulseEvents, roles } from "@/app/dashboard/data";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusDot } from "@/components/dashboard/StatusDot";

export const metadata: Metadata = {
  title: "Dashboard | Chayote",
};

export default function DashboardPage() {
  const recruiterName = "Test Recruiter";
  const liveAssessments = assessments.filter((assessment) => assessment.status === "Live");
  const activeRoles = roles.filter((role) => role.status === "Active");
  const averageScore = Math.round(
    candidates.reduce((sum, candidate) => sum + candidate.score, 0) /
      candidates.filter((candidate) => candidate.score > 0).length,
  );

  return (
    <>
      <section className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[28px] font-black leading-tight text-[#202322]">
            Hey {recruiterName}
          </h1>
        </div>
        <p className="flex items-center gap-2 text-xs text-[#55594f]">
          Data synced: just now
          <RefreshCw size={14} />
        </p>
      </section>

      <section className="mt-6 grid gap-3 xl:grid-cols-3">
        <MetricCard detail="+3 this week" label="Active Pipelines" value={`${activeRoles.length}`} />
        <MetricCard detail="-2.4d" label="Time to Hire (Avg)" suffix="d" value="18" />
        <MetricCard detail="Accuracy" label="Assessment Quality" suffix="%" value={`${averageScore}`} />
      </section>

      <section className="mt-7 grid gap-4 xl:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Active Roles</h2>
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#353a32] transition duration-150 hover:text-[#111510]"
              href="/dashboard/roles"
            >
              <span>View all</span>
              <ArrowRight className="inline-block" size={14} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[8px] bg-white">
            <div className="grid grid-cols-[1.4fr_0.9fr_0.7fr_0.4fr] border-b border-[#f0eeea] px-4 py-2.5 text-xs font-semibold text-[#4d5148]">
              <span>Role Identity</span>
              <span>Pipeline</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {roles.slice(0, 3).map((role) => (
              <div
                className="grid min-h-[72px] grid-cols-[1.4fr_0.9fr_0.7fr_0.4fr] items-center border-b border-[#f0eeea] px-4 last:border-b-0"
                key={role.id}
              >
                <div>
                  <p className="max-w-[170px] text-[15px] font-medium leading-5">{role.title}</p>
                  <p className="mt-1 text-xs text-[#3f443b]">
                    {role.id} · {role.team}
                  </p>
                </div>
                <div className="flex items-center">
                  {[role.pipeline.applied, role.pipeline.assessment, role.pipeline.interview].map(
                    (value, index) => (
                      <span
                        className={
                          index === 2
                            ? "flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d7ff5a] px-1.5 text-[11px] font-semibold text-[#202322]"
                            : "-mr-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#efeeeb] px-1 text-[11px] text-[#62665e]"
                        }
                        key={`${role.id}-${value}-${index}`}
                      >
                        {value}
                      </span>
                    ),
                  )}
                </div>
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <StatusDot active={role.status === "Active"} />
                  {role.status}
                </span>
                <Link
                  aria-label={`Open ${role.title}`}
                  className="inline-flex transition duration-150 hover:translate-x-0.5"
                  href="/dashboard/roles"
                >
                  <ChevronRight size={18} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        <aside className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Pulse Feed
            </h2>
            <button className="inline-grid h-7 w-7 place-items-center text-[#55594f]" type="button">
              <SlidersVertical size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {pulseEvents.slice(0, 2).map((item) => (
              <article className="rounded-[8px] bg-white px-4 py-3.5" key={item.id}>
                <div className="flex items-center justify-between gap-4">
                  <p className="flex items-center gap-2 text-xs font-semibold">
                    <StatusDot active={item.tone !== "warning"} />
                    {item.label}
                  </p>
                  <p className="text-xs text-[#4a4f46]">{item.time}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#50554d]">{item.text}</p>
                {item.action ? (
                  <button
                    className="mt-4 h-8 w-full rounded-[3px] border border-[#e4e1dc] text-xs font-semibold text-[#2b3028] transition duration-150 hover:border-[#c7c2ba] hover:bg-[#fbfaf7]"
                    type="button"
                  >
                    {item.action}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-5 rounded-[8px] bg-white px-4 py-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-[#5a5f56]">
              Live Assessments
            </p>
            <p className="mt-2 text-sm text-[#5b6158]">
              {liveAssessments.length} assessments are currently collecting responses.
            </p>
          </div>
          <Link
            className="inline-flex h-8 items-center justify-center rounded-[3px] bg-primary px-3 text-[13px] font-bold text-[#111510] transition duration-150 hover:bg-[#d7ff5a]"
            href="/dashboard/assessments"
          >
            Manage assessments
          </Link>
        </div>
      </section>
    </>
  );
}
