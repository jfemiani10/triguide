import { cn } from "../../lib/utils";

export function Button({ className, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] border border-[var(--primary)]",
    secondary: "bg-white text-[var(--primary)] hover:bg-[var(--bg-alt)] border-[1.5px] border-[var(--primary)]",
    ghost: "bg-transparent text-[var(--text-muted)] hover:text-[var(--primary)] border border-transparent",
    danger: "bg-[var(--danger)] text-white hover:bg-[var(--primary-dark)] border border-[var(--danger)]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded px-4 py-3 text-sm font-semibold tracking-[0.04em] transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
