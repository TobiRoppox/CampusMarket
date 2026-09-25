/**
 * Move product photos from local disk to Supabase Storage.
 *
 *   PHOTO_STORAGE=supabase npm run photos:migrate
 *
 * Uploads every product photo stored under /api/product-images/ and points the
 * product at its new Supabase URL. Local files are kept as a backup. Safe to
 * rerun: products already on Supabase are skipped.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { closeDb, query } from "../src/db/index.js";
import { productPhotoDirectory, savePhoto, usingSupabaseStorage } from "../src/services/photoStorage.js";

if (!usingSupabaseStorage()) {
  console.error("Set PHOTO_STORAGE=supabase (plus SUPABASE_URL and SUPABASE_SECRET_KEY) first.");
  process.exit(1);
}

const TYPES = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
const products = await query("SELECT id, name, image_url FROM products WHERE image_url LIKE '/api/product-images/%'");
let moved = 0;
let missing = 0;

for (const product of products) {
  const filename = path.basename(product.image_url);
  const extension = path.extname(filename).slice(1);
  let buffer;
  try {
    buffer = await fs.readFile(path.join(productPhotoDirectory, filename));
  } catch {
    console.warn(`[skip] ${product.name}: ${filename} not found in ${productPhotoDirectory}`);
    missing += 1;
    continue;
  }
  const url = await savePhoto(buffer, { extension, contentType: TYPES[extension] });
  await query("UPDATE products SET image_url = $2 WHERE id = $1 AND image_url = $3", [product.id, url, product.image_url]);
  moved += 1;
}

console.log(`Moved ${moved} photo(s) to Supabase Storage${missing ? `; ${missing} file(s) missing` : ""}.`);
await closeDb();
