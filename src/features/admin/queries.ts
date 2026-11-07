import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toAmount } from "@/lib/money";
import type { OrderStatus, PaymentStatus, ShippingAddress } from "@/features/orders/types";

// All reads use the admin's own session. RLS (is_admin()) is what lets these see every row.

export const ADMIN_PAGE_SIZE = 20;

export type DashboardStats = {
  days: number;
  revenue: number;
  paid_orders: number;
  to_fulfill: number;
  awaiting_payment: number;
  customers: number;
  new_customers: number;
  active_products: number;
  low_stock: number;
  daily: { day: string; revenue: number; orders: number }[];
};

export async function getDashboardStats(days = 30): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats", { days, low_stock: 5 });
  if (error) throw new Error(`Could not load dashboard: ${error.message}`);
  const s = data as DashboardStats;
  return {
    ...s,
    revenue: toAmount(s.revenue),
    daily: s.daily.map((d) => ({ day: d.day, revenue: toAmount(d.revenue), orders: Number(d.orders) })),
  };
}

export type AdminOrderRow = {
  id: string;
  order_number: string;
  email: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  cancel_reason: string | null;
  is_guest: boolean;
  currency: string;
  total_amount: number;
  created_at: string;
  customer_name: string | null;
  item_count: number;
};

export type OrderFilters = { status?: string; q?: string; page: number };

export const ORDER_FILTERS = [
  { value: "", label: "All" },
  { value: "to_fulfill", label: "To fulfill" },
  { value: "pending", label: "Awaiting payment" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "canceled", label: "Canceled" },
] as const;

export async function listAdminOrders(filters: OrderFilters, userId?: string) {
  const supabase = await createClient();
  const from = (filters.page - 1) * ADMIN_PAGE_SIZE;
  let query = supabase
    .from("orders")
    .select("id, order_number, email, status, payment_status, cancel_reason, is_guest, currency, total_amount, created_at, shipping_address, items:order_items ( quantity )", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  if (filters.status === "to_fulfill") query = query.in("status", ["confirmed", "processing"]);
  else if (filters.status) query = query.eq("status", filters.status);
  if (userId) query = query.eq("user_id", userId);
  const q = filters.q?.trim().replace(/[%,()]/g, "");
  if (q) query = query.or(`order_number.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, count, error } = await query;
  if (error && error.code !== "PGRST103") throw new Error(`Could not load orders: ${error.message}`);
  const orders: AdminOrderRow[] = (data ?? []).map(({ shipping_address, items, ...o }) => ({
    ...o,
    total_amount: toAmount(o.total_amount),
    customer_name: (shipping_address as ShippingAddress | null)?.full_name ?? null,
    item_count: items.reduce((n: number, i: { quantity: number }) => n + i.quantity, 0),
  }));
  const total = count ?? 0;
  return { orders, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminOrder(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, user_id, email, status, payment_status, cancel_reason, is_guest, currency,
       shipping_method_name, shipping_address, subtotal, shipping_amount, tax_amount, discount_amount, total_amount,
       stripe_checkout_session_id, stripe_payment_intent_id, created_at, paid_at, canceled_at, updated_at,
       items:order_items ( id, product_id, product_name, variant_name, sku, image_url, unit_price, quantity, line_total )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    status: data.status as OrderStatus,
    payment_status: data.payment_status as PaymentStatus,
    shipping_address: data.shipping_address as ShippingAddress,
    subtotal: toAmount(data.subtotal),
    shipping_amount: toAmount(data.shipping_amount),
    tax_amount: toAmount(data.tax_amount),
    discount_amount: toAmount(data.discount_amount),
    total_amount: toAmount(data.total_amount),
    items: data.items.map((i) => ({ ...i, unit_price: toAmount(i.unit_price), line_total: toAmount(i.line_total) })),
  };
}
export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getAdminOrder>>>;

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
};

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order, is_active, products ( count )")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data.map(({ products, ...c }) => ({ ...c, product_count: (products as unknown as { count: number }[])[0]?.count ?? 0 }));
}

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  price: number;
  compare_at_price: number | null;
  is_active: boolean;
  is_featured: boolean;
  category_name: string;
  image_url: string | null;
  stock: number;
  variant_count: number;
  updated_at: string;
};

export type ProductFilters = { q?: string; category?: string; status?: string; page: number };

export async function listAdminProducts(filters: ProductFilters) {
  const supabase = await createClient();
  const from = (filters.page - 1) * ADMIN_PAGE_SIZE;
  let query = supabase
    .from("products")
    .select(
      `id, name, slug, brand, price, compare_at_price, is_active, is_featured, updated_at,
       category:categories!inner ( name, slug ),
       images:product_images ( url, sort_order ),
       variants:product_variants ( stock_quantity, is_active )`,
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  const q = filters.q?.trim().replace(/[%,()]/g, "");
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,brand.ilike.%${q}%`);
  if (filters.category) query = query.eq("category.slug", filters.category);
  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "hidden") query = query.eq("is_active", false);
  if (filters.status === "featured") query = query.eq("is_featured", true);

  const { data, count, error } = await query;
  if (error && error.code !== "PGRST103") throw new Error(`Could not load products: ${error.message}`);
  const products: AdminProductRow[] = (data ?? []).map((p) => {
    const category = p.category as unknown as { name: string };
    const active = p.variants.filter((v) => v.is_active);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      price: toAmount(p.price),
      compare_at_price: p.compare_at_price == null ? null : toAmount(p.compare_at_price),
      is_active: p.is_active,
      is_featured: p.is_featured,
      updated_at: p.updated_at,
      category_name: category.name,
      image_url: [...p.images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
      stock: active.reduce((n, v) => n + v.stock_quantity, 0),
      variant_count: active.length,
    };
  });
  const total = count ?? 0;
  return { products, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, category_id, name, slug, brand, short_description, description, price, compare_at_price, specs, is_featured, is_active, created_at, updated_at,
       images:product_images ( id, url, alt_text, sort_order ),
       variants:product_variants ( id, sku, name, options, price, stock_quantity, is_default, is_active, sort_order )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    price: toAmount(data.price),
    compare_at_price: data.compare_at_price == null ? null : toAmount(data.compare_at_price),
    specs: (data.specs ?? {}) as Record<string, string>,
    images: [...data.images].sort((a, b) => a.sort_order - b.sort_order),
    variants: [...data.variants]
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map((v) => ({ ...v, options: (v.options ?? {}) as Record<string, string>, price: v.price == null ? null : toAmount(v.price) })),
  };
}
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

