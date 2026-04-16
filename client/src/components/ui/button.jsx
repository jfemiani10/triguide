import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", ...props }) {
  const variants = {
    primary:
      "bg-[var(--primary)] text-slate-950 hover:bg-[var(--primary-strong)] shadow-[0_16px_36px_rgba(36,185,129,0.24)]",
    secondary:
      "bg-white/8 text-white hover:bg-white/14 border border-white/10",
    ghost: "bg-transparent text-[var(--muted)] hover:text-white hover:bg-white/5",
    danger: "bg-[var(--danger)] text-white hover:opacity-90",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
