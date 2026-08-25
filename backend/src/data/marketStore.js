import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "market-data.json");

const seedPasswordHash = bcrypt.hashSync("password123", 12);

const buildSeedState = () => {
  const now = new Date().toISOString();
  const adminId = randomUUID();
  const buyerId = randomUUID();
  const sellerId = randomUUID();
  const stallId = randomUUID();
  const productId1 = randomUUID();
  const productId2 = randomUUID();
  const productId3 = randomUUID();

  return {
    users: [
      {
        id: adminId,
        name: "System Admin",
        email: "admin@campusmarket.test",
        password_hash: seedPasswordHash,
        role: "admin",
        status: "approved",
        avatar_url: "",
        is_banned: false,
        created_at: now,
      },
      {
        id: buyerId,
        name: "Maria Santos",
        email: "buyer@campusmarket.test",
        password_hash: seedPasswordHash,
        role: "buyer",
        status: "approved",
        avatar_url: "",
        is_banned: false,
        created_at: now,
      },
      {
        id: sellerId,
        name: "Jayson Cruz",
        email: "seller@campusmarket.test",
        password_hash: seedPasswordHash,
        role: "seller",
        status: "approved",
        avatar_url: "",
        is_banned: false,
        created_at: now,
      },
    ],
    stalls: [
      {
        id: stallId,
        owner_id: sellerId,
        name: "Campus Eats",
        description: "Fresh student favorites and snacks",
        banner_url: "",
        location: "Main Canteen",
        category: "food",
        status: "approved",
        tier: "premium",
        is_active: true,
        created_at: now,
      },
    ],
    products: [
      {
        id: productId1,
        stall_id: stallId,
        name: "Adobong Rice Bucket",
        description: "Hearty rice meal with chicken adobo.",
        price: 89,
        stock: 15,
        category: "food",
        image_url: "",
        is_active: true,
        is_featured: true,
        view_count: 42,
        created_at: now,
      },
      {
        id: productId2,
        stall_id: stallId,
        name: "Campus Hoodie",
        description: "Comfortable hoodie for everyday campus wear.",
        price: 450,
        stock: 8,
        category: "clothing",
        image_url: "",
        is_active: true,
        is_featured: false,
        view_count: 21,
        created_at: now,
      },
      {
        id: productId3,
        stall_id: stallId,
        name: "USB-C Charger",
        description: "Fast charging USB-C power adapter.",
        price: 299,
        stock: 10,
        category: "electronics",
        image_url: "",
        is_active: true,
        is_featured: true,
        view_count: 33,
        created_at: now,
      },
    ],
    orders: [],
    messages: [],
    carts: [],
    behavior: [],
    events: [
      {
        id: randomUUID(),
        name: "Spring Fair",
        date: "2026-05-01",
        location: "CSUCC Grounds",
        description: "A fun spring event featuring local student stalls.",
        created_at: now,
      },
      {
        id: randomUUID(),
        name: "Summer Fest",
        date: "2026-06-15",
        location: "CSUCC Covered Court",
        description: "Enjoy summer vibes with food, music, and merch.",
        created_at: now,
      },
    ],
    eventStalls: [],
    applications: [],
  };
};

let state = null;

const ensureState = () => {
  if (state) return state;
  if (fs.existsSync(dataFile)) {
    try {
      state = JSON.parse(fs.readFileSync(dataFile, "utf8"));
      // Backfill new collections for stores created before this update
      if (!state.events) state.events = [];
      if (!state.eventStalls) state.eventStalls = [];
      if (!state.applications) state.applications = [];
      return state;
    } catch {
      // ignore and fall back to seed state
    }
  }

  state = buildSeedState();
  saveState();
  return state;
};

const saveState = () => {
  if (!state) return;
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2));
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const findUserByEmail = (email) =>
  ensureState().users.find((u) => u.email === email);

const findUserById = (id) => ensureState().users.find((u) => u.id === id);

const findStallById = (id) => ensureState().stalls.find((s) => s.id === id);

const findProductById = (id) => ensureState().products.find((p) => p.id === id);

const getSellerProductCount = (stallId) =>
  ensureState().products.filter((p) => p.stall_id === stallId).length;

