import type { Metadata } from "next";
import { MIN_PASSWORD_LENGTH, requireUser, ROLE_LABELS } from "@/lib/auth";
import { ActionForm, PasswordInput } from "../../_components/forms";
import { Card, PageTitle } from "../../_components/ui";
import { changePassword } from "../../actions";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageTitle title="Mon compte" subtitle={`${user.name} · ${user.email} · ${ROLE_LABELS[user.role]}`} />
      <Card className="max-w-lg">
        <h2 className="mb-4 font-serif text-xl font-semibold text-purple">Changer de mot de passe</h2>
        <ActionForm action={changePassword} submitLabel="Modifier le mot de passe" resetOnSuccess>
          <PasswordInput name="current" label="Mot de passe actuel" autoComplete="current-password" />
          <PasswordInput name="password" label={`Nouveau mot de passe (${MIN_PASSWORD_LENGTH} caractères min.)`} autoComplete="new-password" />
          <PasswordInput name="confirm" label="Confirmer le nouveau mot de passe" autoComplete="new-password" />
        </ActionForm>
        <p className="mt-4 text-xs text-muted">Vos autres appareils connectés seront déconnectés.</p>
      </Card>
    </>
  );
}
