import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Grid3X3,
  LayoutGrid,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Store,
  UserRound,
  X,
} from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";
import eventService from "../../services/eventService.js";

const unwrapObject = (payload) =>
  payload?.data?.event || payload?.event || payload?.data || payload || null;

const unwrapArray = (payload) => {
  const value =
    payload?.data?.stalls ?? payload?.stalls ?? payload?.data ?? payload;
  return Array.isArray(value) ? value : [];
};

const titleCase = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeStatus = (value) => {
  const status = String(value || "open").toLowerCase();

  if (["closed", "inactive", "suspended", "cancelled"].includes(status)) {
    return { key: "closed", label: "Closed" };
  }

  if (["available", "vacant"].includes(status)) {
    return { key: "available", label: "Available space" };
  }

  return { key: "open", label: "Open now" };
};

const normalizeStall = (record, index) => {
  const stall = record?.stalls || record?.stall || record || {};
  const rawProducts =
    stall.products || record?.products || record?.productsAvailable || [];
  const products = Array.isArray(rawProducts)
    ? rawProducts
        .map((product) =>
          typeof product === "string"
            ? product
            : product?.name || product?.product_name,
        )
        .filter(Boolean)
    : [];
  const status = normalizeStatus(record?.status || stall.status);
  const category =
    stall.category ||
    record?.category ||
    rawProducts.find?.((product) => product?.category)?.category ||
    "Other";

  return {
    id: stall.stall_id || stall.id || record?.stall_id || record?.id,
    mapKey: stall.id || record?.id || `stall-${index}`,
    number:
      stall.number || stall.stall_number || record?.stall_number || index + 1,
    name: stall.name || record?.name || `Stall ${index + 1}`,
    seller:
      stall.profiles?.full_name ||
      stall.seller?.name ||
      stall.seller_name ||
      record?.sellerName ||
      record?.seller_name ||
      "Campus seller",
    category: titleCase(category),
    products,
    productCount:
      stall.product_count ??
      record?.product_count ??
      record?.products_count ??
      products.length,
    image: stall.logo_url || stall.image_url || record?.image_url || null,
    description: stall.description || record?.description || "",
    location: stall.location || record?.location || "",
    status,
  };
};

const formatEventDate = (event) => {
  const startValue = event?.start_date || event?.start_at || event?.date;
  const endValue = event?.end_date || event?.end_at;
  if (!startValue) return "Schedule to be announced";

  const start = new Date(startValue);
  if (Number.isNaN(start.getTime())) return String(startValue);

  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  if (!endValue) return start.toLocaleDateString("en-PH", dateOptions);

  const end = new Date(endValue);
  if (Number.isNaN(end.getTime()))
    return start.toLocaleDateString("en-PH", dateOptions);

  return `${start.toLocaleDateString("en-PH", dateOptions)} – ${end.toLocaleDateString(
    "en-PH",
    dateOptions,
  )}`;
};