export async function listLowStock(limit = 8, threshold = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, sku, name, stock_quantity, product:products!inner ( id, name, is_active )")
    .eq("is_active", true)
    .eq("product.is_active", true)
    .lte("stock_quantity", threshold)
    .order("stock_quantity")
    .limit(limit);
  if (error) throw new Error(`Could not load stock: ${error.message}`);
  return data.map((v) => ({ ...v, product: v.product as unknown as { id: string; name: string } }));
}

export type AdminPromotion = {
  id: string;
  placement: "banner" | "hero" | "feature";
  page: "all" | "home" | "products" | "category" | "cart";
  category_id: string | null;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  cta2_label: string | null;
  cta2_href: string | null;
  image_url: string | null;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

const PROMOTION_COLUMNS =
  "id, placement, page, category_id, eyebrow, title, subtitle, cta_label, cta_href, cta2_label, cta2_href, image_url, sort_order, starts_at, ends_at, is_active";

export async function listAdminPromotions(): Promise<AdminPromotion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select(PROMOTION_COLUMNS).order("page").order("placement").order("sort_order");
  if (error) throw new Error(`Could not load page content: ${error.message}`);
  return data as AdminPromotion[];
}

export async function getAdminPromotion(id: string): Promise<AdminPromotion | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("promotions").select(PROMOTION_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load banner: ${error.message}`);
  return data as AdminPromotion | null;
}

export type AdminCustomer = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
  created_at: string;
  orders: number;
  spent: number;
  last_order_at: string | null;
};

export async function listAdminCustomers({ q, page }: { q?: string; page: number }) {
  const supabase = await createClient();
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  // Guests have profiles too but no email; list real accounts only.
  let query = supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at", { count: "exact" })
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  const term = q?.trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`);
  const { data, count, error } = await query;
  if (error && error.code !== "PGRST103") throw new Error(`Could not load customers: ${error.message}`);
  const rows = data ?? [];

  const totals = new Map<string, { orders: number; spent: number; last_order_at: string | null }>();
  if (rows.length) {
    const { data: t, error: tErr } = await supabase.rpc("admin_customer_totals", { user_ids: rows.map((r) => r.id) });
    if (tErr) throw new Error(`Could not load customer totals: ${tErr.message}`);
    for (const r of t as { user_id: string; orders: number; spent: string; last_order_at: string }[]) {
      totals.set(r.user_id, { orders: Number(r.orders), spent: toAmount(r.spent), last_order_at: r.last_order_at });
    }
  }
  const customers: AdminCustomer[] = rows.map((r) => ({
    ...(r as Omit<AdminCustomer, "orders" | "spent" | "last_order_at">),
    ...(totals.get(r.id) ?? { orders: 0, spent: 0, last_order_at: null }),
  }));
  const total = count ?? 0;
  return { customers, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminSettings() {
  const supabase = await createClient();
  const [settings, shipping] = await Promise.all([
    supabase.from("store_settings").select("store_name, currency, tax_rate").single(),
    supabase.from("shipping_methods").select("code, name, description, price, free_over, min_days, max_days, sort_order, is_active").order("sort_order"),
  ]);
  if (settings.error) throw new Error(`Could not load settings: ${settings.error.message}`);
  if (shipping.error) throw new Error(`Could not load delivery methods: ${shipping.error.message}`);
  return {
    storeName: settings.data.store_name,
    currency: settings.data.currency,
    taxRate: Number(settings.data.tax_rate),
    shipping: shipping.data.map((m) => ({ ...m, price: toAmount(m.price), free_over: m.free_over == null ? null : toAmount(m.free_over) })),
  };
}

export function pageParam(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function textParam(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim().slice(0, 100) : undefined;
}
