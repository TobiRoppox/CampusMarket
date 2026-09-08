import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { stallStore } from "../data/marketStore.js";

export const productPhotoDirectory = process.env.PRODUCT_PHOTO_DIR || fileURLToPath(new URL("../../uploads/products/", import.meta.url));
const parsePhoto = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 } }).single("image");

export const uploadProductPhoto = async (req, res, next) => {
  try {
    const stall = await stallStore.getMy(req.user.id);
    if (!stall || !["approved", "active"].includes(stall.status)) return res.status(403).json({ error: "An approved stall is required to upload product photos." });
    parsePhoto(req, res, async (error) => {
      if (error) return res.status(400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "Choose a photo smaller than 5 MB." : "Upload one product photo at a time." });
      if (!req.file) return res.status(400).json({ error: "Choose a product photo." });
      const { buffer, mimetype } = req.file;
      let extension;
      if (mimetype === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) extension = "png";
      if (mimetype === "image/jpeg" && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) extension = "jpg";
      if (mimetype === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") extension = "webp";
      if (!extension) return res.status(400).json({ error: "Choose a JPG, PNG, or WebP photo." });
      try {
        await fs.mkdir(productPhotoDirectory, { recursive: true });
        const filename = `${randomUUID()}.${extension}`;
        await fs.writeFile(path.join(productPhotoDirectory, filename), buffer, { flag: "wx" });
        res.status(201).json({ image_url: `/api/product-images/${filename}` });
      } catch (writeError) { next(writeError); }
    });
  } catch (error) { next(error); }
};
