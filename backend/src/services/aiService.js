/**
 * aiService.js — client for the Python recommendation service (ai-service/).
 *
 * The AI service only returns product IDs. Callers load the products
 * themselves and fall back to simple rules whenever this returns [] —
 * the service being unset, down, slow or having no data for a user.
 *
 * Environment variables:
 *   AI_SERVICE_URL     e.g. http://localhost:5002 (unset = AI disabled)
 *   AI_SERVICE_SECRET  shared secret, sent as X-AI-Secret
 *   AI_TIMEOUT_MS      request timeout (default 3000)
 */

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 3000;

const fetchIds = async (path, key) => {
  const base = process.env.AI_SERVICE_URL;
  if (!base) return [];
  try {
    const response = await fetch(new URL(path, base), {
      headers: { "X-AI-Secret": process.env.AI_SERVICE_SECRET || "" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`[aiService] ${path} returned ${response.status}`);
      return [];
    }
    const ids = (await response.json())?.[key];
    return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
  } catch (error) {
    console.warn(`[aiService] ${path} unavailable: ${error.message}`);
    return [];
  }
};

/** Personalised product IDs for a user, best first. */
export const getRecommendedProductIds = (userId, n = 12) =>
  fetchIds(`/recommend/${encodeURIComponent(userId)}?n=${n}`, "recommended_product_ids");

/** Product IDs similar to a product, best first. */
export const getSimilarProductIds = (productId, n = 8) =>
  fetchIds(`/similar/${encodeURIComponent(productId)}?n=${n}`, "similar_product_ids");
