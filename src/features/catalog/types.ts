export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
};

export type ProductListing = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  is_featured: boolean;
  category_slug: string;
  category_name: string;
  image_url: string | null;
  image_alt: string | null;
  min_price: number;
  max_price: number;
  total_stock: number;
  in_stock: boolean;
};

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  price: number;
  stock_quantity: number;
  is_default: boolean;
};

export type ProductImage = { id: string; url: string; alt_text: string };

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  specs: Record<string, string>;
  category: { name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
};

export type PromotionPage = "all" | "home" | "products" | "category" | "cart";

export type Promotion = {
  id: string;
  // banner: thin announcement bar. hero: big banner (several on one page play as a carousel).
  // feature: image-and-text card further down the page.
  placement: "banner" | "hero" | "feature";
  page: PromotionPage;
  category_id: string | null; // page "category" only; null = every category page
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  cta2_label: string | null;
  cta2_href: string | null;
  image_url: string | null;
};

export type ListingPage = {
  products: ProductListing[];
  total: number;
  page: number;
  pageCount: number;
};
