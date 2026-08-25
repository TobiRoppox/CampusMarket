/**
 * aiService.js — Node.js client for the Python recommendation microservice.
 *
 * All HTTP communication with the Flask AI service is centralised here.
 * The backend (Express) never imports scikit-learn directly; it delegates
 * through these functions and handles fallbacks gracefully so the main
 * API stays fully functional even when the AI service is down.
 *
 * Environment variables:
 *   AI_SERVICE_URL     http://localhost:5001  (base URL of Flask app)
 *   AI_SERVICE_SECRET  Internal API key shared between Node and Flask
 *   AI_TIMEOUT_MS      Request timeout in milliseconds (default 6000)
 */

import axios from "axios";
import { supabase } from "../config/supabase.js";

const AI_BASE = process.env.AI_SERVICE_URL || "http://localhost:5001";
const AI_SECRET = process.env.AI_SERVICE_SECRET || "change-me-in-production";
const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 6000;

// ── Axios instance for the AI service ────────────────────────────────────────
const aiClient = axios.create({
  baseURL: AI_BASE,
  timeout: TIMEOUT_MS,
  headers: {
    "X-AI-Secret": AI_SECRET,
    "Content-Type": "application/json",
  },
});

// ── Logging helper ────────────────────────────────────────────────────────────
const log = {
  info: (msg) => console.log(`[aiService] ${msg}`),
  warn: (msg) => console.warn(`[aiService] WARN — ${msg}`),
  error: (msg, err) =>
    console.error(`[aiService] ERROR — ${msg}`, err?.message ?? err),
};

// ── Health check ──────────────────────────────────────────────────────────────
/**
 * Ping the AI service. Returns true if reachable.
 * @returns {Promise<boolean>}
 */
export async function pingAiService() {
  try {
    const res = await aiClient.get("/health");
    return res.data?.status === "ok";
  } catch {
    return false;
  }
}

// ── Collaborative filtering recommendations ───────────────────────────────────
/**
 * Fetch personalised product recommendations for a user.
 *
 * Falls back to the most popular products if:
 *  - The AI service is unreachable (network/timeout)
 *  - The AI service returns an empty list (cold start)
 *  - Any unexpected error occurs
 *
 * @param {string} userId - UUID of the buyer
 * @param {number} n      - Number of recommendations to request (default 12)
 * @returns {Promise<string[]>} Array of product UUIDs, ordered by relevance
 */
export async function getRecommendedProductIds(userId, n = 12) {
  if (!userId) return getPopularProductIds(n);

  try {
    const { data } = await aiClient.get(`/recommend/${userId}`, {
      params: { n },
    });

    const ids = data?.recommended_product_ids ?? [];

    if (ids.length === 0) {
      log.info(
        `No recs for user ${userId} (cold start) — using popular fallback`,
      );
      return getPopularProductIds(n);
    }

    log.info(`Returned ${ids.length} recs for user ${userId}`);
    return ids;
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      log.warn("AI service unreachable — using popular fallback");
    } else {
      log.error(`getRecommendedProductIds(${userId})`, err);
    }
    return getPopularProductIds(n);
  }
}

// ── Content-based similar products ───────────────────────────────────────────
/**
 * Fetch products similar to a given product (content-based filtering).
 *
 * Falls back to same-category products from Supabase if AI is unavailable.
 *
 * @param {string} productId - UUID of the reference product
 * @param {number} n         - Number of similar products to return (default 8)
 * @returns {Promise<string[]>} Array of similar product UUIDs
 */
export async function getSimilarProductIds(productId, n = 8) {
  if (!productId) return [];

  try {
    const { data } = await aiClient.get(`/similar/${productId}`, {
      params: { n },
    });

    const ids = data?.similar_product_ids ?? [];

    if (ids.length > 0) {
      log.info(`Returned ${ids.length} similar products for ${productId}`);
      return ids;
    }
  } catch (err) {
    if (err.code !== "ECONNREFUSED" && err.code !== "ETIMEDOUT") {
      log.error(`getSimilarProductIds(${productId})`, err);
    }
  }

  // Fallback: same category
  return getSameCategoryProductIds(productId, n);
}

// ── Fallback helpers (Supabase queries) ───────────────────────────────────────

/**
 * Return the most interacted-with product IDs across all users.
 * Used as the cold-start / AI-unavailable fallback.
 *
 * @param {number} n
 * @returns {Promise<string[]>}
 */
export async function getPopularProductIds(n = 12) {
  try {
    const { data } = await supabase
      .from("user_behavior")
      .select("product_id, action")
      .limit(500);

    if (!data || data.length === 0) return getNewestProductIds(n);

    const WEIGHTS = { view: 1, cart_add: 3, wishlist: 2, purchase: 5 };
    const scores = {};

    for (const row of data) {
      const w = WEIGHTS[row.action] ?? 1;
      scores[row.product_id] = (scores[row.product_id] ?? 0) + w;
    }

    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => id);

    return sorted;
  } catch (err) {
    log.error("getPopularProductIds", err);
    return getNewestProductIds(n);
  }
}

/**
 * Return IDs of the newest active products.
 * Final fallback when even the behavior table is empty.
 *
 * @param {number} n
 * @returns {Promise<string[]>}
 */
export async function getNewestProductIds(n = 12) {
  try {
    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(n);

    return (data ?? []).map((p) => p.id);
  } catch {
    return [];
  }
}

/**
 * Return IDs of products in the same category as a reference product.
 * Fallback for getSimilarProductIds when AI is down.
 *
 * @param {string} productId
 * @param {number} n
 * @returns {Promise<string[]>}
 */
async function getSameCategoryProductIds(productId, n) {
  try {
    const { data: ref } = await supabase
      .from("products")
      .select("category")
      .eq("id", productId)
      .single();

    if (!ref?.category) return [];

    const { data } = await supabase
      .from("products")
      .select("id")
      .eq("category", ref.category)
      .eq("is_active", true)
      .neq("id", productId)
      .limit(n);

    return (data ?? []).map((p) => p.id);
  } catch {
    return [];
  }
}

// ── Log a behavior event (convenience wrapper) ────────────────────────────────
/**
 * Insert a user-behavior record into Supabase.
 * Called by order.controller.js after purchase and optionally from
 * other places that want to log events server-side (not just from the
 * frontend /api/behavior endpoint).
 *
 * @param {{ userId: string, productId: string, action: string }} param0
 */
export async function logBehavior({ userId, productId, action }) {
  const validActions = ["view", "cart_add", "purchase", "wishlist"];
  if (!validActions.includes(action)) return;

  try {
    await supabase
      .from("user_behavior")
      .insert({ user_id: userId, product_id: productId, action });
  } catch (err) {
    log.error("logBehavior", err);
  }
}

export default {
  pingAiService,
  getRecommendedProductIds,
  getSimilarProductIds,
  getPopularProductIds,
  getNewestProductIds,
  logBehavior,
};
