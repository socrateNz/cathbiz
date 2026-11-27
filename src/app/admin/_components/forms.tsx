"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { ActionResult } from "../actions";
import { btn, inputClass, labelClass } from "./ui";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

export function SubmitButton({ children, className = btn.primary }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function ResultMessage({ state }: { state: ActionResult }) {
  if (!state) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={`rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-green/10 text-green-deep" : "bg-red-50 text-red-800"}`}
    >
      {state.ok ? state.message : state.error}
    </p>
  );
}

/** Formulaire générique branché sur une action serveur avec retour d'état */
export function ActionForm({
  action,
  children,
  submitLabel,
  submitClass,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  submitLabel: string;
  submitClass?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      key={resetOnSuccess && state?.ok ? `ok-${state.message}` : undefined}
    >
      {children}
      <ResultMessage state={state} />
      <SubmitButton className={submitClass}>{submitLabel}</SubmitButton>
    </form>
  );
}

export function PasswordInput({ name, label, autoComplete }: { name: string; label: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className={labelClass}>
      {label}
      <span className="relative block">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          className={`${inputClass} pr-10`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 mt-0.5 -translate-y-1/2 p-1 text-muted"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
