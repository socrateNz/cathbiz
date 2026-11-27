import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPublishedJobs } from "@/lib/jobs";
import { sitePaths, siteUrl } from "@/lib/seo";

const languages = (path: string) =>
  Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = sitePaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      changeFrequency: (path === "/jobs" ? "daily" : "monthly") as "daily" | "monthly",
      priority: path === "" ? 1 : 0.8,
      alternates: { languages: languages(path) },
    }))
  );

  const jobs = (await getPublishedJobs()).flatMap((job) =>
    routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}/jobs/${job.slug}`,
      lastModified: job.publishedAt ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: { languages: languages(`/jobs/${job.slug}`) },
    }))
  );

  return [...pages, ...jobs];
}
