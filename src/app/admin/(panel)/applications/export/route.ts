import { ObjectId } from "mongodb";
import { can, countryScope, getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUSES, COUNTRY_LABELS, type ApplicationStatus, type JobCountry } from "@/lib/jobs";

type Row = {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  company: string;
  country: JobCountry;
  status: ApplicationStatus;
  notes: string;
  createdAt: Date;
};

/** Cellule CSV sûre (guillemets échappés, pas d'injection de formule Excel) */
function cell(value: unknown) {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "applications.view")) return new Response("Non autorisé", { status: 401 });

  const sp = new URL(request.url).searchParams;
  const status = sp.get("status");
  const job = sp.get("job");
  const filter = {
    ...countryScope(user),
    ...(status && APPLICATION_STATUSES.includes(status as ApplicationStatus) ? { status: status as ApplicationStatus } : {}),
    ...(job && /^[a-f0-9]{24}$/.test(job) ? { jobId: new ObjectId(job) } : {}),
  };

  const db = await getDb();
  const rows = await db.collection<Row>("applications").find(filter).sort({ createdAt: -1 }).toArray();
  const header = ["Date", "Nom", "E-mail", "Téléphone", "Localisation", "Offre", "Entreprise", "Pays", "Statut", "Notes"];
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString().slice(0, 10),
      r.name,
      r.email,
      r.phone,
      r.location,
      r.jobTitle,
      r.company,
      COUNTRY_LABELS[r.country] ?? r.country,
      APPLICATION_STATUS_LABELS[r.status],
      r.notes,
    ]
      .map(cell)
      .join(";")
  );
  // BOM UTF-8 + point-virgule : s'ouvre correctement dans Excel en français
  const csv = "﻿" + [header.map(cell).join(";"), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidatures-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
