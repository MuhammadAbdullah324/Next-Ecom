import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  isGuest: boolean;
};

// Verified with the Auth server (getUser), deduplicated per request.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    id: user.id,
    email: user.email ?? null,
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
    isGuest: user.is_anonymous ?? false,
  };
});

// For pages that need a real account (order history, address book).
export async function requireAccount(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.isGuest) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return user;
}
