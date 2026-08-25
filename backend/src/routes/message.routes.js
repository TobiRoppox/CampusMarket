import { Router as MessageRouter } from "express";
import { getConversations, getMessages, sendMessage } from "../controllers/message.controller.js";
import { verifyToken } from "../middleware/auth.js";
import { validate, messageSchema } from "../middleware/validate.js";
 
const messageRouter = MessageRouter();
 
messageRouter.get("/", verifyToken, getConversations);
messageRouter.get("/:partnerId", verifyToken, getMessages);
messageRouter.post("/", verifyToken, validate(messageSchema), sendMessage);
 
export { messageRouter as default };
