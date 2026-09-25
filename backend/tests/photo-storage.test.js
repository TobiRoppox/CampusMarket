import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";

// A stand-in for Supabase Storage's upload endpoint that records what it receives.
const startFakeStorage = async () => {
  const received = [];
  let failNext = false;
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      received.push({ method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks) });
      if (failNext) { failNext = false; res.writeHead(400).end('{"message":"Bucket not found"}'); return; }
      res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ Key: req.url }));
    });
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, received, url: `http://127.0.0.1:${server.address().port}`, failOnce: () => { failNext = true; } };
};

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=", "base64");

test("photos go to Supabase Storage when enabled, and local photos migrate", async (t) => {
  const storage = await startFakeStorage();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "campus-photos-"));
  Object.assign(process.env, {
    PHOTO_STORAGE: "supabase", SUPABASE_URL: `${storage.url}/`, SUPABASE_SECRET_KEY: "test-secret-key",
    PRODUCT_PHOTO_DIR: path.join(directory, "photos"), PGLITE_DIR: path.join(directory, "db"), SEED_DEMO: "false",
  });
  delete process.env.DATABASE_URL;
  const { savePhoto } = await import("../src/services/photoStorage.js");
  const { query, exec, closeDb } = await import("../src/db/index.js").then((db) => ({ ...db, exec: async (sql) => (await db.getDb()).exec(sql) }));
  t.after(async () => {
    await closeDb();
    storage.server.close();
    assert.ok(path.basename(directory).startsWith("campus-photos-"));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  // Upload: right endpoint, auth headers, bytes and public URL.
  const url = await savePhoto(png, { extension: "png", contentType: "image/png" });
  const [upload] = storage.received;
  assert.equal(upload.method, "POST");
  assert.match(upload.url, /^\/storage\/v1\/object\/product-images\/products\/[0-9a-f-]{36}\.png$/);
  assert.equal(upload.headers.apikey, "test-secret-key");
  assert.equal(upload.headers.authorization, "Bearer test-secret-key");
  assert.equal(upload.headers["content-type"], "image/png");
  assert.equal(upload.headers["x-upsert"], "false");
  assert.deepEqual(upload.body, png);
  assert.equal(url, `${storage.url}/storage/v1/object/public/product-images/products/${path.basename(upload.url)}`);
  assert.equal(fs.existsSync(path.join(directory, "photos")), false, "Nothing is written to local disk");

  // Storage errors surface as 502 so the API reports a server-side failure.
  storage.failOnce();
  await assert.rejects(savePhoto(png, { extension: "png", contentType: "image/png" }), { status: 502 });

  // Migration: a product with a local photo moves to Supabase; a missing file is skipped.
  fs.mkdirSync(path.join(directory, "photos"));
  fs.writeFileSync(path.join(directory, "photos", "local.png"), png);
  await query("INSERT INTO users (id, name, email, password_hash, role) VALUES ('seller', 'S', 's@test.invalid', 'x', 'seller')");
  await query("INSERT INTO stalls (id, owner_id, name) VALUES ('stall', 'seller', 'Stall')");
  await query(`INSERT INTO products (id, stall_id, name, price, image_url) VALUES
    ('local', 'stall', 'Local', 1, '/api/product-images/local.png'),
    ('gone', 'stall', 'Gone', 1, '/api/product-images/gone.png'),
    ('static', 'stall', 'Static', 1, '/images/buyer/product-adobo.png')`);
  await closeDb();
  const child = spawn(process.execPath, ["scripts/migrate-photos.js"], { cwd: process.cwd(), env: process.env, stdio: ["ignore", "pipe", "pipe"] });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  const [code] = await once(child, "exit");
  assert.equal(code, 0, output);
  assert.match(output, /Moved 1 photo\(s\).*1 file\(s\) missing/);
  const rows = Object.fromEntries((await query("SELECT id, image_url FROM products")).map((row) => [row.id, row.image_url]));
  assert.match(rows.local, new RegExp(`^${storage.url}/storage/v1/object/public/product-images/products/`));
  assert.equal(rows.gone, "/api/product-images/gone.png");
  assert.equal(rows.static, "/images/buyer/product-adobo.png");
  assert.deepEqual(storage.received.at(-1).body, png);

  // On Supabase the schema also creates the public photo bucket, once.
  await exec("CREATE SCHEMA storage; CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[])");
  const schema = fs.readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
  await exec(schema);
  await exec(schema);
  assert.deepEqual(await query("SELECT id, public, file_size_limit FROM storage.buckets"), [{ id: "product-images", public: true, file_size_limit: 5242880 }]);
});
