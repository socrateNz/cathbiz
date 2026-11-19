import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

/** URL publique du site (à surcharger avec NEXT_PUBLIC_SITE_URL si le domaine change) */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://catholic-business-network-africa.org"
).replace(/\/$/, "");

export const siteName = "CBNA · RECA";

const ogLocales: Record<Locale, string> = { fr: "fr_FR", en: "en_US" };

/** Pages publiques du site, utilisées par le sitemap */
export const sitePaths = ["", "/about", "/programs", "/presence", "/membership", "/contact"] as const;

/** Métadonnées SEO d'une page : canonique, hreflang, Open Graph et Twitter */
export function pageMetadata({
  locale,
  path,
  title,
  homeTitle,
  description,
}: {
  locale: string;
  path: (typeof sitePaths)[number];
  /** Titre de la page (le gabarit « | CBNA / RECA » est ajouté) */
  title?: string;
  /** Titre complet de l'accueil, utilisé tel quel */
  homeTitle?: string;
  description: string;
}): Metadata {
  const fullTitle = homeTitle ?? `${title} | ${siteName}`;
  const loc = (routing.locales as readonly string[]).includes(locale) ? (locale as Locale) : routing.defaultLocale;
  const url = `/${loc}${path}`;
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`]));

  return {
    title: homeTitle ? { absolute: homeTitle } : title,
    description,
    alternates: {
      canonical: url,
      languages: { ...languages, "x-default": `/${routing.defaultLocale}${path}` },
    },
    openGraph: {
      type: "website",
      siteName,
      url,
      title: fullTitle,
      description,
      locale: ogLocales[loc],
      alternateLocale: routing.locales.filter((l) => l !== loc).map((l) => ogLocales[l]),
      images: [{ url: "/images/og-cbna.jpg", width: 1200, height: 630, alt: "Catholic Business Network of Africa" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/images/og-cbna.jpg"],
    },
  };
}
