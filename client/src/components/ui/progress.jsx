import * as ProgressPrimitive from "@radix-ui/react-progress";

export function Progress({ value }) {
  return (
    <ProgressPrimitive.Root className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-[var(--primary)] transition-all"
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
