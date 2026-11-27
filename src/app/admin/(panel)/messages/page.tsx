import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { Check, Mail, RotateCcw, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { Badge, btn, EmptyState, fmtDate, PageTitle, TabLink } from "../../_components/ui";
import { deleteMessage, setMessageStatus } from "../../actions";

export const metadata: Metadata = { title: "Messages" };

type Msg = {
  _id: ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  locale: string;
  status: "new" | "read" | "done";
  createdAt: Date;
};

const TABS = [
  { key: undefined, label: "Tous" },
  { key: "new", label: "Nouveaux" },
  { key: "done", label: "Traités" },
] as const;

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireUser("messages.view");
  const sp = await searchParams;
  const status = sp.status === "new" || sp.status === "done" ? sp.status : undefined;
  const db = await getDb();
  const messages = await db
    .collection<Msg>("messages")
    .find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  return (
    <>
      <PageTitle title="Messages" subtitle="Messages reçus via le formulaire de contact du site." />
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <TabLink key={t.label} href={t.key ? `/admin/messages?status=${t.key}` : "/admin/messages"} active={status === t.key}>
            {t.label}
          </TabLink>
        ))}
      </div>

      {messages.length === 0 ? (
        <EmptyState title="Aucun message" />
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => {
            const id = m._id.toHexString();
            const reply = `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Votre message"}`)}`;
            return (
              <li key={id} className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ${m.status === "new" ? "ring-gold/50" : "ring-purple/5"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {m.name} <span className="font-normal text-muted">· {m.email}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {fmtDate(m.createdAt, true)} · {m.locale.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.subject && <Badge tone="purple">{m.subject}</Badge>}
                    {m.status === "new" && <Badge tone="gold">Nouveau</Badge>}
                    {m.status === "done" && <Badge tone="green">Traité</Badge>}
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/85">{m.message}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={reply} className={`${btn.primary} py-2`}>
                    <Mail className="h-4 w-4" /> Répondre
                  </a>
                  <form action={setMessageStatus}>
                    <input type="hidden" name="id" value={id} />
                    <input type="hidden" name="status" value={m.status === "done" ? "new" : "done"} />
                    <button type="submit" className={`${btn.ghost} py-2`}>
                      {m.status === "done" ? (
                        <>
                          <RotateCcw className="h-4 w-4" /> Rouvrir
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" /> Marquer comme traité
                        </>
                      )}
                    </button>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={id} />
                    <button type="submit" className={`${btn.danger} py-2`} title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
