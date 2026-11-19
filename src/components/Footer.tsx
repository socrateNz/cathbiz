import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { navItems, site, telHref } from "@/lib/site";

export default async function Footer() {
  const t = await getTranslations("footer");
  const tn = await getTranslations("nav");
  const tt = await getTranslations("topbar");

  return (
    <footer className="relative overflow-hidden bg-purple-deep text-white/80">
      <div className="bg-diamonds absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/images/logo-cbna.png" alt="Logo CBNA" width={64} height={64} className="rounded-full ring-1 ring-gold" />
            <div>
              <p className="font-serif text-2xl font-bold text-white">CBNA · RECA</p>
              <p className="text-xs uppercase tracking-wider text-gold-light">{t("nonprofit")}</p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed">{t("tagline")}</p>
        </div>

        <div>
          <p className="mb-4 font-serif text-xl font-semibold text-white">{t("links")}</p>
          <ul className="space-y-2 text-sm">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="hover:text-gold-light">
                  {tn(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-4 font-serif text-xl font-semibold text-white">{t("contact")}</p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {tt("seat")}
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <a href={`mailto:${site.email}`} className="hover:text-gold-light">{site.email}</a>
            </li>
            {site.phones.map((p) => (
              <li key={p} className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a href={telHref(p)} className="hover:text-gold-light">{p}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Catholic Business Network of Africa (CBNA / RECA). {t("rights")}</p>
          <p>
            Design and build by{" "}
            <a
              href="https://www.tacynt.com/"
              target="_blank"
              rel="noopener"
              className="font-semibold text-gold-light hover:underline"
            >
              Tacynt
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
