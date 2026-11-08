"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { ImageIcon } from "lucide-react";
import type { FormState } from "@/features/admin/validation";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function Described({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  return (
    <>
      {hint && !error ? <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="text-sm font-medium text-danger">{error}</p> : null}
    </>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
}

export function TextareaField({ label, name, error, hint, className, ...props }: ComponentProps<"textarea"> & { label: string; name: string; error?: string; hint?: ReactNode }) {
  const id = props.id ?? `field-${name}`;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {props.required ? null : <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Textarea id={id} name={name} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props} />
      <Described id={id} error={error} hint={hint} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; name: string; error?: string; hint?: ReactNode }) {
  const id = props.id ?? `field-${name}`;
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} name={name} className="w-full min-h-11" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props}>
        {children}
      </NativeSelect>
      <Described id={id} error={error} hint={hint} />
    </div>
  );
}

export function CheckboxField({ label, hint, className, ...props }: ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 text-sm", className)}>
      <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...props} />
      <span>
        <span className="font-semibold">{label}</span>
        {hint ? <span className="block text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}

export function FormStatus({ state }: { state: FormState }) {
  if (state.error) return <Alert variant="destructive">{state.error}</Alert>;
  if (state.ok && state.message) return <Alert variant="success">{state.message}</Alert>;
  return null;
}

// Pick a file to upload, or paste a link. Shows a preview of whichever is set.
export function ImageField({
  label = "Image",
  defaultUrl,
  error,
  required,
  urlName = "image_url",
}: {
  label?: string;
  defaultUrl?: string | null;
  error?: string;
  required?: boolean;
  urlName?: string;
}) {
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);
  const [url, setUrl] = useState(defaultUrl ?? "");
  const id = `field-${urlName}`;
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">
        {label} {required ? null : <span className="font-normal text-muted-foreground">(optional)</span>}
      </legend>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="grid aspect-[4/3] w-full shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted sm:w-40">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- previews local files and pasted links
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon aria-hidden className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="w-full space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`${id}-file`}>Upload a photo</Label>
            <Input
              id={`${id}-file`}
              name="image_file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : url || null);
              }}
            />
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP or AVIF, up to 4 MB.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={id}>Or paste an image link</Label>
            <Input
              id={id}
              name={urlName}
              type="url"
              inputMode="url"
              placeholder="https://images.unsplash.com/…"
              value={url}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onChange={(e) => {
                setUrl(e.target.value);
                setPreview(e.target.value || null);
              }}
              className="text-sm"
            />
          </div>
          {error ? <p id={`${id}-error`} className="text-sm font-medium text-danger">{error}</p> : null}
        </div>
      </div>
    </fieldset>
  );
}
