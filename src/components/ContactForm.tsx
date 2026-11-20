"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import { sendContact, type ContactState } from "@/app/actions/contact";

const initialState: ContactState = { status: "idle" };

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const locale = useLocale();
  const subjects = t.raw("subjects") as string[];
  const [picked, setSubject] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(sendContact, initialState);

  // Lien « Faire un don » (#don) : présélectionne l'objet « Don »
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const subject = picked ?? (hash === "#don" ? t("donSubject") : subjects[0]);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-sand p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-green" />
        <p className="mt-4 font-serif text-2xl font-semibold text-purple">{t("successTitle")}</p>
        <p className="mt-2 text-muted">{t("successText")}</p>
      </div>
    );
  }

  const field =
    "w-full rounded-xl border border-purple/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="locale" value={locale} />
      {/* Piège à robots, invisible pour les humains */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-purple">
          {t("name")}
          <input name="name" required maxLength={120} className={`${field} mt-1`} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium text-purple">
          {t("email")}
          <input name="email" type="email" required maxLength={200} className={`${field} mt-1`} autoComplete="email" />
        </label>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-purple">{t("subject")}</legend>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              aria-pressed={subject === s}
              className={`rounded-full px-4 py-2 text-sm transition ${
                subject === s ? "bg-purple text-white" : "bg-sand text-purple hover:bg-purple/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium text-purple">
        {t("message")}
        <textarea name="message" required rows={6} maxLength={5000} className={`${field} mt-1 resize-y`} />
      </label>

      {state.status === "error" && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error === "invalid" ? t("errorInvalid") : t("errorServer")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-semibold text-purple-deep transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? t("sending") : t("send")}
      </button>
      <p className="text-xs text-muted">{t("note")}</p>
    </form>
  );
}
