import { Router as ProductRouter } from "express";
import {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, getRecommendations, getSimilar,
} from "../controllers/product.controller.js";
import { verifyToken, requireRole, optionalAuth } from "../middleware/auth.js";
import { validate, productSchema } from "../middleware/validate.js";
 
const productRouter = ProductRouter();
 
productRouter.get("/", getProducts);
productRouter.get("/recommendations/:userId", verifyToken, getRecommendations);
productRouter.get("/similar/:productId", getSimilar);
productRouter.get("/:id", optionalAuth, getProduct);
productRouter.post("/", verifyToken, requireRole("seller"), validate(productSchema), createProduct);
productRouter.put("/:id", verifyToken, requireRole("seller", "admin"), updateProduct);
productRouter.delete("/:id", verifyToken, requireRole("seller", "admin"), deleteProduct);
 
export { productRouter as default };