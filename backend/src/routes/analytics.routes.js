import { Router as AnalyticsRouter } from "express";
import {
  getSalesAnalytics,
  getTopProducts,
  getCategoryBreakdown,
} from "../controllers/analytics.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { stallStore } from "../data/marketStore.js";

const analyticsRouter = AnalyticsRouter();
analyticsRouter.use(verifyToken, requireRole("seller", "admin"), async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      const stall = await stallStore.getMy(req.user.id);
      if (stall?.tier !== "premium") return res.status(403).json({ error: "Product analytics are included in Premium. Contact the campus administrator to request a plan change.", code: "PREMIUM_REQUIRED" });
    }
    next();
  } catch (error) { next(error); }
});

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
