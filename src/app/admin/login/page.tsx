import type { Metadata } from "next";
import AuthShell from "../_components/AuthShell";
import { ActionForm, PasswordInput } from "../_components/forms";
import { btn, inputClass, labelClass } from "../_components/ui";
import { login } from "../actions";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <AuthShell title="Back-office" subtitle="CBNA · RECA">
      <ActionForm action={login} submitLabel="Se connecter" submitClass={`${btn.primary} w-full`}>
        <label className={labelClass}>
          E-mail
          <input name="email" type="email" required autoComplete="username" className={inputClass} />
        </label>
        <PasswordInput name="password" label="Mot de passe" autoComplete="current-password" />
      </ActionForm>
    </AuthShell>
  );
}
