import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Briefcase, CalendarClock, CheckCircle2, FileSignature, Lock, MapPin } from "lucide-react";
import ApplyForm from "@/components/jobs/ApplyForm";
import { Link } from "@/i18n/navigation";
import { getPublishedJob, isExpired, pick, toLines, type PublicJob } from "@/lib/jobs";
import { pageMetadata, siteUrl } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/jobs/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const job = await getPublishedJob(slug);
  if (!job) {
    const t = await getTranslations({ locale, namespace: "jobs.detail" });
    return { title: t("notFound"), robots: { index: false } };
  }
  const summary = pick(job.summary, locale);
  return pageMetadata({
    locale,
    path: `/jobs/${slug}`,
    title: `${pick(job.title, locale)} – ${job.company}`,
    description: summary.length > 160 ? `${summary.slice(0, 157)}…` : summary,
  });
}

export default function JobPage({ params }: PageProps<"/[locale]/jobs/[slug]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <JobDetail params={params} />
    </Suspense>
  );
}

async function JobDetail({ params }: { params: PageProps<"/[locale]/jobs/[slug]">["params"] }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const job = await getPublishedJob(slug);
  if (!job) notFound();

  const t = await getTranslations({ locale, namespace: "jobs" });
  const format = await getFormatter({ locale });
  const closed = isExpired(job);
  const sections = [
    { key: "missions", text: pick(job.missions, locale) },
    { key: "profile", text: pick(job.profile, locale) },
    { key: "benefits", text: pick(job.benefits, locale) },
  ].filter((s) => s.text.trim());
  const place = [job.city, t(`countries.${job.country}`)].filter(Boolean).join(", ");

  return (
    <>
      <JobPostingJsonLd job={job} locale={locale} />

      <section className="relative overflow-hidden bg-purple-deep text-white">
        <div className="bg-diamonds absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-gold-light">
            <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
          </Link>
          <h1 className="mt-6 max-w-4xl font-serif text-4xl font-semibold leading-tight md:text-5xl">
            {pick(job.title, locale)}
          </h1>
          <ul className="mt-6 flex flex-wrap gap-3 text-sm">
            <Meta icon={<Briefcase className="h-4 w-4" />}>{job.company}</Meta>
            <Meta icon={<MapPin className="h-4 w-4" />}>{place}</Meta>
            <Meta icon={<FileSignature className="h-4 w-4" />}>{t(`contracts.${job.contract}`)}</Meta>
            {job.deadline && (
              <Meta icon={<CalendarClock className="h-4 w-4" />}>
                {t("card.deadline", { date: format.dateTime(new Date(job.deadline), { dateStyle: "long" }) })}
              </Meta>
            )}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1fr_400px]">
        <article>
          <h2 className="font-serif text-3xl font-semibold text-purple">{t("detail.summary")}</h2>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink/85">{pick(job.summary, locale)}</p>

          {sections.map((s) => (
            <div key={s.key} className="mt-12">
              <h2 className="font-serif text-3xl font-semibold text-purple">{t(`detail.${s.key}`)}</h2>
              <ul className="mt-5 space-y-3">
                {toLines(s.text).map((line, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed text-ink/85">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-gold" /> {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {job.publishedAt && (
            <p className="mt-12 text-sm text-muted">
              {t("detail.published", { date: format.dateTime(new Date(job.publishedAt), { dateStyle: "long" }) })}
            </p>
          )}
        </article>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div id="postuler" className="scroll-mt-32 rounded-[2rem] bg-white p-7 shadow-sm ring-1 ring-purple/5 md:p-8">
            {closed ? (
              <div className="text-center">
                <Lock className="mx-auto h-10 w-10 text-gold" />
                <p className="mt-4 font-serif text-2xl font-semibold text-purple">{t("detail.closedTitle")}</p>
                <p className="mt-2 text-sm text-muted">{t("detail.closedText")}</p>
                <Link
                  href="/jobs"
                  className="mt-6 inline-flex rounded-full bg-purple px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white"
                >
                  {t("detail.back")}
                </Link>
              </div>
            ) : (
              <>
                <h2 className="mb-6 font-serif text-3xl font-semibold text-purple">{t("apply.title")}</h2>
                <ApplyForm jobId={job.id} />
              </>
            )}
          </div>
        </aside>
      </section>
    </>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-white/85">
      <span className="text-gold-light">{icon}</span>
      {children}
    </li>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 bg-purple-deep" />
      <div className="mx-auto max-w-7xl space-y-4 px-6 py-16">
        <div className="h-8 w-1/3 rounded bg-sand" />
        <div className="h-4 w-2/3 rounded bg-sand" />
        <div className="h-4 w-1/2 rounded bg-sand" />
      </div>
    </div>
  );
}

const EMPLOYMENT_TYPES: Record<string, string> = {
  cdi: "FULL_TIME",
  cdd: "TEMPORARY",
  internship: "INTERN",
  freelance: "CONTRACTOR",
  volunteer: "VOLUNTEER",
  apprenticeship: "OTHER",
};

/** Données structurées Google Jobs */
function JobPostingJsonLd({ job, locale }: { job: PublicJob; locale: string }) {
  const description = [job.summary, job.missions, job.profile, job.benefits]
    .map((v) => pick(v, locale))
    .filter(Boolean)
    .map((txt) => `<p>${txt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`)
    .join("");
  const remote = job.country === "REMOTE";
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: pick(job.title, locale),
    description,
    datePosted: job.publishedAt ?? undefined,
    validThrough: job.deadline ?? undefined,
    employmentType: EMPLOYMENT_TYPES[job.contract] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: job.company },
    url: `${siteUrl}/${locale}/jobs/${job.slug}`,
    directApply: true,
  };
  if (remote) {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = { "@type": "Country", name: "Africa" };
  } else {
    data.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city || undefined,
        addressCountry: job.country === "OTHER" ? undefined : job.country,
      },
    };
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
