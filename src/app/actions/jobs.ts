"use server";

import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signPrivateUpload, verifyPrivateUpload } from "@/lib/cloudinary";
import { isExpired, pick, type JobDoc } from "@/lib/jobs";
import { detailsTable, emailLayout, escapeHtml, quoteBlock, safeMultiline, sendMail, teamCc, teamTo } from "@/lib/mail";
import { siteUrl } from "@/lib/seo";

/** Signature pour envoyer le CV directement à Cloudinary depuis le navigateur */
export async function getCvUploadParams() {
  if (!(await rateLimit(`cv-sign:${await clientIp()}`, 20, 3600))) {
    return { ok: false as const, error: "rate" as const };
  }
  try {
    return { ok: true as const, ...signPrivateUpload("cv") };
  } catch (err) {
    console.error("[jobs] signature Cloudinary impossible", err);
    return { ok: false as const, error: "server" as const };
  }
}

export type ApplyState = {
  status: "idle" | "success" | "error";
  error?: "invalid" | "cv" | "closed" | "duplicate" | "rate" | "server";
};

const schema = z.object({
  jobId: z.string().regex(/^[a-f0-9]{24}$/),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().min(6).max(40),
  location: z.string().trim().max(120).optional().default(""),
  coverLetter: z.string().trim().max(5000).optional().default(""),
  cvPublicId: z.string().min(5).max(300),
  cvName: z.string().max(200).optional().default(""),
  consent: z.literal("on"),
  locale: z.enum(["fr", "en"]).catch("fr"),
});

const confirmation = {
  fr: {
    subject: (job: string) => `Candidature reçue : ${job} – CBNA · RECA`,
    title: "Votre candidature a bien été reçue",
    body: (name: string, job: string, company: string) =>
      `Bonjour ${name},<br/><br/>Nous avons bien reçu votre candidature pour le poste <strong>${job}</strong> chez <strong>${company}</strong>. Elle sera étudiée avec attention et nous reviendrons vers vous si votre profil est retenu.`,
    outro: "Que le Sacré-Cœur de Jésus bénisse vos projets.<br/><br/>L'équipe CBNA · RECA<br/><em>Tous en mission</em>",
  },
  en: {
    subject: (job: string) => `Application received: ${job} – CBNA · RECA`,
    title: "Your application has been received",
    body: (name: string, job: string, company: string) =>
      `Hello ${name},<br/><br/>We have received your application for the position of <strong>${job}</strong> at <strong>${company}</strong>. It will be carefully reviewed and we will get back to you if your profile is shortlisted.`,
    outro: "May the Sacred Heart of Jesus bless your projects.<br/><br/>The CBNA · RECA team<br/><em>All on mission</em>",
  },
};

export async function applyToJob(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  if (String(formData.get("website") ?? "") !== "") return { status: "success" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", error: "invalid" };
  const data = parsed.data;

  try {
    if (!(await rateLimit(`apply:${await clientIp()}`, 8, 3600))) return { status: "error", error: "rate" };

    const db = await getDb();
    const jobId = new ObjectId(data.jobId);
    const job = await db.collection<JobDoc>("jobs").findOne({ _id: jobId, status: "published" });
    if (!job || isExpired({ deadline: job.deadline ? job.deadline.toISOString() : null })) {
      return { status: "error", error: "closed" };
    }

    const email = data.email.toLowerCase();
    if (await db.collection("applications").findOne({ jobId, email })) return { status: "error", error: "duplicate" };

    const cv = await verifyPrivateUpload("cv", data.cvPublicId, data.cvName);
    if (!cv) return { status: "error", error: "cv" };

    const jobTitle = pick(job.title, "fr");
    const now = new Date();
    const { insertedId } = await db.collection("applications").insertOne({
      jobId,
      jobTitle,
      company: job.company,
      country: job.country,
      name: data.name,
      email,
      phone: data.phone,
      location: data.location,
      coverLetter: data.coverLetter,
      cv,
      locale: data.locale,
      status: "received",
      notes: "",
      consentAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const safe = {
      name: escapeHtml(data.name),
      email: escapeHtml(email),
      phone: escapeHtml(data.phone),
      location: escapeHtml(data.location),
      letter: safeMultiline(data.coverLetter),
      job: escapeHtml(pick(job.title, data.locale)),
      jobFr: escapeHtml(jobTitle),
      company: escapeHtml(job.company),
    };
    const c = confirmation[data.locale];

    // Les e-mails ne bloquent pas la candidature, déjà enregistrée
    await Promise.allSettled([
      sendMail({
        to: teamTo(),
        cc: teamCc(),
        replyTo: { name: data.name, address: email },
        subject: `[Candidature] ${jobTitle} – ${data.name}`,
        html: emailLayout(
          "Nouvelle candidature",
          `${detailsTable([
            ["Offre", `<strong>${safe.jobFr}</strong> (${safe.company})`],
            ["Candidat", `<strong>${safe.name}</strong>`],
            ["E-mail", `<a href="mailto:${safe.email}">${safe.email}</a>`],
            ["Téléphone", safe.phone],
            ["Localisation", safe.location || "—"],
          ])}
          ${data.coverLetter ? `<div style="margin-top:20px">${quoteBlock(safe.letter)}</div>` : ""}
          <p style="margin-top:24px"><a href="${siteUrl}/admin/applications/${insertedId.toHexString()}" style="background:#c99a3e;color:#240b2e;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:13px">Voir la candidature et le CV</a></p>`
        ),
      }),
      sendMail({
        to: { name: data.name, address: email },
        replyTo: teamTo(),
        subject: c.subject(pick(job.title, data.locale)),
        html: emailLayout(
          c.title,
          `<p style="font-size:15px;line-height:1.6">${c.body(safe.name, safe.job, safe.company)}</p>
          <p style="margin-top:24px;font-size:15px;line-height:1.6">${c.outro}</p>`
        ),
      }),
    ]).then((results) =>
      results.forEach((r) => r.status === "rejected" && console.error("[jobs] e-mail non envoyé", r.reason))
    );

    return { status: "success" };
  } catch (err) {
    console.error("[jobs] candidature impossible", err);
    return { status: "error", error: "server" };
  }
}
