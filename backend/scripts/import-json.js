/**
 * Copy the old JSON data file into the database.
 *
 *   npm run db:import                         # imports src/data/market-data.json
 *   npm run db:import -- path/to/file.json
 *
 * Uses DATABASE_URL when set (e.g. Supabase), otherwise the local PGlite database.
 * Safe to rerun: rows whose ID already exists are skipped. Everything runs in one
 * transaction, so a failure leaves the database unchanged.
 */
import "dotenv/config";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { closeDb, databaseLabel, getDb, transaction } from "../src/db/index.js";

process.env.SEED_DEMO = "false";
const file = process.argv[2] || fileURLToPath(new URL("../src/data/market-data.json", import.meta.url));
const state = JSON.parse(fs.readFileSync(file, "utf8"));
const list = (key) => (Array.isArray(state[key]) ? state[key] : []);

const report = {};
const insert = async (run, table, row, columns) => {
  const present = columns.filter((column) => row[column] !== undefined);
  const result = await run(
    `INSERT INTO ${table} (${present.join(", ")}) VALUES (${present.map((_, i) => `$${i + 1}`).join(", ")})
     ON CONFLICT DO NOTHING RETURNING 1`,
    present.map((column) => row[column]),
  );
  report[table] ??= { imported: 0, skipped: 0 };
  report[table][result.length ? "imported" : "skipped"] += 1;
  return result.length > 0;
};
const skip = (table, reason) => {
  report[table] ??= { imported: 0, skipped: 0 };
  report[table].skipped += 1;
  console.warn(`[skip] ${table}: ${reason}`);
};

await getDb();
console.log(`Importing ${file} into ${databaseLabel()}...`);

await transaction(async (run) => {
  const exists = async (table, id) => Boolean(id) && (await run(`SELECT 1 FROM ${table} WHERE id = $1`, [id])).length > 0;

  for (const user of list("users")) {
    await insert(run, "users", { ...user, email: user.email?.toLowerCase() }, [
      "id", "name", "email", "password_hash", "role", "status", "campus_id", "affiliation", "department", "campus",
      "avatar_url", "is_banned", "review_note", "reviewed_by", "reviewed_at", "password_changed_at", "created_at"]);
  }
  for (const stall of list("stalls")) {
    await insert(run, "stalls", stall, ["id", "owner_id", "name", "description", "banner_url", "logo_url", "location",
      "category", "contact_number", "operating_hours", "status", "tier", "is_active", "created_at"]);
  }
  for (const product of list("products")) {
    await insert(run, "products", product, ["id", "stall_id", "name", "description", "price", "stock", "category",
      "image_url", "is_active", "is_featured", "view_count", "created_at"]);
  }
  for (const item of list("carts")) {
    if (!(await exists("products", item.product_id))) { skip("cart_items", `product ${item.product_id} no longer exists`); continue; }
    await insert(run, "cart_items", item, ["id", "user_id", "product_id", "quantity"]);
  }
  const productStall = new Map(list("products").map((product) => [product.id, product.stall_id]));
  for (const order of list("orders")) {
    const stallId = order.stall_id || productStall.get(order.items?.[0]?.product_id);
    const row = { ...order, stall_id: (await exists("stalls", stallId)) ? stallId : null };
    if (await insert(run, "orders", row, ["id", "buyer_id", "seller_id", "stall_id", "total", "status", "delivery_notes",
      "fulfillment", "cancelled_at", "created_at"])) {
      for (const item of order.items || []) {
        await insert(run, "order_items", { ...item, order_id: order.id, name: item.name || item.product_name || "Item" },
          ["order_id", "product_id", "name", "image_url", "quantity", "unit_price"]);
      }
    }
  }
  for (const sale of list("posSales")) {
    if (await insert(run, "pos_sales", sale, ["id", "request_id", "seller_id", "buyer_id", "buyer_name", "stall_id",
      "stall_name", "total", "cash_received", "change", "status", "source", "created_at"])) {
      for (const item of sale.items || []) {
        await insert(run, "pos_sale_items", { ...item, sale_id: sale.id }, ["sale_id", "product_id", "name", "quantity", "unit_price"]);
      }
    }
  }
  for (const message of list("messages")) {
    await insert(run, "messages", message, ["id", "sender_id", "receiver_id", "product_id", "content", "read_status", "sent_at"]);
  }
  for (const entry of list("behavior")) {
    if (!["view", "cart_add", "purchase", "wishlist"].includes(entry.action)) { skip("user_behavior", `unknown action ${entry.action}`); continue; }
    await insert(run, "user_behavior", entry, ["id", "user_id", "product_id", "action", "created_at"]);
  }
  for (const event of list("events")) {
    const date = event.date || event.start_date?.slice(0, 10);
    if (!date) { skip("events", `event ${event.id} has no date`); continue; }
    await insert(run, "events", { ...event, date }, ["id", "name", "date", "start_date", "end_date", "location",
      "description", "image_url", "is_demo", "layout_version", "created_at"]);
  }
  for (const stall of list("eventStalls")) {
    await insert(run, "event_stalls", stall, ["id", "event_id", "stall_number", "category", "status", "size", "price",
      "stall_id", "seller_id", "name", "description", "location"]);
  }
  for (const application of list("applications")) {
    await insert(run, "seller_applications", application, ["id", "seller_id", "event_id", "stall_name", "business_name",
      "product_category", "product_list", "preferred_stall_size", "duration", "contact_info", "status", "created_at"]);
  }
  for (const entry of list("auditLog")) {
    await insert(run, "audit_log", entry, ["id", "actor_id", "action", "target_id", "note", "created_at"]);
  }
});

console.table(report);
await closeDb();
