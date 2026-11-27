"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Mail, Menu, Phone, X, MapPin } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { navItems, site, telHref } from "@/lib/site";

/**
 * L'URL courante n'est connue qu'à la requête sur les pages dynamiques :
 * l'en-tête est prérendu sans lien actif, puis remplacé dès que l'URL est disponible.
 */
export default function Header() {
  return (
    <Suspense fallback={<HeaderView pathname={null} />}>
      <HeaderWithPath />
    </Suspense>
  );
}

function HeaderWithPath() {
  return <HeaderView pathname={usePathname()} />;
}

function HeaderView({ pathname }: { pathname: string | null }) {
  const t = useTranslations("nav");
  const tt = useTranslations("topbar");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const otherLocale = locale === "fr" ? "en" : "fr";

  const isActive = (href: string) =>
    pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50">
      {/* Bandeau supérieur */}
      <div className="hidden bg-purple-deep text-xs text-white/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <span className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gold" /> {tt("seat")}
          </span>
          <div className="flex items-center gap-6">
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-gold-light">
              <Mail className="h-3.5 w-3.5 text-gold" /> {site.email}
            </a>
            <a href={telHref(site.phones[0])} className="flex items-center gap-2 hover:text-gold-light">
              <Phone className="h-3.5 w-3.5 text-gold" /> {site.phones[0]}
            </a>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <div className="border-b border-purple/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/images/logo-cbna.png" alt="Logo CBNA" width={52} height={52} priority className="rounded-full ring-1 ring-gold" />
            <span className="leading-tight">
              <span className="block whitespace-nowrap font-serif text-xl font-bold text-purple">CBNA · RECA</span>
              <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-wider text-muted sm:block xl:hidden 2xl:block">
                Catholic Business Network of Africa
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`whitespace-nowrap px-2.5 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                  isActive(item.href) ? "text-green underline decoration-gold decoration-2 underline-offset-8" : "text-ink hover:text-purple"
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={pathname ?? "/"}
              locale={otherLocale}
              className="rounded-full border border-purple/20 px-3 py-1.5 text-xs font-semibold uppercase text-purple hover:bg-purple hover:text-white"
              aria-label={t("switchTo")}
            >
              {otherLocale}
            </Link>
            <Link
              href="/membership"
              className="hidden whitespace-nowrap rounded-full bg-gold px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-purple-deep hover:bg-gold-light md:inline-flex"
            >
              {t("join")}
            </Link>
            <button
              type="button"
              className="rounded-full p-2 text-purple xl:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? t("close") : t("menu")}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-purple/10 bg-cream px-6 py-4 xl:hidden">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block border-b border-purple/5 py-3 font-medium ${
                  isActive(item.href) ? "text-green" : "text-ink"
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/membership"
              onClick={() => setOpen(false)}
              className="mt-4 block rounded-full bg-gold px-5 py-3 text-center font-semibold text-purple-deep"
            >
              {t("join")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
