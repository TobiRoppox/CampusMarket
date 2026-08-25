import { stallStore } from "../data/marketStore.js";

export const getStalls = async (req, res, next) => {
  try {
    const { q, status, active } = req.query;
    const stalls = await stallStore.listStalls({
      q,
      status,
      activeOnly: active === "true",
    });
    res.json(stalls);
  } catch (err) {
    next(err);
  }
};

export const getStall = async (req, res, next) => {
  try {
    const stall = await stallStore.getById(req.params.id);
    res.json(stall);
  } catch (err) {
    next(err);
  }
};

export const createStall = async (req, res, next) => {
  try {
    const stall = await stallStore.create(req.user.id, req.body);
    res.status(201).json(stall);
  } catch (err) {
    next(err);
  }
};

export const updateStall = async (req, res, next) => {
  try {
    const stall = await stallStore.update(req.params.id, req.user.id, req.body);
    res.json(stall);
  } catch (err) {
    next(err);
  }
};

export const updateStallStatus = async (req, res, next) => {
  try {
    const stall = await stallStore.updateStatus(req.params.id, req.body.status);
    res.json(stall);
  } catch (err) {
    next(err);
  }
};

export const getMyStall = async (req, res, next) => {
  try {
    const stall = await stallStore.getMy(req.user.id);
    res.json(stall);
  } catch (err) {
    next(err);
  }
};
