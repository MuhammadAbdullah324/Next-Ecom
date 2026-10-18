import { listingHref, parseListingParams } from "./search-params";

describe("parseListingParams", () => {
  it("uses defaults for an empty URL", () => {
    expect(parseListingParams({})).toEqual({ q: undefined, category: undefined, brand: [], min: undefined, max: undefined, inStock: false, sort: "featured", page: 1 });
  });

  it("reads filters, repeated brands and sort", () => {
    const f = parseListingParams({ q: " pajamas ", brand: ["Sunny Days", "Pebble & Co"], min: "10", max: "50", inStock: "1", sort: "price-asc", page: "2" });
    expect(f).toMatchObject({ q: "pajamas", brand: ["Sunny Days", "Pebble & Co"], min: 10, max: 50, inStock: true, sort: "price-asc", page: 2 });
  });

  it("falls back instead of failing on bad values", () => {
    const f = parseListingParams({ sort: "cheapest", page: "-3", min: "abc", category: "../etc" });
    expect(f).toMatchObject({ sort: "featured", page: 1, min: undefined, category: undefined });
  });
});

describe("listingHref", () => {
  it("drops defaults and keeps filters", () => {
    expect(listingHref("/products", { sort: "featured", page: 1 })).toBe("/products");
    expect(listingHref("/category/dresses", { brand: ["Sunny Days"], inStock: true, page: 3 })).toBe("/category/dresses?brand=Sunny+Days&inStock=1&page=3");
  });
});
