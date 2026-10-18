import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { toAmount } from "@/lib/money";
import type { ShippingMethod } from "@/features/cart/pricing";
import { CATALOG_TAG } from "@/features/catalog/queries";

export type StoreSettings = { storeName: string; currency: string; taxRate: number };

export type SavedAddress = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
};

export async function getStoreSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { data, error } = await createPublicClient().from("store_settings").select("store_name, currency, tax_rate").single();
  if (error) throw new Error(`Could not load store settings: ${error.message}`);
  return { storeName: data.store_name, currency: data.currency, taxRate: Number(data.tax_rate) };
}

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  const { data, error } = await createPublicClient()
    .from("shipping_methods")
    .select("code, name, description, price, free_over, min_days, max_days")
    .order("sort_order");
  if (error) throw new Error(`Could not load delivery methods: ${error.message}`);
  return data.map((m) => ({
    code: m.code,
    name: m.name,
    description: m.description,
    price: toAmount(m.price),
    freeOver: m.free_over == null ? null : toAmount(m.free_over),
    minDays: m.min_days,
    maxDays: m.max_days,
  }));
}

// RLS returns only the signed-in account's addresses (guests have none).
export async function getSavedAddresses(): Promise<SavedAddress[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id, label, full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default")
    .order("is_default", { ascending: false })
    .order("created_at");
  if (error) throw new Error(`Could not load addresses: ${error.message}`);
  return data;
}
