import { Router } from "express";
import { register, login, refresh, me, updateProfile } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { validate, registerSchema, loginSchema } from "../middleware/validate.js";
 
const router = Router();
 
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.get("/me", verifyToken, me);
router.put("/profile", verifyToken, updateProfile);
 
export default router;