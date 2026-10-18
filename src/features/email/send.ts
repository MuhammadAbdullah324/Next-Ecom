import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/server-env";

// Sends a transactional email through Resend. Without RESEND_API_KEY it logs and skips,
// so local development works before email is set up.
export async function sendEmail(to: string, message: { subject: string; html: string; text: string }) {
  const { RESEND_API_KEY, EMAIL_FROM } = serverEnv();
  if (!RESEND_API_KEY) {
    console.info(`[email skipped: RESEND_API_KEY not set] to=${to} subject="${message.subject}"`);
    return;
  }
  const { error } = await new Resend(RESEND_API_KEY).emails.send({ from: EMAIL_FROM, to, ...message });
  if (error) console.error("Resend error", error);
}
