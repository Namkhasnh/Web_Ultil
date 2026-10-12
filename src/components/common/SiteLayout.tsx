import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/common/Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only z-[60] rounded-lg bg-surface p-3 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Skip to content</a>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
