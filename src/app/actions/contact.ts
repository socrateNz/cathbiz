"use server";

import { getDb, isDbConfigured } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  detailsTable,
  emailLayout,
  escapeHtml,
  quoteBlock,
  safeMultiline,
  sendMail,
  teamCc,
  teamTo,
} from "@/lib/mail";

export type ContactState = {
  status: "idle" | "success" | "error";
  error?: "invalid" | "server" | "rate";
};

const MAX = { name: 120, email: 200, subject: 80, message: 5000 };

function field(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

const confirmation = {
  fr: {
    subject: "Nous avons bien reçu votre message – CBNA · RECA",
    title: "Merci pour votre message",
    intro: (name: string) =>
      `Bonjour ${name},<br/><br/>Nous avons bien reçu votre message et nous vous répondrons dans les meilleurs délais.`,
    recap: "Rappel de votre message",
    subjectLabel: "Objet",
    outro: "Que le Sacré-Cœur de Jésus bénisse vos entreprises.<br/><br/>L'équipe CBNA · RECA<br/><em>Tous en mission</em>",
  },
  en: {
    subject: "We have received your message – CBNA · RECA",
    title: "Thank you for your message",
    intro: (name: string) =>
      `Hello ${name},<br/><br/>We have received your message and will reply as soon as possible.`,
    recap: "Your message",
    subjectLabel: "Subject",
    outro: "May the Sacred Heart of Jesus bless your undertakings.<br/><br/>The CBNA · RECA team<br/><em>All on mission</em>",
  },
};

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Piège à robots : ce champ caché doit rester vide
  if (String(formData.get("website") ?? "") !== "") return { status: "success" };

  const name = field(formData, "name", MAX.name);
  const email = field(formData, "email", MAX.email);
  const subject = field(formData, "subject", MAX.subject);
  const message = field(formData, "message", MAX.message);
  const locale = formData.get("locale") === "en" ? "en" : "fr";

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", error: "invalid" };
  }

  // Enregistrement en base (le back-office liste les messages) + limite anti-abus
  if (isDbConfigured()) {
    try {
      if (!(await rateLimit(`contact:${await clientIp()}`, 5, 3600))) return { status: "error", error: "rate" };
      const db = await getDb();
      await db.collection("messages").insertOne({
        name,
        email,
        subject,
        message,
        locale,
        status: "new",
        createdAt: new Date(),
      });
    } catch (err) {
      // L'e-mail part quand même si la base est indisponible
      console.error("[contact] enregistrement impossible", err);
    }
  }

  const safe = { name: escapeHtml(name), email: escapeHtml(email), subject: escapeHtml(subject), message: safeMultiline(message) };
  const c = confirmation[locale];

  try {
    // 1. Notification à l'équipe (contact@ + copie à la boîte Gmail)
    await sendMail({
      to: teamTo(),
      cc: teamCc(),
      replyTo: { name, address: email },
      subject: `[Site web] ${subject || "Message"} – ${name}`,
      text: `Nom : ${name}\nE-mail : ${email}\nObjet : ${subject}\nLangue : ${locale}\n\n${message}`,
      html: emailLayout(
        "Nouveau message du site",
        `${detailsTable([
          ["Nom", `<strong>${safe.name}</strong>`],
          ["E-mail", `<a href="mailto:${safe.email}">${safe.email}</a>`],
          ["Objet", safe.subject],
          ["Langue", locale.toUpperCase()],
        ])}
        <div style="margin-top:20px">${quoteBlock(safe.message)}</div>
        <p style="font-size:12px;color:#5f5866;margin-top:20px">Répondez directement à cet e-mail pour écrire à ${safe.name}.</p>`
      ),
    });

    // 2. Accusé de réception à la personne qui nous contacte
    await sendMail({
      to: { name, address: email },
      replyTo: teamTo(),
      subject: c.subject,
      html: emailLayout(
        c.title,
        `<p style="font-size:15px;line-height:1.6">${c.intro(safe.name)}</p>
        <p style="margin-top:24px;font-size:12px;letter-spacing:2px;color:#0b8a50;text-transform:uppercase">${c.recap}</p>
        <p style="font-size:14px;color:#5f5866">${c.subjectLabel} : ${safe.subject}</p>
        ${quoteBlock(safe.message)}
        <p style="margin-top:24px;font-size:15px;line-height:1.6">${c.outro}</p>`
      ),
    });

    return { status: "success" };
  } catch (err) {
    console.error("[contact] Échec d'envoi SMTP", err);
    return { status: "error", error: "server" };
  }
}
