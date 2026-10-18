import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/server-env";

const MERGE_COOKIE = "ne_guest_merge";

function sign(value: string) {
  return createHmac("sha256", serverEnv().SUPABASE_SERVICE_ROLE_KEY).update(`guest-merge:${value}`).digest("base64url");
}

// Returns a client with a user attached. Visitors without a session become guests
// (Supabase anonymous sign-in) the first time they add something to the cart.
export async function getShopperClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return { supabase, user };

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw new Error(`Could not start a guest session: ${error?.message ?? "no user"}`);
  return { supabase, user: data.user };
}

// Before leaving for OAuth or email confirmation, remember which guest cart to merge afterwards.
export async function rememberGuestForMerge(guestId: string) {
  (await cookies()).set(MERGE_COOKIE, `${guestId}.${sign(guestId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

async function takeRememberedGuest(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(MERGE_COOKIE)?.value;
  if (!raw) return null;
  store.delete(MERGE_COOKIE);

  const [id, signature] = raw.split(".");
  if (!id || !signature) return null;
  const expected = Buffer.from(sign(id));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return id;
}

// Moves the guest's cart and orders into the account that just signed in.
export async function mergeGuestInto(guestId: string | null | undefined, userId: string) {
  if (!guestId || guestId === userId) return;
  const { error } = await createAdminClient().rpc("merge_guest_cart", { from_user: guestId, to_user: userId });
  if (error) console.error("merge_guest_cart failed", error);
}

export async function mergeRememberedGuest(userId: string) {
  await mergeGuestInto(await takeRememberedGuest(), userId);
}
