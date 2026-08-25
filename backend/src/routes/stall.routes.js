import { Router as StallRouter } from "express";
import {
  getStalls, getStall, createStall, updateStall,
  updateStallStatus, getMyStall,
} from "../controllers/stall.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate, stallSchema } from "../middleware/validate.js";
 
const stallRouter = StallRouter();
 
stallRouter.get("/", getStalls);
stallRouter.get("/my", verifyToken, requireRole("seller"), getMyStall);
stallRouter.get("/:id", getStall);
stallRouter.post("/", verifyToken, requireRole("seller"), validate(stallSchema), createStall);
stallRouter.put("/:id", verifyToken, requireRole("seller", "admin"), updateStall);
stallRouter.put("/:id/status", verifyToken, requireRole("admin"), updateStallStatus);
 
export { stallRouter as default };