import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Next Ecom <onboarding@resend.dev>"),
});

let cached: z.infer<typeof serverSchema> | undefined;

// Parsed on first use so a missing secret fails the request that needs it, with a clear message.
export function serverEnv() {
  cached ??= serverSchema.parse(process.env);
  return cached;
}
