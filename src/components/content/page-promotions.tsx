import { getPagePromotions, getPromotions } from "@/features/catalog/queries";
import type { PromotionPage } from "@/features/catalog/types";
import { AnnouncementBar, FeatureCard, HeroSlide } from "./promo-blocks";
import { HeroCarousel } from "./hero-carousel";

// Announcement bars set to show on every page. Rendered once by the root layout.
export async function SiteAnnouncement() {
  const banners = (await getPromotions()).filter((p) => p.page === "all" && p.placement === "banner");
  return <AnnouncementBar banners={banners} />;
}

type Where = { page: PromotionPage; categoryId?: string | null };

export async function PageAnnouncement({ page, categoryId }: Where) {
  const { banners } = await getPagePromotions(page, categoryId);
  return <AnnouncementBar banners={banners} />;
}

// One hero is a static banner; two or more become a carousel.
export async function PageHero({ page, categoryId, size = "compact", heading = "h2", className }: Where & { size?: "full" | "compact"; heading?: "h1" | "h2"; className?: string }) {
  const { heroes } = await getPagePromotions(page, categoryId);
  if (heroes.length === 0) return null;
  return (
    <div className={className}>
      {heroes.length === 1 ? (
        <section aria-label="Featured offer">
          <HeroSlide promo={heroes[0]} size={size} priority heading={heading} />
        </section>
      ) : (
        <HeroCarousel slides={heroes} size={size} headingFirst={heading} />
      )}
    </div>
  );
}

export async function PageFeatures({ page, categoryId, className = "" }: Where & { className?: string }) {
  const { features } = await getPagePromotions(page, categoryId);
  if (features.length === 0) return null;
  return (
    <div className={`space-y-8 ${className}`}>
      {features.map((promo) => (
        <section key={promo.id}>
          <FeatureCard promo={promo} />
        </section>
      ))}
    </div>
  );
}
