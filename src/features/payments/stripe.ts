import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/server-env";

let client: Stripe | undefined;

// STRIPE_API_BASE points the SDK at a local fake for end-to-end tests (see e2e/fake-stripe.mjs).
function apiOverride(): Stripe.StripeConfig {
  const base = process.env.STRIPE_API_BASE;
  if (!base) return {};
  const url = new URL(base);
  return { host: url.hostname, port: Number(url.port), protocol: url.protocol.replace(":", "") as "http" | "https" };
}

export function getStripe() {
  client ??= new Stripe(serverEnv().STRIPE_SECRET_KEY, { appInfo: { name: "next-ecom" }, ...apiOverride() });
  return client;
}
