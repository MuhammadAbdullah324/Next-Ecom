import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SiteAnnouncement } from "@/components/content/page-promotions";

// Storefront chrome. The admin dashboard (app/admin) has its own layout instead.
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteAnnouncement />
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
