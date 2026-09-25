import { test } from "node:test";
import assert from "node:assert/strict";

test("admin events persist layouts, protect assignments and reject stale saves", async (t) => {
  process.env.PGLITE_DIR = "memory://";
  process.env.SEED_DEMO = "false";
  delete process.env.DATABASE_URL;
  const { query, closeDb } = await import("../src/db/index.js");
  const { eventStore, adminStore, ready } = await import("../src/data/marketStore.js");
  t.after(closeDb);
  await ready();

  await query("INSERT INTO users (id, name, email, password_hash, role, status) VALUES ('buyer', 'B', 'b@test.invalid', 'x', 'buyer', 'approved'), ('seller', 'S', 's@test.invalid', 'x', 'seller', 'approved')");
  await query("INSERT INTO orders (buyer_id, seller_id, total, status) VALUES ('buyer', 'seller', 100, 'completed'), ('buyer', 'seller', 900, 'cancelled')");
  await query("INSERT INTO events (id, name, date, location) VALUES ('existing', 'Existing', '2026-09-01', 'Grounds')");
  await query("INSERT INTO event_stalls (id, event_id, seller_id, status, category, stall_number) VALUES ('assigned', 'existing', 'seller', 'open', 'food', 1)");

  await assert.rejects(eventStore.saveEvent({ name: "", date: "bad" }, "admin"));
  const event = await eventStore.saveEvent({ name: "Campus Fair", location: "Grounds", date: "2026-10-01" }, "admin");
  assert.equal(event.date, "2026-10-01");
  const space = { id: "new", stall_number: 1, category: "food", status: "available", size: "3m x 3m", price: 300 };
  const saved = await eventStore.saveLayout(event.id, { version: 0, stalls: [space] }, "admin");
  assert.equal(saved.event.layout_version, 1);
  assert.equal((await eventStore.listStallsForEvent(event.id))[0].price, 300);
  await assert.rejects(eventStore.saveLayout(event.id, { version: 0, stalls: [space] }, "admin"), { status: 409 });
  await assert.rejects(eventStore.saveLayout(event.id, { version: 1, stalls: [{ ...saved.stalls[0], price: -1 }] }, "admin"));
  await assert.rejects(eventStore.saveLayout(event.id, { version: 1, stalls: [saved.stalls[0], { ...space, id: "duplicate-number" }] }, "admin"));
  await assert.rejects(eventStore.saveLayout("existing", { version: 0, stalls: [{ ...space, id: "assigned" }] }, "admin"), { status: 409 });
  await assert.rejects(eventStore.saveLayout(event.id, { version: 1, stalls: [] }, "admin"));

  // Failed saves must leave the stored layout untouched.
  const stored = await query("SELECT price FROM event_stalls WHERE event_id = $1", [event.id]);
  assert.deepEqual(stored, [{ price: 300 }]);
  assert.equal((await query("SELECT count(*) FROM audit_log"))[0].count, 2);
  assert.equal((await adminStore.getStats()).total_revenue, 100);
});
