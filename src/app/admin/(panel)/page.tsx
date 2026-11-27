import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, Inbox, Mail, Sparkles } from "lucide-react";
import { can, countryScope, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/jobs";
import { Badge, btn, Card, fmtDate, Notice, PageTitle } from "../_components/ui";

export const metadata: Metadata = { title: "Tableau de bord" };

type AppRow = { _id: { toHexString(): string }; name: string; jobTitle: string; status: ApplicationStatus; createdAt: Date };
type MsgRow = { _id: { toHexString(): string }; name: string; subject: string; status: string; createdAt: Date };

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const db = await getDb();
  const scope = countryScope(user);
  const seeApps = can(user.role, "applications.view");
  const seeMsgs = can(user.role, "messages.view");

  const [publishedJobs, draftJobs, newApps, totalApps, newMsgs, recentApps, recentMsgs] = await Promise.all([
    db.collection("jobs").countDocuments({ status: "published", ...scope }),
    db.collection("jobs").countDocuments({ status: "draft", ...scope }),
    seeApps ? db.collection("applications").countDocuments({ status: "received", ...scope }) : 0,
    seeApps ? db.collection("applications").countDocuments(scope) : 0,
    seeMsgs ? db.collection("messages").countDocuments({ status: "new" }) : 0,
    seeApps
      ? db.collection<AppRow>("applications").find(scope).sort({ createdAt: -1 }).limit(6).toArray()
      : ([] as AppRow[]),
    seeMsgs ? db.collection<MsgRow>("messages").find().sort({ createdAt: -1 }).limit(5).toArray() : ([] as MsgRow[]),
  ]);

  const stats = [
    { label: "Offres publiées", value: publishedJobs, sub: `${draftJobs} brouillon(s)`, icon: Briefcase, href: "/admin/jobs", show: can(user.role, "jobs.manage") },
    { label: "Nouvelles candidatures", value: newApps, sub: `${totalApps} au total`, icon: Inbox, href: "/admin/applications?status=received", show: seeApps },
    { label: "Nouveaux messages", value: newMsgs, sub: "Formulaire de contact", icon: Mail, href: "/admin/messages", show: seeMsgs },
  ].filter((s) => s.show);

  return (
    <>
      {denied && <Notice tone="red">Vous n&apos;avez pas accès à cette section.</Notice>}
      <PageTitle
        title={`Bonjour ${user.name.split(" ")[0]}`}
        subtitle="Voici l'activité du site."
        actions={
          can(user.role, "jobs.manage") && (
            <Link href="/admin/jobs/new" className={btn.gold}>
              <Sparkles className="h-4 w-4" /> Publier une offre
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-purple/5 transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <s.icon className="h-6 w-6 text-gold" />
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-1" />
            </div>
            <p className="mt-4 font-serif text-4xl font-bold text-purple">{s.value}</p>
            <p className="text-sm font-medium text-ink">{s.label}</p>
            <p className="text-xs text-muted">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {seeApps && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-purple">Dernières candidatures</h2>
              <Link href="/admin/applications" className="text-xs font-semibold text-green hover:underline">
                Tout voir
              </Link>
            </div>
            {recentApps.length === 0 ? (
              <p className="text-sm text-muted">Aucune candidature pour le moment.</p>
            ) : (
              <ul className="divide-y divide-purple/5">
                {recentApps.map((a) => (
                  <li key={a._id.toHexString()}>
                    <Link href={`/admin/applications/${a._id.toHexString()}`} className="flex items-center justify-between gap-4 py-3 hover:opacity-80">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{a.name}</span>
                        <span className="block truncate text-xs text-muted">{a.jobTitle}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <Badge tone={a.status === "received" ? "gold" : "gray"}>{APPLICATION_STATUS_LABELS[a.status]}</Badge>
                        <span className="mt-1 block text-[11px] text-muted">{fmtDate(a.createdAt)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {seeMsgs && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-purple">Derniers messages</h2>
              <Link href="/admin/messages" className="text-xs font-semibold text-green hover:underline">
                Tout voir
              </Link>
            </div>
            {recentMsgs.length === 0 ? (
              <p className="text-sm text-muted">Aucun message pour le moment.</p>
            ) : (
              <ul className="divide-y divide-purple/5">
                {recentMsgs.map((m) => (
                  <li key={m._id.toHexString()} className="flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">{m.name}</span>
                      <span className="block truncate text-xs text-muted">{m.subject || "—"}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      {m.status === "new" && <Badge tone="gold">Nouveau</Badge>}
                      <span className="mt-1 block text-[11px] text-muted">{fmtDate(m.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
