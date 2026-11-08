// Names shown in the dashboard for page-content types and pages. Plain values, usable on server and client.

export const PLACEMENT_LABELS = {
  banner: "Announcement bar",
  hero: "Hero banner / carousel slide",
  feature: "Feature card",
} as const;

export const PAGE_LABELS = {
  all: "Every page",
  home: "Home page",
  products: "All products page",
  category: "Category pages",
  cart: "Cart page",
} as const;

export const PLACEMENT_HELP = {
  banner: "A thin strip of text at the top of the page, e.g. a delivery offer.",
  hero: "A large photo with a headline at the top of the page. Add two or more heroes to the same page and they play as a carousel.",
  feature: "A photo-and-text card further down the page.",
} as const;
