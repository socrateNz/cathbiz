import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { ObjectId } from "mongodb";
import { getDb } from "./db";

/* ─── Rôles et permissions ─────────────────────────────────── */

export const ROLES = ["superadmin", "admin", "editor", "section"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super-administrateur",
  admin: "Administrateur",
  editor: "Éditeur",
  section: "Responsable de section",
};

export type Permission =
  | "users.manage"
  | "jobs.manage"
  | "applications.view"
  | "applications.manage"
  | "messages.view";

const MATRIX: Record<Role, Permission[]> = {
  superadmin: ["users.manage", "jobs.manage", "applications.view", "applications.manage", "messages.view"],
  admin: ["jobs.manage", "applications.view", "applications.manage", "messages.view"],
  editor: ["jobs.manage"],
  // Un responsable de section ne voit que les offres et candidatures de son pays
  section: ["jobs.manage", "applications.view", "applications.manage"],
};

export function can(role: Role, permission: Permission) {
  return MATRIX[role].includes(permission);
}

/* ─── Types ────────────────────────────────────────────────── */

export type UserDoc = {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  country?: string;
  active: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  country?: string;
};

type SessionDoc = { _id: string; userId: ObjectId; expiresAt: Date; createdAt: Date };

/* ─── Mots de passe ────────────────────────────────────────── */

export const MIN_PASSWORD_LENGTH = 10;

export function hashPassword(password: string) {
  return hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password).catch(() => false);
}

/* ─── Sessions ─────────────────────────────────────────────── */

export const SESSION_COOKIE = "cbna_admin_session";

function sessionDays() {
  return Math.max(1, Number(process.env.SESSION_MAX_AGE_DAYS) || 7);
}

/** Le jeton du cookie n'est jamais stocké tel quel : on garde son HMAC */
function tokenId(token: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET n'est pas défini");
  return createHmac("sha256", secret).update(token).digest("hex");
}

export async function createSession(userId: ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDays() * 86400_000);
  const db = await getDb();
  await db.collection<SessionDoc>("sessions").insertOne({ _id: tokenId(token), userId, expiresAt, createdAt: new Date() });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.collection<SessionDoc>("sessions").deleteOne({ _id: tokenId(token) });
  }
  jar.delete(SESSION_COOKIE);
}

export async function destroyUserSessions(userId: ObjectId) {
  const db = await getDb();
  await db.collection<SessionDoc>("sessions").deleteMany({ userId });
}

/** Utilisateur connecté (ou null), lu une seule fois par requête */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const session = await db
    .collection<SessionDoc>("sessions")
    .findOne({ _id: tokenId(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await db.collection<UserDoc>("users").findOne({ _id: session.userId, active: true });
  if (!user) return null;
  return { id: user._id.toHexString(), email: user.email, name: user.name, role: user.role, country: user.country };
});

/** À appeler en haut de chaque page et action du back-office */
export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (permission && !can(user.role, permission)) redirect("/admin?denied=1");
  return user;
}

/** Filtre MongoDB limitant un responsable de section à son pays */
export function countryScope(user: SessionUser): Record<string, unknown> {
  return user.role === "section" ? { country: user.country ?? "__none__" } : {};
}

export async function countUsers() {
  const db = await getDb();
  return db.collection("users").estimatedDocumentCount();
}
