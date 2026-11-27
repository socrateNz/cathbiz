"use client";

import { useMemo, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ArrowRight, Briefcase, CalendarClock, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Localized = { fr: string; en?: string };
type Job = {
  id: string;
  slug: string;
  title: Localized;
  company: string;
  country: string;
  city: string;
  contract: string;
  summary: Localized;
  deadline: string | null;
};

const pick = (v: Localized, locale: string) => (locale === "en" && v.en?.trim()) || v.fr;

export default function JobsBrowser({ jobs }: { jobs: Job[] }) {
  const t = useTranslations("jobs");
  const locale = useLocale();
  const format = useFormatter();
  const [country, setCountry] = useState<string | null>(null);
  const [contract, setContract] = useState<string | null>(null);

  const countries = useMemo(() => [...new Set(jobs.map((j) => j.country))], [jobs]);
  const contracts = useMemo(() => [...new Set(jobs.map((j) => j.contract))], [jobs]);
  const visible = jobs.filter((j) => (!country || j.country === country) && (!contract || j.contract === contract));

  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition ${active ? "bg-purple text-white" : "bg-white text-purple ring-1 ring-purple/15 hover:bg-purple/5"}`;

  return (
    <div>
      {jobs.length > 1 && (
        <div className="mb-10 space-y-4 rounded-3xl bg-sand p-6">
          <FilterRow label={t("filters.country")}>
            <button type="button" className={chip(!country)} onClick={() => setCountry(null)}>
              {t("filters.all")}
            </button>
            {countries.map((c) => (
              <button key={c} type="button" className={chip(country === c)} onClick={() => setCountry(c)}>
                {t(`countries.${c}`)}
              </button>
            ))}
          </FilterRow>
          <FilterRow label={t("filters.contract")}>
            <button type="button" className={chip(!contract)} onClick={() => setContract(null)}>
              {t("filters.all")}
            </button>
            {contracts.map((c) => (
              <button key={c} type="button" className={chip(contract === c)} onClick={() => setContract(c)}>
                {t(`contracts.${c}`)}
              </button>
            ))}
          </FilterRow>
        </div>
      )}

      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-green">
        {t("count", { count: visible.length })}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-3xl bg-white p-10 text-center text-muted ring-1 ring-purple/5">{t("noMatch")}</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {visible.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.slug}`}
                className="group flex h-full flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ring-purple/5 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-semibold text-green">
                    {t(`contracts.${job.contract}`)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {[job.city, t(`countries.${job.country}`)].filter(Boolean).join(", ")}
                  </span>
                </div>
                <h2 className="mt-4 font-serif text-2xl font-semibold leading-snug text-purple group-hover:text-purple-soft">
                  {pick(job.title, locale)}
                </h2>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink/80">
                  <Briefcase className="h-4 w-4 text-gold" /> {job.company}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{pick(job.summary, locale)}</p>
                <div className="mt-auto flex items-center justify-between gap-4 pt-6">
                  {job.deadline ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <CalendarClock className="h-4 w-4 text-gold" />
                      {t("card.deadline", { date: format.dateTime(new Date(job.deadline), { dateStyle: "long" }) })}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-purple">
                    {t("card.view")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 w-20 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{label}</span>
      {children}
    </div>
  );
}
