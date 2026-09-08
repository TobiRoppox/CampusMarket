import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiCheckCircle,
  FiCoffee,
  FiGrid,
  FiMapPin,
  FiMonitor,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import Navbar from "../../components/common/Navbar.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { SkeletonCard, SkeletonGrid } from "../../components/common/Ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { productService, stallService } from "../../services/api.js";
import "./Home.css";
import eventService from "../../services/eventService.js";

const IMAGE_ROOT = "/images/buyer";

const CATEGORIES = [
  { key: "all", label: "All", icon: FiGrid },
  { key: "food", label: "Food", icon: FiCoffee },
  { key: "clothing", label: "Clothing", icon: FiShoppingBag },
  { key: "electronics", label: "Electronics", icon: FiMonitor },
  { key: "accessories", label: "Accessories", icon: FiTag },
  { key: "student-made", label: "Student Made", icon: FiPackage },
];

const getProductList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function BuyerHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStalls, setActiveStalls] = useState([]);
  const [campusEvents, setCampusEvents] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [marketError, setMarketError] = useState("");
  const [marketLoading, setMarketLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([stallService.getAll(), eventService.getAll(), productService.getAll({ featured: true, limit: 4 })])
      .then(([stores, events, featured]) => {
        if (!active) return;
        setActiveStalls(stores.data);
        setFeaturedProducts(getProductList(featured.data));
        setCampusEvents(events.data.filter((event) => new Date(event.end_date || event.date) >= new Date()).slice(0, 3).map((event) => {
          const start = new Date(event.start_date || event.date);
          return { ...event, title: event.name, image: event.image_url, date: start.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }), month: start.toLocaleDateString("en-PH", { month: "short" }), day: start.getDate(), tags: event.description };
        }));
      }).catch(() => { if (active) setMarketError("Campus highlights are unavailable. Please refresh to try again."); })
      .finally(() => { if (active) setMarketLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user?.id || user.status !== "approved") {
      setRecommendations([]);
      return;
    }

    let active = true;
    setRecommendationsLoading(true);

    productService
      .getRecommendations(user.id)
      .then(({ data }) => {
        if (active) {
          setRecommendations(getProductList(data));
        }
      })
      .catch(() => {
        if (active) setRecommendations([]);
      })
      .finally(() => {
        if (active) setRecommendationsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    setProductsLoading(true);

    const params = { page, limit: 16 };
    if (activeCategory !== "all") params.category = activeCategory;

    productService
      .getAll(params)
      .then(({ data }) => {
        if (!active) return;

        const nextProducts = getProductList(data);
        setProducts((previous) =>
          page === 1 ? nextProducts : [...previous, ...nextProducts],
        );
        setTotal(Number(data?.total ?? nextProducts.length));
      })
      .catch(() => {
        if (!active) return;
        if (page === 1) setProducts([]);
        setTotal(0);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeCategory, page]);

  const handleCategory = (category) => {
    setActiveCategory(category);
    setPage(1);
    setProducts([]);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/browse?q=${encodeURIComponent(query)}` : "/browse");
  };

  const currentCategory =
    CATEGORIES.find(({ key }) => key === activeCategory)?.label || "Products";

  return (
    <div className="buyer-home">
      <Navbar />

      <main className="buyer-home-content">
        <section className="buyer-hero" aria-labelledby="buyer-hero-title">
          <div className="buyer-hero-text">
            <span className="buyer-hero-kicker">
              Support local <i /> Shop campus <i /> Build community
            </span>

            <h1 id="buyer-hero-title">Discover campus-made favorites.</h1>
            <p>
              Quality products. Student entrepreneurs. A stronger CSU Cabadbaran
              community.
            </p>

            <form className="buyer-hero-search" onSubmit={handleSearch}>
              <FiSearch className="buyer-search-icon" aria-hidden="true" />
              <label className="sr-only" htmlFor="home-product-search">
                Search products, stalls, or events
              </label>
              <input
                id="home-product-search"
                type="search"
                placeholder="Search for products, stalls, or events..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            <div className="buyer-hero-trust">
              <span>
                <FiCheckCircle aria-hidden="true" /> Verified campus sellers
              </span>
              <span>
                <FiUsers aria-hidden="true" /> Made by the CSUCC community
              </span>
            </div>
          </div>
        </section>

        <section
          className="buyer-section buyer-stalls-section"
          aria-labelledby="stalls-title"
        >
          <div className="buyer-section-header">
            <div>
              <span className="buyer-section-kicker">Meet campus sellers</span>
              <h2 id="stalls-title">Active campus stores</h2>
            </div>
            <Link to="/stalls" className="buyer-see-all">
              See all <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          {marketLoading && <p role="status">Loading campus highlights…</p>}
          {marketError && <p role="alert">{marketError}</p>}
          {!marketLoading && !marketError && !activeStalls.length && <p>No stores are currently open.</p>}
          <Link to={user ? "/open-store" : "/register"} className="buyer-see-all">Open your campus store <FiArrowRight aria-hidden="true" /></Link>
          <div className="buyer-stall-grid">
            {activeStalls.map((stall) => (
              <Link
                to={`/stalls/${stall.id}`}
                key={stall.id}
                className="buyer-stall-card"
              >
                <div className="buyer-stall-logo">
                  {stall.logo_url || stall.banner_url ? <img src={stall.logo_url || stall.banner_url} alt={`${stall.name} products`} /> : <FiShoppingBag aria-hidden="true" />}
                </div>
                <div className="buyer-stall-body">
                  <div className="buyer-stall-name">
                    <h3>{stall.name}</h3>
                    <FiCheckCircle aria-label="Verified seller" />
                  </div>
                  <p>{stall.category}</p>
                  <p className="buyer-stall-rating">
                    <FiStar aria-hidden="true" />
                    <strong>{stall.location}</strong>
                  </p>
                </div>
                <FiArrowUpRight
                  className="buyer-card-arrow"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>

        <section
          className="buyer-section buyer-events-section"
          aria-labelledby="events-title"
        >
          <div className="buyer-section-header">
            <div>
              <span className="buyer-section-kicker">Happening on campus</span>
              <h2 id="events-title">Upcoming events</h2>
            </div>
            <Link to="/events" className="buyer-see-all">
              See all <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          {!marketLoading && !marketError && !campusEvents.length && <p>No upcoming campus events.</p>}
          <div className="buyer-event-grid">
            {campusEvents.map((event) => (
              <Link
                to={`/events/${event.id}/stalls`}
                key={event.id}
                className="buyer-event-card"
              >
                <div className="buyer-event-thumb">
                  <img src={event.image} alt="" />
                  <div className="buyer-event-date" aria-hidden="true">
                    <span>{event.month}</span>
                    <strong>{event.day}</strong>
                  </div>
                </div>
                <div className="buyer-event-body">
                  <div>
                    <p className="buyer-event-meta">{event.date}</p>
                    <h3>{event.title}</h3>
                    <p className="buyer-event-loc">
                      <FiMapPin aria-hidden="true" /> {event.location}
                    </p>
                    <span className="buyer-event-tags">{event.tags}</span>
                  </div>
                  <span className="buyer-event-link-icon">
                    <FiArrowUpRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {featuredProducts.length > 0 && <section className="buyer-section" aria-labelledby="promoted-title">
          <div className="buyer-section-header"><div><span className="buyer-section-kicker">Premium store spotlight · Promoted</span><h2 id="promoted-title">Featured products</h2></div></div>
          <div className="buyer-rec-grid">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>}
        {user?.status === "approved" && (
          <section
            className="buyer-section"
            aria-labelledby="recommended-title"
          >
            <div className="buyer-section-header">
              <div>
                <span className="buyer-section-kicker">Selected for you</span>
                <h2 id="recommended-title">Recommended for you</h2>
              </div>
              <Link to="/browse?rec=1" className="buyer-see-all">
                Browse more <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            {recommendationsLoading ? (
              <div className="buyer-rec-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : recommendations.length ? (
              <div className="buyer-rec-grid">
                {recommendations.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="buyer-inline-empty">
                <FiShoppingBag aria-hidden="true" />
                <div>
                  <strong>Your recommendations are getting ready.</strong>
                  <span>
                    Explore a few products so we can learn what you like.
                  </span>
                </div>
                <Link to="/browse" className="btn btn-outline btn-sm">
                  Start browsing
                </Link>
              </div>
            )}
          </section>
        )}

        <section
          className="buyer-products-section"
          aria-labelledby="products-title"
        >
          <div className="buyer-section-header buyer-products-header">
            <div>
              <span className="buyer-section-kicker">
                Explore the marketplace
              </span>
              <h2 id="products-title">
                {activeCategory === "all"
                  ? "Campus marketplace"
                  : currentCategory}
              </h2>
            </div>
            <span className="buyer-product-count">
              {total} {total === 1 ? "item" : "items"}
            </span>
          </div>

          <div
            className="category-bar"
            aria-label="Filter products by category"
          >
            {CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              const isActive = category.key === activeCategory;

              return (
                <button
                  type="button"
                  key={category.key}
                  className={`cat-chip ${isActive ? "active" : ""}`}
                  onClick={() => handleCategory(category.key)}
                  aria-pressed={isActive}
                >
                  <CategoryIcon aria-hidden="true" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          {productsLoading && page === 1 ? (
            <SkeletonGrid count={12} />
          ) : (
            <>
              <div className="product-grid fade-in">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {products.length < total && (
                <div className="load-more">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={productsLoading}
                  >
                    {productsLoading ? (
                      <>
                        <span className="spinner spinner-dark" /> Loading
                      </>
                    ) : (
                      <>
                        Load more <FiArrowRight aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {!productsLoading && products.length === 0 && (
                <div className="empty-state buyer-products-empty">
                  <div className="empty-state-icon">
                    <FiSearch aria-hidden="true" />
                  </div>
                  <h3>No products found</h3>
                  <p>Try another category or browse all available products.</p>
                  {activeCategory !== "all" && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCategory("all")}
                    >
                      View all products
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="buyer-home-footer">
        <div className="buyer-footer-inner">
          <div className="buyer-footer-grid">
            <div className="buyer-footer-brand">
              <Link to="/" aria-label="Campus Market home">
                <img
                  src={`${IMAGE_ROOT}/campusmarket-logo.png`}
                  alt="Campus Market"
                  loading="lazy"
                />
              </Link>
              <p>
                Discover student-made favorites, support campus sellers, and
                connect with your community.
              </p>
              <strong>Buy. Sell. Connect.</strong>
            </div>

            <nav className="buyer-footer-links" aria-label="Footer navigation">
              <h2>Explore</h2>
              <Link to="/browse">Shop products</Link>
              <Link to="/stalls">Campus stalls</Link>
              <Link to="/events">Upcoming events</Link>
            </nav>

            <div className="buyer-footer-community">
              <h2>Our campus, our community</h2>
              <p className="buyer-footer-location">
                <FiMapPin aria-hidden="true" />
                <span>Caraga State University<br />Cabadbaran Campus</span>
              </p>
              <p>A place for small ideas to make a big impact.</p>
            </div>
          </div>

          <div className="buyer-footer-bottom">
            <small>&copy; {new Date().getFullYear()} Campus Market.</small>
            <span>Made for the CSUCC community.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
