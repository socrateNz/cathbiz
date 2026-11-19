import { site } from "@/lib/site";
import { siteUrl } from "@/lib/seo";

/** Données structurées schema.org de l'organisation (pour Google) */
export default function OrganizationJsonLd({ locale }: { locale: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "NGO",
    "@id": `${siteUrl}/#organization`,
    name: "Catholic Business Network of Africa",
    alternateName: ["CBNA", "RECA", "Réseau des Entrepreneurs Catholiques d'Afrique"],
    url: `${siteUrl}/${locale}`,
    logo: `${siteUrl}/images/logo-cbna.png`,
    image: `${siteUrl}/images/og-cbna.jpg`,
    email: site.email,
    telephone: site.phones[0].replace(/\s/g, ""),
    nonprofitStatus: "Nonprofit",
    address: { "@type": "PostalAddress", addressLocality: "Yaoundé", addressCountry: "CM" },
    areaServed: ["CM", "CI", "MG", "CG", "CF", "GQ", "NG"].map((c) => ({ "@type": "Country", name: c })),
    founder: { "@type": "Person", name: "Frank Ombick" },
    knowsLanguage: ["fr", "en"],
    contactPoint: site.phones.map((p) => ({
      "@type": "ContactPoint",
      telephone: p.replace(/\s/g, ""),
      contactType: "customer support",
      areaServed: "CM",
      availableLanguage: ["French", "English"],
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}
