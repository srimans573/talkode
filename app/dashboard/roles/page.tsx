"use client";

import { useMemo, useState } from "react";
import { roles, type RoleStatus } from "@/app/dashboard/data";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

const statusOptions: Array<"All" | RoleStatus> = ["All", "Active", "Sourcing", "Paused"];

export default function RolesPage() {
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All");

  const visibleRoles = useMemo(() => {
    if (status === "All") {
      return roles;
    }

    return roles.filter((role) => role.status === status);
  }, [status]);

  return (
    <>
      <section className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[28px] font-black leading-tight text-[#202322]">Roles</h1>
          <p className="mt-2 text-sm text-[#55594f]">
            Track open reqs, owners, and pipeline health.
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

      <section className="mt-6 overflow-hidden rounded-[8px] bg-white">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.5fr] border-b border-[#f0eeea] px-4 py-3 text-xs font-semibold text-[#4d5148]">
          <span>Role</span>
          <span>Owner</span>
          <span>Pipeline</span>
          <span>Status</span>
          <span>Updated</span>
        </div>
        {visibleRoles.map((role) => (
          <div
            className="grid min-h-[76px] grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.5fr] items-center border-b border-[#f0eeea] px-4 last:border-b-0"
            key={role.id}
          >
            <div>
              <p className="text-base font-semibold">{role.title}</p>
              <p className="mt-1 text-xs text-[#62675e]">
                {role.id} · {role.team} · {role.location}
              </p>
            </div>
            <p className="text-sm text-[#51564d]">{role.owner}</p>
            <div className="flex gap-3 text-sm">
              <span>{role.pipeline.applied} applied</span>
              <span>{role.pipeline.assessment} screens</span>
              <span>{role.pipeline.interview} interviews</span>
            </div>
            <StatusBadge status={role.status} />
            <p className="text-sm text-[#62675e]">{role.updated}</p>
          </div>
        ))}
      </section>
    </>
  );
}
