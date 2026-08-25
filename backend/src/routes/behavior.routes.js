import { Router as BehaviorRouter } from "express";
import { logBehavior } from "../controllers/behavior.controller.js";
import { verifyToken } from "../middleware/auth.js";
 
const behaviorRouter = BehaviorRouter();
 
behaviorRouter.post("/:productId", verifyToken, logBehavior);
behaviorRouter.post("/", verifyToken, logBehavior);
 
export { behaviorRouter as default }