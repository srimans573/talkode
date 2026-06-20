type MetricCardProps = {
  detail: string;
  label: string;
  suffix?: string;
  value: string;
};

export function MetricCard({ detail, label, suffix, value }: MetricCardProps) {
  return (
    <article className="min-h-[96px] rounded-[8px] border border-[#eeeeee] bg-white px-4 py-4 shadow-[0_1px_8px_rgba(30,30,26,0.03)]">
      <p className="text-xs font-semibold text-[#4e5148]">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[30px] font-bold leading-none text-[#202322]">
          {value}
          {suffix ? <span className="ml-1 text-base font-semibold">{suffix}</span> : null}
        </p>
        <p className="mb-1 whitespace-nowrap text-xs text-[#42463e]">{detail}</p>
      </div>
    </article>
  );
}

