"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { site } from "@/lib/site";

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const subjects = t.raw("subjects") as string[];
  const [subject, setSubject] = useState(subjects[0]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = `${data.get("message")}\n\n— ${data.get("name")} (${data.get("email")})`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
      `[CBNA] ${subject}`
    )}&body=${encodeURIComponent(body)}`;
  }

  const field =
    "w-full rounded-xl border border-purple/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-purple">
          {t("name")}
          <input name="name" required className={`${field} mt-1`} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium text-purple">
          {t("email")}
          <input name="email" type="email" required className={`${field} mt-1`} autoComplete="email" />
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
        <textarea name="message" required rows={6} className={`${field} mt-1 resize-y`} />
      </label>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 font-semibold text-purple-deep transition hover:bg-gold-light"
      >
        <Send className="h-4 w-4" /> {t("send")}
      </button>
      <p className="text-xs text-muted">{t("note")}</p>
    </form>
  );
}
