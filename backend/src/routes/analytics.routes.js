import { Router as AnalyticsRouter } from "express";
import {
  getSalesAnalytics,
  getTopProducts,
  getCategoryBreakdown,
} from "../controllers/analytics.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const analyticsRouter = AnalyticsRouter();

analyticsRouter.get(
  "/sales",
  verifyToken,
  requireRole("seller", "admin"),
  getSalesAnalytics,
);
analyticsRouter.get(
  "/products/top",
  verifyToken,
  requireRole("seller", "admin"),
  getTopProducts,
);
analyticsRouter.get(
  "/categories",
  verifyToken,
  requireRole("seller", "admin"),
  getCategoryBreakdown,
);

export { analyticsRouter as default };
