import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/api.js";

/**
 * Custom hook for fetching and filtering products.
 * @param {object} initialFilters - Initial filter values
 */
export function useProducts(initialFilters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);

  const fetch = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const currentPage = reset ? 1 : page;
        const { data } = await productService.getAll({
          ...filters,
          page: currentPage,
          limit: 20,
        });
        setProducts((prev) =>
          reset || currentPage === 1 ? data.data : [...prev, ...data.data],
        );
        setTotal(data.total);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [filters, page],
  );

  useEffect(() => {
    fetch(true);
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (page > 1) fetch();
  }, [page]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const hasMore = products.length < total;

  return {
    products,
    loading,
    error,
    total,
    hasMore,
    filters,
    updateFilters,
    loadMore,
    refetch: () => fetch(true),
  };
}

export default useProducts;
