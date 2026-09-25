/**
 * photoStorage.js — where uploaded product photos are kept.
 *
 *  PHOTO_STORAGE=supabase → Supabase Storage (public bucket). Use this in production:
 *                           most hosts wipe the local disk on every deploy/restart.
 *  otherwise (default)    → local disk (PRODUCT_PHOTO_DIR), served at /api/product-images.
 *
 * Supabase settings: SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PHOTO_BUCKET
 * (default "product-images"). The bucket is created by database/schema.sql when
 * the database is Supabase.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

export const productPhotoDirectory = process.env.PRODUCT_PHOTO_DIR || fileURLToPath(new URL("../../uploads/products/", import.meta.url));

export const usingSupabaseStorage = () => process.env.PHOTO_STORAGE === "supabase";

const supabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("PHOTO_STORAGE=supabase needs SUPABASE_URL and SUPABASE_SECRET_KEY.");
  return { url, key, bucket: process.env.SUPABASE_PHOTO_BUCKET || "product-images" };
};

const saveToSupabase = async (buffer, filename, contentType) => {
  const { url, key, bucket } = supabaseConfig();
  const response = await fetch(`${url}/storage/v1/object/${bucket}/products/${filename}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "Cache-Control": "max-age=86400",
      "x-upsert": "false",
    },
    body: buffer,
    signal: AbortSignal.timeout(Number(process.env.PHOTO_UPLOAD_TIMEOUT_MS) || 15000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw Object.assign(new Error(`Supabase Storage upload failed (${response.status}): ${detail.slice(0, 200)}`), { status: 502 });
  }
  return `${url}/storage/v1/object/public/${bucket}/products/${filename}`;
};

const saveToDisk = async (buffer, filename) => {
  await fs.mkdir(productPhotoDirectory, { recursive: true });
  await fs.writeFile(path.join(productPhotoDirectory, filename), buffer, { flag: "wx" });
  return `/api/product-images/${filename}`;
};

/**
 * Store a validated photo and return the URL to save on the product.
 * @param {Buffer} buffer
 * @param {{ extension: "png" | "jpg" | "webp", contentType: string }} type
 */
export const savePhoto = (buffer, { extension, contentType }) => {
  const filename = `${randomUUID()}.${extension}`;
  return usingSupabaseStorage() ? saveToSupabase(buffer, filename, contentType) : saveToDisk(buffer, filename);
};
