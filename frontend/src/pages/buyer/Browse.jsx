// ── Browse.jsx ────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { productService } from "../../services/api.js";
import Navbar from "../../components/common/Navbar.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { SkeletonGrid, EmptyState } from "../../components/common/UI.jsx";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";

const CATS = [
  "food",
  "clothing",
  "electronics",
  "accessories",
  "student-made",
  "other",
];
const CAT_LABELS = {
  food: "Food",
  clothing: "Clothing",
  electronics: "Electronics",
  accessories: "Accessories",
  "student-made": "Student Made",
  other: "Other",
};

export function Browse() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    min_price: "",
    max_price: "",
  });
  const [search, setSearch] = useState("");

  const fetchProducts = (reset = false) => {
    setLoading(true);
    const p = reset ? 1 : page;
    productService
      .getAll({ ...filters, q: search, page: p, limit: 20 })
      .then(({ data }) => {
        setProducts((prev) =>
          reset || p === 1 ? data.data : [...prev, ...data.data],
        );
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(true);
  }, [filters, search]);
  useEffect(() => {
    if (page > 1) fetchProducts();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(true);
  };
  const hasActiveFilters =
    filters.category || filters.min_price || filters.max_price;

  return (
    <div>
      <Navbar />
      <div className="browse-page">
        <div className="browse-header">
          <div>
            <h1>Browse Products</h1>
            <p>{total} items found</p>
          </div>
          <form onSubmit={handleSearch} className="browse-search">
            <FiSearch size={18} />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>
        </div>

        <div className="browse-layout">
          {/* Sidebar filters */}
          <aside className="browse-filters">
            <div className="browse-filters-head">
              <h3>
                <FiFilter size={16} /> Filters
              </h3>
              {hasActiveFilters && (
                <button
                  className="browse-filters-clear"
                  onClick={() =>
                    setFilters({
                      q: "",
                      category: "",
                      min_price: "",
                      max_price: "",
                    })
                  }
                >
                  <FiX size={13} /> Clear
                </button>
              )}
            </div>

            <div className="browse-filter-group">
              <span className="browse-filter-label">Category</span>
              <div className="browse-cat-chips">
                <button
                  className={`browse-chip browse-chip-all ${filters.category === "" ? "active" : ""}`}
                  onClick={() => setFilters((p) => ({ ...p, category: "" }))}
                >
                  All Categories
                </button>
                {CATS.map((c) => (
                  <button
                    key={c}
                    className={`browse-chip ${filters.category === c ? "active" : ""}`}
                    onClick={() => setFilters((p) => ({ ...p, category: c }))}
                  >
                    {CAT_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            <div className="browse-filter-group">
              <span className="browse-filter-label">Price range (₱)</span>
              <div className="browse-price-inputs">
                <input
                  placeholder="Min"
                  type="number"
                  value={filters.min_price}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, min_price: e.target.value }))
                  }
                />
                <span>–</span>
                <input
                  placeholder="Max"
                  type="number"
                  value={filters.max_price}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, max_price: e.target.value }))
                  }
                />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="browse-results">
            {loading && page === 1 ? (
              <SkeletonGrid count={12} />
            ) : (
              <>
                {products.length === 0 ? (
                  <EmptyState
                    icon="🔍"
                    title="No products found"
                    description="Try adjusting your filters"
                  />
                ) : (
                  <div className="product-grid">
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
                {products.length < total && (
                  <div className="browse-load-more">
                    <button
                      className="btn btn-outline"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner spinner-dark" />
                      ) : (
                        "Load More"
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .browse-page { max-width: 1400px; margin: 0 auto; padding: 1.75rem 1.5rem 4rem; }

        .browse-header {
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
          margin-bottom: 1.5rem; flex-wrap: wrap;
        }
        .browse-header h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900, #111827); }
        .browse-header p { color: var(--gray-500, #6b7280); font-size: 0.9rem; margin-top: 0.15rem; }
        .browse-search {
          display: flex; align-items: center; gap: 0.5rem; max-width: 380px; flex: 1;
          background: var(--gray-50, #f3f4f3); border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: 999px; padding: 0.4rem 0.4rem 0.4rem 1rem; color: var(--gray-500, #6b7280);
        }
        .browse-search input { border: none; background: none; outline: none; flex: 1; font-size: 0.875rem; }

        .browse-layout { display: flex; gap: 1.75rem; align-items: flex-start; }

        .browse-filters {
          width: 240px; flex-shrink: 0; background: #fff;
          border: 1px solid var(--gray-200, #e5e7eb); border-radius: 16px;
          padding: 1.25rem; position: sticky; top: calc(var(--navbar-height, 64px) + 1rem);
          display: flex; flex-direction: column; gap: 1.25rem;
        }
        .browse-filters-head { display: flex; align-items: center; justify-content: space-between; }
        .browse-filters-head h3 {
          font-weight: 700; font-size: 0.9rem; color: var(--gray-800, #1f2937);
          display: flex; align-items: center; gap: 0.4rem;
        }
        .browse-filters-clear {
          display: flex; align-items: center; gap: 0.2rem; font-size: 0.78rem; font-weight: 600;
          color: var(--green-600, #1f9d4d); background: none; border: none; cursor: pointer;
        }
        .browse-filter-group { display: flex; flex-direction: column; gap: 0.6rem; }
        .browse-filter-label { font-size: 0.8rem; font-weight: 600; color: var(--gray-600, #4b5563); }

        .browse-cat-chips { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .browse-chip {
          padding: 0.5rem 0.75rem; border-radius: 10px;
          border: 1.5px solid var(--gray-200, #e5e7eb); background: #fff;
          font-size: 0.82rem; font-weight: 500; color: var(--gray-600, #4b5563); cursor: pointer;
          transition: all 0.15s; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .browse-chip:hover { border-color: var(--green-600, #1f9d4d); color: var(--green-600, #1f9d4d); }
        .browse-chip.active { background: var(--green-600, #1f9d4d); border-color: var(--green-600, #1f9d4d); color: #fff; }
        .browse-chip-all { grid-column: 1 / -1; }

        .browse-price-inputs { display: flex; align-items: center; gap: 0.5rem; }
        .browse-price-inputs input {
          width: 0; flex: 1; padding: 0.5rem 0.6rem; border-radius: 8px;
          border: 1px solid var(--gray-200, #e5e7eb); outline: none; font-size: 0.85rem;
        }
        .browse-price-inputs input:focus { border-color: var(--green-600, #1f9d4d); }
        .browse-price-inputs span { color: var(--gray-400, #9ca3af); }

        .browse-results { flex: 1; min-width: 0; }
        .browse-load-more { text-align: center; margin-top: 2rem; }

        @media (max-width: 900px) {
          .browse-layout { flex-direction: column; }
          .browse-filters { width: 100%; position: static; }
        }
      `}</style>
    </div>
  );
}

export default Browse;
