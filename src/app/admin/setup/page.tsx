import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { countUsers, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import AuthShell from "../_components/AuthShell";
import { ActionForm, PasswordInput } from "../_components/forms";
import { btn, inputClass, labelClass } from "../_components/ui";
import { setupFirstAdmin } from "../actions";

export const metadata: Metadata = { title: "Configuration" };

/** Création du premier compte, disponible uniquement quand aucun utilisateur n'existe */
export default async function SetupPage() {
  await connection();
  let users = 0;
  try {
    users = await countUsers();
  } catch {
    return (
      <AuthShell title="Configuration">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          Connexion à MongoDB impossible. Vérifiez <code>MONGODB_URI</code> dans le fichier <code>.env</code> et l&apos;accès réseau
          d&apos;Atlas.
        </p>
      </AuthShell>
    );
  }

  if (users > 0) {
    return (
      <AuthShell title="Déjà configuré" subtitle="Un compte administrateur existe déjà.">
        <Link href="/admin/login" className={`${btn.primary} w-full`}>
          Aller à la connexion
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Bienvenue" subtitle="Créez le premier compte super-administrateur">
      <ActionForm action={setupFirstAdmin} submitLabel="Créer le compte" submitClass={`${btn.primary} w-full`}>
        <label className={labelClass}>
          Nom complet
          <input name="name" required minLength={2} className={inputClass} />
        </label>
        <label className={labelClass}>
          E-mail
          <input name="email" type="email" required autoComplete="username" className={inputClass} />
        </label>
        <PasswordInput name="password" label={`Mot de passe (${MIN_PASSWORD_LENGTH} caractères minimum)`} autoComplete="new-password" />
        <PasswordInput name="confirm" label="Confirmer le mot de passe" autoComplete="new-password" />
      </ActionForm>
    </AuthShell>
  );
}
