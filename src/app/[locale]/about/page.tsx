import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Heart, Quote, Star } from "lucide-react";
import Reveal from "@/components/Reveal";
import { Eyebrow, JoinBanner, PageHero, QuoteBanner, SectionTitle } from "@/components/ui";

type Item = { title: string; text: string };
type Saint = { name: string; role: string };

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.hero" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const th = await getTranslations("home.join");
  const tq = await getTranslations("quotes");

  const saints = t.raw("saints.items") as Saint[];
  const values = t.raw("values.items") as Item[];
  const governance = t.raw("governance.items") as Item[];

  return (
    <>
      <PageHero title={t("hero.title")} subtitle={t("hero.subtitle")} />

      {/* IDENTITÉ */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 md:grid-cols-2">
        <Reveal>
          <Eyebrow>{t("who.eyebrow")}</Eyebrow>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-purple md:text-5xl">
            {t("who.title")}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/90">{t("who.p1")}</p>
          <p className="mt-4 leading-relaxed text-muted">{t("who.p2")}</p>
          <p className="mt-4 leading-relaxed text-muted">{t("who.p3")}</p>
        </Reveal>
        <Reveal delay={0.1} className="flex items-start justify-center gap-6">
          <div className="shrink-0 rounded-full shadow-xl ring-1 ring-gold">
            <Image src="/images/logo-cbna.png" alt="Logo CBNA" width={224} height={224} className="h-44 w-44 rounded-full md:h-56 md:w-56" />
          </div>
          <div className="mt-20 shrink-0 rounded-full shadow-xl ring-1 ring-gold">
            <Image src="/images/logo-reca.png" alt="Logo RECA" width={176} height={176} className="h-36 w-36 rounded-full md:h-44 md:w-44" />
          </div>
        </Reveal>
      </section>

      {/* SPIRITUALITÉ */}
      <section className="relative overflow-hidden bg-purple-deep text-white">
        <div className="bg-diamonds absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <SectionTitle eyebrow={t("spirituality.eyebrow")} title={t("spirituality.title")} light />
          <div className="grid gap-6 md:grid-cols-2">
            {(["heart", "mary"] as const).map((k, i) => (
              <Reveal key={k} delay={i * 0.1}>
                <div className="h-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                  <Heart className={`h-9 w-9 ${k === "heart" ? "fill-gold text-gold" : "text-gold-light"}`} />
                  <h3 className="mt-5 font-serif text-3xl font-semibold">{t(`spirituality.${k}.title`)}</h3>
                  <p className="mt-3 leading-relaxed text-white/75">{t(`spirituality.${k}.text`)}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-20">
            <SectionTitle eyebrow={t("saints.eyebrow")} title={t("saints.title")} light />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {saints.map((s, i) => (
                <Reveal key={s.name} delay={i * 0.06}>
                  <div className="h-full rounded-2xl bg-white/5 p-6 text-center ring-1 ring-gold/20">
                    <Star className="mx-auto h-6 w-6 fill-gold text-gold" />
                    <p className="mt-4 font-serif text-xl font-semibold leading-tight">{s.name}</p>
                    <p className="mt-2 text-sm text-white/65">{s.role}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALEURS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionTitle eyebrow={t("values.eyebrow")} title={t("values.title")} center />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.08}>
              <div className="h-full rounded-3xl border-t-4 border-green bg-white p-7 shadow-sm">
                <p className="font-serif text-5xl font-bold text-gold/70">0{i + 1}</p>
                <h3 className="mt-3 font-serif text-2xl font-semibold text-purple">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <QuoteBanner text={tq("work.text")} reference={tq("work.ref")} tone="green" />

      {/* GOUVERNANCE */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionTitle eyebrow={t("governance.eyebrow")} title={t("governance.title")} />
          <div className="grid gap-6 md:grid-cols-2">
            {governance.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.08}>
                <div className="flex h-full gap-5 rounded-3xl bg-white p-7 shadow-sm">
                  <span className="mt-1 h-3 w-3 shrink-0 rotate-45 bg-gold" aria-hidden />
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-purple">{g.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{g.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MOT DU CO-FONDATEUR */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Reveal>
          <Quote className="mx-auto h-12 w-12 text-gold" />
          <p className="mt-6 font-script font-semibold text-4xl leading-snug text-purple md:text-6xl">
            {t("founder.quote")}
          </p>
          <p className="mt-8 font-serif text-2xl font-semibold text-ink">{t("founder.name")}</p>
          <p className="text-sm uppercase tracking-widest text-green">{t("founder.role")}</p>
        </Reveal>
      </section>

      <JoinBanner title={th("title")} text={th("text")} cta={th("cta")} ctaContact={th("ctaContact")} />
    </>
  );
}
