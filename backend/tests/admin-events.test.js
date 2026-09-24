import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("admin events persist layouts, protect assignments and reject stale saves", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "campus-admin-"));
  process.env.MARKET_DATA_FILE = path.join(directory, "data.json");
  fs.writeFileSync(process.env.MARKET_DATA_FILE, JSON.stringify({ users: [], stalls: [], products: [], orders: [{ total: 100, status: "completed", created_at: new Date().toISOString() }, { total: 900, status: "cancelled" }], behavior: [], events: [{ id: "existing" }], eventStalls: [{ id: "assigned", event_id: "existing", seller_id: "seller", status: "open", category: "food", stall_number: 1 }], applications: [] }));
  try {
    const { eventStore, adminStore } = await import("../src/data/marketStore.js");
    await assert.rejects(eventStore.saveEvent({ name: "", date: "bad" }, "admin"));
    const event = await eventStore.saveEvent({ name: "Campus Fair", location: "Grounds", date: "2026-10-01" }, "admin");
    const space = { id: "new", stall_number: 1, category: "food", status: "available", size: "3m x 3m", price: 300 };
    const saved = await eventStore.saveLayout(event.id, { version: 0, stalls: [space] }, "admin");
    assert.equal(saved.event.layout_version, 1);
    assert.equal((await eventStore.listStallsForEvent(event.id))[0].price, 300);
    await assert.rejects(eventStore.saveLayout(event.id, { version: 0, stalls: [space] }, "admin"), { status: 409 });
    await assert.rejects(eventStore.saveLayout(event.id, { version: 1, stalls: [{ ...saved.stalls[0], price: -1 }] }, "admin"));
    await assert.rejects(eventStore.saveLayout(event.id, { version: 1, stalls: [saved.stalls[0], { ...space, id: "duplicate-number" }] }, "admin"));
    await assert.rejects(eventStore.saveLayout("existing", { version: 0, stalls: [{ ...space, id: "assigned" }] }, "admin"), { status: 409 });
    await assert.rejects(eventStore.saveLayout(event.id, { version: 1, stalls: [] }, "admin"));
    const disk = JSON.parse(fs.readFileSync(process.env.MARKET_DATA_FILE, "utf8"));
    assert.equal(disk.eventStalls.find((s) => s.event_id === event.id).price, 300);
    assert.equal(disk.auditLog.length, 2);
    assert.equal((await adminStore.getStats()).total_revenue, 100);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("campus-admin-"));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
