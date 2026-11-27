"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  countUsers,
  countryScope,
  createSession,
  destroySession,
  destroyUserSessions,
  hashPassword,
  MIN_PASSWORD_LENGTH,
  requireUser,
  ROLES,
  verifyPassword,
  type UserDoc,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { deleteFile, type StoredFile } from "@/lib/cloudinary";
import {
  APPLICATION_STATUSES,
  CONTRACT_TYPES,
  JOB_COUNTRIES,
  JOB_STATUSES,
  JOBS_TAG,
  slugify,
  type JobDoc,
} from "@/lib/jobs";

export type ActionResult = { ok: boolean; error?: string; message?: string } | null;

const oid = (id: unknown) => (typeof id === "string" && /^[a-f0-9]{24}$/.test(id) ? new ObjectId(id) : null);
const refreshAdmin = () => revalidatePath("/admin", "layout");
let dummyHash: Promise<string> | undefined;

/* ─── Authentification ─────────────────────────────────────── */

export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Renseignez votre e-mail et votre mot de passe." };

  const ipKey = `login-ip:${await clientIp()}`;
  const emailKey = `login-email:${email}`;
  if (!(await rateLimit(ipKey, 20, 900)) || !(await rateLimit(emailKey, 6, 900))) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ email });
  // Vérification même si l'utilisateur n'existe pas, pour ne pas révéler les comptes existants
  dummyHash ??= hashPassword(randomUUID());
  const valid = await verifyPassword(user?.passwordHash ?? (await dummyHash), password);
  if (!user || !valid || !user.active) return { ok: false, error: "E-mail ou mot de passe incorrect." };

  await resetRateLimit(emailKey);
  await db.collection<UserDoc>("users").updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  await createSession(user._id);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

const setupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
  confirm: z.string(),
});

/** Création du premier super-administrateur, possible uniquement si la base est vide */
export async function setupFirstAdmin(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if ((await countUsers()) > 0) return { ok: false, error: "Le back-office est déjà configuré." };
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: `Vérifiez les champs (mot de passe : ${MIN_PASSWORD_LENGTH} caractères minimum).` };
  }
  if (parsed.data.password !== parsed.data.confirm) return { ok: false, error: "Les mots de passe ne correspondent pas." };

  const db = await getDb();
  const { insertedId } = await db.collection<Omit<UserDoc, "_id">>("users").insertOne({
    email: parsed.data.email.toLowerCase(),
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
    role: "superadmin",
    active: true,
    createdAt: new Date(),
  });
  await createSession(insertedId);
  redirect("/admin");
}

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("password") ?? "");
  if (next.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Le nouveau mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  }
  if (next !== String(formData.get("confirm") ?? "")) return { ok: false, error: "Les mots de passe ne correspondent pas." };

  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ _id: new ObjectId(me.id) });
  if (!user || !(await verifyPassword(user.passwordHash, current))) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }
  await db.collection<UserDoc>("users").updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(next) } });
  // Déconnecte les autres appareils puis recrée la session courante
  await destroyUserSessions(user._id);
  await createSession(user._id);
  return { ok: true, message: "Mot de passe modifié." };
}

/* ─── Offres d'emploi ──────────────────────────────────────── */

const text = (max: number) => z.string().trim().max(max).optional().default("");
const jobSchema = z.object({
  id: z.string().optional(),
  title_fr: z.string().trim().min(3).max(160),
  title_en: text(160),
  company: z.string().trim().min(2).max(160),
  country: z.enum(JOB_COUNTRIES),
  city: text(120),
  contract: z.enum(CONTRACT_TYPES),
  summary_fr: z.string().trim().min(10).max(3000),
  summary_en: text(3000),
  missions_fr: text(5000),
  missions_en: text(5000),
  profile_fr: text(5000),
  profile_en: text(5000),
  benefits_fr: text(3000),
  benefits_en: text(3000),
  deadline: z.string().optional().default(""),
  status: z.enum(JOB_STATUSES),
});

