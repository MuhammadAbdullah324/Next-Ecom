import { z } from "zod";

export const SORTS = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name",
} as const;

export type Sort = keyof typeof SORTS;

export const PAGE_SIZE = 12;

const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);
const many = (v: unknown) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const money = z.coerce.number().min(0).max(100000).optional().catch(undefined);

const schema = z.object({
  q: z.preprocess(one, z.string().trim().max(100).optional()).catch(undefined),
  category: z.preprocess(one, z.string().regex(/^[a-z0-9-]+$/).optional()).catch(undefined),
  brand: z.preprocess(many, z.array(z.string().trim().min(1).max(50)).max(20)).catch([]),
  min: z.preprocess((v) => one(v) || undefined, money),
  max: z.preprocess((v) => one(v) || undefined, money),
  inStock: z.preprocess((v) => one(v) === "1", z.boolean()).catch(false),
  sort: z.preprocess(one, z.enum(Object.keys(SORTS) as [Sort, ...Sort[]])).catch("featured"),
  page: z.preprocess(one, z.coerce.number().int().min(1).max(1000)).catch(1),
});

export type ListingFilters = z.infer<typeof schema>;

// Bad or missing values fall back to defaults instead of erroring.
export function parseListingParams(params: Record<string, string | string[] | undefined>): ListingFilters {
  return schema.parse(params);
}

// Builds a query string for links (pagination, clearing a filter).
export function listingHref(base: string, filters: Partial<ListingFilters>) {
  const sp = new URLSearchParams();
  if (filters.q) sp.set("q", filters.q);
  if (filters.category) sp.set("category", filters.category);
  filters.brand?.forEach((b) => sp.append("brand", b));
  if (filters.min != null) sp.set("min", String(filters.min));
  if (filters.max != null) sp.set("max", String(filters.max));
  if (filters.inStock) sp.set("inStock", "1");
  if (filters.sort && filters.sort !== "featured") sp.set("sort", filters.sort);
  if (filters.page && filters.page > 1) sp.set("page", String(filters.page));
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
