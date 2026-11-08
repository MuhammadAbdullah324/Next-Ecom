import { z } from "zod";

export type FormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

// "Girls' Rain Jacket!" -> "girls-rain-jacket"
export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Image hosts the storefront's next/image is configured for (next.config.ts). A URL from any
// other host would break the product page, so the dashboard refuses it.
export function allowedImageHosts(supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const hosts = ["images.unsplash.com", "placehold.co"];
  if (supabaseUrl) hosts.push(new URL(supabaseUrl).hostname);
  return hosts;
}

export function isAllowedImageUrl(value: string, hosts = allowedImageHosts()) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.includes(url.hostname);
  } catch {
    return false;
  }
}

// Blank or missing (a field the form hides for this kind of item) both mean "not set".
const blankToNull = (v: unknown) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? null : v);
const optionalText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable());
const money = z.coerce.number({ error: "Enter a price." }).min(0, "Price can't be negative.").max(99999999, "That price is too high.").transform((n) => Math.round(n * 100) / 100);
const optionalMoney = z.preprocess(blankToNull, money.nullable());
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes.").max(80);
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const internalHref = z.preprocess(blankToNull, z.string().trim().regex(/^\/(?!\/)/, "Use a link inside the store, starting with /.").max(200).nullable());
const imageUrl = z.preprocess(
  blankToNull,
  z.string().trim().refine((v) => isAllowedImageUrl(v), "Upload the image, or use an https link from Unsplash or your Supabase storage.").nullable(),
);

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
  slug,
  description: optionalText(500),
  image_url: imageUrl,
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: checkbox,
});

export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name.").max(120),
    slug,
    category_id: z.uuid("Choose a category."),
    brand: optionalText(80),
    short_description: optionalText(200),
    description: optionalText(5000),
    price: money,
    compare_at_price: optionalMoney,
    is_featured: checkbox,
    is_active: checkbox,
    specs: z.string().max(5000).default(""),
  })
  .refine((p) => p.compare_at_price == null || p.compare_at_price > p.price, {
    path: ["compare_at_price"],
    message: "The 'was' price must be higher than the price.",
  })
  .transform(({ specs, ...p }) => ({ ...p, specs: parseKeyValues(specs) }));

export const variantSchema = z.object({
  name: z.string().trim().min(1, "Enter a name, e.g. 2-3Y / Blue.").max(80),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-_.]*$/, "Use letters, numbers and dashes.").max(64),
  options: z.string().max(1000).default("").transform(parseKeyValues),
  price: optionalMoney,
  stock_quantity: z.coerce.number({ error: "Enter a stock count." }).int("Use a whole number.").min(0, "Stock can't be negative.").max(1000000),
  is_default: checkbox,
  is_active: checkbox,
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const imageSchema = z.object({
  url: z.string().trim().refine((v) => isAllowedImageUrl(v), "Use an https link from Unsplash or your Supabase storage."),
  alt_text: z.string().trim().min(1, "Describe the photo for screen readers.").max(200),
});

export const PLACEMENTS = ["banner", "hero", "feature"] as const;
export const PAGES = ["all", "home", "products", "category", "cart"] as const;

export const promotionSchema = z
  .object({
    placement: z.enum(PLACEMENTS),
    page: z.enum(PAGES),
    category_id: z.preprocess(blankToNull, z.uuid().nullable()),
    eyebrow: optionalText(40),
    title: z.string().trim().min(1, "Enter a headline.").max(120),
    subtitle: optionalText(300),
    cta_label: optionalText(40),
    cta_href: internalHref,
    cta2_label: optionalText(40),
    cta2_href: internalHref,
    image_url: imageUrl,
    sort_order: z.coerce.number().int().min(0).max(9999).default(0),
    starts_at: z.preprocess(blankToNull, z.coerce.date().nullable()),
    ends_at: z.preprocess(blankToNull, z.coerce.date().nullable()),
    is_active: checkbox,
  })
  .refine((p) => p.page !== "all" || p.placement === "banner", { path: ["page"], message: "Only announcement bars can show on every page." })
  .refine((p) => !p.ends_at || !p.starts_at || p.ends_at > p.starts_at, { path: ["ends_at"], message: "End must be after the start." })
  .transform((p) => ({
    ...p,
    category_id: p.page === "category" ? p.category_id : null,
    starts_at: p.starts_at?.toISOString() ?? null,
    ends_at: p.ends_at?.toISOString() ?? null,
  }));

export const settingsSchema = z.object({
  store_name: z.string().trim().min(1, "Enter the store name.").max(80),
  tax_percent: z.coerce.number().min(0, "Tax can't be negative.").max(99.99, "Tax must be under 100%."),
});

export const shippingSchema = z
  .object({
    code: z.string().trim().toLowerCase().regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores.").max(40),
    name: z.string().trim().min(1, "Enter a name.").max(60),
    description: optionalText(200),
    price: money,
    free_over: z.preprocess(blankToNull, z.coerce.number().positive("Must be above 0.").nullable()),
    min_days: z.coerce.number().int().min(0),
    max_days: z.coerce.number().int().min(0),
    sort_order: z.coerce.number().int().min(0).max(9999).default(0),
    is_active: checkbox,
  })
  .refine((s) => s.max_days >= s.min_days, { path: ["max_days"], message: "Must be at least the minimum." });

// "Color: Blue\nSize: 2-3Y" <-> {"Color": "Blue", "Size": "2-3Y"}. Lines without a colon are ignored.
export function parseKeyValues(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key && value) out[key] = value;
  }
  return out;
}

export function formatKeyValues(record: Record<string, unknown> | null | undefined) {
  return Object.entries(record ?? {})
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");
}

// "2026-11-20T09:00" typed in a zone with getTimezoneOffset() = offsetMinutes (UTC+5 -> -300) -> ISO UTC.
export function localDateTimeToIso(value: FormDataEntryValue | null, offsetMinutes: number) {
  if (typeof value !== "string" || !value.trim()) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
  if (!m) return value; // let the schema report it
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + offsetMinutes * 60_000;
  return new Date(utc).toISOString();
}

export function formToObject(formData: FormData) {
  const out: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) if (!key.startsWith("$")) out[key] = value;
  return out;
}

// Postgres errors an admin can act on, in plain words.
export function adminDbMessage(error: { code?: string; message: string; details?: string | null } | null, fallback = "Could not save. Please try again.") {
  if (!error) return fallback;
  if (error.code === "23505") {
    const what = /slug/.test(error.message + (error.details ?? "")) ? "web address (slug)" : /sku/.test(error.message + (error.details ?? "")) ? "SKU" : /name/.test(error.message + (error.details ?? "")) ? "name" : "value";
    return `That ${what} is already used. Choose another.`;
  }
  if (error.code === "23503") return "It's still in use, so it can't be deleted. Hide it instead, or move what uses it first.";
  if (error.code === "23514") return "Some values aren't allowed. Check the form and try again.";
  if (error.code === "42501") return "Only store admins can do that.";
  if (error.code && ["P0001", "P0002", "22023"].includes(error.code)) return error.message;
  console.error(error);
  return fallback;
}
