import type { RoleStatus } from "@/app/dashboard/data";

export function StatusBadge({ status }: { status: RoleStatus }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[#efeeeb] px-3 py-1 text-xs font-semibold text-[#3f443b]">
      <span
        className={
          status === "Active"
            ? "h-2 w-2 rounded-full bg-[#c8f23d]"
            : "h-2 w-2 rounded-full bg-[#b8bcb2]"
        }
      />
      {status}
    </span>
  );
}

