import { cn } from "../../lib/utils";

export function Input({ className, ...props }) {
  return <input className={cn("input-base", className)} {...props} />;
}
