import { Router as OrderRouter } from "express";
import { createOrder, getBuyerOrders, getSellerOrders, updateOrderStatus } from "../controllers/order.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { validate, orderSchema } from "../middleware/validate.js";
 
const orderRouter = OrderRouter();
 
orderRouter.post("/", verifyToken, requireRole("buyer"), validate(orderSchema), createOrder);
orderRouter.get("/buyer", verifyToken, requireRole("buyer"), getBuyerOrders);
orderRouter.get("/seller", verifyToken, requireRole("seller"), getSellerOrders);
orderRouter.put("/:id/status", verifyToken, updateOrderStatus);
 
export { orderRouter as default };