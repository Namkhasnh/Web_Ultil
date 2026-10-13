import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteLayout } from "@/components/common/SiteLayout";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebUtil — Tiny tools, big time savings",
  description: "Fix PDFs, transform images, and spin up an AI newsletter — all in one playful place. Free tools, no sign-up. PDF and image files stay on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground"><SiteLayout>{children}</SiteLayout></body>
    </html>
  );
}
