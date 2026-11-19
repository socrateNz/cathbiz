import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileCheck2, Info, Mail } from "lucide-react";
import Reveal from "@/components/Reveal";
import { Button, PageHero, SectionTitle } from "@/components/ui";
import { site } from "@/lib/site";

type Category = { name: string; text: string };
type Step = { title: string; text: string };

export async function generateMetadata({ params }: PageProps<"/[locale]/membership">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "membership.hero" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function MembershipPage({ params }: PageProps<"/[locale]/membership">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("membership");

  const categories = t.raw("categories.items") as Category[];
  const steps = t.raw("steps.items") as Step[];
  const docs = t.raw("docs.items") as string[];
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(`[CBNA] ${t("hero.title")}`)}`;

  return (
    <>
      <PageHero title={t("hero.title")} subtitle={t("hero.subtitle")} />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <p className="mx-auto max-w-3xl text-center font-serif text-2xl leading-relaxed text-purple md:text-3xl">
            {t("intro")}
          </p>
        </Reveal>

        <div className="mt-20">
          <SectionTitle eyebrow={t("categories.eyebrow")} title={t("categories.title")} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.name} delay={i * 0.06}>
                <div className="h-full rounded-3xl bg-white p-7 shadow-sm ring-1 ring-purple/5">
                  <span className="inline-block h-3 w-3 rotate-45 bg-gold" aria-hidden />
                  <h3 className="mt-4 font-serif text-2xl font-semibold text-purple">{c.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-purple-deep text-white">
        <div className="bg-diamonds absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <SectionTitle eyebrow={t("steps.eyebrow")} title={t("steps.title")} light />
          <ol className="grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <li className="h-full rounded-3xl border border-white/10 bg-white/5 p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold font-serif text-2xl font-bold text-purple-deep">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 font-serif text-2xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-24 md:grid-cols-[1.3fr_1fr]">
        <Reveal>
          <h2 className="font-serif text-4xl font-semibold text-purple">{t("docs.title")}</h2>
          <ul className="mt-8 space-y-4">
            {docs.map((d) => (
              <li key={d} className="flex gap-3 text-ink">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-green" /> {d}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="rounded-3xl bg-sand p-8">
            <Info className="h-8 w-8 text-gold" />
            <p className="mt-4 leading-relaxed text-ink/85">{t("note")}</p>
            <div className="mt-8">
              <Button href={mailto} variant="purple">
                <Mail className="h-4 w-4" /> {t("cta")}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted">{site.email}</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
