"use client";

import { useActionState, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
import { savePromotion } from "@/features/admin/store-actions";
import type { FormState } from "@/features/admin/validation";
import type { AdminPromotion } from "@/features/admin/queries";
import { PAGE_LABELS, PLACEMENT_HELP, PLACEMENT_LABELS } from "@/features/admin/content-labels";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckboxField, FormStatus, ImageField, SelectField, TextareaField } from "./form-fields";

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm".
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PromotionForm({ promotion, categories, defaults }: { promotion?: AdminPromotion; categories: { id: string; name: string }[]; defaults?: { placement?: string; page?: string } }) {
  const [state, action] = useActionState<FormState, FormData>(savePromotion, {});
  const [placement, setPlacement] = useState<keyof typeof PLACEMENT_LABELS>((promotion?.placement ?? defaults?.placement ?? "hero") as keyof typeof PLACEMENT_LABELS);
  const [page, setPage] = useState<string>(promotion?.page ?? defaults?.page ?? "home");
  // Known only in the browser, so the date fields render after mount (no server/browser mismatch).
  const tzOffset = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getTimezoneOffset(),
    () => null,
  );
  const err = state.fieldErrors ?? {};
  const isBanner = placement === "banner";

  return (
    <form action={action} className="space-y-6" noValidate>
      {/* datetime-local has no time zone; the server reads it in the admin's own zone. */}
      <input type="hidden" name="tz_offset" value={tzOffset ?? 0} />
      {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}
      <FormStatus state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Type"
          name="placement"
          value={placement}
          onChange={(e) => {
            const next = e.target.value as keyof typeof PLACEMENT_LABELS;
            setPlacement(next);
            if (next !== "banner" && page === "all") setPage("home");
          }}
          hint={PLACEMENT_HELP[placement]}
          error={err.placement}
        >
          {Object.entries(PLACEMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <SelectField label="Show on" name="page" value={page} onChange={(e) => setPage(e.target.value)} error={err.page}>
          {Object.entries(PAGE_LABELS).map(([value, label]) =>
            value === "all" && !isBanner ? null : <option key={value} value={value}>{label}</option>,
          )}
        </SelectField>
        {page === "category" ? (
          <SelectField label="Which category" name="category_id" defaultValue={promotion?.category_id ?? ""} error={err.category_id} className="sm:col-span-2">
            <option value="">Every category page</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </SelectField>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {!isBanner ? <Field label="Small label above the headline" name="eyebrow" defaultValue={promotion?.eyebrow ?? ""} placeholder="New season" error={err.eyebrow} /> : null}
        <Field label={isBanner ? "Bold text" : "Headline"} name="title" required defaultValue={promotion?.title ?? ""} error={err.title} className={isBanner ? "sm:col-span-2" : ""} />
        <TextareaField label={isBanner ? "Rest of the message" : "Text under the headline"} name="subtitle" rows={2} defaultValue={promotion?.subtitle ?? ""} error={err.subtitle} className="sm:col-span-2" />
        <Field label={isBanner ? "Link text" : "Button text"} name="cta_label" defaultValue={promotion?.cta_label ?? ""} placeholder="Shop now" error={err.cta_label} />
        <Field label={isBanner ? "Link to" : "Button links to"} name="cta_href" defaultValue={promotion?.cta_href ?? ""} placeholder="/category/baby" error={err.cta_href} hint="A page in the store, starting with /." />
        {!isBanner ? (
          <>
            <Field label="Second button text" name="cta2_label" defaultValue={promotion?.cta2_label ?? ""} error={err.cta2_label} />
            <Field label="Second button links to" name="cta2_href" defaultValue={promotion?.cta2_href ?? ""} placeholder="/products?sort=newest" error={err.cta2_href} />
          </>
        ) : null}
      </div>

      {!isBanner ? <ImageField label="Photo" defaultUrl={promotion?.image_url} error={err.image_url} required={placement === "hero"} /> : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Order" name="sort_order" type="number" min="0" step="1" defaultValue={promotion?.sort_order ?? 0} hint="Lower shows first (and first in a carousel)." error={err.sort_order} />
        {tzOffset === null ? (
          <div className="sm:col-span-2" />
        ) : (
          <>
            <Field label="Starts" name="starts_at" type="datetime-local" defaultValue={toLocalInput(promotion?.starts_at)} hint="Blank: right away." error={err.starts_at} />
            <Field label="Ends" name="ends_at" type="datetime-local" defaultValue={toLocalInput(promotion?.ends_at)} hint="Blank: no end date." error={err.ends_at} />
          </>
        )}
      </div>

      <CheckboxField name="is_active" label="Live" hint="Untick to keep it as a draft." defaultChecked={promotion?.is_active ?? true} />
      <SubmitButton pendingLabel="Saving…">{promotion ? "Save changes" : "Publish"}</SubmitButton>
    </form>
  );
}
