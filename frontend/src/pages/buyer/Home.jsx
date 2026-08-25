import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { productService } from "../../services/api.js";
import Navbar from "../../components/common/Navbar.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { SkeletonGrid, SkeletonCard } from "../../components/common/UI.jsx";

const CATEGORIES = [
  { key: "all", label: "All", emoji: "🛍️" },
  { key: "food", label: "Food", emoji: "🍱" },
  { key: "clothing", label: "Clothing", emoji: "👗" },
  { key: "electronics", label: "Electronics", emoji: "📱" },
  { key: "accessories", label: "Accessories", emoji: "💍" },
  { key: "student-made", label: "Student Made", emoji: "🎨" },
];

// TODO: swap for eventService.getUpcoming() once that endpoint exists
const MOCK_EVENTS = [
  {
    id: 1,
    title: "CSU Food Fest 2024",
    date: "May 10 - 12, 2024",
    location: "CSUCC Grounds",
    image: null,
  },
  {
    id: 2,
    title: "Hiring Karta-An 2024",
    date: "May 16, 2024",
    location: "CSUCC Covered Court",
    image: null,
  },
  {
    id: 3,
    title: "Eco Fair 2024",
    date: "May 25 - 26, 2024",
    location: "CSUCC Grounds",
    image: null,
  },
];

// TODO: swap for stallService.getFeatured() once that endpoint exists
const MOCK_STALLS = [
  {
    id: 1,
    name: "Sweet Finds PH",
    category: "Food Stall",
    rating: 4.8,
    logo: null,
  },
  {
    id: 2,
    name: "Crafty Hands",
    category: "Merchandise",
    rating: 4.9,
    logo: null,
  },
  {
    id: 3,
    name: "Brew Corner",
    category: "Food Stall",
    rating: 4.7,
    logo: null,
  },
  {
    id: 4,
    name: "Campus Threads",
    category: "Mixed-Use",
    rating: 4.6,
    logo: null,
  },
];

