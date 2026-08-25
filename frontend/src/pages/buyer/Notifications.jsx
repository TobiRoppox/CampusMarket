import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  MessageSquare,
  Tag,
  CalendarDays,
  CheckCheck,
} from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";

const TYPE_META = {
  order: { icon: Package, color: "#1f9d4d" },
  message: { icon: MessageSquare, color: "#2563eb" },
  promo: { icon: Tag, color: "#d97706" },
  event: { icon: CalendarDays, color: "#7c3aed" },
};

// TODO: replace with notificationService.getAll(user.id) once that endpoint exists
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "order",
    title: "Order #ORD-004 is now Processing",
    body: "Sofia Gomez's order is being prepared.",
    time: "10 minutes ago",
    read: false,
    link: "/orders",
  },
  {
    id: 2,
    type: "message",
    title: "New message from Sweet Finds PH",
    body: '"Yes, we still have that flavor available!"',
    time: "1 hour ago",
    read: false,
    link: "/messages",
  },
  {
    id: 3,
    type: "event",
    title: "CSU Food Fest 2024 starts tomorrow",
    body: "Don't forget to check out the stalls at CSUCC Grounds.",
    time: "3 hours ago",
    read: true,
    link: "/events/1",
  },
  {
    id: 4,
    type: "promo",
    title: "10% off at Crafty Hands",
    body: "Limited-time discount on all keychains this week.",
    time: "Yesterday",
    read: true,
    link: "/stalls/2",
  },
  {
    id: 5,
    type: "order",
    title: "Order #ORD-002 was completed",
    body: "Thanks for your purchase from Sweet Finds PH!",
    time: "2 days ago",
    read: true,
    link: "/orders",
  },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    // TODO: swap for notificationService.getAll(user.id)
    const timer = setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const markAllRead = () => {
    // TODO: notificationService.markAllRead(user.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = (id) => {
    // TODO: notificationService.markRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const visible =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <Navbar />
      <div className="notif-page">
        <div className="notif-header">
          <div>
            <h1>Notifications</h1>
            <p>
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline btn-sm" onClick={markAllRead}>
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}
        </div>

        <div className="notif-filter-bar">
          <button
            className={`notif-chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`notif-chip ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>

        {loading ? (
          <div className="notif-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="notif-skeleton" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No notifications</h3>
            <p>
              {filter === "unread"
                ? "You've read everything!"
                : "Nothing here yet"}
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {visible.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.order;
              const Icon = meta.icon;
              return (
                <Link
                  to={n.link}
                  key={n.id}
                  className={`notif-item ${n.read ? "" : "unread"}`}
                  onClick={() => markOneRead(n.id)}
                >
                  <div
                    className="notif-icon"
                    style={{ background: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="notif-body">
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-desc">{n.body}</p>
                    <span className="notif-time">{n.time}</span>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .notif-page { max-width: 720px; margin: 0 auto; padding: 1.75rem 1.5rem 4rem; }
        .notif-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .notif-header h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900, #111827); }
        .notif-header p { color: var(--gray-500, #6b7280); font-size: 0.9rem; margin-top: 0.15rem; }

        .notif-filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
        .notif-chip {
          padding: 0.4rem 0.9rem; border-radius: 999px;
          border: 1.5px solid var(--gray-200, #e5e7eb); background: #fff;
          font-size: 0.85rem; font-weight: 500; color: var(--gray-600, #4b5563); cursor: pointer;
        }
        .notif-chip.active { background: var(--green-600, #1f9d4d); border-color: var(--green-600, #1f9d4d); color: #fff; }

        .notif-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .notif-item {
          display: flex; align-items: flex-start; gap: 0.85rem; padding: 1rem;
          border: 1px solid var(--gray-200, #e5e7eb); border-radius: 14px;
          text-decoration: none; color: inherit; background: #fff; position: relative;
          transition: background 0.15s;
        }
        .notif-item.unread { background: var(--green-50, #f3faf3); border-color: var(--green-100, #dcf0e0); }
        .notif-item:hover { background: var(--gray-50, #f9fafb); }
        .notif-icon {
          width: 38px; height: 38px; border-radius: 999px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .notif-title { font-size: 0.9rem; font-weight: 700; color: var(--gray-900, #111827); margin-bottom: 0.15rem; }
        .notif-desc { font-size: 0.83rem; color: var(--gray-500, #6b7280); margin-bottom: 0.3rem; }
        .notif-time { font-size: 0.75rem; color: var(--gray-400, #9ca3af); }
        .notif-dot { position: absolute; top: 1rem; right: 1rem; width: 8px; height: 8px; border-radius: 50%; background: var(--green-600, #1f9d4d); }

        .notif-skeleton { height: 80px; border-radius: 14px; background: var(--gray-100, #f0f1f0); animation: pulse 1.4s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
