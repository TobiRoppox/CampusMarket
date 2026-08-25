import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Star } from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";
import { SkeletonGrid } from "../../components/common/UI.jsx";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "food", label: "Food Stall" },
  { key: "merchandise", label: "Merchandise" },
  { key: "mixed", label: "Mixed-Use" },
];

// TODO: replace with stallService.getAll({ category, q }) once that endpoint exists
const MOCK_STALLS = [
  {
    id: 1,
    name: "Sweet Finds PH",
    category: "food",
    categoryLabel: "Food Stall",
    rating: 4.8,
    reviews: 132,
    logo: null,
    tagline: "Homemade pastries & bread",
  },
  {
    id: 2,
    name: "Crafty Hands",
    category: "merchandise",
    categoryLabel: "Merchandise",
    rating: 4.9,
    reviews: 87,
    logo: null,
    tagline: "Handmade keychains & accessories",
  },
  {
    id: 3,
    name: "Brew Corner",
    category: "food",
    categoryLabel: "Food Stall",
    rating: 4.7,
    reviews: 210,
    logo: null,
    tagline: "Coffee, tea, and pastries",
  },
  {
    id: 4,
    name: "Campus Threads",
    category: "mixed",
    categoryLabel: "Mixed-Use",
    rating: 4.6,
    reviews: 54,
    logo: null,
    tagline: "Apparel and printed goods",
  },
  {
    id: 5,
    name: "Green Bloom",
    category: "merchandise",
    categoryLabel: "Merchandise",
    rating: 4.9,
    reviews: 41,
    logo: null,
    tagline: "Crochet flowers & plants",
  },
  {
    id: 6,
    name: "Cheese Central",
    category: "food",
    categoryLabel: "Food Stall",
    rating: 4.8,
    reviews: 176,
    logo: null,
    tagline: "Cheese pandesal & snacks",
  },
];

export default function Stalls() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setLoading(true);
    // TODO: swap for stallService.getAll({ category: activeCategory, q: searchTerm })
    const timer = setTimeout(() => {
      setStalls(MOCK_STALLS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = stalls.filter((s) => {
    const matchesCategory =
      activeCategory === "all" || s.category === activeCategory;
    const matchesSearch = s.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <Navbar />
      <div className="stalls-page">
        <div className="stalls-header">
          <div>
            <h1>Browse Stalls</h1>
            <p>Discover trusted sellers across campus</p>
          </div>
          <form className="stalls-search" onSubmit={(e) => e.preventDefault()}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Search stalls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>

        <div className="stalls-filter-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`stalls-chip ${activeCategory === cat.key ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonGrid count={6} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No stalls found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <div className="stalls-grid">
            {filtered.map((stall) => (
              <Link
                to={`/stalls/${stall.id}`}
                key={stall.id}
                className="stalls-card"
              >
                <div className="stalls-card-logo">
                  {stall.logo ? (
                    <img src={stall.logo} alt={stall.name} />
                  ) : (
                    stall.name.charAt(0)
                  )}
                </div>
                <div className="stalls-card-body">
                  <h3>{stall.name}</h3>
                  <span className="stalls-card-category">
                    {stall.categoryLabel}
                  </span>
                  <p className="stalls-card-tagline">{stall.tagline}</p>
                  <div className="stalls-card-rating">
                    <Star size={14} fill="#facc15" stroke="#facc15" />
                    <span>{stall.rating}</span>
                    <span className="stalls-card-reviews">
                      ({stall.reviews})
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .stalls-page { max-width: 1400px; margin: 0 auto; padding: 1.75rem 1.5rem 4rem; }
        .stalls-header {
          display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
          margin-bottom: 1.25rem; flex-wrap: wrap;
        }
        .stalls-header h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900, #111827); }
        .stalls-header p { color: var(--gray-500, #6b7280); font-size: 0.9rem; margin-top: 0.15rem; }
        .stalls-search {
          display: flex; align-items: center; gap: 0.5rem; max-width: 320px; flex: 1;
          background: var(--gray-50, #f3f4f3); border: 1px solid var(--gray-200, #e5e7eb);
          border-radius: 999px; padding: 0.55rem 1rem; color: var(--gray-500, #6b7280);
        }
        .stalls-search input { border: none; background: none; outline: none; flex: 1; font-size: 0.875rem; }

        .stalls-filter-bar { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .stalls-chip {
          padding: 0.5rem 1rem; border-radius: 999px;
          border: 1.5px solid var(--gray-200, #e5e7eb); background: #fff;
          font-size: 0.875rem; font-weight: 500; color: var(--gray-600, #4b5563);
          cursor: pointer; transition: all 0.15s;
        }
        .stalls-chip:hover { border-color: var(--green-600, #1f9d4d); color: var(--green-600, #1f9d4d); }
        .stalls-chip.active { background: var(--green-600, #1f9d4d); border-color: var(--green-600, #1f9d4d); color: #fff; }

        .stalls-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .stalls-card {
          display: flex; gap: 1rem; padding: 1.25rem;
          border: 1px solid var(--gray-200, #e5e7eb); border-radius: 16px;
          text-decoration: none; color: inherit; background: #fff;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .stalls-card:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .stalls-card-logo {
          width: 56px; height: 56px; border-radius: 999px; flex-shrink: 0; overflow: hidden;
          background: var(--green-600, #1f9d4d); color: #fff; font-weight: 700; font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
        }
        .stalls-card-logo img { width: 100%; height: 100%; object-fit: cover; }
        .stalls-card-body h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.2rem; }
        .stalls-card-category {
          display: inline-block; font-size: 0.7rem; font-weight: 600; color: var(--green-700, #15803d);
          background: var(--green-50, #eef8ee); padding: 0.15rem 0.5rem; border-radius: 999px; margin-bottom: 0.4rem;
        }
        .stalls-card-tagline { font-size: 0.82rem; color: var(--gray-500, #6b7280); margin-bottom: 0.5rem; }
        .stalls-card-rating { display: flex; align-items: center; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: var(--gray-800, #1f2937); }
        .stalls-card-reviews { font-weight: 400; color: var(--gray-500, #6b7280); }

        @media (max-width: 1024px) { .stalls-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .stalls-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
