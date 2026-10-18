import clsx from "clsx";
import type { ComponentProps } from "react";

export const inputClass =
  "block w-full min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-muted aria-invalid:border-danger";

// Label, input and error message wired together for screen readers.
export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; name: string; error?: string; hint?: string }) {
  const id = props.id ?? `field-${name}`;
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={clsx("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink-soft">
        {label}
        {props.required ? null : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <input id={id} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={inputClass} {...props} />
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
