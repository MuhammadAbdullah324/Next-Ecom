import Link from "next/link";
import Form from "next/form";
import { Suspense } from "react";
import { Search, ShoppingBag, UserRound } from "lucide-react";
import { getCategories } from "@/features/catalog/queries";
import { getCartCount } from "@/features/cart/queries";
import { getCurrentUser } from "@/features/auth/session";
import { ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";

async function CartLink() {
  const count = await getCartCount();
  return (
    <ButtonLink href="/cart" variant="ghost" size="icon" className="relative" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
      <ShoppingBag aria-hidden className="size-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-primary-foreground ring-2 ring-card">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </ButtonLink>
  );
}

async function AccountLinks() {
  const user = await getCurrentUser();
  if (!user || user.isGuest) {
    return (
      <ButtonLink href="/sign-in" variant="ghost" className="px-3">
        <UserRound aria-hidden />
        Sign in
      </ButtonLink>
    );
  }
  return <AccountMenu email={user.email ?? null} />;
}

async function CategoryNav() {
  const categories = await getCategories();
  const pill = "block whitespace-nowrap rounded-full px-3.5 py-1.5 font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-secondary-foreground";
  return (
    <nav aria-label="Categories" className="border-t border-border/70">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 text-sm sm:px-6">
        <li>
          <Link href="/products" className={pill}>All products</Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.slug}`} className={pill}>{c.name}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SearchBox({ id, className }: { id: string; className?: string }) {
  return (
    <Form action="/products" role="search" className={className}>
      <label htmlFor={id} className="sr-only">Search products</label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} name="q" type="search" placeholder="Search tees, dresses, pajamas…" className="rounded-full border-transparent bg-muted pl-10 focus-visible:bg-card" />
      </div>
    </Form>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <SearchBox id="site-search" className="hidden max-w-md flex-1 sm:block" />
        <div className="ml-auto flex items-center gap-1">
          <Suspense fallback={<span className="w-24" />}>
            <AccountLinks />
          </Suspense>
          <Suspense fallback={<span className="inline-flex size-11 items-center justify-center"><ShoppingBag aria-hidden className="size-5" /></span>}>
            <CartLink />
          </Suspense>
        </div>
      </div>
      <SearchBox id="site-search-mobile" className="px-4 pb-3 sm:hidden" />
      <CategoryNav />
    </header>
  );
}