export const authStore = {
  async registerUser({ name, email, password, role = "buyer" }) {
    const current = ensureState();
    if (findUserByEmail(email)) {
      const error = new Error("Email already registered");
      error.status = 409;
      throw error;
    }

    const user = {
      id: randomUUID(),
      name,
      email,
      password_hash: bcrypt.hashSync(password, 12),
      role,
      status: role === "seller" ? "pending" : "approved",
      avatar_url: "",
      is_banned: false,
      created_at: new Date().toISOString(),
    };

    current.users.push(user);
    saveState();
    return clone(user);
  },

  async loginUser(email, password) {
    const current = ensureState();
    const user = findUserByEmail(email);
    if (!user) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    if (user.is_banned) {
      const error = new Error("Account suspended");
      error.status = 403;
      throw error;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    return clone(user);
  },

  async getUserById(userId) {
    const user = findUserById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return clone(user);
  },

  async updateUserProfile(userId, updates) {
    const current = ensureState();
    const user = current.users.find((entry) => entry.id === userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (updates.name) user.name = updates.name;
    if (updates.avatar_url !== undefined) user.avatar_url = updates.avatar_url;
    saveState();
    return clone(user);
  },

  async listUsers({ role, q, page = 1, limit = 20 } = {}) {
    const current = ensureState();
    const items = current.users.filter((user) => {
      const matchRole = !role || user.role === role;
      const value = `${user.name} ${user.email}`.toLowerCase();
      const matchQuery = !q || value.includes(q.toLowerCase());
      return matchRole && matchQuery;
    });

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    return {
      data: clone(items.slice(start, end)),
      total: items.length,
      page: Number(page),
    };
  },

  async banUser(userId, ban) {
    const current = ensureState();
    const user = current.users.find((entry) => entry.id === userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    user.is_banned = Boolean(ban);
    saveState();
    return clone(user);
  },
};

export const stallStore = {
  async listStalls({ q = "", status, activeOnly = false } = {}) {
    const current = ensureState();
    const items = current.stalls.filter((stall) => {
      const matchStatus = !status || stall.status === status;
      const matchActive = !activeOnly || stall.is_active;
      const haystack = `${stall.name} ${stall.location}`.toLowerCase();
      const matchQuery = !q || haystack.includes(q.toLowerCase());
      return matchStatus && matchActive && matchQuery;
    });

    return clone(items);
  },

  async getById(stallId) {
    const stall = findStallById(stallId);
    if (!stall) {
      const error = new Error("Stall not found");
      error.status = 404;
      throw error;
    }
    return clone(stall);
  },

  async getMy(ownerId) {
    const current = ensureState();
    const stall = current.stalls.find((entry) => entry.owner_id === ownerId);
    if (!stall) return null;
    return clone(stall);
  },

  async create(ownerId, payload) {
    const current = ensureState();
    const existing = current.stalls.find((entry) => entry.owner_id === ownerId);
    if (existing) {
      const error = new Error("You already have a stall");
      error.status = 409;
      throw error;
    }

    const stall = {
      id: randomUUID(),
      owner_id: ownerId,
      name: payload.name,
      description: payload.description || "",
      banner_url: payload.banner_url || "",
      location: payload.location || "Campus",
      category: payload.category || "other",
      status: "pending",
      tier: "free",
      is_active: false,
      created_at: new Date().toISOString(),
    };

    current.stalls.push(stall);
    saveState();
    return clone(stall);
  },

  async update(stallId, ownerId, payload) {
    const current = ensureState();
    const stall = current.stalls.find((entry) => entry.id === stallId);
    if (!stall) throw new Error("Stall not found");
    if (stall.owner_id !== ownerId)
      throw Object.assign(new Error("Forbidden"), { status: 403 });

    Object.assign(stall, payload);
    saveState();
    return clone(stall);
  },

  async updateStatus(stallId, status) {
    const current = ensureState();
    const stall = current.stalls.find((entry) => entry.id === stallId);
    if (!stall) throw new Error("Stall not found");

    stall.status = status;
    if (status === "approved") stall.is_active = true;
    saveState();
    return clone(stall);
  },
};

export const productStore = {
  async listProducts({
    q = "",
    category,
    page = 1,
    limit = 20,
    stallId,
    activeOnly = true,
  } = {}) {
    const current = ensureState();
    const filtered = current.products.filter((product) => {
      const matchActive = !activeOnly || product.is_active;
      const matchCategory = !category || product.category === category;
      const matchStall = !stallId || product.stall_id === stallId;
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      const matchQuery = !q || haystack.includes(q.toLowerCase());
      return matchActive && matchCategory && matchStall && matchQuery;
    });

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const data = filtered.slice(start, end).map((product) => ({
      ...product,
      stalls: current.stalls.find((stall) => stall.id === product.stall_id),
    }));

    return { data, total: filtered.length, page: Number(page) };
  },

  async getById(productId) {
    const current = ensureState();
    const product = current.products.find((entry) => entry.id === productId);
    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    product.view_count = (product.view_count || 0) + 1;
    saveState();
    return clone({
      ...product,
      stalls: current.stalls.find((stall) => stall.id === product.stall_id),
    });
  },

  async create(stallId, payload) {
    const current = ensureState();
    const stall = current.stalls.find((entry) => entry.id === stallId);
    if (!stall) throw new Error("Stall not found");

    const count = current.products.filter(
      (product) => product.stall_id === stallId,
    ).length;
    if (stall.tier === "free" && count >= 15) {
      const error = new Error("Free tier listing cap reached");
      error.status = 403;
      throw error;
    }

    const product = {
      id: randomUUID(),
      stall_id: stallId,
      name: payload.name,
      description: payload.description || "",
      price: Number(payload.price),
      stock: Number(payload.stock),
      category: payload.category || "other",
      image_url: payload.image_url || "",
      is_active: payload.is_active !== false,
      is_featured: false,
      view_count: 0,
      created_at: new Date().toISOString(),
    };

    current.products.push(product);
    saveState();
    return clone({ ...product, stalls: stall });
  },

  async update(productId, payload) {
    const current = ensureState();
    const product = current.products.find((entry) => entry.id === productId);
    if (!product) throw new Error("Product not found");

    Object.assign(product, payload);
    saveState();
    return clone({
      ...product,
      stalls: current.stalls.find((stall) => stall.id === product.stall_id),
    });
  },

  async remove(productId) {
    const current = ensureState();
    const idx = current.products.findIndex((entry) => entry.id === productId);
    if (idx < 0) throw new Error("Product not found");
    current.products.splice(idx, 1);
    saveState();
    return true;
  },

  async getRecommendations(userId) {
    const current = ensureState();
    const products = current.products.filter((p) => p.is_active).slice(0, 8);
    return clone(
      products.map((product) => ({
        ...product,
        stalls: current.stalls.find((stall) => stall.id === product.stall_id),
      })),
    );
  },

  async getSimilar(productId) {
    const current = ensureState();
    const source = current.products.find((entry) => entry.id === productId);
    if (!source) return [];
    const similar = current.products
      .filter(
        (product) =>
          product.is_active &&
          product.category === source.category &&
          product.id !== productId,
      )
      .slice(0, 4);
    return clone(
      similar.map((product) => ({
        ...product,
        stalls: current.stalls.find((stall) => stall.id === product.stall_id),
      })),
    );
  },
};

export const cartStore = {
  async list(userId) {
    const current = ensureState();
    return clone(
      current.carts
        .filter((item) => item.user_id === userId)
        .map((item) => ({
          ...item,
          products: current.products.find(
            (product) => product.id === item.product_id,
          ),
        })),
    );
  },

  async add(userId, productId, quantity = 1) {
    const current = ensureState();
    const product = current.products.find((entry) => entry.id === productId);
    if (!product) throw new Error("Product not found");
    if (!product.is_active) throw new Error("Product is unavailable");

    let entry = current.carts.find(
      (item) => item.user_id === userId && item.product_id === productId,
    );
    if (entry) {
      entry.quantity += Number(quantity);
    } else {
      entry = {
        id: randomUUID(),
        user_id: userId,
        product_id: productId,
        quantity: Number(quantity),
      };
      current.carts.push(entry);
    }
    saveState();
    return clone({ ...entry, products: product });
  },

  async update(userId, itemId, quantity) {
    const current = ensureState();
    const entry = current.carts.find(
      (item) => item.id === itemId && item.user_id === userId,
    );
    if (!entry) throw new Error("Cart item not found");
    entry.quantity = Number(quantity);
    saveState();
    return clone(entry);
  },

  async remove(userId, itemId) {
    const current = ensureState();
    const index = current.carts.findIndex(
      (item) => item.id === itemId && item.user_id === userId,
    );
    if (index < 0) throw new Error("Cart item not found");
    current.carts.splice(index, 1);
    saveState();
    return true;
  },

  async clear(userId) {
    const current = ensureState();
    current.carts = current.carts.filter((item) => item.user_id !== userId);
    saveState();
    return true;
  },
};

export const orderStore = {
  async create(buyerId, items, deliveryNotes = "") {
    const current = ensureState();
    const productIds = items.map((item) => item.product_id);
    const selectedProducts = current.products.filter((product) =>
      productIds.includes(product.id),
    );
    if (selectedProducts.length !== productIds.length) {
      throw new Error("One or more products were not found");
    }

    const orderItems = [];
    const sellers = new Set();
    for (const item of items) {
      const product = selectedProducts.find(
        (entry) => entry.id === item.product_id,
      );
      if (!product || product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product?.name || item.product_id}`,
        );
      }
      product.stock -= item.quantity;
      const stall = current.stalls.find(
        (entry) => entry.id === product.stall_id,
      );
      if (stall) sellers.add(stall.owner_id);
      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.price,
      });
    }

    const sellerId =
      sellers.size === 1
        ? Array.from(sellers)[0]
        : current.stalls[0]?.owner_id || buyerId;
    const order = {
      id: randomUUID(),
      buyer_id: buyerId,
      seller_id: sellerId,
      total: orderItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0,
      ),
      status: "pending",
      delivery_notes: deliveryNotes,
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    current.orders.push(order);
    saveState();
    return clone(order);
  },

  async listBuyer(buyerId) {
    const current = ensureState();
    return clone(
      current.orders
        .filter((order) => order.buyer_id === buyerId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  },

  async listSeller(sellerId, status) {
    const current = ensureState();
    return clone(
      current.orders
        .filter(
          (order) =>
            order.seller_id === sellerId &&
            (!status || order.status === status),
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  },

  async updateStatus(orderId, status, actorId, actorRole) {
    const current = ensureState();
    const order = current.orders.find((entry) => entry.id === orderId);
    if (!order) throw new Error("Order not found");
    const isAuthorized =
      actorId === order.buyer_id ||
      actorId === order.seller_id ||
      actorRole === "admin";
    if (!isAuthorized) {
      const error = new Error("Not authorized");
      error.status = 403;
      throw error;
    }
    order.status = status;
    saveState();
    return clone(order);
  },
};

export const messageStore = {
  async listConversations(userId) {
    const current = ensureState();
    const filtered = current.messages
      .filter(
        (message) =>
          message.sender_id === userId || message.receiver_id === userId,
      )
      .sort((a, b) => b.sent_at.localeCompare(a.sent_at));
    const partners = [];
    const seen = new Set();

    for (const message of filtered) {
      const partnerId =
        message.sender_id === userId ? message.receiver_id : message.sender_id;
      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        partners.push({
          partner: findUserById(partnerId),
          last_message: clone(message),
        });
      }
    }

    return clone(partners);
  },

  async listThread(userId, partnerId) {
    const current = ensureState();
    const thread = current.messages
      .filter((message) => {
        const sentByUser =
          message.sender_id === userId && message.receiver_id === partnerId;
        const sentByPartner =
          message.sender_id === partnerId && message.receiver_id === userId;
        return sentByUser || sentByPartner;
      })
      .sort((a, b) => a.sent_at.localeCompare(b.sent_at));

    return clone(thread);
  },

  async send(userId, receiverId, content, productId = null) {
    const current = ensureState();
    const message = {
      id: randomUUID(),
      sender_id: userId,
      receiver_id: receiverId,
      product_id: productId,
      content,
      sent_at: new Date().toISOString(),
      read_status: false,
    };
    current.messages.push(message);
    saveState();
    return clone(message);
  },
};

export const eventStore = {
  async listEvents() {
    const current = ensureState();
    return clone(
      current.events.slice().sort((a, b) => a.date.localeCompare(b.date)),
    );
  },

  async getById(eventId) {
    const current = ensureState();
    const event = current.events.find((entry) => entry.id === eventId);
    if (!event) {
      const error = new Error("Event not found");
      error.status = 404;
      throw error;
    }
    return clone(event);
  },

  async listStallsForEvent(eventId) {
    const current = ensureState();
    const event = current.events.find((entry) => entry.id === eventId);
    if (!event) {
      const error = new Error("Event not found");
      error.status = 404;
      throw error;
    }

    const stalls = current.eventStalls
      .filter((entry) => entry.event_id === eventId)
      .map((entry) => {
        const seller = entry.seller_id
          ? current.stalls.find((s) => s.owner_id === entry.seller_id)
          : null;
        return {
          ...entry,
          sellerName: seller
            ? current.users.find((u) => u.id === seller.owner_id)?.name || ""
            : "",
          productsAvailable: seller
            ? current.products
                .filter((p) => p.stall_id === seller.id)
                .map((p) => p.name)
            : [],
        };
      });

    return clone(stalls);
  },

  async submitApplication(sellerId, payload) {
    const current = ensureState();
    const event = current.events.find((entry) => entry.id === payload.eventId);
    if (!event) {
      const error = new Error("Event not found");
      error.status = 404;
      throw error;
    }

    const application = {
      id: randomUUID(),
      seller_id: sellerId,
      event_id: payload.eventId,
      stall_name: payload.stallName,
      business_name: payload.businessName,
      product_category: payload.productCategory,
      product_list: payload.productList,
      preferred_stall_size: payload.preferredStallSize,
      duration: payload.duration,
      contact_info: payload.contactInfo,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    current.applications.push(application);
    saveState();
    return clone(application);
  },

  async listApplications({ eventId, status } = {}) {
    const current = ensureState();
    const items = current.applications.filter((entry) => {
      const matchEvent = !eventId || entry.event_id === eventId;
      const matchStatus = !status || entry.status === status;
      return matchEvent && matchStatus;
    });
    return clone(items);
  },
};

export const analyticsStore = {
  async salesSummary(userId, role) {
    const current = ensureState();
    const orders = current.orders.filter((order) => {
      const scoped = role === "admin" ? true : order.seller_id === userId;
      return scoped && order.status !== "cancelled";
    });

    const timeline = {};
    for (const order of orders) {
      const date = order.created_at.slice(0, 10);
      if (!timeline[date]) timeline[date] = { date, revenue: 0, orders: 0 };
      timeline[date].revenue += Number(order.total);
      timeline[date].orders += 1;
    }

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    const totalOrders = orders.length;
    return {
      timeline: Object.values(timeline).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      total_revenue: Number(totalRevenue.toFixed(2)),
      total_orders: totalOrders,
      avg_order_value: totalOrders
        ? Number((totalRevenue / totalOrders).toFixed(2))
        : 0,
    };
  },

  async topProducts(userId, role) {
    const current = ensureState();
    const scopedOrders = current.orders.filter((entry) =>
      role === "admin" ? true : entry.seller_id === userId,
    );

    const map = {};
    for (const order of scopedOrders) {
      for (const item of order.items || []) {
        const product = current.products.find(
          (entry) => entry.id === item.product_id,
        );
        if (!map[item.product_id]) {
          map[item.product_id] = {
            product_id: item.product_id,
            product,
            total_sold: 0,
            revenue: 0,
          };
        }
        map[item.product_id].total_sold += item.quantity;
        map[item.product_id].revenue += item.quantity * Number(item.unit_price);
      }
    }

    return Object.values(map)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 6)
      .map((entry) => ({
        ...entry,
        revenue: Number(entry.revenue.toFixed(2)),
      }));
  },

  async categoryBreakdown(userId, role) {
    const current = ensureState();
    const scopedOrders = current.orders.filter((entry) =>
      role === "admin" ? true : entry.seller_id === userId,
    );

    const map = {};
    for (const order of scopedOrders) {
      for (const item of order.items || []) {
        const product = current.products.find(
          (entry) => entry.id === item.product_id,
        );
        const category = product?.category || "other";
        if (!map[category]) map[category] = { category, revenue: 0 };
        map[category].revenue += item.quantity * Number(item.unit_price);
      }
    }

    return Object.values(map)
      .map((entry) => ({ ...entry, revenue: Number(entry.revenue.toFixed(2)) }))
      .sort((a, b) => b.revenue - a.revenue);
  },
};

export const behaviorStore = {
  async log(userId, productId, action) {
    const current = ensureState();
    current.behavior.push({
      id: randomUUID(),
      user_id: userId,
      product_id: productId,
      action,
      created_at: new Date().toISOString(),
    });
    saveState();
    return true;
  },
};

export const adminStore = {
  async getStats() {
    const current = ensureState();
    const total_users = current.users.length;
    const active_stalls = current.stalls.filter(
      (stall) => stall.status === "approved",
    ).length;
    const total_orders = current.orders.length;
    const total_revenue = current.orders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    return {
      total_users,
      active_stalls,
      total_orders,
      total_revenue: Number(total_revenue.toFixed(2)),
      total_interactions: current.behavior.length,
    };
  },

  async getPendingStalls() {
    const current = ensureState();
    return clone(current.stalls.filter((stall) => stall.status === "pending"));
  },
};

export const getFeaturedStalls = () => {
  const current = ensureState();
  return clone(
    current.stalls.filter(
      (stall) => stall.is_active && stall.status === "approved",
    ),
  );
};

export const getPublicProductFeed = () => {
  const current = ensureState();
  return clone(
    current.products
      .filter((product) => product.is_active)
      .map((product) => ({
        ...product,
        stalls: current.stalls.find((stall) => stall.id === product.stall_id),
      })),
  );
};
