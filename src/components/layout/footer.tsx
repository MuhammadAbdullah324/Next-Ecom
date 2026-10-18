import Link from "next/link";
import { Leaf, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "./logo";

const promises = [
  { icon: Truck, title: "Free delivery over $75", text: "Tracked to your door in 3 to 5 days." },
  { icon: RotateCcw, title: "Easy 30-day returns", text: "Grown out of it already? Send it back." },
  { icon: Leaf, title: "Gentle fabrics", text: "Soft cottons that are kind to little skin." },
  { icon: ShieldCheck, title: "Secure checkout", text: "Payments handled by Stripe." },
];

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="border-y border-border/70 bg-secondary/60">
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-primary shadow-sm">
                <Icon aria-hidden className="size-5" />
              </span>
              <div>
                <p className="font-heading font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm sm:grid-cols-[2fr_1fr_1fr] sm:px-6">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-muted-foreground">Soft, durable clothes for babies and kids, from newborn to 8 years. Made for climbing, splashing and everything in between.</p>
          </div>
          <div>
            <p className="font-heading font-semibold">Shop</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary">All products</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-primary">New arrivals</Link></li>
              <li><Link href="/cart" className="hover:text-primary">Cart</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-heading font-semibold">Help</p>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li><Link href="/orders" className="hover:text-primary">Track an order</Link></li>
              <li><Link href="/account" className="hover:text-primary">Your account</Link></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">© Tiny Threads. Photos from Unsplash.</p>
      </div>
    </footer>
  );
}
