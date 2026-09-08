import { Router } from "express";
import { posStore } from "../data/marketStore.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate, posSchema } from "../middleware/validate.js";
const router = Router();
router.use(verifyToken, requireRole("seller"));
router.get("/customers", async (req, res, next) => {
  try { res.json(await posStore.customers(req.query.q)); } catch (error) { next(error); }
});
router.get("/sales", async (req, res, next) => {
  try { res.json(await posStore.list(req.user.id)); } catch (error) { next(error); }
});
router.post("/sales", validate(posSchema), async (req, res, next) => {
  try { res.status(201).json(await posStore.create(req.user.id, req.body)); } catch (error) { next(error); }
});
export default router;
