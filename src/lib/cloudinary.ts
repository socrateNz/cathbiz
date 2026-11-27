import "server-only";
import { v2 as cloudinary } from "cloudinary";

export type StoredFile = {
  publicId: string;
  resourceType: "raw" | "image";
  deliveryType: "authenticated" | "upload";
  originalName: string;
  bytes: number;
  ext: string;
};

/** Fichiers privés (CV, pièces) : formats acceptés et taille maximale */
export const PRIVATE_DOC_EXTENSIONS = ["pdf", "doc", "docx"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Variables Cloudinary manquantes");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
}

export function folderFor(kind: "cv") {
  return `${process.env.CLOUDINARY_FOLDER || "cathbiz"}/${kind}`;
}

/**
 * Paramètres signés pour un envoi direct navigateur → Cloudinary.
 * Les documents privés sont stockés en « authenticated » : inaccessibles sans URL signée.
 */
export function signPrivateUpload(kind: "cv") {
  const { cloudName, apiKey, apiSecret } = configure();
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder: folderFor(kind), timestamp, type: "authenticated" };
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);
  return {
    url: `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    fields: { ...params, api_key: apiKey, signature },
  };
}

/**
 * Vérifie côté serveur qu'un fichier envoyé existe bien, dans le bon dossier,
 * avec un format et une taille autorisés. Supprime le fichier sinon.
 */
export async function verifyPrivateUpload(kind: "cv", publicId: string, originalName: string): Promise<StoredFile | null> {
  configure();
  if (!publicId.startsWith(`${folderFor(kind)}/`)) return null;
  try {
    const res = await cloudinary.api.resource(publicId, { resource_type: "raw", type: "authenticated" });
    const ext = (publicId.split(".").pop() ?? "").toLowerCase();
    const okExt = (PRIVATE_DOC_EXTENSIONS as readonly string[]).includes(ext);
    if (!okExt || res.bytes > MAX_UPLOAD_BYTES) {
      await deleteFile({ publicId, resourceType: "raw", deliveryType: "authenticated" });
      return null;
    }
    return {
      publicId,
      resourceType: "raw",
      deliveryType: "authenticated",
      originalName: originalName.slice(0, 200) || `document.${ext}`,
      bytes: res.bytes,
      ext,
    };
  } catch {
    return null;
  }
}

/** URL signée, utilisée uniquement côté serveur pour relayer le fichier à un admin */
export function signedFileUrl(file: Pick<StoredFile, "publicId" | "resourceType" | "deliveryType">) {
  configure();
  return cloudinary.url(file.publicId, {
    resource_type: file.resourceType,
    type: file.deliveryType,
    sign_url: true,
    secure: true,
  });
}

export async function deleteFile(file: Pick<StoredFile, "publicId" | "resourceType" | "deliveryType">) {
  configure();
  await cloudinary.uploader
    .destroy(file.publicId, { resource_type: file.resourceType, type: file.deliveryType, invalidate: true })
    .catch(() => undefined);
}
