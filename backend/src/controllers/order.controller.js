import { orderStore } from "../data/marketStore.js";

// ── POST /api/orders ──────────────────────────────────────────────────────────
export const createOrder = async (req, res, next) => {
  try {
    const { items, delivery_notes } = req.body;
    const order = await orderStore.create(req.user.id, items, delivery_notes);
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders/buyer ─────────────────────────────────────────────────────
export const getBuyerOrders = async (req, res, next) => {
  try {
    const orders = await orderStore.listBuyer(req.user.id);
    res.json(orders || []);
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders/seller ────────────────────────────────────────────────────
export const getSellerOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const orders = await orderStore.listSeller(req.user.id, status);
    res.json(orders || []);
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/orders/:id/status ────────────────────────────────────────────────
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "ready", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await orderStore.updateStatus(req.params.id, status, req.user.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
};