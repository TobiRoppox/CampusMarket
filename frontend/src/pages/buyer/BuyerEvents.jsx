import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  Store,
  Users,
  XCircle,
} from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";
import eventService from "../../services/eventService.js";

const FILTERS = [
  { value: "all", label: "All events" },
  { value: "ongoing", label: "Happening now" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const getEventStart = (event) =>
  event.starts_at || event.start_date || event.start_at || event.date;

const getEventEnd = (event) =>
  event.ends_at || event.end_date || event.end_at || event.date_end;

const parseDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const getEventStatus = (event, now = new Date()) => {
  const start = parseDate(getEventStart(event));
  if (!start) return "upcoming";
  const rawEnd = getEventEnd(event);
  const parsedEnd = parseDate(rawEnd);
  const explicitEnd =
    parsedEnd && /^\d{4}-\d{2}-\d{2}$/.test(String(rawEnd))
      ? endOfDay(parsedEnd)
      : parsedEnd;
  const end = explicitEnd || endOfDay(start);

  if (start > now) return "upcoming";
  if (end >= now) return "ongoing";
  return "past";
};

const formatEventDate = (event) => {
  const start = parseDate(getEventStart(event));
  const end = parseDate(getEventEnd(event));
  if (!start) return "Schedule to be announced";

  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  const startLabel = start.toLocaleDateString("en-PH", dateOptions);
  const endLabel = end?.toLocaleDateString("en-PH", dateOptions);
  const timeLabel = start.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (end && start.toDateString() !== end.toDateString()) {
    return `${startLabel} – ${endLabel}`;
  }
  return `${startLabel} · ${timeLabel}`;
};

const getDateParts = (event) => {
  const date = parseDate(getEventStart(event));
  if (!date) return { month: "TBA", day: "—" };
  return {
    month: date.toLocaleDateString("en-PH", { month: "short" }),
    day: date.getDate(),
  };
};

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.data?.events)) return payload.data.events;
  return [];
};

