import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { ArrowLeft, Download, FileText, Mail, MapPin, Phone, Trash2 } from "lucide-react";
import { can, countryScope, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { StoredFile } from "@/lib/cloudinary";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/jobs";
import { ActionForm } from "../../../_components/forms";
import { APP_STATUS_TONE, Badge, btn, Card, fmtDate, inputClass, labelClass, PageTitle } from "../../../_components/ui";
import { deleteApplication, updateApplication } from "../../../actions";

export const metadata: Metadata = { title: "Candidature" };

type ApplicationDoc = {
  _id: ObjectId;
  jobId: ObjectId;
  jobTitle: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  coverLetter: string;
  cv: StoredFile;
  locale: string;
  status: ApplicationStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

export default async function ApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
  const user = await requireUser("applications.view");
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  const db = await getDb();
  const app = await db.collection<ApplicationDoc>("applications").findOne({ _id: new ObjectId(id), ...countryScope(user) });
  if (!app) notFound();
  const canManage = can(user.role, "applications.manage");
  const kb = Math.max(1, Math.round(app.cv.bytes / 1024));

  return (
    <>
      <Link href="/admin/applications" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-purple">
        <ArrowLeft className="h-4 w-4" /> Toutes les candidatures
      </Link>
      <PageTitle
        title={app.name}
        subtitle={`Candidature reçue le ${fmtDate(app.createdAt, true)}`}
        actions={<Badge tone={APP_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABELS[app.status]}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green">Offre</p>
            <Link href={`/admin/jobs/${app.jobId.toHexString()}`} className="mt-1 block font-serif text-2xl font-semibold text-purple hover:underline">
              {app.jobTitle}
            </Link>
            <p className="text-sm text-muted">{app.company}</p>

            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                <a href={`mailto:${app.email}`} className="text-ink hover:underline">
                  {app.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gold" />
                <a href={`tel:${app.phone.replace(/\s/g, "")}`} className="text-ink hover:underline">
                  {app.phone}
                </a>
              </li>
              {app.location && (
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gold" /> {app.location}
                </li>
              )}
              <li className="text-muted">Langue du candidat : {app.locale.toUpperCase()}</li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-serif text-xl font-semibold text-purple">CV</h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-sand/60 p-4">
              <span className="flex min-w-0 items-center gap-3">
                <FileText className="h-8 w-8 shrink-0 text-purple" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{app.cv.originalName}</span>
                  <span className="text-xs text-muted">
                    {app.cv.ext.toUpperCase()} · {kb} Ko
                  </span>
                </span>
              </span>
              <div className="flex gap-2">
                <a href={`/admin/applications/${id}/cv`} target="_blank" rel="noopener" className={btn.ghost}>
                  Ouvrir
                </a>
                <a href={`/admin/applications/${id}/cv?download=1`} className={btn.primary}>
                  <Download className="h-4 w-4" /> Télécharger
                </a>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-serif text-xl font-semibold text-purple">Lettre de motivation</h2>
            {app.coverLetter ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/85">{app.coverLetter}</p>
            ) : (
              <p className="mt-4 text-sm text-muted">Aucune lettre jointe.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {canManage && (
            <Card>
              <h2 className="mb-4 font-serif text-xl font-semibold text-purple">Suivi</h2>
              <ActionForm action={updateApplication} submitLabel="Enregistrer">
                <input type="hidden" name="id" value={id} />
                <label className={labelClass}>
                  Statut
                  <select name="status" defaultValue={app.status} className={inputClass}>
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {APPLICATION_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelClass}>
                  Notes internes
                  <textarea name="notes" rows={6} defaultValue={app.notes} className={inputClass} placeholder="Visibles uniquement dans le back-office" />
                </label>
              </ActionForm>
              <p className="mt-3 text-xs text-muted">Dernière mise à jour : {fmtDate(app.updatedAt, true)}</p>
            </Card>
          )}

          {canManage && (
            <Card className="border border-red-100">
              <h2 className="font-serif text-lg font-semibold text-red-800">Supprimer la candidature</h2>
              <p className="mt-1 text-xs text-muted">Supprime aussi le CV. À utiliser sur demande du candidat (droit à l&apos;effacement).</p>
              <form action={deleteApplication} className="mt-3">
                <input type="hidden" name="id" value={id} />
                <button type="submit" className={btn.danger}>
                  <Trash2 className="h-4 w-4" /> Supprimer définitivement
                </button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
