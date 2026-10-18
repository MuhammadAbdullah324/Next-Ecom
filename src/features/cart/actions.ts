"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { userMessage } from "@/lib/db-errors";
import { getShopperClient } from "@/features/auth/guest";

export type CartActionState = { ok?: boolean; error?: string; message?: string };

const uuid = z.uuid();
const quantity = z.coerce.number().int().min(1).max(99);

export async function addToCart(_: CartActionState, formData: FormData): Promise<CartActionState> {
  const variantId = uuid.safeParse(formData.get("variantId"));
  const amount = quantity.safeParse(formData.get("quantity") ?? 1);
  if (!variantId.success) return { error: "Choose an option first." };
  if (!amount.success) return { error: "Choose a quantity between 1 and 99." };

  try {
    const { supabase } = await getShopperClient();
    const { error } = await supabase.rpc("mutate_cart", {
      action: "add",
      target_variant: variantId.data,
      amount: amount.data,
    });
    if (error) return { error: userMessage(error) };
  } catch (e) {
    console.error(e);
    return { error: "We couldn't reach the store. Please try again." };
  }

  refresh();
  return { ok: true, message: "Added to cart" };
}

async function mutate(action: "update" | "remove" | "clear", variantId?: string, amount?: number): Promise<CartActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mutate_cart", { action, target_variant: variantId ?? null, amount: amount ?? 1 });
  if (error) return { error: userMessage(error) };
  refresh();
  return { ok: true };
}

export async function updateCartQuantity(_: CartActionState, formData: FormData): Promise<CartActionState> {
  const variantId = uuid.safeParse(formData.get("variantId"));
  const amount = quantity.safeParse(formData.get("quantity"));
  if (!variantId.success || !amount.success) return { error: "Choose a quantity between 1 and 99." };
  return mutate("update", variantId.data, amount.data);
}

export async function removeFromCart(_: CartActionState, formData: FormData): Promise<CartActionState> {
  const variantId = uuid.safeParse(formData.get("variantId"));
  if (!variantId.success) return { error: "That item is no longer in your cart." };
  return mutate("remove", variantId.data);
}
