import "server-only";
import { createClient } from "@/lib/supabase/server";
import { toAmount } from "@/lib/money";
import { cartSubtotal, itemCount } from "./pricing";

export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  variantName: string;
  hasOptions: boolean;
  unitPrice: number;
  stock: number;
  imageUrl: string | null;
  imageAlt: string;
  available: boolean; // product and variant still on sale
};

export type Cart = {
  lines: CartLine[];
  subtotal: number;
  count: number;
  problems: number; // lines that block checkout
};

const EMPTY: Cart = { lines: [], subtotal: 0, count: 0, problems: 0 };

type Row = {
  id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  variant: {
    id: string;
    name: string;
    options: Record<string, string>;
    price: string | null;
    stock_quantity: number;
    is_active: boolean;
    product: {
      name: string;
      slug: string;
      price: string;
      is_active: boolean;
      images: { url: string; alt_text: string; sort_order: number }[];
    } | null;
  } | null;
};

// The current shopper's active cart. Never cached: it belongs to one person.
export async function getCart(): Promise<Cart> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data: cart } = await supabase.from("carts").select("id").eq("status", "active").maybeSingle();
  if (!cart) return EMPTY;

  // Variants and products hidden from sale come back as null through RLS.
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `id, variant_id, quantity, created_at,
       variant:product_variants ( id, name, options, price, stock_quantity, is_active,
         product:products ( name, slug, price, is_active, images:product_images ( url, alt_text, sort_order ) ) )`,
    )
    .eq("cart_id", cart.id)
    .order("created_at");
  if (error) throw new Error(`Could not load cart: ${error.message}`);

  const lines: CartLine[] = (data as unknown as Row[]).map((row) => {
    const variant = row.variant;
    const product = variant?.product ?? null;
    const image = product?.images.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      id: row.id,
      variantId: row.variant_id,
      quantity: row.quantity,
      productName: product?.name ?? "Unavailable product",
      productSlug: product?.slug ?? "",
      variantName: variant?.name ?? "",
      hasOptions: Object.keys(variant?.options ?? {}).length > 0,
      unitPrice: toAmount(variant?.price ?? product?.price ?? 0),
      stock: variant?.stock_quantity ?? 0,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt_text ?? product?.name ?? "",
      available: !!(variant?.is_active && product?.is_active),
    };
  });

  const sellable = lines.filter((l) => l.available);
  return {
    lines,
    subtotal: cartSubtotal(sellable),
    count: itemCount(lines),
    problems: lines.filter((l) => !l.available || l.quantity > l.stock).length,
  };
}

export async function getCartCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase.from("cart_items").select("quantity, cart:carts!inner(status)").eq("cart.status", "active");
  return (data ?? []).reduce((sum, r) => sum + r.quantity, 0);
}
