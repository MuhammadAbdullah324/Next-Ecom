"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { userMessage } from "@/lib/db-errors";
import { addressSchema, fieldErrors } from "@/features/checkout/validation";

export type AccountFormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

async function accountClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) throw new Error("Sign in to manage your account.");
  return { supabase, user };
}

export async function updateProfile(_: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const parsed = z
    .object({ full_name: z.string().trim().min(1, "Enter your name.").max(100), phone: z.string().trim().max(20).optional() })
    .safeParse({ full_name: formData.get("full_name"), phone: formData.get("phone") || undefined });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await accountClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name, phone: parsed.data.phone ?? null }).eq("id", user.id);
  if (error) return { error: userMessage(error) };
  refresh();
  return { ok: true };
}

export async function addAddress(_: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const raw = Object.fromEntries(["full_name", "phone", "address_line_1", "address_line_2", "city", "state", "postal_code", "country"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { supabase, user } = await accountClient();
  const label = String(formData.get("label") ?? "").trim().slice(0, 40) || null;
  const { error } = await supabase
    .from("addresses")
    .insert({ ...parsed.data, label, user_id: user.id, is_default: formData.get("is_default") === "on" });
  if (error) return { error: userMessage(error) };
  refresh();
  return { ok: true };
}

export async function deleteAddress(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await accountClient();
  await supabase.from("addresses").delete().eq("id", id);
  refresh();
}

export async function makeDefaultAddress(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const { supabase } = await accountClient();
  await supabase.from("addresses").update({ is_default: true }).eq("id", id);
  refresh();
}
