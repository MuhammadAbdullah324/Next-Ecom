import Link from "next/link";
import Form from "next/form";
import { Suspense } from "react";
import { getCategories } from "@/features/catalog/queries";
import { getCartCount } from "@/features/cart/queries";
import { getCurrentUser } from "@/features/auth/session";
import { signOut } from "@/features/auth/actions";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

async function CartLink() {
  const count = await getCartCount();
  return (
    <Link href="/cart" className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-line/60" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
      <CartIcon />
      {count > 0 ? (
        <span className="absolute right-0.5 top-0.5 min-w-5 rounded-full bg-brand px-1 text-center text-xs font-semibold leading-5 text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}

async function AccountLinks() {
  const user = await getCurrentUser();
  if (!user || user.isGuest) {
    return (
      <Link href="/sign-in" className="rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:bg-line/60 hover:text-ink">
        Sign in
      </Link>
    );
  }
  return (
    <details className="relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full px-3 text-sm font-medium text-ink-soft hover:bg-line/60 hover:text-ink">
        Account
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-line bg-surface p-2 shadow-lg">
        <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
        <Link href="/account" className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas">
          Account and addresses
        </Link>
        <Link href="/orders" className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas">
          Orders
        </Link>
        <form action={signOut}>
          <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-canvas">
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}

async function CategoryNav() {
  const categories = await getCategories();
  return (
    <nav aria-label="Categories" className="border-t border-line">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-sm sm:px-6">
        <li>
          <Link href="/products" className="block whitespace-nowrap rounded-full px-3 py-1.5 text-ink-soft hover:bg-line/60 hover:text-ink">
            All products
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.slug}`} className="block whitespace-nowrap rounded-full px-3 py-1.5 text-ink-soft hover:bg-line/60 hover:text-ink">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-2 text-lg font-bold tracking-tight">
          Tiny<span className="text-brand">Threads</span>
        </Link>
        <Form action="/products" role="search" className="hidden flex-1 sm:block">
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Search tees, dresses, pajamas…"
            className="min-h-10 w-full max-w-md rounded-full border border-line bg-canvas px-4 text-sm"
          />
        </Form>
        <div className="ml-auto flex items-center gap-1">
          <Suspense fallback={<span className="w-16" />}>
            <AccountLinks />
          </Suspense>
          <Suspense fallback={<span className="inline-flex size-11 items-center justify-center"><CartIcon /></span>}>
            <CartLink />
          </Suspense>
        </div>
      </div>
      <Form action="/products" role="search" className="px-4 pb-3 sm:hidden">
        <label htmlFor="site-search-mobile" className="sr-only">
          Search products
        </label>
        <input id="site-search-mobile" name="q" type="search" placeholder="Search products" className="min-h-11 w-full rounded-full border border-line bg-canvas px-4 text-base" />
      </Form>
      <CategoryNav />
    </header>
  );
}
