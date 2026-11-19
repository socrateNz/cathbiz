import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Hourglass,
  Plane,
  Sprout,
  Users,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { Button, JoinBanner, PageHero, QuoteBanner, SectionTitle } from "@/components/ui";

type Item = { title: string; text: string };
type Axis = Item & { points: string[] };

const axisIcons = [Briefcase, Handshake, GraduationCap];
const audienceIcons = [Sprout, Users, HeartHandshake, Plane, Hourglass];

export async function generateMetadata({ params }: PageProps<"/[locale]/programs">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "programs.hero" });
  const tm = await getTranslations({ locale, namespace: "meta.pages" });
  return pageMetadata({ locale, path: "/programs", title: t("title"), description: tm("programs") });
}

export default async function ProgramsPage({ params }: PageProps<"/[locale]/programs">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("programs");
  const tAll = await getTranslations();
  const th = await getTranslations("home.join");
  const tq = await getTranslations("quotes");

  const axes = tAll.raw("axes") as Axis[];
  const audiences = t.raw("audiences.items") as Item[];

  return (
    <>
      <PageHero title={t("hero.title")} subtitle={t("hero.subtitle")} />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="mx-auto max-w-3xl text-center font-serif text-2xl leading-relaxed text-purple md:text-3xl">
            {t("intro")}
          </p>
        </Reveal>

        <div className="mt-16 space-y-8">
          {axes.map((a, i) => {
            const Icon = axisIcons[i];
            return (
              <Reveal key={a.title}>
                <article className="grid overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-purple/5 md:grid-cols-[280px_1fr]">
                  <div
                    className={`relative flex flex-col justify-between p-8 text-white ${
                      i === 1 ? "bg-green" : "bg-purple"
                    }`}
                  >
                    <div className="bg-diamonds absolute inset-0 opacity-70" aria-hidden />
                    <Icon className="relative h-12 w-12 text-gold-light" />
                    <p className="relative mt-10 font-serif text-7xl font-bold text-white/20">0{i + 1}</p>
                  </div>
                  <div className="p-8 md:p-10">
                    <h2 className="font-serif text-3xl font-semibold text-purple md:text-4xl">{a.title}</h2>
                    <p className="mt-3 text-lg leading-relaxed text-muted">{a.text}</p>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                      {a.points.map((p) => (
                        <li key={p} className="flex items-center gap-3 text-ink">
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-gold" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <QuoteBanner text={tq("talents.text")} reference={tq("talents.ref")} tone="dark" />

      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <SectionTitle eyebrow={t("audiences.eyebrow")} title={t("audiences.title")} center />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map((a, i) => {
              const Icon = audienceIcons[i];
              return (
                <Reveal key={a.title} delay={i * 0.06}>
                  <div className="h-full rounded-3xl bg-white p-6 text-center shadow-sm">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple/5">
                      <Icon className="h-7 w-7 text-green" />
                    </span>
                    <h3 className="mt-4 font-serif text-xl font-semibold text-purple">{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{a.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-purple-deep p-10 text-white md:p-14">
            <div className="bg-diamonds absolute inset-0" aria-hidden />
            <div className="relative max-w-2xl">
              <h2 className="font-serif text-4xl font-semibold">{t("partners.title")}</h2>
              <p className="mt-4 text-lg text-white/75">{t("partners.text")}</p>
              <div className="mt-8">
                <Button href="/contact">
                  {t("partners.cta")} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <JoinBanner title={th("title")} text={th("text")} cta={th("cta")} ctaContact={th("ctaContact")} />
    </>
  );
}
