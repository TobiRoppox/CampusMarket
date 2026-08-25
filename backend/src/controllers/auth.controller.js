import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authStore } from "../data/marketStore.js";

// ── TOKEN HELPERS ─────────────────────────────────────────────
const signAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: "refresh" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

// ── REGISTER ─────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "buyer" } = req.body;
    const user = await authStore.registerUser({ name, email, password, role });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authStore.loginUser(email, password);
    const { password_hash: _, ...userSafe } = user;

    const accessToken = signAccessToken(userSafe);
    const refreshToken = signRefreshToken(user.id);

    res.json({ user: userSafe, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ── REFRESH TOKEN ────────────────────────────────────────────
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (payload.type !== "refresh") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    const user = await authStore.getUserById(payload.id);
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user.id);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

// ── GET CURRENT USER ─────────────────────────────────────────
export const me = async (req, res, next) => {
  try {
    const user = await authStore.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ── UPDATE PROFILE ───────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar_url } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar_url) updates.avatar_url = avatar_url;

    const data = await authStore.updateUserProfile(req.user.id, updates);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ── ADMIN: GET ALL USERS ─────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await authStore.listUsers({
      role: req.query.role,
      q: req.query.q,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};
