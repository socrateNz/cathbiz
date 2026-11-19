import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Handshake,
  Heart,
  Quote,
  Scale,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { Button, Eyebrow, QuoteBanner, SectionTitle } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";

type Item = { title: string; text: string };
type Axis = Item & { points: string[] };
type Stat = { value: string; label: string };
type Country = { code: string; name: string };
type NearItem = { label: string; href: string };

const pillarIcons = [Heart, Sparkles, Scale];
const axisIcons = [Briefcase, Handshake, GraduationCap];
const nearIcons = [UserPlus, Handshake, Users];

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({ locale, path: "", homeTitle: t("title"), description: t("description") });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tAll = await getTranslations();

  const pillars = t.raw("pillars.items") as Item[];
  const stats = t.raw("stats") as Stat[];
  const near = t.raw("near.items") as NearItem[];
  const promises = t.raw("promise.items") as string[];
  const axes = tAll.raw("axes") as Axis[];
  const countries = tAll.raw("presence.countries") as Country[];

  return (
    <>
      <OrganizationJsonLd locale={locale} />
      {/* HERO : photo de la basilique, la promesse comme porte d'entrée */}
      <section className="relative flex min-h-[calc(100svh-7rem)] items-center overflow-hidden bg-purple-deep text-white">
        <div className="absolute inset-y-0 right-0 w-full overflow-hidden md:w-[62%]">
          <Image
            src="/images/hero-basilique.jpg"
            alt={t("hero.photo")}
            fill
            priority
            sizes="(min-width: 768px) 62vw, 100vw"
            className="animate-kenburns object-cover object-[55%_30%]"
          />
        </div>
        {/* Voiles pour la lisibilité */}
        <div className="absolute inset-0 bg-purple-deep/70 md:hidden" aria-hidden />
        <div
          className="absolute inset-y-0 left-[38%] hidden w-[30%] bg-gradient-to-r from-purple-deep to-transparent md:block"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-purple-deep/70 to-transparent" aria-hidden />
        <div className="bg-diamonds absolute inset-y-0 left-0 hidden w-[40%] opacity-60 md:block" aria-hidden />

        <div className="relative mx-auto w-full max-w-7xl px-6 py-16">
          <div className="max-w-xl">
            <Reveal>
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-gold-light">
                <span className="h-px w-10 bg-gold" aria-hidden />
                {t("hero.label")}
              </p>
              <p className="mt-5 font-script font-semibold text-5xl leading-[1.1] drop-shadow-lg md:text-6xl">
                <span className="text-gold-light">«&nbsp;{t("promise.quote")}&nbsp;»</span>
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <h1 className="mt-8 font-serif text-3xl font-semibold leading-tight md:text-4xl">{t("hero.title")}</h1>
              <p className="mt-4 max-w-lg leading-relaxed text-white/80">{t("hero.subtitle")}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button href="/about">{t("hero.cta")}</Button>
                <Button href="/membership" variant="outline">
                  {t("hero.ctaJoin")}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>

        <p className="absolute bottom-5 right-6 text-[11px] uppercase tracking-[0.2em] text-white/60">
          {t("hero.photo")}
        </p>
      </section>

      {/* MOT DE BIENVENUE */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <Eyebrow>{t("welcome.eyebrow")}</Eyebrow>
            <h2 className="font-serif text-4xl font-semibold leading-tight text-purple md:text-5xl">
              {t("welcome.title")}
            </h2>
            <div className="mt-6 h-px w-24 bg-gold" />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative rounded-3xl bg-white p-8 shadow-sm ring-1 ring-purple/5 md:p-10">
              <Quote className="absolute -top-5 left-8 h-10 w-10 rounded-full bg-gold p-2 text-purple-deep" />
              <p className="text-lg leading-relaxed text-ink/90">{t("welcome.p1")}</p>
              <p className="mt-4 leading-relaxed text-muted">{t("welcome.p2")}</p>
              <div className="mt-8 flex items-end justify-between gap-4 border-t border-purple/10 pt-6">
                <div>
                  <p className="font-serif text-2xl font-semibold text-purple">{t("welcome.signature")}</p>
                  <p className="text-sm text-muted">{t("welcome.role")}</p>
                </div>
                <p className="font-script font-semibold text-3xl text-green">{t("welcome.motto")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <QuoteBanner text={tAll("quotes.work.text")} reference={tAll("quotes.work.ref")} />

      {/* LE SACRÉ-CŒUR ET SA 5ᵉ PROMESSE */}
      <section className="relative overflow-hidden bg-purple-deep text-white">
        <div className="bg-diamonds absolute inset-0" aria-hidden />
        <div className="absolute left-1/4 top-1/3 h-[26rem] w-[26rem] rounded-full bg-[#7a1020]/30 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <Reveal className="mx-auto max-w-3xl text-center [&>p:first-child]:justify-center">
            <Eyebrow light>{t("promise.eyebrow")}</Eyebrow>
            <h2 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">{t("promise.title")}</h2>
            <p className="mt-5 leading-relaxed text-white/70">{t("promise.text")}</p>
          </Reveal>

          <div className="mt-14 grid items-center gap-12 lg:gap-16 md:grid-cols-2">
            <Reveal className="mx-auto w-full max-w-sm md:max-w-md lg:max-w-lg">
              <div className="relative aspect-square">
                <div className="absolute -inset-6 rounded-full bg-gold/25 blur-3xl" aria-hidden />
                <div className="absolute -inset-4 rounded-full border border-gold/40" aria-hidden />
                <div className="relative h-full w-full overflow-hidden rounded-full shadow-2xl ring-2 ring-gold">
                  <Image
                    src="/images/sacre-coeur-medaillon.jpg"
                    alt={t("promise.heartAlt")}
                    width={736}
                    height={964}
                    sizes="(min-width: 1024px) 512px, (min-width: 768px) 448px, 384px"
                    className="h-full w-full object-cover object-[50%_35%]"
                  />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <figure className="rounded-[2rem] border border-gold/30 bg-white/[0.04] p-8 backdrop-blur md:p-12">
                <span className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-purple-deep">
                  <Heart className="h-3.5 w-3.5 fill-current" /> {t("promise.number")}
                </span>
                <blockquote className="mt-6 font-script text-5xl font-semibold leading-tight md:text-6xl">
                  <span className="text-gold-light">«&nbsp;{t("promise.quote")}&nbsp;»</span>
                </blockquote>
                <div className="mt-8 flex items-center gap-3" aria-hidden>
                  <span className="h-px w-12 bg-gold/60" />
                  <span className="h-2 w-2 rotate-45 bg-gold" />
                </div>
                <figcaption className="mt-4 text-sm leading-relaxed text-white/60">{t("promise.source")}</figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      {/* LES 10 PROMESSES */}
      <section className="bg-sand">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-green">
            {t("promise.listTitle")}
          </p>
          <ol className="mt-10 grid gap-x-12 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-5">
            {promises.map((p, i) => {
              const key = i === 4;
              return (
                <li key={i} className="flex items-center gap-5 border-b border-purple/10 py-4">
                  <span
                    className={`flex h-9 w-9 shrink-0 rotate-45 items-center justify-center rounded-md ${
                      key ? "bg-gold" : "border border-gold/70"
                    }`}
                  >
                    <span className={`-rotate-45 text-sm font-semibold ${key ? "text-purple-deep" : "text-gold"}`}>
                      {i + 1}
                    </span>
                  </span>
                  <span className={key ? "font-semibold text-purple" : "text-ink/75"}>{p}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* PILIERS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionTitle eyebrow={t("pillars.eyebrow")} title={t("pillars.title")} center />
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => {
            const Icon = pillarIcons[i];
            return (
              <Reveal key={p.title} delay={i * 0.1}>
                <div className="group h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-purple/5 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-6 flex h-14 w-14 rotate-45 items-center justify-center rounded-xl bg-purple transition group-hover:bg-green">
                    <Icon className="h-6 w-6 -rotate-45 text-gold-light" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-purple">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{p.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <QuoteBanner text={tAll("quotes.talents.text")} reference={tAll("quotes.talents.ref")} tone="green" />

      {/* AXES D'ACTION */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionTitle eyebrow={t("axes.eyebrow")} title={t("axes.title")} intro={t("axes.intro")} />
          <div className="mb-12">
            <Button href="/programs" variant="outlineDark">
              {t("axes.cta")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {axes.map((a, i) => {
            const Icon = axisIcons[i];
            return (
              <Reveal key={a.title} delay={i * 0.1}>
                <div className="relative h-full overflow-hidden rounded-3xl bg-purple p-8 text-white">
                  <span className="absolute -right-4 -top-6 font-serif text-[9rem] font-bold leading-none text-white/5">
                    {i + 1}
                  </span>
                  <Icon className="h-10 w-10 text-gold" />
                  <h3 className="mt-6 font-serif text-3xl font-semibold">{a.title}</h3>
                  <p className="mt-3 leading-relaxed text-white/75">{a.text}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {a.points.map((pt) => (
                      <li key={pt} className="rounded-full bg-white/10 px-3 py-1 text-xs text-gold-light">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 border-y border-purple/10 py-10 md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="text-center">
              <p className="font-serif text-5xl font-bold text-purple">{s.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRÉSENCE */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-purple-deep p-10 text-white md:p-14">
            <div className="bg-diamonds absolute inset-0" aria-hidden />
            <div className="relative grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <Eyebrow light>{t("presence.eyebrow")}</Eyebrow>
                <h2 className="font-serif text-4xl font-semibold leading-tight">{t("presence.title")}</h2>
                <p className="mt-4 text-white/75">{t("presence.text")}</p>
                <div className="mt-8">
                  <Button href="/presence">
                    {t("presence.cta")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {countries.map((c) => (
                  <li
                    key={c.code}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center"
                  >
                    <span className="flex h-10 w-10 rotate-45 items-center justify-center rounded-md bg-gold">
                      <span className="-rotate-45 text-xs font-bold text-purple-deep">{c.code}</span>
                    </span>
                    <span className="text-sm">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <QuoteBanner text={tAll("quotes.hands.text")} reference={tAll("quotes.hands.ref")} tone="dark" />

      {/* AUPRÈS DE VOUS */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle eyebrow={t("near.eyebrow")} title={t("near.title")} intro={t("join.text")} center />
          <div className="grid gap-5 md:grid-cols-3">
            {near.map((n, i) => {
              const Icon = nearIcons[i];
              const cls =
                "group flex h-full items-center justify-between gap-4 rounded-2xl border border-purple/15 bg-white px-7 py-6 transition hover:border-purple hover:bg-purple";
              const inner = (
                <>
                  <span className="flex items-center gap-4">
                    <Icon className="h-6 w-6 text-green transition group-hover:text-gold-light" />
                    <span className="text-sm font-semibold uppercase tracking-[0.15em] text-purple transition group-hover:text-white">
                      {n.label}
                    </span>
                  </span>
                  <ArrowRight className="h-5 w-5 text-gold transition group-hover:translate-x-1" />
                </>
              );
              return (
                <Reveal key={n.label} delay={i * 0.08}>
                  {n.href.startsWith("mailto:") ? (
                    <a href={n.href} className={cls}>{inner}</a>
                  ) : (
                    <Link href={n.href} className={cls}>{inner}</Link>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
