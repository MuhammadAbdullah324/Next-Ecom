import { isAllowedImageUrl, localDateTimeToIso, parseKeyValues, formatKeyValues, productSchema, promotionSchema, slugify, variantSchema } from "./validation";

const hosts = ["images.unsplash.com", "placehold.co", "abcd.supabase.co"];

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Girls' Rain Jacket!")).toBe("girls-rain-jacket");
    expect(slugify("  Café   Crème 2-3Y ")).toBe("cafe-creme-2-3y");
  });
});

describe("isAllowedImageUrl", () => {
  it("accepts https links from configured hosts only", () => {
    expect(isAllowedImageUrl("https://images.unsplash.com/photo-1?w=800", hosts)).toBe(true);
    expect(isAllowedImageUrl("https://abcd.supabase.co/storage/v1/object/public/product-images/a.jpg", hosts)).toBe(true);
    expect(isAllowedImageUrl("http://images.unsplash.com/photo-1", hosts)).toBe(false);
    expect(isAllowedImageUrl("https://evil.example.com/a.jpg", hosts)).toBe(false);
    expect(isAllowedImageUrl("not a url", hosts)).toBe(false);
  });
});

describe("key/value text", () => {
  it("round-trips", () => {
    const parsed = parseKeyValues("Material: 100% cotton\nCare: Machine wash: cold\nno colon here\n : empty key");
    expect(parsed).toEqual({ Material: "100% cotton", Care: "Machine wash: cold" });
    expect(parseKeyValues(formatKeyValues(parsed))).toEqual(parsed);
  });
});

describe("productSchema", () => {
  const base = { name: "Rain jacket", slug: "rain-jacket", category_id: "7b0c1a52-7d1e-4a7b-9a36-1d3a3a8f4c11", price: "24.5", is_active: "on" };
  it("parses form values", () => {
    const r = productSchema.parse({ ...base, compare_at_price: "", specs: "Fit: Roomy" });
    expect(r).toMatchObject({ price: 24.5, compare_at_price: null, is_active: true, is_featured: false, brand: null, specs: { Fit: "Roomy" } });
  });
  it("needs the was-price above the price", () => {
    const r = productSchema.safeParse({ ...base, compare_at_price: "20" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(["compare_at_price"]);
  });
  it("rejects bad slugs", () => {
    expect(productSchema.safeParse({ ...base, slug: "Rain Jacket" }).success).toBe(false);
  });
});

describe("variantSchema", () => {
  it("uppercases SKUs and blanks price to null", () => {
    expect(variantSchema.parse({ name: "2-3Y", sku: "tee-23", stock_quantity: "4", price: "", options: "Size: 2-3Y" })).toMatchObject({
      sku: "TEE-23",
      price: null,
      stock_quantity: 4,
      options: { Size: "2-3Y" },
      is_default: false,
    });
  });
  it("refuses negative or fractional stock", () => {
    expect(variantSchema.safeParse({ name: "x", sku: "X", stock_quantity: "-1" }).success).toBe(false);
    expect(variantSchema.safeParse({ name: "x", sku: "X", stock_quantity: "1.5" }).success).toBe(false);
  });
});

describe("promotionSchema", () => {
  const base = { placement: "hero", page: "home", title: "Made for play", is_active: "on" };
  it("only lets announcement bars go on every page", () => {
    expect(promotionSchema.safeParse({ ...base, page: "all" }).success).toBe(false);
    expect(promotionSchema.safeParse({ ...base, placement: "banner", page: "all" }).success).toBe(true);
  });
  it("keeps links inside the store", () => {
    expect(promotionSchema.safeParse({ ...base, cta_href: "https://evil.example.com" }).success).toBe(false);
    expect(promotionSchema.safeParse({ ...base, cta_href: "//evil.example.com" }).success).toBe(false);
    expect(promotionSchema.safeParse({ ...base, cta_href: "/category/baby" }).success).toBe(true);
  });
  it("drops the category unless the page is a category page", () => {
    const id = "7b0c1a52-7d1e-4a7b-9a36-1d3a3a8f4c11";
    expect(promotionSchema.parse({ ...base, category_id: id }).category_id).toBeNull();
    expect(promotionSchema.parse({ ...base, page: "category", category_id: id }).category_id).toBe(id);
  });
  it("needs the end after the start", () => {
    expect(promotionSchema.safeParse({ ...base, starts_at: "2026-12-02T00:00:00Z", ends_at: "2026-12-01T00:00:00Z" }).success).toBe(false);
  });
});

describe("localDateTimeToIso", () => {
  it("reads datetime-local input in the admin's zone", () => {
    expect(localDateTimeToIso("2026-11-20T09:00", -300)).toBe("2026-11-20T04:00:00.000Z"); // Pakistan, UTC+5
    expect(localDateTimeToIso("2026-11-20T09:00", 0)).toBe("2026-11-20T09:00:00.000Z");
    expect(localDateTimeToIso("", -300)).toBeNull();
  });
});
