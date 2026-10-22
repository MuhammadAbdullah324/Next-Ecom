jest.mock("server-only", () => ({}));
const headerValues = new Map<string, string>();
jest.mock("next/headers", () => ({ headers: async () => ({ get: (k: string) => headerValues.get(k) ?? null }) }));

const ENV = { ...process.env };

async function load(env: Record<string, string | undefined>) {
  jest.resetModules();
  process.env = { ...ENV, NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "pk", ...env };
  return import("./site-url");
}

afterEach(() => {
  process.env = ENV;
  headerValues.clear();
});

describe("site url", () => {
  it("uses the host the shopper is on for redirects", async () => {
    const { requestSiteUrl } = await load({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" });
    headerValues.set("x-forwarded-host", "tiny-threads.vercel.app");
    headerValues.set("x-forwarded-proto", "https");
    await expect(requestSiteUrl()).resolves.toBe("https://tiny-threads.vercel.app");
  });

  it("uses http for a local dev server", async () => {
    const { requestSiteUrl } = await load({});
    headerValues.set("host", "localhost:3000");
    await expect(requestSiteUrl()).resolves.toBe("http://localhost:3000");
  });

  it("ignores a localhost site URL on Vercel", async () => {
    const { configuredSiteUrl } = await load({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000", VERCEL_PROJECT_PRODUCTION_URL: "tiny-threads.vercel.app" });
    expect(configuredSiteUrl()).toBe("https://tiny-threads.vercel.app");
  });

  it("keeps an explicit public site URL", async () => {
    const { configuredSiteUrl } = await load({ NEXT_PUBLIC_SITE_URL: "https://shop.example.com/", VERCEL_PROJECT_PRODUCTION_URL: "tiny-threads.vercel.app" });
    expect(configuredSiteUrl()).toBe("https://shop.example.com");
  });
});
