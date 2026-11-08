"use client";

import { useActionState, useState } from "react";
import { saveProduct } from "@/features/admin/catalog-actions";
import { formatKeyValues, slugify, type FormState } from "@/features/admin/validation";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckboxField, FormStatus, ImageField, SelectField, TextareaField } from "./form-fields";

type ProductValues = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  specs: Record<string, string>;
  is_featured: boolean;
  is_active: boolean;
};

export function ProductForm({ product, categories }: { product?: ProductValues; categories: { id: string; name: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(saveProduct, {});
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const err = state.fieldErrors ?? {};
  const isNew = !product;

  return (
    <form action={action} className="space-y-6" noValidate>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <FormStatus state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Product name"
          name="name"
          required
          value={name}
          error={err.name}
          className="sm:col-span-2"
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
        <Field
          label="Web address (slug)"
          name="slug"
          required
          value={slug}
          error={err.slug}
          hint={slug ? `/products/${slug}` : "Filled in from the name."}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
        <SelectField label="Category" name="category_id" defaultValue={product?.category_id ?? ""} error={err.category_id} required>
          <option value="" disabled>Choose a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <Field label="Price" name="price" type="number" inputMode="decimal" step="0.01" min="0" required defaultValue={product?.price ?? ""} error={err.price} />
        <Field
          label="Was price"
          name="compare_at_price"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          defaultValue={product?.compare_at_price ?? ""}
          error={err.compare_at_price}
          hint="Set higher than the price to show a sale badge."
        />
        <Field label="Brand" name="brand" defaultValue={product?.brand ?? ""} error={err.brand} />
        <Field label="Short description" name="short_description" defaultValue={product?.short_description ?? ""} error={err.short_description} hint="One line shown under the name." />
        <TextareaField label="Description" name="description" rows={6} defaultValue={product?.description ?? ""} error={err.description} className="sm:col-span-2" />
        <TextareaField
          label="Details"
          name="specs"
          rows={4}
          defaultValue={formatKeyValues(product?.specs)}
          error={err.specs}
          hint="One per line, like “Material: 100% cotton”. Shown as a list on the product page."
          className="sm:col-span-2"
        />
      </div>

      {isNew ? (
        <fieldset className="grid gap-5 rounded-xl border p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">First size or variant</legend>
          <Field label="Variant name" name="variant_name" placeholder="Default, or 2-3Y" error={err.variant_name} hint="You can add more sizes after saving." />
          <Field label="SKU" name="sku" required error={err.sku} placeholder="TEE-RAIN-23" />
          <Field label="Stock" name="stock_quantity" type="number" inputMode="numeric" min="0" step="1" required defaultValue={0} error={err.stock_quantity} />
        </fieldset>
      ) : null}

      {isNew ? <ImageField label="Main photo" error={err.image_url} /> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField name="is_active" label="Visible in the store" hint="Hidden products can't be found or bought." defaultChecked={product?.is_active ?? true} />
        <CheckboxField name="is_featured" label="Featured" hint="Shown on the home page." defaultChecked={product?.is_featured ?? false} />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Saving…">{isNew ? "Create product" : "Save changes"}</SubmitButton>
      </div>
    </form>
  );
}
