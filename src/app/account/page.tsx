import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAccount } from "@/features/auth/session";
import { getSavedAddresses } from "@/features/checkout/queries";
import { deleteAddress, makeDefaultAddress } from "@/features/account/actions";
import { createClient } from "@/lib/supabase/server";
import { AddAddressForm, ProfileForm } from "@/components/account/account-forms";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Your account" };

async function Account({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const user = await requireAccount("/account");
  const supabase = await createClient();
  const [{ data: profile }, addresses, sp] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    getSavedAddresses(),
    searchParams,
  ]);

  return (
    <div className="space-y-10">
      {sp.updated === "password" ? <Alert tone="success">Your password was updated.</Alert> : null}
      <section className="rounded-card border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted">Signed in as {user.email}</p>
        <div className="mt-4">
          <ProfileForm fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-6" aria-labelledby="addresses-heading">
        <h2 id="addresses-heading" className="text-lg font-semibold">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="mt-2 text-sm text-muted">You have no saved addresses yet. Add one below or save one at checkout.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="rounded-xl border border-line p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{a.label ?? a.full_name}</p>
                  {a.is_default ? <Badge tone="brand">Default</Badge> : null}
                </div>
                <p className="mt-1 text-ink-soft">
                  {a.full_name}, {a.address_line_1}
                  {a.address_line_2 ? `, ${a.address_line_2}` : ""}, {a.city} {a.postal_code}, {a.country}
                </p>
                <div className="mt-3 flex gap-2">
                  {!a.is_default ? (
                    <form action={makeDefaultAddress}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="min-h-9 rounded-full px-3 text-sm text-brand hover:bg-brand-soft">Make default</button>
                    </form>
                  ) : null}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="min-h-9 rounded-full px-3 text-sm text-danger hover:bg-danger-soft" aria-label={`Delete address ${a.label ?? a.address_line_1}`}>Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-brand">+ Add an address</summary>
          <div className="mt-4">
            <AddAddressForm />
          </div>
        </details>
      </section>

      <p className="text-sm">
        <Link href="/orders" className="font-medium text-brand hover:underline">View your orders</Link>
        {" · "}
        <Link href="/forgot-password" className="text-ink-soft hover:underline">Change password</Link>
      </p>
    </div>
  );
}

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Your account</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Account searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
