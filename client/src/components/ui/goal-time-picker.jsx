import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

function parseTime(value) {
  if (!value) return { h: "", m: "", s: "" };
  const parts = String(value).split(":");
  if (parts.length !== 3) return { h: "", m: "", s: "" };
  return {
    h: parts[0].replace(/\D/g, ""),
    m: parts[1].replace(/\D/g, ""),
    s: parts[2].replace(/\D/g, ""),
  };
}

function composeTime(h, m, s) {
  if (h === "" && m === "" && s === "") return "";
  return `${h || "0"}:${String(m || "0").padStart(2, "0")}:${String(s || "0").padStart(2, "0")}`;
}

const SegmentBox = forwardRef(function SegmentBox(
  { id, value, onChange, onKeyDown, placeholder, label },
  ref
) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={(e) => e.target.select()}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "h-14 w-14 rounded border border-[var(--border)] bg-[var(--surface)]",
          "text-center text-2xl font-semibold text-[var(--text)]",
          "outline-none transition-colors",
          "focus:border-[var(--primary)] focus:shadow-[0_0_0_2px_rgba(192,57,43,0.12)]",
          "placeholder:text-[var(--text-muted)] placeholder:font-normal placeholder:text-xl"
        )}
      />
      <span className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  );
});

export function GoalTimePicker({ id, value, onChange }) {
  const [segs, setSegs] = useState(() => parseTime(value));
  const lastEmitted = useRef(value ?? "");
  const hRef = useRef(null);
  const mRef = useRef(null);
  const sRef = useRef(null);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setSegs(parseTime(value));
      lastEmitted.current = value ?? "";
    }
  }, [value]);

  function emit(h, m, s) {
    const composed = composeTime(h, m, s);
    lastEmitted.current = composed;
    onChange(composed);
  }

  function handleH(e) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    setSegs((prev) => ({ ...prev, h: raw }));
    emit(raw, segs.m, segs.s);
    if (raw.length === 2) mRef.current?.focus();
  }

  function handleM(e) {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (raw.length === 2 && Number(raw) > 59) raw = "59";
    setSegs((prev) => ({ ...prev, m: raw }));
    emit(segs.h, raw, segs.s);
    if (raw.length === 2) sRef.current?.focus();
  }

  function handleS(e) {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (raw.length === 2 && Number(raw) > 59) raw = "59";
    setSegs((prev) => ({ ...prev, s: raw }));
    emit(segs.h, segs.m, raw);
  }

  function handleMKeyDown(e) {
    if (e.key === "Backspace" && segs.m === "") hRef.current?.focus();
  }

  function handleSKeyDown(e) {
    if (e.key === "Backspace" && segs.s === "") mRef.current?.focus();
  }

  return (
    <div className="flex items-end gap-2">
      <SegmentBox
        ref={hRef}
        id={id}
        value={segs.h}
        onChange={handleH}
        placeholder="00"
        label="hrs"
      />
      <span className="mb-7 select-none text-xl font-bold text-[var(--border)]">:</span>
      <SegmentBox
        ref={mRef}
        value={segs.m}
        onChange={handleM}
        onKeyDown={handleMKeyDown}
        placeholder="00"
        label="min"
      />
      <span className="mb-7 select-none text-xl font-bold text-[var(--border)]">:</span>
      <SegmentBox
        ref={sRef}
        value={segs.s}
        onChange={handleS}
        onKeyDown={handleSKeyDown}
        placeholder="00"
        label="sec"
      />
    </div>
  );
}
