import { useState, useEffect } from "react";
import { productService } from "../services/api.js";

/**
 * Hook for fetching AI-powered product recommendations for a user.
 * Falls back gracefully when AI service is unavailable.
 */
export function useRecommendations(userId) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    productService
      .getRecommendations(userId)
      .then(({ data }) => setRecommendations(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load recommendations");
        setRecommendations([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { recommendations, loading, error };
}

/**
 * Hook for fetching similar products (content-based filtering).
 */
export function useSimilarProducts(productId) {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    productService
      .getSimilar(productId)
      .then(({ data }) => setSimilar(Array.isArray(data) ? data : []))
      .catch(() => setSimilar([]))
      .finally(() => setLoading(false));
  }, [productId]);

  return { similar, loading };
}

export default useRecommendations;
