"use client";

import { useMemo, useState } from "react";
import { candidates, insights, roles } from "@/app/dashboard/data";

const ranges = ["7 days", "30 days", "90 days"] as const;

const sourceData = {
  "7 days": [42, 58, 49, 74, 68, 83, 79],
  "30 days": [38, 44, 57, 52, 66, 61, 79, 74, 86, 81],
  "90 days": [29, 36, 44, 41, 52, 60, 58, 69, 72, 81, 78, 88],
};

export default function InsightsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("30 days");

  const bars = useMemo(() => sourceData[range], [range]);
  const activeRoles = roles.filter((role) => role.status === "Active").length;
  const highScores = candidates.filter((candidate) => candidate.score >= 90).length;

  return (
    <>
      <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[28px] font-black leading-tight text-[#202322]">
            Insights
          </h1>
          <p className="mt-2 text-sm text-[#55594f]">
            Watch quality, velocity, and risk signals move over time.
          </p>
        </div>
        <div className="flex gap-2">
          {ranges.map((option) => (
            <button
              className={
                range === option
                  ? "h-8 rounded-[3px] bg-[#202322] px-3 text-xs font-semibold text-white"
                  : "h-8 rounded-[3px] border border-[#dedbd5] px-3 text-xs font-medium text-[#4f554d] transition duration-150 hover:border-[#bfbab1] hover:text-[#202322]"
              }
              key={option}
              onClick={() => setRange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-4">
        {insights.map((item) => (
          <article className="rounded-[8px] bg-white p-4" key={item.label}>
            <p className="text-xs font-semibold text-[#62675e]">
              {item.label}
            </p>
            <p className="mt-4 text-3xl font-black">{item.value}</p>
            <p className="mt-2 text-sm font-semibold text-[#55594f]">{item.change}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_0.85fr]">
        <article className="rounded-[8px] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assessment quality trend</h2>
              <p className="mt-2 text-sm text-[#62675e]">{range} rolling view</p>
            </div>
            <p className="text-xs font-semibold text-[#62675e]">
              Quality
            </p>
          </div>

          <div className="mt-6 flex h-[200px] items-end gap-2 border-b border-[#dedbd5]">
            {bars.map((value, index) => (
              <button
                aria-label={`Quality value ${value}`}
                className="group flex flex-1 items-end"
                key={`${range}-${value}-${index}`}
                type="button"
              >
                <span
                  className="block w-full rounded-t-[6px] bg-[#202322] transition duration-150 group-hover:bg-[#d7ff5a]"
                  style={{ height: `${value}%` }}
                />
              </button>
            ))}
          </div>
        </article>

        <aside className="grid gap-4">
          <article className="rounded-[8px] bg-white p-4">
            <p className="text-xs font-semibold text-[#62675e]">
              Hiring Motion
            </p>
            <p className="mt-4 text-3xl font-black">{activeRoles}</p>
            <p className="mt-2 text-sm text-[#62675e]">active roles need attention</p>
          </article>
          <article className="rounded-[8px] bg-white p-4">
            <p className="text-xs font-semibold text-[#62675e]">
              Signal
            </p>
            <p className="mt-4 text-3xl font-black">{highScores}</p>
            <p className="mt-2 text-sm text-[#62675e]">
              candidates scored 90 or higher
            </p>
          </article>
        </aside>
      </section>
    </>
  );
}
