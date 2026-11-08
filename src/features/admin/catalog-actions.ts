"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { adminClient } from "./guard";
import { removeUploadedImage, resolveImageField, uploadImage, isImageFile } from "./storage";
import { adminDbMessage, categorySchema, fieldErrorsOf, formToObject, imageSchema, productSchema, variantSchema, type FormState } from "./validation";

function catalogChanged() {
  updateTag(CATALOG_TAG);
  refresh();
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function saveProduct(_: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") ? z.uuid().parse(formData.get("id")) : null;
  const parsed = productSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Check the highlighted fields." };

  const { supabase } = await adminClient();

  if (id) {
    const { error } = await supabase.from("products").update(parsed.data).eq("id", id);
    if (error) return { error: adminDbMessage(error) };
    catalogChanged();
    return { ok: true, message: "Product saved." };
  }

  // New product: also create its first variant so it can be sold straight away.
  const first = variantSchema.safeParse({
    name: formData.get("variant_name") || "Default",
    sku: formData.get("sku"),
    stock_quantity: formData.get("stock_quantity"),
    options: "",
    is_default: "on",
    is_active: "on",
  });
  if (!first.success) {
    const errs = fieldErrorsOf(first.error);
    return { fieldErrors: { sku: errs.sku, stock_quantity: errs.stock_quantity, variant_name: errs.name }, error: "Check the highlighted fields." };
  }

  const pastedUrl = String(formData.get("image_url") ?? "").trim();
  if (pastedUrl && !isImageFile(formData.get("image_file")) && !imageSchema.safeParse({ url: pastedUrl, alt_text: "x" }).success) {
    return { fieldErrors: { image_url: "Use an https link from Unsplash or your Supabase storage, or upload the photo." }, error: "Check the highlighted fields." };
  }

  const { data: product, error } = await supabase.from("products").insert(parsed.data).select("id").single();
  if (error) return { error: adminDbMessage(error) };

  const { error: variantError } = await supabase.from("product_variants").insert({ ...first.data, product_id: product.id });
  if (variantError) {
    await supabase.from("products").delete().eq("id", product.id);
    return { error: adminDbMessage(variantError), fieldErrors: variantError.code === "23505" ? { sku: "That SKU is already used." } : undefined };
  }

  const file = formData.get("image_file");
  const pasted = imageSchema.safeParse({ url: formData.get("image_url"), alt_text: parsed.data.name });
  const upload = isImageFile(file) ? await uploadImage(supabase, file, `products/${product.id}`) : { url: pasted.success ? pasted.data.url : undefined };
  if (upload.url) await supabase.from("product_images").insert({ product_id: product.id, url: upload.url, alt_text: parsed.data.name, sort_order: 0 });

  updateTag(CATALOG_TAG);
  redirect(`/admin/products/${product.id}?created=1`);
}

export async function setProductActive(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await adminClient();
  await supabase.from("products").update({ is_active: formData.get("active") === "true" }).eq("id", id);
  catalogChanged();
}

export async function deleteProduct(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await adminClient();
  const { data: images } = await supabase.from("product_images").select("url").eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(adminDbMessage(error));
  await Promise.all((images ?? []).map((i) => removeUploadedImage(supabase, i.url)));
  updateTag(CATALOG_TAG);
  redirect("/admin/products?deleted=1");
}

// ---------------------------------------------------------------------------
// Variants (sizes / colours) and stock
// ---------------------------------------------------------------------------

export async function saveVariant(_: FormState, formData: FormData): Promise<FormState> {
  const productId = z.uuid().parse(formData.get("product_id"));
  const id = formData.get("id") ? z.uuid().parse(formData.get("id")) : null;
  const parsed = variantSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Check the highlighted fields." };

  const { supabase } = await adminClient();
  // Only one default per product (unique index): clear the old one first.
  if (parsed.data.is_default) {
    let clear = supabase.from("product_variants").update({ is_default: false }).eq("product_id", productId).eq("is_default", true);
    if (id) clear = clear.neq("id", id);
    await clear;
  }

  const { error } = id
    ? await supabase.from("product_variants").update(parsed.data).eq("id", id).eq("product_id", productId)
    : await supabase.from("product_variants").insert({ ...parsed.data, product_id: productId });
  if (error) return { error: adminDbMessage(error), fieldErrors: error.code === "23505" ? { sku: "That SKU is already used." } : undefined };

  catalogChanged();
  return { ok: true, message: id ? "Variant saved." : "Variant added." };
}

export async function setVariantStock(_: FormState, formData: FormData): Promise<FormState> {
  const id = z.uuid().parse(formData.get("id"));
  const stock = z.coerce.number().int().min(0).max(1000000).safeParse(formData.get("stock_quantity"));
  if (!stock.success) return { error: "Enter a whole number, 0 or more." };
  const { supabase } = await adminClient();
  const { error } = await supabase.from("product_variants").update({ stock_quantity: stock.data }).eq("id", id);
  if (error) return { error: adminDbMessage(error) };
  catalogChanged();
  return { ok: true, message: "Saved" };
}

export async function deleteVariant(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await adminClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) throw new Error(adminDbMessage(error));
  catalogChanged();
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function addProductImage(_: FormState, formData: FormData): Promise<FormState> {
  const productId = z.uuid().parse(formData.get("product_id"));
  const { supabase } = await adminClient();

  const upload = await resolveImageField(supabase, formData, `products/${productId}`);
  if (upload.error) return { error: upload.error };
  const parsed = imageSchema.safeParse({ url: upload.url ?? formData.get("url"), alt_text: formData.get("alt_text") });
  if (!parsed.success) {
    if (upload.url) await removeUploadedImage(supabase, upload.url);
    const errs = fieldErrorsOf(parsed.error);
    return { fieldErrors: errs, error: errs.url && !formData.get("url") ? "Choose a photo to upload or paste a link." : "Check the highlighted fields." };
  }

  const { data: last } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("product_images").insert({ ...parsed.data, product_id: productId, sort_order: (last?.sort_order ?? -1) + 1 });
  if (error) return { error: adminDbMessage(error) };
  catalogChanged();
  return { ok: true, message: "Photo added." };
}

export async function deleteProductImage(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await adminClient();
  const { data } = await supabase.from("product_images").delete().eq("id", id).select("url").maybeSingle();
  await removeUploadedImage(supabase, data?.url);
  catalogChanged();
}

// Moves a photo one place earlier or later. The first photo is the one shown in listings.
export async function moveProductImage(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const { supabase } = await adminClient();
  const { data: image } = await supabase.from("product_images").select("product_id").eq("id", id).single();
  if (!image) return;
  const { data: images } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", image.product_id)
    .order("sort_order")
    .order("created_at");
  const order = (images ?? []).map((i) => i.id);
  const from = order.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return;
  [order[from], order[to]] = [order[to], order[from]];
  await Promise.all(order.map((imageId, index) => supabase.from("product_images").update({ sort_order: index }).eq("id", imageId)));
  catalogChanged();
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function saveCategory(_: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") ? z.uuid().parse(formData.get("id")) : null;
  const { supabase } = await adminClient();

  const upload = await resolveImageField(supabase, formData, "categories");
  if (upload.error) return { error: upload.error, fieldErrors: { image_url: upload.error } };
  const parsed = categorySchema.safeParse({ ...formToObject(formData), image_url: upload.url ?? formData.get("image_url") });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Check the highlighted fields." };

  const { error } = id
    ? await supabase.from("categories").update(parsed.data).eq("id", id)
    : await supabase.from("categories").insert(parsed.data);
  if (error) return { error: adminDbMessage(error) };

  updateTag(CATALOG_TAG);
  if (!id) redirect("/admin/categories?created=1");
  refresh();
  return { ok: true, message: "Category saved." };
}

export async function deleteCategory(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await adminClient();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) redirect(`/admin/categories/${id}?error=in-use`);
  const { data, error } = await supabase.from("categories").delete().eq("id", id).select("image_url").maybeSingle();
  if (error) redirect(`/admin/categories/${id}?error=in-use`);
  await removeUploadedImage(supabase, data?.image_url);
  updateTag(CATALOG_TAG);
  redirect("/admin/categories?deleted=1");
}
