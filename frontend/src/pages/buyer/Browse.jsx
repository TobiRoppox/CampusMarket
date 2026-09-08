import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCoffee,
  FiGrid,
  FiMonitor,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiSliders,
  FiTag,
  FiX,
} from "react-icons/fi";
import Navbar from "../../components/common/Navbar.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { SkeletonGrid } from "../../components/common/Ui.jsx";
import { productService } from "../../services/api.js";

import "./Browse.css";

const CATEGORIES = [
  { id: "food", name: "Food", icon: FiCoffee },
  { id: "clothing", name: "Clothing", icon: FiShoppingBag },
  { id: "electronics", name: "Electronics", icon: FiMonitor },
  { id: "accessories", name: "Accessories", icon: FiTag },
  { id: "student-made", name: "Student Made", icon: FiPackage },
  { id: "other", name: "Other", icon: FiSliders },
];

const FILTER_KEYS = ["q", "category", "min_price", "max_price"];

const getFiltersFromParams = (params) => ({
  q: params.get("q")?.trim() || "",
  category: params.get("category") || "",
  min_price: params.get("min_price") || "",
  max_price: params.get("max_price") || "",
});

const compactFilters = (filters) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== "" && value != null,
    ),
  );

const filtersAreEqual = (left, right) => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => left[key] === right[key])
  );
};

const mergeUniqueProducts = (currentProducts, nextProducts) => {
  const productsById = new Map();

  [...currentProducts, ...nextProducts].forEach((product) => {
    productsById.set(product.id, product);
  });

  return Array.from(productsById.values());
};

function useBrowseProducts(initialFilters = {}, limit = 20) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(() => ({ ...initialFilters }));
  const [refreshKey, setRefreshKey] = useState(0);
  const latestRequestRef = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    let active = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await productService.getAll({
          ...compactFilters(filters),
          page,
          limit,
        });

        if (!active || latestRequestRef.current !== requestId) return;

        const nextProducts = Array.isArray(data?.data) ? data.data : [];
        const nextTotal = Number(data?.total) || 0;

        setProducts((currentProducts) =>
          page === 1
            ? nextProducts
            : mergeUniqueProducts(currentProducts, nextProducts),
        );
        setTotal(nextTotal);
      } catch (requestError) {
        if (!active || latestRequestRef.current !== requestId) return;

        setError(
          requestError.response?.data?.error ||
            requestError.message ||
            "Failed to load products",
        );

        if (page === 1) {
          setProducts([]);
          setTotal(0);
        }
      } finally {
        if (active && latestRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [filters, limit, page, refreshKey]);

  const updateFilters = useCallback((newFilters) => {
    const nextFilters = { ...filtersRef.current, ...newFilters };
    if (filtersAreEqual(filtersRef.current, nextFilters)) return;

    filtersRef.current = nextFilters;
    setProducts([]);
    setTotal(0);
    setPage(1);
    setFilters(nextFilters);
  }, []);

  const replaceFilters = useCallback((newFilters = {}) => {
    const nextFilters = { ...newFilters };
    if (filtersAreEqual(filtersRef.current, nextFilters)) return;

    filtersRef.current = nextFilters;
    setProducts([]);
    setTotal(0);
    setPage(1);
    setFilters(nextFilters);
  }, []);

  const loadMore = useCallback(() => {
    if (loading || products.length >= total) return;
    setPage((currentPage) => currentPage + 1);
  }, [loading, products.length, total]);

  const refetch = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return {
    products,
    loading,
    error,
    total,
    hasMore: products.length < total,
    isInitialLoading: loading && page === 1,
    isLoadingMore: loading && page > 1,
    filters,
    updateFilters,
    replaceFilters,
    loadMore,
    refetch,
  };
}

