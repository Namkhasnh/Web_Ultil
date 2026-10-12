"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";

const links = [
  { href: "/pdf-tools", label: "PDF Tools", icon: "📄" },
  { href: "/image-tools", label: "Image Tools", icon: "🖼️" },
  { href: "/ai-newsletter", label: "AI Newsletter", icon: "✨" },
];

export function Navbar() {
  const pathname = usePathname();
  function linkColor(href: string) {
    if (pathname !== href) return "text-soft";
    return href === "/image-tools" ? "text-[#3B6EF6]" : href === "/pdf-tools" ? "text-[#FF5470]" : "text-[#8B5CF6]";
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let savedDark = false;
    try { savedDark = localStorage.getItem("webutil-theme") === "dark"; } catch { /* Storage is optional. */ }
    document.documentElement.dataset.theme = savedDark ? "dark" : "light";
    // Synchronize the initial client state with the stored preference.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(savedDark);
  }, []);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    try { localStorage.setItem("webutil-theme", nextDark ? "dark" : "light"); } catch { /* Keep the toggle usable when storage is blocked. */ }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[var(--nav)] backdrop-blur-[14px]">
      <div className="flex h-[68px] items-center justify-between px-[clamp(16px,5vw,56px)]">
        <Brand />
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-surface2 text-[17px] transition-colors hover:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9061F0]">
            <span aria-hidden="true">{dark ? "☀️" : "🌙"}</span>
          </button>
          <nav aria-label="Main navigation" className="hidden items-center gap-[clamp(14px,2.4vw,28px)] min-[760px]:flex">
            {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`flex min-h-11 items-center rounded-md text-[15px] font-semibold ${linkColor(link.href)} transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9061F0]`}>{link.label}</Link>)}
            <Link href="/pdf-tools" className="flex min-h-11 items-center rounded-[11px] bg-[#0F1222] px-[17px] text-sm font-bold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9061F0]">Open app</Link>
          </nav>
          <button type="button" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)} className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-surface2 text-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9061F0] min-[760px]:hidden"><span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span></button>
        </div>
      </div>
      {menuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }} className="flex flex-col bg-surface px-5 pt-2 pb-4 min-[760px]:hidden">
        {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setMenuOpen(false)} className={`min-h-11 rounded-md border-b border-border px-1.5 py-[13px] font-semibold ${linkColor(link.href)} last:border-0 hover:bg-surface2 focus-visible:outline-2 focus-visible:outline-[#9061F0]`}><span aria-hidden="true">{link.icon} </span>{link.label}</Link>)}
      </nav>}
    </header>
  );
}
