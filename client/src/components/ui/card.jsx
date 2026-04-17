import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("panel rounded-[8px]", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}