function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <fieldset className="category-filter">
      <legend className="browse-filter-label">Category</legend>

      <div className="category-filter-options">
        <button
          type="button"
          className={`category-filter-option ${selectedCategory === "" ? "active" : ""}`}
          onClick={() => onSelectCategory("")}
          aria-pressed={selectedCategory === ""}
        >
          <span className="category-filter-icon" aria-hidden="true">
            <FiGrid />
          </span>
          <span>All categories</span>
        </button>

        {categories.map((category) => {
          const CategoryIcon = category.icon;
          const selected = selectedCategory === category.id;

          return (
            <button
              type="button"
              key={category.id}
              className={`category-filter-option ${selected ? "active" : ""}`}
              onClick={() => onSelectCategory(category.id)}
              aria-pressed={selected}
            >
              <span className="category-filter-icon" aria-hidden="true">
                <CategoryIcon />
              </span>
              <span className="category-filter-name">{category.name}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryString = searchParams.toString();
  const urlFilters = useMemo(
    () => getFiltersFromParams(new URLSearchParams(queryString)),
    [queryString],
  );

  const {
    products,
    loading,
    error,
    total,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    filters,
    updateFilters,
    replaceFilters,
    loadMore,
    refetch,
  } = useBrowseProducts(urlFilters);

  const [searchInput, setSearchInput] = useState(urlFilters.q);
  const [priceDraft, setPriceDraft] = useState({
    min_price: urlFilters.min_price,
    max_price: urlFilters.max_price,
  });
  const [priceError, setPriceError] = useState("");

  useEffect(() => {
    setSearchInput(urlFilters.q);
    setPriceDraft({
      min_price: urlFilters.min_price,
      max_price: urlFilters.max_price,
    });
    setPriceError("");
    replaceFilters(urlFilters);
  }, [replaceFilters, urlFilters]);

  const commitFilters = (changes) => {
    const nextFilters = { ...filters, ...changes };
    const nextParams = new URLSearchParams(searchParams);

    FILTER_KEYS.forEach((key) => {
      const value = String(nextFilters[key] || "").trim();
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });

    updateFilters(changes);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    commitFilters({ q: searchInput.trim() });
  };

  const handleApplyPrice = (event) => {
    event.preventDefault();
    const minimum = priceDraft.min_price;
    const maximum = priceDraft.max_price;

    if (minimum !== "" && Number(minimum) < 0) {
      setPriceError("Minimum price cannot be negative.");
      return;
    }

    if (maximum !== "" && Number(maximum) < 0) {
      setPriceError("Maximum price cannot be negative.");
      return;
    }

    if (minimum !== "" && maximum !== "" && Number(minimum) > Number(maximum)) {
      setPriceError("Minimum price must be lower than maximum price.");
      return;
    }

    setPriceError("");
    commitFilters({ min_price: minimum, max_price: maximum });
  };

  const clearProductFilters = () => {
    setPriceError("");
    commitFilters({ category: "", min_price: "", max_price: "" });
  };

  const selectedCategory = CATEGORIES.find(
    (category) => category.id === filters.category,
  );
  const activeFilterCount = [
    filters.category,
    filters.min_price,
    filters.max_price,
  ].filter(Boolean).length;
  const hasProductFilters = activeFilterCount > 0;
  const hasAnyCriteria = Boolean(filters.q) || hasProductFilters;
  const productLabel = total === 1 ? "product" : "products";

  return (
    <div className="browse-screen">
      <Navbar />

      <main className="browse-page">
        <section className="browse-intro" aria-labelledby="browse-title">
          <div className="browse-intro-copy">
            <span className="browse-eyebrow"><FiShoppingBag aria-hidden="true" /> Your campus marketplace</span>
            <h1 id="browse-title">Campus essentials.<br />Everyday discoveries.</h1>
            <p>
              Discover food, essentials, and student-made products from trusted
              sellers across CSUCC.
            </p>
          </div>

          <Link className="browse-stalls-link" to="/stalls">
            Meet your campus sellers <FiArrowRight aria-hidden="true" />
          </Link>
        </section>

        <section className="browse-controls" aria-label="Product filters">
          <form className="browse-search" onSubmit={handleSearch} role="search">
            <FiSearch aria-hidden="true" />
            <label className="sr-only" htmlFor="browse-product-search">
              Search marketplace products
            </label>
            <input
              id="browse-product-search"
              type="search"
              placeholder="Search products or sellers"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="browse-search-clear"
                onClick={() => {
                  setSearchInput("");
                  if (filters.q) commitFilters({ q: "" });
                }}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              Search <FiArrowRight aria-hidden="true" />
            </button>
          </form>
            <CategoryFilter
              categories={CATEGORIES}
              selectedCategory={filters.category}
              onSelectCategory={(category) => commitFilters({ category })}
            />

            <form className="browse-filter-group" onSubmit={handleApplyPrice}>
              <label className="browse-filter-label" htmlFor="minimum-price">
                Price range
              </label>
              <div className="browse-price-inputs">
                <label>
                  <span>Minimum</span>
                  <div>
                    <span>₱</span>
                    <input
                      id="minimum-price"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0"
                      value={priceDraft.min_price}
                      onChange={(event) =>
                        setPriceDraft((current) => ({
                          ...current,
                          min_price: event.target.value,
                        }))
                      }
                    />
                  </div>
                </label>
                <label>
                  <span>Maximum</span>
                  <div>
                    <span>₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="Any"
                      value={priceDraft.max_price}
                      onChange={(event) =>
                        setPriceDraft((current) => ({
                          ...current,
                          max_price: event.target.value,
                        }))
                      }
                    />
                  </div>
                </label>
              </div>
              {priceError && <p className="browse-price-error">{priceError}</p>}
              <button
                type="submit"
                className="btn btn-outline btn-sm browse-price-apply"
              >
                Apply price
              </button>
            </form>

            {hasProductFilters && (
              <button
                type="button"
                className="browse-clear-filters"
                onClick={clearProductFilters}
              >
                <FiX /> Clear all filters
              </button>
            )}
        </section>

        <div className="browse-layout">
          <section
            className="browse-results"
            aria-live="polite"
            aria-busy={loading}
          >
            <div className="browse-results-toolbar">
              <div>
                <span className="browse-results-eyebrow">Explore the market</span>
                <h2>{selectedCategory?.name || "All products"}</h2>
                <p>
                  {isInitialLoading
                    ? "Finding products…"
                    : `${total} ${productLabel} available`}
                </p>
              </div>

              <button
                type="button"
                className="browse-refresh-btn"
                onClick={refetch}
                disabled={loading}
                aria-label="Refresh products"
              >
                <FiRefreshCw className={loading ? "spinning" : ""} />
                Refresh
              </button>
            </div>

            {hasAnyCriteria && (
              <div
                className="browse-active-filters"
                aria-label="Active filters"
              >
                {filters.q && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      commitFilters({ q: "" });
                    }}
                  >
                    Search: “{filters.q}” <FiX />
                  </button>
                )}
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => commitFilters({ category: "" })}
                  >
                    {selectedCategory.name} <FiX />
                  </button>
                )}
                {(filters.min_price || filters.max_price) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPriceDraft({ min_price: "", max_price: "" });
                      commitFilters({ min_price: "", max_price: "" });
                    }}
                  >
                    ₱{filters.min_price || "0"} –{" "}
                    {filters.max_price ? `₱${filters.max_price}` : "Any"}
                    <FiX />
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="browse-error" role="alert">
                <FiAlertCircle />
                <div>
                  <strong>We couldn’t load the products.</strong>
                  <span>{error}</span>
                </div>
                <button type="button" onClick={refetch}>
                  Try again
                </button>
              </div>
            )}

            {isInitialLoading ? (
              <SkeletonGrid count={12} />
            ) : error ? null : products.length === 0 ? (
              <div className="browse-empty-state">
                <span>
                  <FiSearch />
                </span>
                <h3>{hasAnyCriteria ? "No products matched your search" : "No products yet"}</h3>
                <p>{hasAnyCriteria ? "Try a different keyword, category, or price range." : "Check back soon for new finds from campus sellers."}</p>
                {hasAnyCriteria && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setSearchInput("");
                      setPriceDraft({ min_price: "", max_price: "" });
                      commitFilters({
                        q: "",
                        category: "",
                        min_price: "",
                        max_price: "",
                      });
                    }}
                  >
                    Reset everything
                  </button>
                )}
              </div>
            ) : (
              <div className="product-grid browse-product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {hasMore && !isInitialLoading && (
              <div className="browse-load-more">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {isLoadingMore ? (
                    <>
                      <span className="spinner spinner-dark" /> Loading products
                    </>
                  ) : (
                    <>
                      Load more <FiArrowRight />
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Browse;
