import { Router as AdminRouter } from "express";
import { getAdminStats, getPendingStalls } from "../controllers/admin.controller.js";
import { getAllUsers } from "../controllers/auth.controller.js";
import { banUser } from "../controllers/admin.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
 
const adminRouter = AdminRouter();
 
adminRouter.use(verifyToken, requireRole("admin"));
 
adminRouter.get("/stats", getAdminStats);
adminRouter.get("/users", getAllUsers);
adminRouter.put("/users/:id/ban", banUser);
adminRouter.get("/stalls/pending", getPendingStalls);
 
export { adminRouter as default };
