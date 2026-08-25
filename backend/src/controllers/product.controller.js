import { productStore, stallStore } from "../data/marketStore.js";

export const getProducts = async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 20, stall_id: stallId } = req.query;
    const result = await productStore.listProducts({
      q,
      category,
      page,
      limit,
      stallId,
      activeOnly: true,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getProduct = async (req, res, next) => {
  try {
    const product = await productStore.getById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const myStall = await stallStore.getMy(req.user.id);
    const stallId = myStall?.id || req.body.stall_id;
    if (!stallId) {
      return res.status(403).json({ error: "You need an approved stall before listing products" });
    }

    const product = await productStore.create(stallId, req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productStore.update(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productStore.remove(req.params.id);
    res.json({ message: "Product removed" });
  } catch (err) {
    next(err);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const products = await productStore.getRecommendations(req.params.userId);
    res.json(products);
  } catch (err) {
    next(err);
  }
};

export const getSimilar = async (req, res, next) => {
  try {
    const products = await productStore.getSimilar(req.params.productId);
    res.json(products);
  } catch (err) {
    next(err);
  }
};
