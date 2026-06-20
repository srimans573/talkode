export function StatusDot({ active }: { active?: boolean }) {
  return (
    <span
      className={
        active ? "h-2 w-2 rounded-full bg-[#c8f23d]" : "h-2 w-2 rounded-full bg-[#b7bbb1]"
      }
    />
  );
}

