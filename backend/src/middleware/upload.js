/**
 * upload.js — File upload middleware using Multer + Supabase Storage.
 *
 * Supports:
 *  - In-memory buffering (no temp files on disk)
 *  - MIME type validation (images only)
 *  - File size limit (5 MB default)
 *  - Automatic upload to Supabase Storage bucket
 *  - Public URL returned on req.uploadedUrl
 *
 * Usage in a route:
 *   import { uploadSingle, uploadToSupabase } from "../middleware/upload.js";
 *
 *   router.post(
 *     "/products",
 *     verifyToken,
 *     uploadSingle("image"),        // parse multipart/form-data, field "image"
 *     uploadToSupabase("products"), // push to Supabase bucket "products"
 *     createProduct                 // req.uploadedUrl is now available
 *   );
 */

import multer from "multer";
import path from "path";
import { supabase } from "../config/supabase.js";

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // bytes

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ── Multer configuration ──────────────────────────────────────────────────────

/**
 * Memory storage — keeps the file in a Buffer (req.file.buffer).
 * No disk I/O, ideal for serverless / container deployments.
 */
const storage = multer.memoryStorage();

/**
 * MIME type filter — rejects non-image uploads before they reach the handler.
 */
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      ),
      false,
    );
  }
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ── Exported Multer middleware shortcuts ──────────────────────────────────────

/**
 * Parse a single file upload from the specified form field.
 * @param {string} fieldName - HTML input name attribute
 */
export const uploadSingle = (fieldName = "image") =>
  multerInstance.single(fieldName);

/**
 * Parse up to `maxCount` files from the specified form field.
 */
export const uploadArray = (fieldName = "images", maxCount = 5) =>
  multerInstance.array(fieldName, maxCount);

// ── Supabase Storage upload middleware ────────────────────────────────────────

/**
 * Uploads the file that Multer placed on req.file to a Supabase Storage bucket.
 *
 * After this middleware runs:
 *   req.uploadedUrl   — the public URL of the uploaded file (string | null)
 *   req.uploadedPath  — the storage path within the bucket (string | null)
 *
 * If no file was attached (req.file is undefined), the middleware is a no-op
 * so optional uploads work naturally.
 *
 * @param {string} bucket  Supabase Storage bucket name (must exist & be public)
 */
export const uploadToSupabase =
  (bucket = "uploads") =>
  async (req, res, next) => {
    // No file attached — skip silently (optional upload)
    if (!req.file) {
      req.uploadedUrl = null;
      req.uploadedPath = null;
      return next();
    }

    try {
      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const folder = req.user?.id ?? "anon";
      const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      req.uploadedUrl = urlData?.publicUrl ?? null;
      req.uploadedPath = filename;

      next();
    } catch (err) {
      console.error("[upload.js] Supabase upload error:", err);
      next(new Error("File upload failed. Please try again."));
    }
  };

/**
 * Upload multiple files (req.files array → Supabase).
 * Attaches req.uploadedUrls (string[]) after completion.
 *
 * @param {string} bucket
 */
export const uploadManyToSupabase =
  (bucket = "uploads") =>
  async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      req.uploadedUrls = [];
      req.uploadedPaths = [];
      return next();
    }

    try {
      const folder = req.user?.id ?? "anon";
      const results = await Promise.all(
        req.files.map(async (file) => {
          const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
          const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

          const { error } = await supabase.storage
            .from(bucket)
            .upload(filename, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename);

          return { url: urlData?.publicUrl ?? null, path: filename };
        }),
      );

      req.uploadedUrls = results.map((r) => r.url);
      req.uploadedPaths = results.map((r) => r.path);

      next();
    } catch (err) {
      console.error("[upload.js] Bulk upload error:", err);
      next(new Error("One or more file uploads failed."));
    }
  };

/**
 * Delete a file from Supabase Storage by its storage path.
 * Utility for cleanup when a product or stall is deleted.
 *
 * @param {string} bucket
 * @param {string} filePath  The path returned in req.uploadedPath
 */
export async function deleteFromSupabase(bucket, filePath) {
  if (!filePath) return;
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) console.error("[upload.js] Delete error:", error);
}

// ── Multer error handler ──────────────────────────────────────────────────────
/**
 * Express error-handling middleware that formats Multer errors into
 * clean JSON responses. Mount this AFTER your upload routes.
 *
 * Usage in app.js:
 *   app.use(handleUploadError);
 */
export const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`,
      });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err?.message?.startsWith("Invalid file type")) {
    return res.status(415).json({ error: err.message });
  }

  next(err);
};

export default {
  uploadSingle,
  uploadArray,
  uploadToSupabase,
  uploadManyToSupabase,
  deleteFromSupabase,
  handleUploadError,
};
