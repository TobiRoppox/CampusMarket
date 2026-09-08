import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Inbox,
  MessageSquare,
  Package,
  Tag,
  XCircle,
} from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import notificationService from "../../services/notificationService.js";
import toast from "react-hot-toast";

const TYPE_META = {
  order: { icon: Package, label: "Orders" },
  message: { icon: MessageSquare, label: "Messages" },
  promo: { icon: Tag, label: "Promotions" },
  event: { icon: CalendarDays, label: "Events" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "order", label: "Orders" },
  { value: "message", label: "Messages" },
  { value: "event", label: "Events" },
];

const relativeTime = (value, fallback) => {
  if (!value) return fallback || "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback || "Recently";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
};

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError("");

    notificationService
      .getAll(user.id)
      .then((items) => {
        if (active) setNotifications(items);
      })
      .catch(() => {
        if (active) setError("We could not load your notifications.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = notificationService.subscribe(user.id, (items) => {
      if (active) setNotifications(items);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user?.id]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const typeCounts = useMemo(
    () =>
      notifications.reduce((counts, notification) => {
        counts[notification.type] = (counts[notification.type] || 0) + 1;
        return counts;
      }, {}),
    [notifications],
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") {
      return notifications.filter((notification) => !notification.read);
    }
    return notifications.filter((notification) => notification.type === filter);
  }, [filter, notifications]);

  const markAllRead = async () => {
    if (!user?.id || !unreadCount || markingAll) return;
    try {
      setMarkingAll(true);
      await notificationService.markAllRead(user.id);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not update notifications");
    } finally {
      setMarkingAll(false);
    }
  };

  const markOneRead = (notification) => {
    if (!user?.id || notification.read) return;
    notificationService.markRead(user.id, notification.id).catch(() => {});
  };

  return (
    <div className="notifications-shell">
      <Navbar />

      <main className="notifications-page">
        <header className="notifications-header">
          <div className="notifications-title-wrap">
            <span className="notifications-title-icon" aria-hidden="true">
              <Bell />
              {unreadCount > 0 && <i />}
            </span>
            <div>
              <span className="notifications-eyebrow">Your activity</span>
              <h1>Notifications</h1>
              <p>
                {loading
                  ? "Checking for updates…"
                  : unreadCount > 0
                    ? `${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}`
                    : "You’re all caught up"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="notifications-read-all"
              onClick={markAllRead}
              disabled={markingAll}
            >
              {markingAll ? (
                <span className="spinner notifications-action-spinner" />
              ) : (
                <CheckCheck />
              )}
              {markingAll ? "Updating…" : "Mark all as read"}
            </button>
          )}
        </header>

        {!loading && !error && notifications.length > 0 && (
          <nav
            className="notifications-filters"
            aria-label="Notification filters"
          >
            {FILTERS.map((option) => {
              const count =
                option.value === "all"
                  ? notifications.length
                  : option.value === "unread"
                    ? unreadCount
                    : typeCounts[option.value] || 0;

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
          </nav>
        )}

        {loading ? (
          <NotificationSkeleton />
        ) : error ? (
          <section className="notification-state is-error" role="alert">
            <span>
              <XCircle />
            </span>
            <h2>Notifications unavailable</h2>
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </section>
        ) : notifications.length === 0 ? (
          <section className="notification-state">
            <div className="notification-empty-art" aria-hidden="true">
              <span>
                <Bell />
              </span>
              <i>
                <CheckCheck />
              </i>
            </div>
            <span className="notifications-eyebrow">Nothing new</span>
            <h2>You’re all caught up</h2>
            <p>
              Order updates, seller messages, promotions, and campus events will
              appear here.
            </p>
            <Link to="/browse" className="btn btn-primary btn-lg">
              Explore the market <ChevronRight size={17} />
            </Link>
          </section>
        ) : visibleNotifications.length === 0 ? (
          <section className="notification-state compact">
            <span>
              <Inbox />
            </span>
            <h2>No notifications in this view</h2>
            <p>Choose another filter to see your other updates.</p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setFilter("all")}
            >
              View all notifications
            </button>
          </section>
        ) : (
          <section className="notification-list" aria-live="polite">
            {visibleNotifications.map((notification) => {
              const meta = TYPE_META[notification.type] || TYPE_META.order;
              const Icon = meta.icon;

              return (
                <Link
                  to={notification.link || "/notifications"}
                  key={notification.id}
                  className={`notification-item type-${notification.type} ${notification.read ? "is-read" : "is-unread"}`}
                  onClick={() => markOneRead(notification)}
                >
                  <span className="notification-type-icon">
                    <Icon />
                  </span>
                  <span className="notification-content">
                    <span className="notification-meta-row">
                      <em>{meta.label}</em>
                      <time dateTime={notification.created_at}>
                        {relativeTime(
                          notification.created_at,
                          notification.time,
                        )}
                      </time>
                    </span>
                    <strong>{notification.title}</strong>
                    {notification.body && <p>{notification.body}</p>}
                  </span>
                  {!notification.read && (
                    <span
                      className="notification-unread-dot"
                      aria-label="Unread"
                    />
                  )}
                  <ChevronRight
                    className="notification-chevron"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div
      className="notification-skeleton-list"
      aria-label="Loading notifications"
    >
      {[0, 1, 2, 3].map((item) => (
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
