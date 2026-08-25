import { behaviorStore } from "../data/marketStore.js";

// POST /api/behavior
export const logBehavior = async (req, res, next) => {
  try {
    const product_id = req.body.product_id || req.params.productId;
    const { action } = req.body;

    const validActions = ["view", "cart_add", "purchase", "wishlist"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    await behaviorStore.log(req.user.id, product_id, action);
    res.status(201).json({ logged: true });
  } catch (err) {
    next(err);
  }
};
