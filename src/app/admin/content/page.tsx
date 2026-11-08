import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/features/admin/guard";
import { listAdminCategories, listAdminPromotions, type AdminPromotion } from "@/features/admin/queries";
import { setPromotionActive } from "@/features/admin/store-actions";
import { AdminPageHeader, EmptyState } from "@/components/admin/page-header";
import { PAGE_LABELS, PLACEMENT_LABELS } from "@/features/admin/content-labels";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Banners & content" };

const PAGE_ORDER = ["all", "home", "products", "category", "cart"] as const;
const PAGE_LINKS: Record<string, string> = { all: "/", home: "/", products: "/products", cart: "/cart" };

function scheduleState(p: AdminPromotion, now = Date.now()) {
  if (!p.is_active) return { label: "Draft", variant: "neutral" as const };
  if (p.starts_at && new Date(p.starts_at).getTime() > now) return { label: "Scheduled", variant: "warning" as const };
  if (p.ends_at && new Date(p.ends_at).getTime() <= now) return { label: "Ended", variant: "neutral" as const };
  return { label: "Live", variant: "success" as const };
}

export default async function AdminContentPage({ searchParams }: PageProps<"/admin/content">) {
  await requireAdmin("/admin/content");
  const [promotions, categories, sp] = await Promise.all([listAdminPromotions(), listAdminCategories(), searchParams]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <>
      <AdminPageHeader
        title="Banners & content"
        description="Announcement bars, hero banners and feature cards for each page of the store. Two or more live heroes on the same page play as a carousel."
        actions={<ButtonLink href="/admin/content/new"><Plus aria-hidden /> New banner</ButtonLink>}
      />
      {sp.created ? <Alert variant="success" className="mb-4">Published. It shows in the store now.</Alert> : null}
      {sp.deleted ? <Alert variant="success" className="mb-4">Deleted.</Alert> : null}

      {promotions.length === 0 ? (
        <EmptyState title="No banners yet" action={<ButtonLink href="/admin/content/new">Create a hero banner</ButtonLink>}>
          Start with a hero banner for the home page.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {PAGE_ORDER.map((page) => {
            const items = promotions.filter((p) => p.page === page);
            if (items.length === 0) return null;
            const liveHeroes = items.filter((p) => p.placement === "hero" && scheduleState(p).label === "Live").length;
            return (
              <section key={page} aria-labelledby={`page-${page}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 id={`page-${page}`} className="text-lg font-semibold">
                    {PAGE_LABELS[page]}
                    {page !== "category" ? (
                      <Link href={PAGE_LINKS[page]} target="_blank" className="ml-2 text-sm font-normal text-muted-foreground underline underline-offset-4">Open</Link>
                    ) : null}
                  </h2>
                  <div className="flex items-center gap-3">
                    {liveHeroes > 1 && page !== "category" ? <Badge variant="brand">Carousel · {liveHeroes} slides</Badge> : null}
                    <Link href={`/admin/content/new?page=${page}`} className="text-sm font-medium underline underline-offset-4">Add here</Link>
                  </div>
                </div>
                <ul className="divide-y rounded-xl border bg-card">
                  {items.map((p) => {
                    const state = scheduleState(p);
                    return (
                      <li key={p.id} className="relative flex flex-wrap items-center gap-4 p-3">
                        <div className="grid h-14 w-24 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnails */}
                          {p.image_url ? <img src={p.image_url} alt="" className="size-full object-cover" loading="lazy" /> : p.placement === "banner" ? "Text bar" : "No photo"}
                        </div>
                        <div className="min-w-48 flex-1">
                          <Link href={`/admin/content/${p.id}`} className="font-medium after:absolute after:inset-0 hover:underline">{p.title}</Link>
                          <p className="text-sm text-muted-foreground">
                            {PLACEMENT_LABELS[p.placement]}
                            {p.page === "category" ? ` · ${p.category_id ? categoryName.get(p.category_id) ?? "Category" : "All categories"}` : ""}
                            {` · order ${p.sort_order}`}
                          </p>
                        </div>
                        <Badge variant={state.variant}>{state.label}</Badge>
                        <form action={setPromotionActive} className="relative z-10">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="active" value={String(!p.is_active)} />
                          <SubmitButton size="sm" variant="outline" pendingLabel="…">{p.is_active ? "Unpublish" : "Publish"}</SubmitButton>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
