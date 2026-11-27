import "server-only";
import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Texte saisi par un visiteur → HTML sûr avec retours à la ligne */
export function safeMultiline(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

let transporter: Transporter | undefined;

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error("Variables SMTP manquantes");
  const port = Number(SMTP_PORT ?? 465);
  transporter ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export const mailFrom = () => `"CBNA · RECA" <${process.env.SMTP_USER}>`;
export const teamTo = () => process.env.CONTACT_TO || process.env.SMTP_USER!;
export const teamCc = () => process.env.CONTACT_CC || undefined;

export function sendMail(options: SendMailOptions) {
  return getTransporter().sendMail({ from: mailFrom(), ...options });
}

/** Gabarit HTML commun aux e-mails, aux couleurs CBNA */
export function emailLayout(title: string, body: string) {
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

/** Bloc de citation du message d'un visiteur */
export function quoteBlock(html: string) {
  return `<div style="padding:16px;border-left:3px solid #c99a3e;background:#fbf8f2;font-size:14px;line-height:1.6">${html}</div>`;
}

/** Tableau clé / valeur pour les notifications internes */
export function detailsTable(rows: [string, string][]) {
  return `<table style="font-size:14px;line-height:1.6">${rows
    .map(([k, v]) => `<tr><td style="color:#5f5866;padding-right:12px;vertical-align:top">${k}</td><td>${v}</td></tr>`)
    .join("")}</table>`;
}
