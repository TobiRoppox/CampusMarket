export const CANCELLATION_WINDOW_MS = 10 * 60 * 1000;
const CANCELLABLE_STATUSES = new Set(["pending", "confirmed", "preparing", "ready"]);

export const cancellationDeadline = (order) => {
  const created = Date.parse(order.created_at);
  return Number.isFinite(created) ? created + CANCELLATION_WINDOW_MS : null;
};

export const canBuyerCancel = (order, now = Date.now()) => {
  const deadline = cancellationDeadline(order);
  return deadline !== null && now >= deadline - CANCELLATION_WINDOW_MS && now < deadline && CANCELLABLE_STATUSES.has(order.status);
};