export async function saveJob(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireUser("jobs.manage");
  const parsed = jobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((i) => String(i.path[0])))].join(", ");
    return { ok: false, error: `Champs invalides ou manquants : ${fields}.` };
  }
  const d = parsed.data;
  // Un responsable de section ne publie que dans son pays
  if (me.role === "section" && d.country !== me.country) {
    return { ok: false, error: "Vous ne pouvez publier que des offres de votre pays." };
  }

  const db = await getDb();
  const jobs = db.collection<Omit<JobDoc, "_id"> & { _id?: ObjectId }>("jobs");
  const now = new Date();
  const values = {
    title: { fr: d.title_fr, en: d.title_en },
    company: d.company,
    country: d.country,
    city: d.city,
    contract: d.contract,
    summary: { fr: d.summary_fr, en: d.summary_en },
    missions: { fr: d.missions_fr, en: d.missions_en },
    profile: { fr: d.profile_fr, en: d.profile_en },
    benefits: { fr: d.benefits_fr, en: d.benefits_en },
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(d.deadline) ? new Date(`${d.deadline}T23:59:59Z`) : null,
    status: d.status,
    updatedAt: now,
  };

  const id = oid(d.id);
  let slug: string;
  if (id) {
    const existing = await jobs.findOne({ _id: id, ...countryScope(me) });
    if (!existing) return { ok: false, error: "Offre introuvable." };
    slug = existing.slug;
    const publishedAt = d.status === "published" && !existing.publishedAt ? now : existing.publishedAt;
    await jobs.updateOne({ _id: id }, { $set: { ...values, publishedAt } });
  } else {
    // Slug unique et lisible : titre + suffixe aléatoire court
    slug = `${slugify(`${d.title_fr} ${d.company}`)}-${Math.random().toString(36).slice(2, 7)}`;
    await jobs.insertOne({
      ...values,
      slug,
      createdBy: new ObjectId(me.id),
      createdAt: now,
      publishedAt: d.status === "published" ? now : null,
    });
  }

  updateTag(JOBS_TAG);
  updateTag(`job:${slug}`);
  refreshAdmin();
  redirect("/admin/jobs?saved=1");
}

export async function setJobStatus(formData: FormData) {
  const me = await requireUser("jobs.manage");
  const id = oid(formData.get("id"));
  const status = z.enum(JOB_STATUSES).safeParse(formData.get("status"));
  if (!id || !status.success) return;
  const db = await getDb();
  const job = await db.collection<JobDoc>("jobs").findOne({ _id: id, ...countryScope(me) });
  if (!job) return;
  await db.collection<JobDoc>("jobs").updateOne(
    { _id: id },
    {
      $set: {
        status: status.data,
        updatedAt: new Date(),
        ...(status.data === "published" && !job.publishedAt ? { publishedAt: new Date() } : {}),
      },
    }
  );
  updateTag(JOBS_TAG);
  updateTag(`job:${job.slug}`);
  refreshAdmin();
}

