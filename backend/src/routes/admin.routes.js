import { authStore, stallStore, eventStore } from "../data/marketStore.js";
import { validate, reviewRegistrationSchema } from "../middleware/validate.js";
import { Router as AdminRouter } from "express";
import { getAdminStats, getPendingStalls } from "../controllers/admin.controller.js";
import { getAllUsers } from "../controllers/auth.controller.js";
import { banUser } from "../controllers/admin.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
 
const adminRouter = AdminRouter();
 
adminRouter.use(verifyToken, requireRole("admin"));
adminRouter.post("/events", async (req, res, next) => {
  try { res.status(201).json(await eventStore.saveEvent(req.body, req.user.id)); } catch (error) { next(error); }
});
adminRouter.put("/events/:id/layout", async (req, res, next) => {
  try { res.json(await eventStore.saveLayout(req.params.id, req.body, req.user.id)); } catch (error) { next(error); }
});
 
adminRouter.put("/users/:id/review", validate(reviewRegistrationSchema), async (req, res, next) => {
  try { res.json(await authStore.reviewRegistration(req.params.id, req.user.id, req.body)); } catch (error) { next(error); }
});
adminRouter.get("/stalls", async (_req, res, next) => {
  try { res.json(await stallStore.listStalls()); } catch (error) { next(error); }
});
adminRouter.put("/stalls/:id/plan", async (req, res, next) => {
  try { res.json(await stallStore.setPlan(req.params.id, req.body.tier, req.user.id)); } catch (error) { next(error); }
});
adminRouter.get("/stats", getAdminStats);
adminRouter.get("/users", getAllUsers);
adminRouter.put("/users/:id/ban", banUser);
adminRouter.get("/stalls/pending", getPendingStalls);
 
export { adminRouter as default };
