import type { Metadata } from "next";
import { MIN_PASSWORD_LENGTH, requireUser, ROLE_LABELS, ROLES, type UserDoc } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { COUNTRY_LABELS, JOB_COUNTRIES, type JobCountry } from "@/lib/jobs";
import { ActionForm } from "../../_components/forms";
import { Badge, btn, Card, fmtDate, inputClass, labelClass, PageTitle } from "../../_components/ui";
import { createUser, resetUserPassword, updateUser } from "../../actions";

export const metadata: Metadata = { title: "Utilisateurs" };

const ROLE_HELP: Record<string, string> = {
  superadmin: "Tout, y compris la gestion des comptes.",
  admin: "Offres, candidatures et messages.",
  editor: "Publication des offres uniquement (pas d'accès aux candidatures).",
  section: "Offres et candidatures de son pays uniquement.",
};

export default async function UsersPage() {
  const me = await requireUser("users.manage");
  const db = await getDb();
  const users = await db
    .collection<UserDoc>("users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray();

  return (
    <>
      <PageTitle title="Utilisateurs" subtitle="Comptes ayant accès au back-office." />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {users.map((u) => {
            const id = u._id.toHexString();
            const self = id === me.id;
            return (
              <Card key={id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">
                      {u.name} {self && <span className="text-xs font-normal text-muted">(vous)</span>}
                    </p>
                    <p className="text-sm text-muted">{u.email}</p>
                    <p className="mt-1 text-xs text-muted">Dernière connexion : {fmtDate(u.lastLoginAt, true)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone="purple">
                      {ROLE_LABELS[u.role]}
                      {u.role === "section" && u.country ? ` · ${COUNTRY_LABELS[u.country as JobCountry]}` : ""}
                    </Badge>
                    {!u.active && <Badge tone="red">Désactivé</Badge>}
                  </div>
                </div>

                {!self && (
                  <div className="mt-5 grid gap-4 border-t border-purple/5 pt-5 lg:grid-cols-2">
                    <form action={updateUser} className="space-y-3">
                      <input type="hidden" name="id" value={id} />
                      <div className="grid grid-cols-2 gap-3">
                        <label className={labelClass}>
                          Rôle
                          <select name="role" defaultValue={u.role} className={inputClass}>
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={labelClass}>
                          Pays (section)
                          <select name="country" defaultValue={u.country ?? ""} className={inputClass}>
                            <option value="">—</option>
                            {JOB_COUNTRIES.map((c) => (
                              <option key={c} value={c}>
                                {COUNTRY_LABELS[c]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-ink">
                        <input type="checkbox" name="active" defaultChecked={u.active} className="h-4 w-4 accent-purple" />
                        Compte actif
                      </label>
                      <button type="submit" className={`${btn.ghost} py-2`}>
                        Mettre à jour
                      </button>
                    </form>

                    <ActionForm action={resetUserPassword} submitLabel="Réinitialiser" submitClass={`${btn.ghost} py-2`} className="space-y-3">
                      <input type="hidden" name="id" value={id} />
                      <label className={labelClass}>
                        Nouveau mot de passe provisoire
                        <input name="password" type="text" minLength={MIN_PASSWORD_LENGTH} required autoComplete="off" className={inputClass} />
                      </label>
                    </ActionForm>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 font-serif text-xl font-semibold text-purple">Nouveau compte</h2>
            <ActionForm action={createUser} submitLabel="Créer le compte" resetOnSuccess>
              <label className={labelClass}>
                Nom complet
                <input name="name" required minLength={2} className={inputClass} />
              </label>
              <label className={labelClass}>
                E-mail
                <input name="email" type="email" required className={inputClass} />
              </label>
              <label className={labelClass}>
                Rôle
                <select name="role" defaultValue="editor" className={inputClass}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Pays (uniquement pour un responsable de section)
                <select name="country" defaultValue="" className={inputClass}>
                  <option value="">—</option>
                  {JOB_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {COUNTRY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Mot de passe provisoire ({MIN_PASSWORD_LENGTH} caractères min.)
                <input name="password" type="text" required minLength={MIN_PASSWORD_LENGTH} autoComplete="off" className={inputClass} />
              </label>
            </ActionForm>
          </Card>

          <Card>
            <h2 className="mb-3 font-serif text-lg font-semibold text-purple">Les rôles</h2>
            <dl className="space-y-3 text-sm">
              {ROLES.map((r) => (
                <div key={r}>
                  <dt className="font-semibold text-ink">{ROLE_LABELS[r]}</dt>
                  <dd className="text-muted">{ROLE_HELP[r]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
