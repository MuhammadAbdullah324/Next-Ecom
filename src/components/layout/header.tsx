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
        <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-sale px-1 text-[10px] font-semibold leading-[18px] text-white">
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
      <ButtonLink href="/sign-in" variant="ghost" className="px-3" aria-label="Sign in">
        <UserRound aria-hidden className="size-5" />
        <span className="hidden sm:inline">Sign in</span>
      </ButtonLink>
    );
  }
  return <AccountMenu email={user.email ?? null} />;
}

async function CategoryNav() {
  const categories = await getCategories();
  const link = "block whitespace-nowrap border-b-2 border-transparent py-3 font-medium text-foreground/75 transition-colors hover:border-foreground hover:text-foreground";
  return (
    <nav aria-label="Categories" className="border-t border-border">
      <ul className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 text-sm sm:px-6 lg:justify-center lg:gap-8 [scrollbar-width:none]">
        <li>
          <Link href="/products" className={link}>All products</Link>
        </li>
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.slug}`} className={link}>{c.name}</Link>
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
        <Input id={id} name="q" type="search" placeholder="Search tees, dresses, pajamas…" className="min-h-10 rounded-full border-transparent bg-muted pl-10 text-sm focus-visible:border-input focus-visible:bg-card" />
      </div>
    </Form>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:grid-cols-[1fr_minmax(0,28rem)_1fr] sm:px-6">
        <Logo className="justify-self-start" />
        <SearchBox id="site-search" className="hidden w-full sm:block" />
        <div className="flex items-center justify-self-end gap-0.5">
          <Suspense fallback={<span className="size-11" />}>
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
