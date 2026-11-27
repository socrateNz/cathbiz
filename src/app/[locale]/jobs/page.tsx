import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase } from "lucide-react";
import JobsBrowser from "@/components/jobs/JobsBrowser";
import { Button, PageHero } from "@/components/ui";
import { getPublishedJobs } from "@/lib/jobs";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/jobs">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "jobs.hero" });
  const tm = await getTranslations({ locale, namespace: "meta.pages" });
  return pageMetadata({ locale, path: "/jobs", title: t("title"), description: tm("jobs") });
}

export default async function JobsPage({ params }: PageProps<"/[locale]/jobs">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("jobs");
  const jobs = await getPublishedJobs();

  return (
    <>
      <PageHero title={t("hero.title")} subtitle={t("hero.subtitle")} />
      <section className="mx-auto max-w-7xl px-6 py-20">
        {jobs.length === 0 ? (
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-[2rem] bg-white p-12 text-center shadow-sm ring-1 ring-purple/5">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand">
              <Briefcase className="h-8 w-8 text-gold" />
            </span>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-purple">{t("empty.title")}</h2>
            <p className="mt-3 text-muted">{t("empty.text")}</p>
            <div className="mt-8">
              <Button href="/contact" variant="purple">
                {t("empty.cta")}
              </Button>
            </div>
          </div>
        ) : (
          <JobsBrowser jobs={jobs} />
        )}
      </section>
    </>
  );
}
