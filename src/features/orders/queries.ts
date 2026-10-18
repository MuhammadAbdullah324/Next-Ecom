import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toAmount } from "@/lib/money";
import type { Order } from "./types";

const ORDER_COLUMNS = `id, order_number, status, payment_status, cancel_reason, is_guest, email, shipping_method_code,
  shipping_method_name, shipping_address, currency, subtotal, shipping_amount, tax_amount, discount_amount, total_amount,
  stripe_checkout_session_id, created_at, paid_at,
  items:order_items ( id, product_name, variant_name, sku, image_url, unit_price, quantity, line_total, created_at,
    product:products ( slug ) )`;

type Row = Omit<Order, "items" | "subtotal" | "shipping_amount" | "tax_amount" | "discount_amount" | "total_amount"> & {
  subtotal: string;
  shipping_amount: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  items: (Omit<Order["items"][number], "unit_price" | "line_total" | "product_slug"> & {
    unit_price: string;
    line_total: string;
    created_at: string;
    product: { slug: string } | null;
  })[];
};

function toOrder(row: Row): Order {
  return {
    ...row,
    subtotal: toAmount(row.subtotal),
    shipping_amount: toAmount(row.shipping_amount),
    tax_amount: toAmount(row.tax_amount),
    discount_amount: toAmount(row.discount_amount),
    total_amount: toAmount(row.total_amount),
    items: row.items
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.product_name.localeCompare(b.product_name))
      .map((item) => ({
        id: item.id,
        product_name: item.product_name,
        variant_name: item.variant_name,
        sku: item.sku,
        image_url: item.image_url,
        quantity: item.quantity,
        unit_price: toAmount(item.unit_price),
        line_total: toAmount(item.line_total),
        product_slug: item.product?.slug ?? null,
      })),
  };
}

// RLS limits every query here to the signed-in shopper's own orders.
export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data ? toOrder(data as unknown as Row) : null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("order_number", orderNumber).maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data ? toOrder(data as unknown as Row) : null;
}

export async function listOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }).limit(50);
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data as unknown as Row[]).map(toOrder);
}

// The pending checkout attempts for the shopper's cart, with their Stripe session ids.
export async function getPendingOrders(): Promise<{ id: string; stripe_checkout_session_id: string | null }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").select("id, stripe_checkout_session_id").eq("status", "pending");
  if (error) throw new Error(`Could not load pending orders: ${error.message}`);
  return data;
}
