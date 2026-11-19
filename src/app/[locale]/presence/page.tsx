import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Globe, Mail, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";
import { JoinBanner, PageHero } from "@/components/ui";
import { site, telHref } from "@/lib/site";

type Country = { code: string; name: string; phones: string[]; seat?: boolean };

export async function generateMetadata({ params }: PageProps<"/[locale]/presence">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "presence.hero" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PresencePage({ params }: PageProps<"/[locale]/presence">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("presence");
  const th = await getTranslations("home.join");
  const countries = t.raw("countries") as Country[];

  return (
    <>
      <PageHero title={t("hero.title")} subtitle={t("hero.subtitle")} />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="max-w-3xl text-lg leading-relaxed text-muted">{t("intro")}</p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c, i) => (
            <Reveal key={c.code} delay={i * 0.05}>
              <div
                className={`relative h-full overflow-hidden rounded-3xl p-7 shadow-sm ring-1 ${
                  c.seat ? "bg-purple text-white ring-purple" : "bg-white ring-purple/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 rotate-45 items-center justify-center rounded-lg bg-gold">
                    <span className="-rotate-45 text-sm font-bold text-purple-deep">{c.code}</span>
                  </span>
                  {c.seat && (
                    <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-deep">
                      {t("seat")}
                    </span>
                  )}
                </div>
                <h2 className={`mt-6 font-serif text-3xl font-semibold ${c.seat ? "text-white" : "text-purple"}`}>
                  {c.name}
                </h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {c.phones.length > 0 ? (
                    c.phones.map((p) => (
                      <li key={p}>
                        <a href={telHref(p)} className="flex items-center gap-2 hover:underline">
                          <Phone className={`h-4 w-4 ${c.seat ? "text-gold-light" : "text-green"}`} /> {p}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li>
                      <a href={`mailto:${site.email}`} className="flex items-center gap-2 text-muted hover:underline">
                        <Mail className="h-4 w-4 text-green" /> {t("contactSeat")}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </Reveal>
          ))}

          <Reveal delay={0.35}>
            <div className="h-full rounded-3xl bg-green p-7 text-white shadow-sm">
              <Globe className="h-12 w-12 text-gold-light" />
              <h2 className="mt-6 font-serif text-3xl font-semibold">{t("diaspora.title")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{t("diaspora.text")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <JoinBanner title={th("title")} text={th("text")} cta={th("cta")} ctaContact={th("ctaContact")} />
    </>
  );
}