export async function deleteJob(formData: FormData) {
  const me = await requireUser("jobs.manage");
  const id = oid(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  const job = await db.collection<JobDoc>("jobs").findOne({ _id: id, ...countryScope(me) });
  if (!job) return;
  // On ne supprime pas une offre qui a reçu des candidatures : on la clôture
  const hasApplications = await db.collection("applications").countDocuments({ jobId: id }, { limit: 1 });
  if (hasApplications) {
    await db.collection<JobDoc>("jobs").updateOne({ _id: id }, { $set: { status: "closed", updatedAt: new Date() } });
  } else {
    await db.collection<JobDoc>("jobs").deleteOne({ _id: id });
  }
  updateTag(JOBS_TAG);
  updateTag(`job:${job.slug}`);
  refreshAdmin();
  redirect("/admin/jobs");
}

/* ─── Candidatures ─────────────────────────────────────────── */

export async function updateApplication(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireUser("applications.manage");
  const id = oid(formData.get("id"));
  const status = z.enum(APPLICATION_STATUSES).safeParse(formData.get("status"));
  const notes = String(formData.get("notes") ?? "").slice(0, 5000);
  if (!id || !status.success) return { ok: false, error: "Données invalides." };
  const db = await getDb();
  const res = await db
    .collection("applications")
    .updateOne({ _id: id, ...countryScope(me) }, { $set: { status: status.data, notes, updatedAt: new Date() } });
  if (!res.matchedCount) return { ok: false, error: "Candidature introuvable." };
  refreshAdmin();
  return { ok: true, message: "Candidature mise à jour." };
}

export async function deleteApplication(formData: FormData) {
  const me = await requireUser("applications.manage");
  const id = oid(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  const app = await db.collection<{ cv?: StoredFile }>("applications").findOne({ _id: id, ...countryScope(me) });
  if (!app) return;
  if (app.cv) await deleteFile(app.cv);
  await db.collection("applications").deleteOne({ _id: id });
  refreshAdmin();
  redirect("/admin/applications");
}

/* ─── Messages de contact ──────────────────────────────────── */

export async function setMessageStatus(formData: FormData) {
  await requireUser("messages.view");
  const id = oid(formData.get("id"));
  const status = z.enum(["new", "read", "done"]).safeParse(formData.get("status"));
  if (!id || !status.success) return;
  const db = await getDb();
  await db.collection("messages").updateOne({ _id: id }, { $set: { status: status.data } });
  refreshAdmin();
}

export async function deleteMessage(formData: FormData) {
  await requireUser("messages.view");
  const id = oid(formData.get("id"));
  if (!id) return;
  const db = await getDb();
  await db.collection("messages").deleteOne({ _id: id });
  refreshAdmin();
}

/* ─── Utilisateurs ─────────────────────────────────────────── */

const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  role: z.enum(ROLES),
  country: z.enum(JOB_COUNTRIES).optional().or(z.literal("")),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
});

export async function createUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireUser("users.manage");
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: `Vérifiez les champs (mot de passe provisoire : ${MIN_PASSWORD_LENGTH} caractères minimum).` };
  }
  const d = parsed.data;
  if (d.role === "section" && !d.country) return { ok: false, error: "Choisissez le pays du responsable de section." };
  const db = await getDb();
  try {
    await db.collection<Omit<UserDoc, "_id">>("users").insertOne({
      name: d.name,
      email: d.email.toLowerCase(),
      role: d.role,
      country: d.role === "section" ? d.country || undefined : undefined,
      passwordHash: await hashPassword(d.password),
      active: true,
      createdAt: new Date(),
    });
  } catch {
    return { ok: false, error: "Un compte existe déjà avec cet e-mail." };
  }
  refreshAdmin();
  return { ok: true, message: `Compte créé. Transmettez le mot de passe provisoire à ${d.name}.` };
}

export async function updateUser(formData: FormData) {
  const me = await requireUser("users.manage");
  const id = oid(formData.get("id"));
  if (!id || id.toHexString() === me.id) return; // on ne modifie pas son propre rôle ici
  const role = z.enum(ROLES).safeParse(formData.get("role"));
  const active = formData.get("active") === "on";
  const country = z.enum(JOB_COUNTRIES).safeParse(formData.get("country"));
  if (!role.success) return;
  const db = await getDb();
  await db.collection<UserDoc>("users").updateOne(
    { _id: id },
    { $set: { role: role.data, active, country: role.data === "section" && country.success ? country.data : undefined } }
  );
  if (!active) await destroyUserSessions(id);
  refreshAdmin();
}

export async function resetUserPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const me = await requireUser("users.manage");
  const id = oid(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (!id || id.toHexString() === me.id) return { ok: false, error: "Action impossible." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `${MIN_PASSWORD_LENGTH} caractères minimum.` };
  }
  const db = await getDb();
  await db.collection<UserDoc>("users").updateOne({ _id: id }, { $set: { passwordHash: await hashPassword(password) } });
  await destroyUserSessions(id);
  return { ok: true, message: "Mot de passe réinitialisé." };
}
