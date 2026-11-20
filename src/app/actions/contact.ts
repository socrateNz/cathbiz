"use server";

import nodemailer from "nodemailer";

export type ContactState = {
  status: "idle" | "success" | "error";
  error?: "invalid" | "server";
};

const MAX = { name: 120, email: 200, subject: 80, message: 5000 };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function field(formData: FormData, key: string, max: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > max ? value.slice(0, max) : value;
}

/** Gabarit HTML commun aux deux e-mails, aux couleurs CBNA */
function layout(title: string, body: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#f3ece0;font-family:Arial,Helvetica,sans-serif;color:#1f1a24">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#240b2e;padding:28px 32px;color:#e8cf84;font-family:Georgia,serif;font-size:22px;font-weight:bold">
          CBNA · RECA
          <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#ffffffaa;font-weight:normal;margin-top:4px">CATHOLIC BUSINESS NETWORK OF AFRICA</div>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:24px;color:#4e1a5c">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="background:#fbf8f2;padding:20px 32px;font-size:12px;color:#5f5866">
          Siège : Yaoundé, Cameroun · <a href="https://www.cathbiz-africa.org" style="color:#0b8a50">www.cathbiz-africa.org</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
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

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO, CONTACT_CC } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("[contact] Variables SMTP manquantes");
    return { status: "error", error: "server" };
  }

  const port = Number(SMTP_PORT ?? 465);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const from = `"CBNA · RECA" <${SMTP_USER}>`;
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    subject: escapeHtml(subject),
    message: escapeHtml(message).replace(/\n/g, "<br/>"),
  };
  const c = confirmation[locale];

  try {
    // 1. Notification à l'équipe (contact@ + copie à la boîte Gmail)
    await transporter.sendMail({
      from,
      to: CONTACT_TO ?? SMTP_USER,
      cc: CONTACT_CC || undefined,
      replyTo: { name, address: email },
      subject: `[Site web] ${subject || "Message"} – ${name}`,
      text: `Nom : ${name}\nE-mail : ${email}\nObjet : ${subject}\nLangue : ${locale}\n\n${message}`,
      html: layout(
        "Nouveau message du site",
        `<table style="font-size:14px;line-height:1.6">
          <tr><td style="color:#5f5866;padding-right:12px">Nom</td><td><strong>${safe.name}</strong></td></tr>
          <tr><td style="color:#5f5866;padding-right:12px">E-mail</td><td><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
          <tr><td style="color:#5f5866;padding-right:12px">Objet</td><td>${safe.subject}</td></tr>
          <tr><td style="color:#5f5866;padding-right:12px">Langue</td><td>${locale.toUpperCase()}</td></tr>
        </table>
        <div style="margin-top:20px;padding:16px;border-left:3px solid #c99a3e;background:#fbf8f2;font-size:14px;line-height:1.6">${safe.message}</div>
        <p style="font-size:12px;color:#5f5866;margin-top:20px">Répondez directement à cet e-mail pour écrire à ${safe.name}.</p>`
      ),
    });

    // 2. Accusé de réception à la personne qui nous contacte
    await transporter.sendMail({
      from,
      to: { name, address: email },
      replyTo: CONTACT_TO ?? SMTP_USER,
      subject: c.subject,
      html: layout(
        c.title,
        `<p style="font-size:15px;line-height:1.6">${c.intro(safe.name)}</p>
        <p style="margin-top:24px;font-size:12px;letter-spacing:2px;color:#0b8a50;text-transform:uppercase">${c.recap}</p>
        <p style="font-size:14px;color:#5f5866">${c.subjectLabel} : ${safe.subject}</p>
        <div style="padding:16px;border-left:3px solid #c99a3e;background:#fbf8f2;font-size:14px;line-height:1.6">${safe.message}</div>
        <p style="margin-top:24px;font-size:15px;line-height:1.6">${c.outro}</p>`
      ),
    });

    return { status: "success" };
  } catch (err) {
    console.error("[contact] Échec d'envoi SMTP", err);
    return { status: "error", error: "server" };
  }
}
