"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { addProductImage, deleteProductImage, moveProductImage } from "@/features/admin/catalog-actions";
import type { FormState } from "@/features/admin/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormStatus, ImageField } from "./form-fields";
import { ConfirmButton } from "./confirm-button";

type Image = { id: string; url: string; alt_text: string };

export function ImageManager({ productId, productName, images }: { productId: string; productName: string; images: Image[] }) {
  const [formKey, setFormKey] = useState(0);
  const [state, action] = useActionState<FormState, FormData>(async (prev: FormState, fd: FormData) => {
    const result = await addProductImage(prev, fd);
    if (result.ok) setFormKey((k) => k + 1); // fresh, empty form for the next photo
    return result;
  }, {});

  return (
    <div className="space-y-5">
      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No photos yet. Listings show a grey box until you add one.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="overflow-hidden rounded-lg border bg-card">
              <div className="relative aspect-[4/5] bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
                <img src={img.url} alt={img.alt_text} className="size-full object-cover" loading="lazy" />
                {i === 0 ? <Badge className="absolute left-2 top-2">Cover</Badge> : null}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex">
                  <form action={moveProductImage}>
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="direction" value="up" />
                    <Button type="submit" size="sm" variant="ghost" disabled={i === 0} aria-label="Move earlier"><ArrowUp aria-hidden /></Button>
                  </form>
                  <form action={moveProductImage}>
                    <input type="hidden" name="id" value={img.id} />
                    <input type="hidden" name="direction" value="down" />
                    <Button type="submit" size="sm" variant="ghost" disabled={i === images.length - 1} aria-label="Move later"><ArrowDown aria-hidden /></Button>
                  </form>
                </div>
                <form action={deleteProductImage}>
                  <input type="hidden" name="id" value={img.id} />
                  <ConfirmButton size="sm" variant="ghost" className="text-danger" message="Delete this photo?" aria-label="Delete photo">
                    <Trash2 aria-hidden />
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form key={formKey} action={action} className="space-y-4 rounded-lg border bg-muted/40 p-4" noValidate>
        <input type="hidden" name="product_id" value={productId} />
        <FormStatus state={state} />
        <ImageField label="Add a photo" urlName="url" error={state.fieldErrors?.url} required />
        <Field label="Description for screen readers" name="alt_text" required defaultValue={productName} error={state.fieldErrors?.alt_text} id="image-alt" />
        <SubmitButton size="sm" pendingLabel="Uploading…">Add photo</SubmitButton>
      </form>
    </div>
  );
}
