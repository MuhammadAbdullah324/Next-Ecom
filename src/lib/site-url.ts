import "server-only";
import { headers } from "next/headers";
import { publicEnv } from "@/lib/env";

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url);

// Address for links that leave the request (emails, webhooks). A localhost value copied into
// hosting settings is ignored in favour of the deployment's own production address on Vercel.
export function configuredSiteUrl() {
  const configured = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (isLocal(configured) && vercel) return `https://${vercel}`;
  return configured;
}

// Address for redirects during a request (Stripe return, sign-in callbacks): the host the shopper
// is actually on, so preview and production deployments each send people back to themselves.
export async function requestSiteUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return configuredSiteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}
