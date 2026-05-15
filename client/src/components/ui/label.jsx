import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../../lib/utils";

export function Label({ className, ...props }) {
  return (
    <LabelPrimitive.Root
      className={cn("mb-2 inline-block text-sm font-semibold text-[var(--text)]", className)}
      {...props}
    />
  );
}
