"use client";

import clsx from "clsx";

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
  label,
  className,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  const btn = "inline-flex size-11 items-center justify-center text-lg disabled:text-muted disabled:cursor-not-allowed";
  return (
    <div role="group" aria-label={label} className={clsx("inline-flex items-center rounded-full border border-line bg-surface", className)}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1} aria-label="Decrease quantity">
        −
      </button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}
