import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";

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
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {props.required ? null : <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Input id={id} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
