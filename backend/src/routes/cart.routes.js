import { Router as CartRouter } from "express";
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from "../controllers/cart.controller.js";
import { verifyToken } from "../middleware/auth.js";
 
const cartRouter = CartRouter();
 
cartRouter.get("/", verifyToken, getCart);
cartRouter.post("/", verifyToken, addToCart);
cartRouter.put("/:id", verifyToken, updateCartItem);
cartRouter.delete("/clear", verifyToken, clearCart);
cartRouter.delete("/:id", verifyToken, removeCartItem);
 
export { cartRouter as default };