function StallCard({ stall }) {
  const body = (
    <>
      <div className="event-stall-card-media">
        {stall.image ? (
          <img src={stall.image} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{stall.name.charAt(0).toUpperCase()}</span>
        )}
        <span className={`event-stall-status status-${stall.status.key}`}>
          {stall.status.label}
        </span>
      </div>

      <div className="event-stall-card-body">
        <div className="event-stall-card-title">
          <div>
            <small>{stall.category}</small>
            <h3>{stall.name}</h3>
          </div>
          {stall.id && <ChevronRight aria-hidden="true" />}
        </div>

        <p className="event-stall-seller">
          <UserRound aria-hidden="true" /> {stall.seller}
        </p>

        {stall.description && (
          <p className="event-stall-description">{stall.description}</p>
        )}

        <div className="event-stall-card-meta">
          <span>
            <Package aria-hidden="true" /> {stall.productCount} product
            {Number(stall.productCount) === 1 ? "" : "s"}
          </span>
          <span>Stall {stall.number}</span>
        </div>

        {stall.products.length > 0 && (
          <div className="event-stall-products" aria-label="Available products">
            {stall.products.slice(0, 3).map((product) => (
              <span key={product}>{product}</span>
            ))}
            {stall.products.length > 3 && (
              <span>+{stall.products.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </>
  );

  return stall.id ? (
    <Link to={`/stalls/${stall.id}`} className="event-stall-card">
      {body}
    </Link>
  ) : (
    <article className="event-stall-card">{body}</article>
  );
}

export default function EventStalls() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("grid");
  const [selectedStall, setSelectedStall] = useState(null);

  const loadEventStalls = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setError("");

    const [eventResult, stallsResult] = await Promise.allSettled([
      eventService.getOne(eventId),
      eventService.getStalls(eventId),
    ]);

    if (eventResult.status === "fulfilled") {
      setEvent(unwrapObject(eventResult.value.data));
    }

    if (stallsResult.status === "rejected") {
      setStalls([]);
      setError(
        stallsResult.reason?.response?.data?.error ||
          "We couldn't load the stalls for this event.",
      );
    } else {
      const normalized = unwrapArray(stallsResult.value.data).map(
        normalizeStall,
      );
      setStalls(normalized);
      setSelectedStall(
        (current) =>
          normalized.find((stall) => stall.mapKey === current?.mapKey) ||
          normalized[0] ||
          null,
      );
    }

    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    loadEventStalls();
  }, [loadEventStalls]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(stalls.map((stall) => stall.category).filter(Boolean)),
    ],
    [stalls],
  );

  const visibleStalls = useMemo(() => {
    const term = query.trim().toLowerCase();
    return stalls.filter((stall) => {
      const matchesCategory = category === "All" || stall.category === category;
      const haystack = [
        stall.name,
        stall.seller,
        stall.category,
        ...stall.products,
      ]
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [category, query, stalls]);

  const clearFilters = () => {
    setQuery("");
    setCategory("All");
  };

  return (
    <div className="event-stalls-shell">
      <Navbar />

      <main className="event-stalls-page">
        <Link to="/events" className="event-stalls-back">
          <ArrowLeft aria-hidden="true" /> Back to events
        </Link>

        <header className="event-stalls-hero">
          <div>
            <span className="event-stalls-eyebrow">Event directory</span>
            <h1>{event?.name || event?.title || "Event stalls"}</h1>
            <p>
              Discover campus sellers and see what they are offering at this
              event.
            </p>
          </div>

          <div className="event-stalls-event-meta">
            <span>
              <CalendarDays aria-hidden="true" /> {formatEventDate(event)}
            </span>
            <span>
              <MapPin aria-hidden="true" />
              {event?.location || event?.venue || "Campus venue"}
            </span>
          </div>
        </header>

        {!loading && !error && stalls.length > 0 && (
          <section className="event-stalls-toolbar" aria-label="Stall filters">
            <label className="event-stalls-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search stalls or products"
                aria-label="Search stalls or products"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </label>

            <div className="event-stalls-categories" aria-label="Categories">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                  aria-pressed={category === item}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="event-stalls-view-toggle" aria-label="View options">
              <button
                type="button"
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
                aria-label="Card view"
                aria-pressed={view === "grid"}
              >
                <LayoutGrid aria-hidden="true" />
              </button>
              <button
                type="button"
                className={view === "map" ? "active" : ""}
                onClick={() => setView("map")}
                aria-label="Directory map view"
                aria-pressed={view === "map"}
              >
                <Grid3X3 aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {loading ? (
          <div className="event-stalls-loading" aria-label="Loading stalls">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <span />
                <i />
                <i />
                <i />
              </div>
            ))}
          </div>
        ) : error ? (
          <section className="event-stalls-state is-error">
            <span>
              <Store aria-hidden="true" />
            </span>
            <small>Unable to load</small>
            <h2>Stalls are temporarily unavailable</h2>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={loadEventStalls}
            >
              <RefreshCw size={16} aria-hidden="true" /> Try again
            </button>
          </section>
        ) : stalls.length === 0 ? (
          <section className="event-stalls-state">
            <span>
              <Store aria-hidden="true" />
            </span>
            <small>Coming soon</small>
            <h2>No stalls have joined yet</h2>
            <p>
              Check back closer to the event for the complete seller directory.
            </p>
            <Link to="/events" className="btn btn-outline">
              Explore other events
            </Link>
          </section>
        ) : visibleStalls.length === 0 ? (
          <section className="event-stalls-state compact">
            <span>
              <Search aria-hidden="true" />
            </span>
            <h2>No matching stalls</h2>
            <p>Try another keyword or clear the current category.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </section>
        ) : view === "grid" ? (
          <section>
            <div className="event-stalls-section-heading">
              <div>
                <small>Browse sellers</small>
                <h2>
                  {visibleStalls.length} stall
                  {visibleStalls.length === 1 ? "" : "s"}
                </h2>
              </div>
              <span>{category === "All" ? "All categories" : category}</span>
            </div>
            <div className="event-stalls-grid">
              {visibleStalls.map((stall) => (
                <StallCard key={stall.mapKey} stall={stall} />
              ))}
            </div>
          </section>
        ) : (
          <section className="event-directory-layout">
            <div className="event-directory-map">
              <div className="event-directory-marker">STAGE</div>
              <div
                className="event-directory-grid"
                role="grid"
                aria-label="Event stall directory"
              >
                {visibleStalls.map((stall) => (
                  <button
                    key={stall.mapKey}
                    type="button"
                    className={`event-directory-cell status-${stall.status.key} ${
                      selectedStall?.mapKey === stall.mapKey ? "selected" : ""
                    }`}
                    onClick={() => setSelectedStall(stall)}
                    aria-label={`${stall.name}, stall ${stall.number}`}
                    aria-pressed={selectedStall?.mapKey === stall.mapKey}
                  >
                    <span>{stall.number}</span>
                    <small>{stall.name}</small>
                  </button>
                ))}
              </div>
              <div className="event-directory-marker entrance">ENTRANCE</div>
            </div>

            {selectedStall && (
              <aside className="event-directory-details">
                <span
                  className={`event-stall-status status-${selectedStall.status.key}`}
                >
                  {selectedStall.status.label}
                </span>
                <small>
                  Stall {selectedStall.number} · {selectedStall.category}
                </small>
                <h2>{selectedStall.name}</h2>
                <p>
                  <UserRound aria-hidden="true" /> {selectedStall.seller}
                </p>
                <p>
                  <Package aria-hidden="true" /> {selectedStall.productCount}{" "}
                  products listed
                </p>
                {selectedStall.products.length > 0 && (
                  <div className="event-directory-products">
                    {selectedStall.products.slice(0, 4).map((product) => (
                      <span key={product}>{product}</span>
                    ))}
                  </div>
                )}
                {selectedStall.id && (
                  <Link
                    to={`/stalls/${selectedStall.id}`}
                    className="btn btn-primary"
                  >
                    Visit stall <ChevronRight size={15} aria-hidden="true" />
                  </Link>
                )}
              </aside>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
