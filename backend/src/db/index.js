/**
 * Database access.
 *
 *  - DATABASE_URL set  → PostgreSQL (Supabase in production) via `pg`.
 *  - otherwise         → embedded PGlite (real Postgres in WebAssembly) stored in
 *                        PGLITE_DIR (default backend/.data/pglite, or "memory://").
 *
 * Both return numbers for NUMERIC/BIGINT, ISO strings for timestamps and
 * "YYYY-MM-DD" strings for dates, so callers never see driver differences.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = fileURLToPath(new URL("../../", import.meta.url));
const schemaFile = path.join(backendRoot, "database/schema.sql");

const OID = { INT8: 20, NUMERIC: 1700, DATE: 1082, TIMESTAMP: 1114, TIMESTAMPTZ: 1184 };
// pg sends "2026-09-25 04:15:01.17+00"; PGlite sends ISO-like text. Normalise both.
const toIso = (value) => new Date(String(value).replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00")).toISOString();
const parsers = {
  [OID.INT8]: Number,
  [OID.NUMERIC]: Number,
  [OID.DATE]: String,
  [OID.TIMESTAMP]: (value) => toIso(`${value}Z`),
  [OID.TIMESTAMPTZ]: toIso,
};

const connectPostgres = async (connectionString) => {
  const { default: pg } = await import("pg");
  for (const [oid, parse] of Object.entries(parsers)) pg.types.setTypeParser(Number(oid), parse);
  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  const pool = new pg.Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_SIZE) || 10,
    ssl: local || process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
  pool.on("error", (error) => console.error("[db] idle client error:", error.message));
  return {
    query: async (text, params) => (await pool.query(text, params)).rows,
    exec: async (text) => { await pool.query(text); },
    transaction: async (fn) => {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn((text, params) => client.query(text, params).then((r) => r.rows));
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
};

const connectPglite = async (dataDir) => {
  const { PGlite } = await import("@electric-sql/pglite");
  if (!dataDir.startsWith("memory://")) fs.mkdirSync(dataDir, { recursive: true });
  const db = await PGlite.create(dataDir, { parsers });
  return {
    query: async (text, params) => (await db.query(text, params)).rows,
    exec: async (text) => { await db.exec(text); },
    transaction: (fn) => db.transaction((tx) => fn((text, params) => tx.query(text, params).then((r) => r.rows))),
    close: () => db.close(),
  };
};

let connecting = null;

/** Connect once, apply the schema and run the optional startup hook. */
export const getDb = () => {
  connecting ??= (async () => {
    const db = process.env.DATABASE_URL
      ? await connectPostgres(process.env.DATABASE_URL)
      : await connectPglite(process.env.PGLITE_DIR || path.join(backendRoot, ".data/pglite"));
    await db.exec(fs.readFileSync(schemaFile, "utf8"));
    return db;
  })().catch((error) => {
    connecting = null;
    throw error;
  });
  return connecting;
};

/** Run a query and return all rows. */
export const query = async (text, params = []) => (await getDb()).query(text, params);

/** Run a query and return the first row or null. */
export const one = async (text, params = []) => (await query(text, params))[0] ?? null;

/**
 * Run `fn(q)` inside a transaction. `q(text, params)` returns rows.
 * Any thrown error rolls everything back.
 */
export const transaction = async (fn) => (await getDb()).transaction(fn);

export const closeDb = async () => {
  if (!connecting) return;
  const db = await connecting;
  connecting = null;
  await db.close();
};

export const databaseLabel = () => (process.env.DATABASE_URL ? "PostgreSQL" : `PGlite (${process.env.PGLITE_DIR || ".data/pglite"})`);
