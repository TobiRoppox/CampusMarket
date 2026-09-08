import { analyticsStore } from "../data/marketStore.js";

// GET /api/analytics/sales?period=30
export const getSalesAnalytics = async (req, res, next) => {
  try {
    const summary = await analyticsStore.salesSummary(
      req.user.id,
      req.user.role,
      req.query.period,
    );
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/products/top
export const getTopProducts = async (req, res, next) => {
  try {
    const top = await analyticsStore.topProducts(req.user.id, req.user.role, req.query.period);
    res.json(top);
  } catch (err) {
    next(err);
  }
};

// GET /api/analytics/categories
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await analyticsStore.categoryBreakdown(
      req.user.id,
      req.user.role,
      req.query.period,
    );
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
};
