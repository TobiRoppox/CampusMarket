import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { canBuyerCancel } from "../src/config/orderCancellation.js";

test("buyer cancellation enforces ten minutes and restores stock only once", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "campus-cancellation-"));
  const previousFile = process.env.MARKET_DATA_FILE;
  process.env.MARKET_DATA_FILE = path.join(directory, "market-data.json");
  t.after(() => {
    if (previousFile === undefined) delete process.env.MARKET_DATA_FILE;
    else process.env.MARKET_DATA_FILE = previousFile;
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("campus-cancellation-"));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const now = Date.parse("2026-09-08T12:00:00Z");
  t.mock.method(Date, "now", () => now);
  const makeOrder = (id, age, status = "pending") => ({ id, buyer_id: "buyer", seller_id: "seller", status, created_at: new Date(now - age).toISOString(), items: [{ product_id: "product", quantity: 2, unit_price: 89 }] });
  const orders = [
    makeOrder("new", 0), makeOrder("just-before", 599999), makeOrder("exact", 600000),
    makeOrder("expired", 600001), makeOrder("confirmed", 1000, "confirmed"),
    makeOrder("ready", 1000, "ready"), makeOrder("delivered", 1000, "delivered"),
    makeOrder("cancelled", 1000, "cancelled"), makeOrder("foreign", 1000),
    makeOrder("future", -1000), { ...makeOrder("invalid", 0), created_at: "invalid" },
  ];
  fs.writeFileSync(process.env.MARKET_DATA_FILE, JSON.stringify({ users: [], stalls: [], products: [{ id: "product", stock: 100 }], orders }));
  const { orderStore } = await import("../src/data/marketStore.js");
  const stock = () => JSON.parse(fs.readFileSync(process.env.MARKET_DATA_FILE, "utf8")).products[0].stock;
  for (const id of ["new", "just-before", "confirmed", "ready"]) {
    const before = stock();
    const result = await orderStore.updateStatus(id, "cancelled", "buyer", "buyer");
    assert.equal(result.status, "cancelled");
    assert.ok(result.cancelled_at);
    assert.equal(stock(), before + 2);
    await assert.rejects(orderStore.updateStatus(id, "cancelled", "buyer", "buyer"), { status: 409 });
    assert.equal(stock(), before + 2, "Repeated requests must not restore stock twice");
  }
  for (const id of ["exact", "expired", "delivered", "cancelled", "future", "invalid"]) {
    const before = stock();
    assert.equal(canBuyerCancel(orders.find((order) => order.id === id), now), false);
    await assert.rejects(orderStore.updateStatus(id, "cancelled", "buyer", "buyer"), { status: 409 });
    assert.equal(stock(), before);
  }
  await assert.rejects(orderStore.updateStatus("foreign", "cancelled", "another-buyer", "buyer"), { status: 403 });
  await assert.rejects(orderStore.updateStatus("foreign", "confirmed", "buyer", "buyer"), { status: 403 });
  // A seller must not advance an order after its buyer has cancelled it.
  await assert.rejects(orderStore.updateStatus("new", "confirmed", "seller", "seller"), { status: 400 });
});
