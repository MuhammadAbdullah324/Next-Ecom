"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { CATALOG_TAG } from "@/features/catalog/queries";
import { getStripe } from "@/features/payments/stripe";
import { adminClient } from "./guard";
import { removeUploadedImage, resolveImageField } from "./storage";
import { adminDbMessage, fieldErrorsOf, formToObject, localDateTimeToIso, promotionSchema, settingsSchema, shippingSchema, type FormState } from "./validation";

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function setOrderStatus(_: FormState, formData: FormData): Promise<FormState> {
  const id = z.uuid().parse(formData.get("id"));
  const status = z.enum(["confirmed", "processing", "shipped", "delivered"]).safeParse(formData.get("status"));
  if (!status.success) return { error: "Choose a status." };
  const { supabase } = await adminClient();
  const { error } = await supabase.rpc("admin_set_order_status", { target_order: id, new_status: status.data });
  if (error) return { error: adminDbMessage(error, "Could not update the order.") };
  refresh();
  return { ok: true, message: `Marked as ${status.data}.` };
}

// Pending order: closes the Stripe payment page, then releases the reserved stock.
// Paid order: refunds the full amount in Stripe, then records the refund (and restocks if asked).
export async function cancelOrder(_: FormState, formData: FormData): Promise<FormState> {
  const id = z.uuid().parse(formData.get("id"));
  const restock = formData.get("restock") === "on";
  const { supabase } = await adminClient();

  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("id, status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id")
    .eq("id", id)
    .maybeSingle();
  if (loadError || !order) return { error: "Order not found." };
  if (order.status === "canceled") return { ok: true, message: "This order is already canceled." };

  try {
    const stripe = getStripe();
    if (order.status === "pending" && order.stripe_checkout_session_id) {
      const session = await stripe.checkout.sessions.retrieve(order.stripe_checkout_session_id);
      if (session.status === "complete") {
        return { error: "The customer just paid for this order. Refresh the page; you can refund it once it shows as paid." };
      }
      if (session.status === "open") await stripe.checkout.sessions.expire(session.id);
    } else if (order.payment_status === "paid") {
      if (!order.stripe_payment_intent_id) return { error: "This order has no Stripe payment to refund. Refund it in the Stripe dashboard." };
      await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id }, { idempotencyKey: `admin-refund-${order.id}` });
    }
  } catch (error) {
    console.error(error);
    const message = error instanceof Error && "type" in error ? error.message : null;
    return { error: message ? `Stripe: ${message}` : "Could not reach Stripe. Nothing was changed; please try again." };
  }

  const { data, error } = await supabase.rpc("admin_cancel_order", { target_order: id, restock });
  if (error) return { error: adminDbMessage(error, "Stripe was updated but the order was not. Try again to finish.") };
  updateTag(CATALOG_TAG); // stock came back
  refresh();
  return { ok: true, message: data === "refunded" ? "Refunded in Stripe and canceled." : "Order canceled and stock released." };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function setCustomerRole(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const role = z.enum(["customer", "admin"]).parse(formData.get("role"));
  const { supabase } = await adminClient();
  const { error } = await supabase.rpc("admin_set_role", { target_user: id, new_role: role });
  if (error) redirect(`/admin/customers?error=${encodeURIComponent(adminDbMessage(error, "Could not change the role."))}`);
  refresh();
}

// ---------------------------------------------------------------------------
// Page content: announcement bars, hero banners / carousels, feature cards
// ---------------------------------------------------------------------------

export async function savePromotion(_: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") ? z.uuid().parse(formData.get("id")) : null;
  const { supabase } = await adminClient();

  const upload = await resolveImageField(supabase, formData, "banners");
  if (upload.error) return { error: upload.error, fieldErrors: { image_url: upload.error } };
  const offset = Number(formData.get("tz_offset")) || 0;
  const parsed = promotionSchema.safeParse({
    ...formToObject(formData),
    image_url: upload.url ?? formData.get("image_url"),
    starts_at: localDateTimeToIso(formData.get("starts_at"), offset),
    ends_at: localDateTimeToIso(formData.get("ends_at"), offset),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Check the highlighted fields." };
  if (parsed.data.placement === "hero" && !parsed.data.image_url) {
    return { fieldErrors: { image_url: "Hero banners need a photo." }, error: "Check the highlighted fields." };
  }

  const { error } = id
    ? await supabase.from("promotions").update(parsed.data).eq("id", id)
    : await supabase.from("promotions").insert(parsed.data);
  if (error) return { error: adminDbMessage(error) };

  updateTag(CATALOG_TAG);
  if (!id) redirect("/admin/content?created=1");
  refresh();
  return { ok: true, message: "Saved. The storefront shows it now." };
}

export async function setPromotionActive(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await adminClient();
  await supabase.from("promotions").update({ is_active: formData.get("active") === "true" }).eq("id", id);
  updateTag(CATALOG_TAG);
  refresh();
}

export async function deletePromotion(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await adminClient();
  const { data } = await supabase.from("promotions").delete().eq("id", id).select("image_url").maybeSingle();
  await removeUploadedImage(supabase, data?.image_url);
  updateTag(CATALOG_TAG);
  redirect("/admin/content?deleted=1");
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveSettings(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = settingsSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Check the highlighted fields." };
  const { supabase } = await adminClient();
  const { error } = await supabase
    .from("store_settings")
    .update({ store_name: parsed.data.store_name, tax_rate: Math.round(parsed.data.tax_percent * 100) / 10000 })
    .eq("id", true);
  if (error) return { error: adminDbMessage(error) };
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Settings saved." };
}

export async function saveShippingMethod(_: FormState, formData: FormData): Promise<FormState> {
  const existing = formData.get("existing_code");
  const parsed = shippingSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error), error: "Check the highlighted fields." };
  const { supabase } = await adminClient();
  const { code, ...rest } = parsed.data;
  const { error } = existing
    ? await supabase.from("shipping_methods").update(rest).eq("code", String(existing))
    : await supabase.from("shipping_methods").insert({ code, ...rest });
  if (error) return { error: adminDbMessage(error), fieldErrors: error.code === "23505" ? { code: "That code is already used." } : undefined };
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: existing ? "Delivery method saved." : "Delivery method added." };
}
