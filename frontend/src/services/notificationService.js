const STORAGE_PREFIX = "campus-market:notifications";
const CHANGE_EVENT = "campus-market:notifications-changed";

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId || "guest"}`;

const normalizeNotification = (notification) => ({
  ...notification,

  id:
    notification.id ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`),

  type: notification.type || "order",

  title: notification.title || "Campus Market update",

  body: notification.body || notification.message || "",

  read: Boolean(notification.read ?? notification.is_read),

  created_at: notification.created_at || new Date().toISOString(),

  link: notification.link || "/notifications",
});

const readNotifications = (userId) => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(storageKey(userId)) || "[]",
    );

    if (!Array.isArray(stored)) {
      return [];
    }

    return stored.map(normalizeNotification);
  } catch {
    return [];
  }
};

const publishNotifications = (userId, notifications) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    storageKey(userId),
    JSON.stringify(notifications),
  );

  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, {
      detail: {
        userId: String(userId),
        notifications,
      },
    }),
  );
};

const notificationService = {
  async getAll(userId) {
    return readNotifications(userId).sort(
      (first, second) =>
        new Date(second.created_at || 0) - new Date(first.created_at || 0),
    );
  },

  async add(userId, notification) {
    const nextNotification = normalizeNotification(notification);

    const notifications = [nextNotification, ...readNotifications(userId)];

    publishNotifications(userId, notifications);

    return nextNotification;
  },

  async markRead(userId, notificationId) {
    const notifications = readNotifications(userId).map((notification) =>
      String(notification.id) === String(notificationId)
        ? {
            ...notification,
            read: true,
          }
        : notification,
    );

    publishNotifications(userId, notifications);

    return notifications;
  },

  async markAllRead(userId) {
    const notifications = readNotifications(userId).map((notification) => ({
      ...notification,
      read: true,
    }));

    publishNotifications(userId, notifications);

    return notifications;
  },

  async unreadCount(userId) {
    return readNotifications(userId).filter(
      (notification) => !notification.read,
    ).length;
  },

  subscribe(userId, listener) {
    if (typeof window === "undefined") {
      return () => {};
    }

    const key = storageKey(userId);

    const handleCustomChange = (event) => {
      if (event.detail?.userId === String(userId)) {
        listener(event.detail.notifications);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === key) {
        listener(readNotifications(userId));
      }
    };

    window.addEventListener(CHANGE_EVENT, handleCustomChange);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustomChange);

      window.removeEventListener("storage", handleStorageChange);
    };
  },
};

export default notificationService;
