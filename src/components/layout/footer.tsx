import Link from "next/link";
import { Leaf, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "./logo";

const promises = [
  { icon: Truck, title: "Free delivery over $75", text: "Tracked to your door in 3 to 5 days." },
  { icon: RotateCcw, title: "Easy 30-day returns", text: "Grown out of it already? Send it back." },
  { icon: Leaf, title: "Gentle fabrics", text: "Soft cottons that are kind to little skin." },
  { icon: ShieldCheck, title: "Secure checkout", text: "Payments handled by Stripe." },
];

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?sort=newest", label: "New arrivals" },
      { href: "/category/baby", label: "Baby" },
      { href: "/category/sleepwear", label: "Sleepwear" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/orders", label: "Track an order" },
      { href: "/account", label: "Your account" },
      { href: "/cart", label: "Cart" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24">
      <div className="border-y border-border">
        <ul className="mx-auto grid max-w-7xl gap-x-6 gap-y-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <Icon aria-hidden strokeWidth={1.5} className="mt-0.5 size-6 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-sand">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-sm sm:grid-cols-[2fr_1fr_1fr] sm:px-6">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-muted-foreground">Soft, durable clothes for babies and kids, from newborn to 8 years. Made for climbing, splashing and everything in between.</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-widest">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="transition-colors hover:text-foreground">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-7xl border-t border-foreground/10 px-4 py-6 text-xs text-muted-foreground sm:px-6">© Tiny Threads. Photos from Unsplash.</p>
      </div>
    </footer>
  );
}
