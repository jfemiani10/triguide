import * as ProgressPrimitive from "@radix-ui/react-progress";

export function Progress({ value }) {
  return (
    <ProgressPrimitive.Root className="relative h-1 w-full overflow-hidden rounded-none bg-[var(--border)]">
      <ProgressPrimitive.Indicator
        className="h-full bg-[var(--primary)] transition-all"
        style={{ width: `${value}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
