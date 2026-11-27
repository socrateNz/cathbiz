import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { countryScope, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  CONTRACT_LABELS,
  COUNTRY_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUSES,
  pick,
  type JobDoc,
  type JobStatus,
} from "@/lib/jobs";
import { Badge, btn, EmptyState, fmtDate, Notice, PageTitle, TabLink, type Tone } from "../../_components/ui";
import { setJobStatus } from "../../actions";

export const metadata: Metadata = { title: "Offres d'emploi" };

const STATUS_TONE: Record<JobStatus, Tone> = { draft: "gray", published: "green", closed: "red" };

export default async function AdminJobsPage({ searchParams }: PageProps<"/admin/jobs">) {
  const user = await requireUser("jobs.manage");
  const sp = await searchParams;
  const status = JOB_STATUSES.includes(sp.status as JobStatus) ? (sp.status as JobStatus) : undefined;
  const db = await getDb();
  const filter = { ...countryScope(user), ...(status ? { status } : {}) };

  const [jobs, counts] = await Promise.all([
    db.collection<JobDoc>("jobs").find(filter).sort({ updatedAt: -1 }).limit(300).toArray(),
    db
      .collection("applications")
      .aggregate<{ _id: unknown; n: number }>([{ $match: countryScope(user) }, { $group: { _id: "$jobId", n: { $sum: 1 } } }])
      .toArray(),
  ]);
  const appCount = new Map(counts.map((c) => [String(c._id), c.n]));

  return (
    <>
      {sp.saved && <Notice>Offre enregistrée.</Notice>}
      <PageTitle
        title="Offres d'emploi"
        subtitle="Créez, publiez et clôturez les offres affichées sur le site."
        actions={
          <Link href="/admin/jobs/new" className={btn.gold}>
            <Plus className="h-4 w-4" /> Nouvelle offre
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <TabLink href="/admin/jobs" active={!status}>
          Toutes
        </TabLink>
        {JOB_STATUSES.map((s) => (
          <TabLink key={s} href={`/admin/jobs?status=${s}`} active={status === s}>
            {JOB_STATUS_LABELS[s]}
          </TabLink>
        ))}
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre"
          text="Publiez votre première offre d'emploi : elle apparaîtra aussitôt sur le site."
          action={
            <Link href="/admin/jobs/new" className={btn.primary}>
              <Plus className="h-4 w-4" /> Nouvelle offre
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-purple/5">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-purple/10 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Offre</th>
                <th className="px-5 py-3 font-semibold">Lieu</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold">Candidatures</th>
                <th className="px-5 py-3 font-semibold">Date limite</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-purple/5">
              {jobs.map((job) => {
                const id = job._id.toHexString();
                const n = appCount.get(id) ?? 0;
                return (
                  <tr key={id} className="align-top">
                    <td className="px-5 py-4">
                      <Link href={`/admin/jobs/${id}`} className="font-semibold text-ink hover:text-purple">
                        {pick(job.title, "fr")}
                      </Link>
                      <p className="text-xs text-muted">
                        {job.company} · {CONTRACT_LABELS[job.contract]}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {[job.city, COUNTRY_LABELS[job.country]].filter(Boolean).join(", ")}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={STATUS_TONE[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {n > 0 ? (
                        <Link href={`/admin/applications?job=${id}`} className="font-semibold text-green hover:underline">
                          {n} candidature{n > 1 ? "s" : ""}
                        </Link>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted">{fmtDate(job.deadline)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {job.status !== "published" ? (
                          <QuickStatus id={id} status="published" label="Publier" />
                        ) : (
                          <QuickStatus id={id} status="closed" label="Clôturer" />
                        )}
                        <Link href={`/admin/jobs/${id}`} className={`${btn.ghost} px-2.5 py-1.5`} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        {job.status !== "draft" && (
                          <a href={`/fr/jobs/${job.slug}`} target="_blank" rel="noopener" className={`${btn.ghost} px-2.5 py-1.5`} title="Voir sur le site">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function QuickStatus({ id, status, label }: { id: string; status: JobStatus; label: string }) {
  return (
    <form action={setJobStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={`${btn.ghost} px-3 py-1.5 text-xs`}>
        {label}
      </button>
    </form>
  );
}
