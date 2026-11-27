import type { Metadata } from "next";
import Link from "next/link";
import { ObjectId } from "mongodb";
import { Download } from "lucide-react";
import { countryScope, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  COUNTRY_LABELS,
  pick,
  type ApplicationStatus,
  type JobCountry,
  type JobDoc,
} from "@/lib/jobs";
import { APP_STATUS_TONE as STATUS_TONE, Badge, btn, EmptyState, fmtDate, PageTitle, TabLink } from "../../_components/ui";

export const metadata: Metadata = { title: "Candidatures" };

type Row = {
  _id: ObjectId;
  name: string;
  email: string;
  jobTitle: string;
  company: string;
  country: JobCountry;
  status: ApplicationStatus;
  createdAt: Date;
};

export default async function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  const user = await requireUser("applications.view");
  const sp = await searchParams;
  const status = APPLICATION_STATUSES.includes(sp.status as ApplicationStatus) ? (sp.status as ApplicationStatus) : undefined;
  const jobId = typeof sp.job === "string" && /^[a-f0-9]{24}$/.test(sp.job) ? sp.job : undefined;

  const db = await getDb();
  const filter = {
    ...countryScope(user),
    ...(status ? { status } : {}),
    ...(jobId ? { jobId: new ObjectId(jobId) } : {}),
  };
  const [rows, job] = await Promise.all([
    db.collection<Row>("applications").find(filter).sort({ createdAt: -1 }).limit(500).toArray(),
    jobId ? db.collection<JobDoc>("jobs").findOne({ _id: new ObjectId(jobId) }) : null,
  ]);

  const qs = (s?: string) => {
    const p = new URLSearchParams();
    if (jobId) p.set("job", jobId);
    if (s) p.set("status", s);
    const str = p.toString();
    return str ? `?${str}` : "";
  };

  return (
    <>
      <PageTitle
        title="Candidatures"
        subtitle={job ? `Offre : ${pick(job.title, "fr")} (${job.company})` : "Toutes les candidatures reçues via le site."}
        actions={
          <a href={`/admin/applications/export${qs(status)}`} className={btn.ghost}>
            <Download className="h-4 w-4" /> Exporter (CSV)
          </a>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <TabLink href={`/admin/applications${qs()}`} active={!status}>
          Toutes
        </TabLink>
        {APPLICATION_STATUSES.map((s) => (
          <TabLink key={s} href={`/admin/applications${qs(s)}`} active={status === s}>
            {APPLICATION_STATUS_LABELS[s]}
          </TabLink>
        ))}
        {jobId && (
          <Link href={`/admin/applications${status ? `?status=${status}` : ""}`} className="ml-2 text-xs text-green hover:underline">
            Retirer le filtre d&apos;offre
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Aucune candidature" text="Les candidatures envoyées depuis le site apparaîtront ici." />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-purple/5">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-purple/10 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Candidat</th>
                <th className="px-5 py-3 font-semibold">Offre</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold">Reçue le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple/5">
              {rows.map((r) => (
                <tr key={r._id.toHexString()} className="hover:bg-sand/40">
                  <td className="px-5 py-4">
                    <Link href={`/admin/applications/${r._id.toHexString()}`} className="font-semibold text-ink hover:text-purple">
                      {r.name}
                    </Link>
                    <p className="text-xs text-muted">{r.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-ink">{r.jobTitle}</p>
                    <p className="text-xs text-muted">
                      {r.company} · {COUNTRY_LABELS[r.country] ?? r.country}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[r.status]}>{APPLICATION_STATUS_LABELS[r.status]}</Badge>
                  </td>
                  <td className="px-5 py-4 text-muted">{fmtDate(r.createdAt, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
