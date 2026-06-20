export function RiskBadge({ risk }: { risk: string }) {
  return (
    <span className="rounded-full bg-[#efeeeb] px-3 py-1 text-xs font-semibold text-[#4f554d]">
      {risk}
    </span>
  );
}

