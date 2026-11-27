"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, FileText, Loader2, Send, TriangleAlert, Upload } from "lucide-react";
import { applyToJob, getCvUploadParams, type ApplyState } from "@/app/actions/jobs";

const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSIONS = ["pdf", "doc", "docx"];

type ClientError = "cvMissing" | "cvType" | "cvSize";
type FormState = ApplyState & { clientError?: ClientError };

export default function ApplyForm({ jobId }: { jobId: string }) {
  const t = useTranslations("jobs.apply");
  const locale = useLocale();
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"idle" | "uploading" | "sending">("idle");

  async function submit(prev: FormState, formData: FormData): Promise<FormState> {
    const file = formData.get("cv");
    formData.delete("cv"); // le fichier ne transite jamais par le serveur du site
    if (!(file instanceof File) || file.size === 0) return { status: "error", clientError: "cvMissing" };
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!EXTENSIONS.includes(ext)) return { status: "error", clientError: "cvType" };
    if (file.size > MAX_BYTES) return { status: "error", clientError: "cvSize" };

    try {
      // 1. Envoi direct du CV à Cloudinary (signature fournie par le serveur)
      setStep("uploading");
      const sign = await getCvUploadParams();
      if (!sign.ok) return { status: "error", error: sign.error };
      const upload = new FormData();
      Object.entries(sign.fields).forEach(([k, v]) => upload.append(k, String(v)));
      upload.append("file", file);
      const res = await fetch(sign.url, { method: "POST", body: upload });
      if (!res.ok) return { status: "error", error: "cv" };
      const { public_id } = (await res.json()) as { public_id: string };

      // 2. Envoi de la candidature avec la référence du CV
      setStep("sending");
      formData.set("cvPublicId", public_id);
      formData.set("cvName", file.name);
      return await applyToJob(prev, formData);
    } catch {
      return { status: "error", error: "server" };
    } finally {
      setStep("idle");
    }
  }

  const [state, formAction, pending] = useActionState(submit, { status: "idle" } as FormState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-sand p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green" />
        <p className="mt-4 font-serif text-2xl font-semibold text-purple">{t("successTitle")}</p>
        <p className="mt-2 text-sm text-muted">{t("successText")}</p>
      </div>
    );
  }

  const field =
    "mt-1 w-full rounded-xl border border-purple/15 bg-white px-4 py-3 text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";
  const errorKey = state.clientError ?? state.error;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <label className="block text-sm font-medium text-purple">
        {t("name")} *
        <input name="name" required minLength={2} maxLength={120} autoComplete="name" className={field} />
      </label>
      <label className="block text-sm font-medium text-purple">
        {t("email")} *
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
      </label>
      <label className="block text-sm font-medium text-purple">
        {t("phone")} *
        <input name="phone" type="tel" required minLength={6} maxLength={40} autoComplete="tel" className={field} />
      </label>
      <label className="block text-sm font-medium text-purple">
        {t("location")}
        <input name="location" maxLength={120} className={field} />
      </label>

      <div>
        <span className="block text-sm font-medium text-purple">{t("cv")} *</span>
        <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-purple/30 bg-sand/60 px-4 py-4 transition hover:border-gold">
          {fileName ? <FileText className="h-5 w-5 text-green" /> : <Upload className="h-5 w-5 text-gold" />}
          <span className="min-w-0 flex-1 truncate text-sm text-ink">{fileName || t("cvChoose")}</span>
          <input
            name="cv"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </label>
        <p className="mt-1 text-xs text-muted">{t("cvHint")}</p>
      </div>

      <label className="block text-sm font-medium text-purple">
        {t("coverLetter")}
        <textarea name="coverLetter" rows={5} maxLength={5000} className={`${field} resize-y`} />
        <span className="mt-1 block text-xs font-normal text-muted">{t("coverLetterHint")}</span>
      </label>

      <label className="flex items-start gap-3 text-xs leading-relaxed text-muted">
        <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 accent-purple" />
        {t("consent")}
      </label>

      {state.status === "error" && errorKey && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {t(`errors.${errorKey}`)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-purple-deep transition hover:bg-gold-light disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {step === "uploading" ? t("uploading") : step === "sending" ? t("sending") : t("send")}
      </button>
    </form>
  );
}
