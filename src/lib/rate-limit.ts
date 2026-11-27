import "server-only";
import { headers } from "next/headers";
import { getDb } from "./db";

/** Adresse IP du visiteur (Vercel fournit x-forwarded-for) */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown").split(",")[0].trim();
}

/**
 * Limiteur simple stocké dans MongoDB (fenêtre fixe).
 * Renvoie true si l'action est autorisée.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const db = await getDb();
  const now = new Date();
  const res = await db.collection<{ _id: string; count: number; expiresAt: Date }>("ratelimits").findOneAndUpdate(
    { _id: key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { returnDocument: "after" }
  );
  if (res) return res.count <= limit;
  await db
    .collection<{ _id: string; count: number; expiresAt: Date }>("ratelimits")
    .updateOne(
      { _id: key },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) } },
      { upsert: true }
    );
  return true;
}

export async function resetRateLimit(key: string) {
  const db = await getDb();
  await db.collection<{ _id: string }>("ratelimits").deleteOne({ _id: key });
}
