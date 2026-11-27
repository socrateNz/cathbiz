import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "../globals.css";

const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["500", "600", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Back-office", template: "%s · Back-office CBNA" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#240b2e" };

/**
 * Back-office privé, rendu à chaque requête (session, base de données) :
 * on n'exige pas de navigation instantanée, ce qui désactive la validation pour /admin uniquement.
 */
export const instant = false;

/** Racine du back-office (sans traduction, non indexé) */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f6f3ee]">
        <Suspense fallback={<div className="p-10 text-sm text-muted">Chargement…</div>}>{children}</Suspense>
      </body>
    </html>
  );
}
