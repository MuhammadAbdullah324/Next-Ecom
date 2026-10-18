import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { toAmount } from "@/lib/money";
import { PAGE_SIZE, type ListingFilters } from "./search-params";
import type { Category, ListingPage, ProductDetail, ProductListing, Promotion } from "./types";

// Catalog data is public and shared, so it is cached and tagged. Stock is re-checked
// by the database whenever someone adds to cart or checks out.
export const CATALOG_TAG = "catalog";

const LISTING_COLUMNS =
  "id, slug, name, brand, short_description, price, compare_at_price, is_featured, category_slug, category_name, image_url, image_alt, min_price, max_price, total_stock, in_stock";

function toListing(row: Record<string, unknown>): ProductListing {
  return {
    ...(row as ProductListing),
    price: toAmount(row.price as string),
    compare_at_price: row.compare_at_price == null ? null : toAmount(row.compare_at_price as string),
    min_price: toAmount(row.min_price as string),
    max_price: toAmount(row.max_price as string),
  };
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, slug, description, image_url")
    .order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data;
}

export async function getCategory(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getPromotions(): Promise<Promotion[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("promotions")
    .select("id, placement, title, subtitle, cta_label, cta_href, image_url")
    .order("sort_order");
  if (error) throw new Error(`Could not load promotions: ${error.message}`);
  return data as Promotion[];
}

export async function getFeaturedProducts(limit = 8): Promise<ProductListing[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("product_listings")
    .select(LISTING_COLUMNS)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load featured products: ${error.message}`);
  return data.map(toListing);
}

export async function getNewArrivals(limit = 4): Promise<ProductListing[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("product_listings")
    .select(LISTING_COLUMNS)
    .order("created_at", { ascending: false })
    .order("name")
    .limit(limit);
  if (error) throw new Error(`Could not load new arrivals: ${error.message}`);
  return data.map(toListing);
}

export async function getBrands(categorySlug?: string): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  let query = createPublicClient().from("product_listings").select("brand");
  if (categorySlug) query = query.eq("category_slug", categorySlug);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load brands: ${error.message}`);
  return [...new Set(data.map((r) => r.brand).filter((b): b is string => !!b))].sort();
}

export async function getListingPage(filters: ListingFilters): Promise<ListingPage> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const from = (filters.page - 1) * PAGE_SIZE;
  let query = createPublicClient()
    .from("product_listings")
    .select(LISTING_COLUMNS, { count: "exact" });

  if (filters.category) query = query.eq("category_slug", filters.category);
  if (filters.brand.length) query = query.in("brand", filters.brand);
  if (filters.min != null) query = query.gte("min_price", filters.min);
  if (filters.max != null) query = query.lte("min_price", filters.max);
  if (filters.inStock) query = query.eq("in_stock", true);
  if (filters.q) query = query.textSearch("search", filters.q, { type: "websearch", config: "english" });

  switch (filters.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price-asc":
      query = query.order("min_price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("min_price", { ascending: false });
      break;
    case "name":
      query = query.order("name");
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("in_stock", { ascending: false });
  }
  query = query.order("name").range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  // Asking for a page past the end returns 416; treat it as an empty page.
  if (error && error.code !== "PGRST103") throw new Error(`Could not load products: ${error.message}`);

  const total = count ?? 0;
  return {
    products: (data ?? []).map(toListing),
    total,
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG, `product:${slug}`);

  const { data, error } = await createPublicClient()
    .from("products")
    .select(
      `id, slug, name, brand, short_description, description, price, compare_at_price, specs,
       category:categories!inner ( name, slug ),
       images:product_images ( id, url, alt_text, sort_order ),
       variants:product_variants ( id, sku, name, options, price, stock_quantity, is_default, sort_order )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  if (!data || data.variants.length === 0) return null;

  const basePrice = toAmount(data.price);
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    brand: data.brand,
    short_description: data.short_description,
    description: data.description,
    price: basePrice,
    compare_at_price: data.compare_at_price == null ? null : toAmount(data.compare_at_price),
    specs: data.specs ?? {},
    category: data.category as unknown as { name: string; slug: string },
    images: [...data.images].sort((a, b) => a.sort_order - b.sort_order),
    variants: [...data.variants]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        options: v.options ?? {},
        price: v.price == null ? basePrice : toAmount(v.price),
        stock_quantity: v.stock_quantity,
        is_default: v.is_default,
      })),
  };
}

export async function getRelatedProducts(categorySlug: string, excludeSlug: string): Promise<ProductListing[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient()
    .from("product_listings")
    .select(LISTING_COLUMNS)
    .eq("category_slug", categorySlug)
    .neq("slug", excludeSlug)
    .order("in_stock", { ascending: false })
    .limit(4);
  if (error) throw new Error(`Could not load related products: ${error.message}`);
  return data.map(toListing);
}

export async function getAllProductSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CATALOG_TAG);

  const { data, error } = await createPublicClient().from("product_listings").select("slug").eq("is_featured", true);
  if (error) throw new Error(`Could not load product slugs: ${error.message}`);
  return data.map((r) => r.slug);
}
