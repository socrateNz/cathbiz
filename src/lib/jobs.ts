import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ObjectId } from "mongodb";
import { getDb } from "./db";

export const JOB_COUNTRIES = ["CM", "CI", "CG", "MG", "CF", "GQ", "NG", "OTHER", "REMOTE"] as const;
export type JobCountry = (typeof JOB_COUNTRIES)[number];

export const CONTRACT_TYPES = ["cdi", "cdd", "internship", "freelance", "volunteer", "apprenticeship"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const JOB_STATUSES = ["draft", "published", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const APPLICATION_STATUSES = ["received", "shortlisted", "interview", "hired", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Libellés du back-office (en français) */
export const COUNTRY_LABELS: Record<JobCountry, string> = {
  CM: "Cameroun",
  CI: "Côte d'Ivoire",
  CG: "Congo",
  MG: "Madagascar",
  CF: "Centrafrique",
  GQ: "Guinée équatoriale",
  NG: "Nigeria",
  OTHER: "Autre pays",
  REMOTE: "Télétravail",
};
export const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  internship: "Stage",
  freelance: "Freelance / consultant",
  volunteer: "Bénévolat / volontariat",
  apprenticeship: "Alternance / apprentissage",
};
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  closed: "Clôturée",
};
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  received: "Reçue",
  shortlisted: "Présélectionnée",
  interview: "Entretien",
  hired: "Retenue",
  rejected: "Non retenue",
};

export type Localized = { fr: string; en?: string };

export type JobDoc = {
  _id: ObjectId;
  slug: string;
  title: Localized;
  company: string;
  country: JobCountry;
  city: string;
  contract: ContractType;
  summary: Localized;
  missions: Localized;
  profile: Localized;
  benefits: Localized;
  deadline: Date | null;
  status: JobStatus;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

/** Version sérialisable envoyée aux pages publiques */
export type PublicJob = {
  id: string;
  slug: string;
  title: Localized;
  company: string;
  country: JobCountry;
  city: string;
  contract: ContractType;
  summary: Localized;
  missions: Localized;
  profile: Localized;
  benefits: Localized;
  deadline: string | null;
  publishedAt: string | null;
};

export const JOBS_TAG = "jobs";

/** Choisit la langue demandée, avec repli sur le français */
export function pick(value: Localized | undefined, locale: string) {
  if (!value) return "";
  return (locale === "en" && value.en?.trim()) || value.fr;
}

/** Transforme un texte multi-lignes en liste (une ligne = un point) */
export function toLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toPublic(j: JobDoc): PublicJob {
  return {
    id: j._id.toHexString(),
    slug: j.slug,
    title: j.title,
    company: j.company,
    country: j.country,
    city: j.city,
    contract: j.contract,
    summary: j.summary,
    missions: j.missions,
    profile: j.profile,
    benefits: j.benefits,
    deadline: j.deadline ? j.deadline.toISOString() : null,
    publishedAt: j.publishedAt ? j.publishedAt.toISOString() : null,
  };
}

/** Offres publiées et non expirées (cache vidé à chaque modification) */
export async function getPublishedJobs(): Promise<PublicJob[]> {
  "use cache";
  cacheTag(JOBS_TAG);
  cacheLife("minutes");
  try {
    const db = await getDb();
    const startOfToday = new Date(new Date().toDateString());
    const docs = await db
      .collection<JobDoc>("jobs")
      .find({ status: "published", $or: [{ deadline: null }, { deadline: { $gte: startOfToday } }] })
      .sort({ publishedAt: -1 })
      .limit(200)
      .toArray();
    return docs.map(toPublic);
  } catch (err) {
    console.error("[jobs] lecture impossible", err);
    return [];
  }
}

export async function getPublishedJob(slug: string): Promise<PublicJob | null> {
  "use cache";
  cacheTag(JOBS_TAG, `job:${slug}`);
  cacheLife("minutes");
  try {
    const db = await getDb();
    const doc = await db.collection<JobDoc>("jobs").findOne({ slug, status: { $in: ["published", "closed"] } });
    return doc ? toPublic(doc) : null;
  } catch (err) {
    console.error("[jobs] lecture impossible", err);
    return null;
  }
}

export function isExpired(job: Pick<PublicJob, "deadline">) {
  if (!job.deadline) return false;
  return new Date(job.deadline) < new Date(new Date().toDateString());
}
