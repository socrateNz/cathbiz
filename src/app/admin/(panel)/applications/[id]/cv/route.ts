import { ObjectId } from "mongodb";
import { countryScope, getCurrentUser, can } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { signedFileUrl, type StoredFile } from "@/lib/cloudinary";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Relais sécurisé du CV : l'URL Cloudinary signée n'est jamais exposée au navigateur */
export async function GET(request: Request, { params }: RouteContext<"/admin/applications/[id]/cv">) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "applications.view")) return new Response("Non autorisé", { status: 401 });

  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response("Introuvable", { status: 404 });
  const db = await getDb();
  const app = await db
    .collection<{ cv: StoredFile; name: string }>("applications")
    .findOne({ _id: new ObjectId(id), ...countryScope(user) }, { projection: { cv: 1, name: 1 } });
  if (!app?.cv) return new Response("Introuvable", { status: 404 });

  const upstream = await fetch(signedFileUrl(app.cv));
  if (!upstream.ok || !upstream.body) return new Response("Fichier indisponible", { status: 502 });

  const download = new URL(request.url).searchParams.has("download");
  const safeName = `CV-${app.name}`.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(0, 80) + `.${app.cv.ext}`;
  return new Response(upstream.body, {
    headers: {
      "Content-Type": MIME[app.cv.ext] ?? "application/octet-stream",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