export default function BuyerHome() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [recLoading, setRecLoading] = useState(false);
  const [prodsLoading, setProdsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    setRecLoading(true);
    productService
      .getRecommendations(user.id)
      .then(({ data }) => setRecommendations(data || []))
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [user]);

  useEffect(() => {
    setProdsLoading(true);
    const params = { page, limit: 16 };
    if (activeCategory !== "all") params.category = activeCategory;
    productService
      .getAll(params)
      .then(({ data }) => {
        setProducts((prev) =>
          page === 1 ? data.data || [] : [...prev, ...(data.data || [])],
        );
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setProdsLoading(false));
  }, [activeCategory, page]);

  const handleCategory = (key) => {
    setActiveCategory(key);
    setPage(1);
    setProducts([]);
  };

  return (
    <div className="buyer-home">
      <Navbar />

      <div className="buyer-home-content">
        {/* Hero */}
        <section className="buyer-hero">
          <div className="buyer-hero-text">
            <h1>
              Find the best products
              <br />
              from trusted campus sellers.
            </h1>
            <form
              className="buyer-hero-search"
              onSubmit={(e) => {
                e.preventDefault(); /* wire to /browse?q= once ready */
              }}
            >
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>
          </div>
          <div className="buyer-hero-art">🛍️</div>
        </section>

        {/* AI Recommendations — logged-in only */}
        {user && (
          <section className="buyer-section">
            <div className="buyer-section-header">
              <h2>AI Recommended for You</h2>
              <Link to="/browse?rec=1" className="buyer-see-all">
                See all
              </Link>
            </div>
            <div className="buyer-rec-grid">
              {recLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                : recommendations
                    .slice(0, 4)
                    .map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Featured Stalls — visible to everyone */}
        <section className="buyer-section">
          <div className="buyer-section-header">
            <h2>Featured Stalls</h2>
            <Link to="/stalls" className="buyer-see-all">
              See all
            </Link>
          </div>
          <div className="buyer-stall-grid">
            {MOCK_STALLS.map((stall) => (
              <Link
                to={`/stalls/${stall.id}`}
                key={stall.id}
                className="buyer-stall-card"
              >
                <div className="buyer-stall-logo">
                  {stall.logo ? (
                    <img src={stall.logo} alt={stall.name} />
                  ) : (
                    stall.name.charAt(0)
                  )}
                </div>
                <div className="buyer-stall-body">
                  <h3>{stall.name}</h3>
                  <p>{stall.category}</p>
                  <p className="buyer-stall-rating">⭐ {stall.rating}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Upcoming Events — visible to everyone */}
        <section className="buyer-section">
          <div className="buyer-section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="buyer-see-all">
              See all
            </Link>
          </div>
          <div className="buyer-event-grid">
            {MOCK_EVENTS.map((ev) => (
              <Link
                to={`/events/${ev.id}`}
                key={ev.id}
                className="buyer-event-card"
              >
                <div className="buyer-event-thumb">
                  {ev.image ? <img src={ev.image} alt={ev.title} /> : "📅"}
                </div>
                <div className="buyer-event-body">
                  <h3>{ev.title}</h3>
                  <p>{ev.date}</p>
                  <p className="buyer-event-loc">@ {ev.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Category filter */}
        <div className="category-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`cat-chip ${activeCategory === cat.key ? "active" : ""}`}
              onClick={() => handleCategory(cat.key)}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Products grid — visible to everyone */}
        <div className="buyer-section-header">
          <h2>
            {activeCategory === "all"
              ? "All Products"
              : CATEGORIES.find((c) => c.key === activeCategory)?.label}
          </h2>
          <span className="text-muted text-sm">{total} items</span>
        </div>

        {prodsLoading && page === 1 ? (
          <SkeletonGrid count={12} />
        ) : (
          <>
            <div className="product-grid fade-in">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {products.length < total && (
              <div className="load-more">
                <button
                  className="btn btn-outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={prodsLoading}
                >
                  {prodsLoading ? (
                    <span className="spinner spinner-dark" />
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
            {!prodsLoading && products.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No products found</h3>
                <p>Try a different category</p>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .buyer-home-content { max-width: 1400px; margin: 0 auto; padding: 1.75rem 1.5rem 4rem; }

        .buyer-hero {
          background: linear-gradient(135deg, #eef8ee 0%, #e6f4e8 100%);
          border-radius: 20px; padding: 2rem; display: flex; align-items: center;
          justify-content: space-between; gap: 2rem; margin-bottom: 2rem;
        }
        .buyer-hero-text h1 { font-size: 1.75rem; font-weight: 800; color: var(--green-900, #0b3d1e); margin-bottom: 1rem; line-height: 1.25; }
        .buyer-hero-search { display: flex; gap: 0.5rem; max-width: 420px; }
        .buyer-hero-search input {
          flex: 1; padding: 0.65rem 1rem; border-radius: 10px; border: 1px solid var(--gray-200, #e5e7eb); outline: none;
        }
        .buyer-hero-art { font-size: 5rem; flex-shrink: 0; }

        .buyer-section { margin-bottom: 2rem; }
        .buyer-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .buyer-section-header h2 { font-size: 1.15rem; font-weight: 700; color: var(--gray-900, #111827); }
        .buyer-see-all { color: var(--green-600, #1f9d4d); font-weight: 600; font-size: 0.875rem; text-decoration: none; }

        .buyer-rec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

        .buyer-stall-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .buyer-stall-card {
          display: flex; align-items: center; gap: 0.75rem; padding: 1rem;
          border: 1px solid var(--gray-200, #e5e7eb); border-radius: 14px;
          text-decoration: none; color: inherit; background: #fff; transition: box-shadow 0.15s, transform 0.15s;
        }
        .buyer-stall-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .buyer-stall-logo {
          width: 48px; height: 48px; border-radius: 999px; background: var(--green-600, #1f9d4d); color: #fff;
          display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; overflow: hidden;
        }
        .buyer-stall-logo img { width: 100%; height: 100%; object-fit: cover; }
        .buyer-stall-body h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.15rem; }
        .buyer-stall-body p { font-size: 0.78rem; color: var(--gray-500, #6b7280); margin: 0; }
        .buyer-stall-rating { margin-top: 0.15rem !important; }

        .buyer-event-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .buyer-event-card {
          border: 1px solid var(--gray-200, #e5e7eb); border-radius: 14px; overflow: hidden;
          text-decoration: none; color: inherit; background: #fff; transition: box-shadow 0.15s, transform 0.15s;
        }
        .buyer-event-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .buyer-event-thumb {
          height: 120px; background: var(--green-900, #0b3d1e); color: #fff;
          display: flex; align-items: center; justify-content: center; font-size: 2rem;
        }
        .buyer-event-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .buyer-event-body { padding: 0.9rem 1rem; }
        .buyer-event-body h3 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.25rem; }
        .buyer-event-body p { font-size: 0.8rem; color: var(--gray-500, #6b7280); margin: 0; }
        .buyer-event-loc { margin-top: 0.15rem !important; }

        .category-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 1rem 0 1.25rem; }
        .cat-chip {
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 1rem; border-radius: 999px;
          border: 1.5px solid var(--gray-200, #e5e7eb); background: #fff;
          font-size: 0.875rem; font-weight: 500; color: var(--gray-600, #4b5563);
          cursor: pointer; transition: all 0.15s;
        }
        .cat-chip:hover { border-color: var(--green-600, #1f9d4d); color: var(--green-600, #1f9d4d); }
        .cat-chip.active { background: var(--green-600, #1f9d4d); border-color: var(--green-600, #1f9d4d); color: #fff; }

        .load-more { display: flex; justify-content: center; margin-top: 2rem; }

        @media (max-width: 1024px) {
          .buyer-rec-grid, .buyer-stall-grid { grid-template-columns: repeat(2, 1fr); }
          .buyer-event-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .buyer-hero { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
