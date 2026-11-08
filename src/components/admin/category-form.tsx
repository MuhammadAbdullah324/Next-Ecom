"use client";

import { useActionState, useState } from "react";
import { saveCategory } from "@/features/admin/catalog-actions";
import { slugify, type FormState } from "@/features/admin/validation";
import type { AdminCategory } from "@/features/admin/queries";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckboxField, FormStatus, ImageField, TextareaField } from "./form-fields";

export function CategoryForm({ category }: { category?: AdminCategory }) {
  const [state, action] = useActionState<FormState, FormData>(saveCategory, {});
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!category);
  const err = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <FormStatus state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" required defaultValue={category?.name} error={err.name} onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))} />
        <Field
          label="Web address (slug)"
          name="slug"
          required
          value={slug}
          error={err.slug}
          hint={slug ? `/category/${slug}` : "Filled in from the name."}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <TextareaField label="Description" name="description" rows={3} defaultValue={category?.description ?? ""} error={err.description} className="sm:col-span-2" />
        <Field label="Sort order" name="sort_order" type="number" min="0" step="1" defaultValue={category?.sort_order ?? 0} error={err.sort_order} hint="Lower numbers come first in the menu." />
      </div>
      <ImageField label="Category photo" defaultUrl={category?.image_url} error={err.image_url} />
      <CheckboxField name="is_active" label="Visible in the store" hint="Hidden categories and their products disappear from the menu and listings." defaultChecked={category?.is_active ?? true} />
      <SubmitButton pendingLabel="Saving…">{category ? "Save changes" : "Create category"}</SubmitButton>
    </form>
  );
}
