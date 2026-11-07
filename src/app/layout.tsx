import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted from @fontsource so builds don't depend on Google Fonts.
const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Tiny Threads: kids' clothing", template: "%s | Tiny Threads" },
  description: "Comfy, playground-ready clothes for babies and kids: tees, dresses, pajamas, jackets and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">
          Skip to content
        </a>
        {/* The store's (store)/layout.tsx and the admin's admin/layout.tsx each draw their own chrome and <main>. */}
        {children}
      </body>
    </html>
  );
}