export default function BuyerEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const loadEvents = async ({ background = false } = {}) => {
    try {
      background ? setRefreshing(true) : setLoading(true);
      setError("");
      const { data } = await eventService.getAll();
      setEvents(getArrayPayload(data));
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "We could not load campus events.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const counts = useMemo(
    () =>
      events.reduce(
        (result, event) => {
          result[getEventStatus(event)] += 1;
          return result;
        },
        { ongoing: 0, upcoming: 0, past: 0 },
      ),
    [events],
  );

  const visibleEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...events]
      .filter((event) => filter === "all" || getEventStatus(event) === filter)
      .filter((event) => {
        if (!term) return true;
        return [event.name, event.title, event.location, event.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        const aDate =
          parseDate(getEventStart(a))?.getTime() || Number.MAX_SAFE_INTEGER;
        const bDate =
          parseDate(getEventStart(b))?.getTime() || Number.MAX_SAFE_INTEGER;
        if (filter === "past") return bDate - aDate;
        return aDate - bDate;
      });
  }, [events, filter, query]);

  const featuredEvent = useMemo(
    () =>
      events.find((event) => getEventStatus(event) === "ongoing") ||
      [...events]
        .filter((event) => getEventStatus(event) === "upcoming")
        .sort(
          (a, b) =>
            (parseDate(getEventStart(a))?.getTime() || Infinity) -
            (parseDate(getEventStart(b))?.getTime() || Infinity),
        )[0],
    [events],
  );

  return (
    <div className="buyer-events-shell">
      <Navbar />

      <main className="buyer-events-page">
        <header className="events-page-header">
          <div>
            <span className="events-eyebrow">Around CSUCC</span>
            <h1>Campus events</h1>
            <p>
              Find campus fairs and pop-ups, check when and where they happen,
              and explore participating sellers and their products.
            </p>
          </div>
          <button
            type="button"
            className="events-refresh-btn"
            onClick={() => loadEvents({ background: true })}
            disabled={loading || refreshing}
          >
            <RefreshCw className={refreshing ? "is-spinning" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {!loading && !error && featuredEvent && (
          <FeaturedEvent event={featuredEvent} />
        )}

        {!loading && !error && events.length > 0 && (
          <section className="events-toolbar" aria-label="Event filters">
            <div className="events-filter-tabs">
              {FILTERS.map((option) => {
                const count =
                  option.value === "all" ? events.length : counts[option.value];
                return (
                  <button
                    type="button"
                    key={option.value}
                    className={filter === option.value ? "active" : ""}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
            <label className="events-search">
              <Search />
              <span className="sr-only">Search events</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search events or locations"
              />
            </label>
          </section>
        )}

        {loading ? (
          <EventSkeleton />
        ) : error ? (
          <section className="events-state-card is-error" role="alert">
            <span>
              <XCircle />
            </span>
            <h2>Events unavailable</h2>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => loadEvents()}
            >
              Try again
            </button>
          </section>
        ) : !events.length ? (
          <section className="events-state-card">
            <span>
              <CalendarDays />
            </span>
            <small>Quiet for now</small>
            <h2>No campus events announced</h2>
            <p>
              New fairs, pop-ups, and selling events will appear here once they
              are published.
            </p>
            <Link to="/browse" className="btn btn-primary">
              Browse products
            </Link>
          </section>
        ) : !visibleEvents.length ? (
          <section className="events-state-card compact">
            <span>
              <Search />
            </span>
            <h2>No matching events</h2>
            <p>Try another search or select a different event status.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </section>
        ) : (
          <section aria-labelledby="event-list-title">
            <div className="events-section-heading">
              <div>
                <span className="events-eyebrow">Explore the market</span>
                <h2 id="event-list-title">
                  {FILTERS.find((item) => item.value === filter)?.label}
                </h2>
              </div>
              <span>
                {visibleEvents.length}{" "}
                {visibleEvents.length === 1 ? "event" : "events"}
              </span>
            </div>
            <div className="buyer-event-grid">
              {visibleEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function FeaturedEvent({ event }) {
  const status = getEventStatus(event);
  const image = event.image_url || event.cover_image || event.banner_url;
  return (
    <Link to={`/events/${event.id}/stalls`} className="featured-event">
      {image && <img src={image} alt="" />}
      <div className="featured-event-overlay" />
      <div className="featured-event-copy">
        <span className={`event-status-label status-${status}`}>
          <i />
          {status === "ongoing" ? "Happening now" : "Next campus event"}
        </span>
        <h2>{event.name || event.title}</h2>
        <div>
          <span>
            <CalendarDays />
            {formatEventDate(event)}
          </span>
          {event.location && (
            <span>
              <MapPin />
              {event.location}
            </span>
          )}
        </div>
        <strong>
          Explore event stalls <ArrowRight />
        </strong>
      </div>
      <span className="featured-event-mark">
        <Store />
      </span>
    </Link>
  );
}

function EventCard({ event }) {
  const status = getEventStatus(event);
  const date = getDateParts(event);
  const image = event.image_url || event.cover_image || event.banner_url;
  const stallCount = event.stall_count ?? event.stalls?.length;

  return (
    <Link
      to={`/events/${event.id}/stalls`}
      className={`buyer-event-card status-${status}`}
    >
      <div className="event-card-media">
        {image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <span>
            <CalendarDays />
          </span>
        )}
        <div className="event-date-block">
          <strong>{date.day}</strong>
          <small>{date.month}</small>
        </div>
        <span className="event-card-status">
          {status === "ongoing" ? "Live now" : status}
        </span>
      </div>
      <div className="event-card-body">
        <h3>{event.name || event.title || "Campus event"}</h3>
        <p className="event-schedule">
          <Clock3 />
          {formatEventDate(event)}
        </p>
        {event.location && (
          <p className="event-location">
            <MapPin />
            {event.location}
          </p>
        )}
        {event.description && (
          <p className="event-description">{event.description}</p>
        )}
        <div className="event-card-footer">
          <span>
            {stallCount !== undefined ? (
              <>
                <Users />
                {stallCount} {stallCount === 1 ? "stall" : "stalls"}
              </>
            ) : (
              "Campus sellers"
            )}
          </span>
          <strong>
            View stalls <ArrowRight />
          </strong>
        </div>
      </div>
    </Link>
  );
}

function EventSkeleton() {
  return (
    <div className="event-skeleton-grid" aria-label="Loading events">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item}>
          <span className="skeleton" />
          <div>
            <i className="skeleton" />
            <i className="skeleton" />
            <i className="skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}
