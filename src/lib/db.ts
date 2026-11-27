import "server-only";
import { MongoClient, type Db } from "mongodb";

/**
 * Connexion MongoDB partagée.
 * En développement, le client est gardé sur globalThis pour survivre au rechargement à chaud ;
 * sur Vercel, il est réutilisé tant que l'instance reste chaude.
 */
type Cache = { client?: MongoClient; promise?: Promise<Db> };
const g = globalThis as unknown as { __cbnaMongo?: Cache };
const cache: Cache = (g.__cbnaMongo ??= {});

export function isDbConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function getDb(): Promise<Db> {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI n'est pas défini");
  cache.promise ??= (async () => {
    const client = new MongoClient(process.env.MONGODB_URI!, { appName: "cathbiz-website" });
    await client.connect();
    cache.client = client;
    const db = client.db(process.env.MONGODB_DB || "cathbiz");
    await ensureIndexes(db);
    return db;
  })().catch((err) => {
    cache.promise = undefined;
    throw err;
  });
  return cache.promise;
}

async function ensureIndexes(db: Db) {
  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("sessions").createIndex({ userId: 1 }),
    db.collection("ratelimits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection("jobs").createIndex({ slug: 1 }, { unique: true }),
    db.collection("jobs").createIndex({ status: 1, publishedAt: -1 }),
    db.collection("applications").createIndex({ jobId: 1, createdAt: -1 }),
    db.collection("applications").createIndex({ status: 1, createdAt: -1 }),
    db.collection("messages").createIndex({ status: 1, createdAt: -1 }),
  ]);
}
