import type { SessionUser } from "@/lib/auth";
import {
  CONTRACT_LABELS,
  CONTRACT_TYPES,
  COUNTRY_LABELS,
  JOB_COUNTRIES,
  JOB_STATUS_LABELS,
  JOB_STATUSES,
  type JobDoc,
} from "@/lib/jobs";
import { Card, inputClass, labelClass } from "./ui";

/** Champs du formulaire d'offre (création et modification) */
export default function JobFormFields({ job, user }: { job?: JobDoc; user: SessionUser }) {
  const lockedCountry = user.role === "section" ? user.country : undefined;
  const deadline = job?.deadline ? job.deadline.toISOString().slice(0, 10) : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {job && <input type="hidden" name="id" value={job._id.toHexString()} />}

        <Card className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-purple">Le poste (français)</h2>
          <label className={labelClass}>
            Intitulé du poste *
            <input name="title_fr" required minLength={3} maxLength={160} defaultValue={job?.title.fr} className={inputClass} />
          </label>
          <label className={labelClass}>
            Présentation du poste *
            <textarea name="summary_fr" required minLength={10} rows={4} defaultValue={job?.summary.fr} className={inputClass} />
          </label>
          <Hint>Dans les champs ci-dessous, mettez un élément par ligne : chaque ligne devient un point de liste sur le site.</Hint>
          <label className={labelClass}>
            Missions
            <textarea name="missions_fr" rows={6} defaultValue={job?.missions.fr} className={inputClass} />
          </label>
          <label className={labelClass}>
            Profil recherché
            <textarea name="profile_fr" rows={6} defaultValue={job?.profile.fr} className={inputClass} />
          </label>
          <label className={labelClass}>
            Ce que l&apos;entreprise offre
            <textarea name="benefits_fr" rows={4} defaultValue={job?.benefits.fr} className={inputClass} />
          </label>
        </Card>

        <Card>
          <details open={Boolean(job?.title.en)}>
            <summary className="cursor-pointer font-serif text-xl font-semibold text-purple">
              Version anglaise <span className="font-sans text-sm font-normal text-muted">(facultatif, sinon le français s&apos;affiche)</span>
            </summary>
            <div className="mt-4 space-y-4">
              <label className={labelClass}>
                Job title
                <input name="title_en" maxLength={160} defaultValue={job?.title.en} className={inputClass} />
              </label>
              <label className={labelClass}>
                Summary
                <textarea name="summary_en" rows={4} defaultValue={job?.summary.en} className={inputClass} />
              </label>
              <label className={labelClass}>
                Responsibilities
                <textarea name="missions_en" rows={5} defaultValue={job?.missions.en} className={inputClass} />
              </label>
              <label className={labelClass}>
                Profile
                <textarea name="profile_en" rows={5} defaultValue={job?.profile.en} className={inputClass} />
              </label>
              <label className={labelClass}>
                What we offer
                <textarea name="benefits_en" rows={3} defaultValue={job?.benefits.en} className={inputClass} />
              </label>
            </div>
          </details>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-purple">Publication</h2>
          <label className={labelClass}>
            Statut
            <select name="status" defaultValue={job?.status ?? "published"} className={inputClass}>
              {JOB_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {JOB_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Date limite de candidature
            <input name="deadline" type="date" defaultValue={deadline} className={inputClass} />
          </label>
          <Hint>Après cette date, l&apos;offre disparaît de la liste et n&apos;accepte plus de candidatures.</Hint>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-purple">Entreprise et lieu</h2>
          <label className={labelClass}>
            Entreprise *
            <input name="company" required minLength={2} maxLength={160} defaultValue={job?.company} className={inputClass} />
          </label>
          <label className={labelClass}>
            Pays *
            {lockedCountry ? (
              <>
                <input type="hidden" name="country" value={lockedCountry} />
                <input disabled value={COUNTRY_LABELS[lockedCountry as keyof typeof COUNTRY_LABELS]} className={inputClass} />
              </>
            ) : (
              <select name="country" required defaultValue={job?.country ?? "CM"} className={inputClass}>
                {JOB_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {COUNTRY_LABELS[c]}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className={labelClass}>
            Ville
            <input name="city" maxLength={120} defaultValue={job?.city} className={inputClass} />
          </label>
          <label className={labelClass}>
            Type de contrat *
            <select name="contract" required defaultValue={job?.contract ?? "cdi"} className={inputClass}>
              {CONTRACT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {CONTRACT_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </Card>
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>;
}
