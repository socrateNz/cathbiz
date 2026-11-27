import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { ExternalLink, Inbox, Trash2 } from "lucide-react";
import { countryScope, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { pick, type JobDoc } from "@/lib/jobs";
import { ActionForm } from "../../../_components/forms";
import JobFormFields from "../../../_components/JobFormFields";
import { btn, Card, PageTitle } from "../../../_components/ui";
import { deleteJob, saveJob } from "../../../actions";

export const metadata: Metadata = { title: "Modifier l'offre" };

export default async function EditJobPage({ params }: PageProps<"/admin/jobs/[id]">) {
  const user = await requireUser("jobs.manage");
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  const db = await getDb();
  const job = await db.collection<JobDoc>("jobs").findOne({ _id: new ObjectId(id), ...countryScope(user) });
  if (!job) notFound();
  const applications = await db.collection("applications").countDocuments({ jobId: job._id });

  return (
    <>
      <PageTitle
        title={pick(job.title, "fr")}
        subtitle={`${job.company} · ${applications} candidature${applications > 1 ? "s" : ""}`}
        actions={
          <>
            {applications > 0 && (
              <Link href={`/admin/applications?job=${id}`} className={btn.ghost}>
                <Inbox className="h-4 w-4" /> Candidatures
              </Link>
            )}
            {job.status !== "draft" && (
              <a href={`/fr/jobs/${job.slug}`} target="_blank" rel="noopener" className={btn.ghost}>
                <ExternalLink className="h-4 w-4" /> Voir sur le site
              </a>
            )}
          </>
        }
      />

      <ActionForm action={saveJob} submitLabel="Enregistrer les modifications" submitClass={btn.gold} className="space-y-6">
        <JobFormFields job={job} user={user} />
      </ActionForm>

      <Card className="mt-10 border border-red-100">
        <h2 className="font-serif text-xl font-semibold text-red-800">Supprimer l&apos;offre</h2>
        <p className="mt-1 text-sm text-muted">
          {applications > 0
            ? "Cette offre a reçu des candidatures : elle sera clôturée plutôt que supprimée, pour conserver les dossiers."
            : "L'offre sera définitivement supprimée."}
        </p>
        <form action={deleteJob} className="mt-4">
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={btn.danger}>
            <Trash2 className="h-4 w-4" /> {applications > 0 ? "Clôturer l'offre" : "Supprimer"}
          </button>
        </form>
      </Card>
    </>
  );
}
