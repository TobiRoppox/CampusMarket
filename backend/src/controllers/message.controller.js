import { messageStore } from "../data/marketStore.js";

// GET /api/messages  — all conversation partners
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await messageStore.listConversations(req.user.id);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

// GET /api/messages/:partnerId  — thread with one user
export const getMessages = async (req, res, next) => {
  try {
    const messages = await messageStore.listThread(req.user.id, req.params.partnerId);
    res.json(messages || []);
  } catch (err) {
    next(err);
  }
};

// POST /api/messages
export const sendMessage = async (req, res, next) => {
  try {
    const { receiver_id, product_id, content } = req.body;
    const message = await messageStore.send(req.user.id, receiver_id, content, product_id || null);
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};
