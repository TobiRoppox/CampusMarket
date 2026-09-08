import fs from "fs";
import { getPlan } from "../config/plans.js";
import { cancellationDeadline, canBuyerCancel } from "../config/orderCancellation.js";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = process.env.MARKET_DATA_FILE || path.join(__dirname, "market-data.json");

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
        logo_url: "/images/buyer/campus-eats-logo.png",
        description: "Fresh student favorites and snacks",
        banner_url: "/images/buyer/campus-eats-banner.png",
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
        image_url: "/images/buyer/product-adobo.png",
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
        image_url: "/images/buyer/product-hoodie.png",
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
        image_url: "/images/buyer/product-charger.png",
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
    posSales: [],
    auditLog: [],
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
      state.posSales ??= [];
      state.auditLog ??= [];
      return state;
    } catch (error) {
      throw new Error(`Unable to read marketplace data: ${error.message}`);
    }
  }

  state = buildSeedState();
  saveState();
  return state;
};

const saveState = () => {
  if (!state) return;
  const temporary = `${dataFile}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(state, null, 2));
  fs.renameSync(temporary, dataFile);
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const safeUser = ({ password_hash, ...user }) => clone(user);
const inPeriod = (createdAt, period) => new Date(createdAt).getTime() >= Date.now() - Math.max(1, Math.min(365, Number(period) || 30)) * 86400000;
const publicUser = (user) => user ? { id: user.id, name: user.name, role: user.role, avatar_url: user.avatar_url } : null;
const approvedUser = (id) => {
  const user = findUserById(id);
  return user && user.status === "approved" && !user.is_banned;
};
const publicStall = (stall) => Boolean(stall && stall.status === "approved" && stall.is_active && approvedUser(stall.owner_id));
const stallDetails = (stall) => ({ ...stall,
  seller_name: findUserById(stall.owner_id)?.name || "Campus seller",
  product_count: getSellerProductCount(stall.id),
  plan: getPlan(stall.tier),
});
const audit = (actorId, action, targetId, note) => {
  ensureState().auditLog.push({ id: randomUUID(), actor_id: actorId, action, target_id: targetId, note, created_at: new Date().toISOString() });
};

const findUserByEmail = (email) =>
  ensureState().users.find((u) => u.email === email);

const findUserById = (id) => ensureState().users.find((u) => u.id === id);

const findStallById = (id) => ensureState().stalls.find((s) => s.id === id);

const findProductById = (id) => ensureState().products.find((p) => p.id === id);

const getSellerProductCount = (stallId) =>
  ensureState().products.filter((p) => p.stall_id === stallId).length;

export const authStore = {
  async startSelling(userId, payload) {
    const user = findUserById(userId);
    if (!approvedUser(userId) || !["buyer", "seller"].includes(user.role)) fail("An approved campus account is required.", 403);
    const stall = await stallStore.create(userId, payload);
    user.role = "seller";
    saveState();
    return { user: safeUser(user), stall };
  },
  async registerUser({ name, email, password, role = "buyer", campus_id, affiliation, department, store_name, campus_location }) {
    const current = ensureState();
    if (findUserByEmail(email)) {
      const error = new Error("Email already registered");
      error.status = 409;
      throw error;
    }

    if (current.users.some((user) => user.campus_id?.toLowerCase() === campus_id?.toLowerCase())) fail("This campus ID is already registered.", 409);
    const user = {
      id: randomUUID(),
      name,
      email,
      password_hash: bcrypt.hashSync(password, 12),
      role,
      status: "pending",
      campus_id, affiliation, department, campus: "CSUCC",
      avatar_url: "",
      is_banned: false,
      created_at: new Date().toISOString(),
    };

    current.users.push(user);
    if (role === "seller") current.stalls.push({
      id: randomUUID(), owner_id: user.id, name: store_name, location: campus_location,
      description: "", logo_url: "", banner_url: "", category: "other", tier: "free",
      status: "pending", is_active: false, created_at: user.created_at,
    });
    saveState();
    return safeUser(user);
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

    return safeUser(user);
  },

  async updateUserProfile(userId, updates) {
    const current = ensureState();
    const user = current.users.find((entry) => entry.id === userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (updates.name) {
      if (typeof updates.name !== "string" || updates.name.trim().length < 2 || updates.name.trim().length > 80) fail("Enter a valid full name.");
      if (updates.name.trim() !== user.name && user.role !== "admin") {
        user.status = "pending";
        user.review_note = "Your name changed. An administrator will recheck your campus credentials.";
      }
      user.name = updates.name.trim();
    }
    if (updates.avatar_url !== undefined) user.avatar_url = updates.avatar_url;
    saveState();
    return safeUser(user);
  },

  async listUsers({ role, status, q, page = 1, limit = 20 } = {}) {
    const current = ensureState();
    const items = current.users.filter((user) => {
      const matchRole = !role || user.role === role;
      const value = `${user.name} ${user.email}`.toLowerCase();
      const matchQuery = !q || value.includes(q.toLowerCase());
      return matchRole && matchQuery && (!status || user.status === status);
    });

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    return {
      data: items.slice(start, end).map(safeUser),
      total: items.length,
      page: Number(page),
    };
  },

  async submitCredentials(userId, payload) {
    const current = ensureState();
    const user = findUserById(userId);
    if (!user || user.is_banned) fail("Account unavailable.", 403);
    if (user.status === "approved") fail("Approved credentials cannot be changed here.", 409);
    if (current.users.some((entry) => entry.id !== userId && entry.campus_id?.toLowerCase() === payload.campus_id.toLowerCase())) fail("This campus ID is already registered.", 409);
    Object.assign(user, payload, { status: "pending", review_note: "", campus: "CSUCC" });
    saveState();
    return safeUser(user);
  },

  async reviewRegistration(userId, actorId, { status, note, credentials_checked }) {
    const user = findUserById(userId);
    if (!user || user.role === "admin") fail("Registration not found.", 404);
    if (user.status !== "pending") fail("This registration has already been reviewed.", 409);
    if (status === "approved" && (!credentials_checked || !user.campus_id || !user.affiliation || !user.department)) fail("Check complete credentials against CSUCC records before approving.");
    Object.assign(user, { status, review_note: note, reviewed_by: actorId, reviewed_at: new Date().toISOString() });
    audit(actorId, `registration.${status}`, userId, note);
    saveState();
    return safeUser(user);
  },

  async banUser(userId, ban) {
    const current = ensureState();
    const user = current.users.find((entry) => entry.id === userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    if (user.role === "admin") fail("Administrator accounts cannot be suspended here.", 403);
    user.is_banned = Boolean(ban);
    saveState();
    return safeUser(user);
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

    return clone(items.map(stallDetails));
  },

  async getById(stallId) {
    const stall = findStallById(stallId);
    if (!stall) {
      const error = new Error("Stall not found");
      error.status = 404;
      throw error;
    }
    return clone(stallDetails(stall));
  },

  async getMy(ownerId) {
    const current = ensureState();
    const stall = current.stalls.find((entry) => entry.owner_id === ownerId);
    if (!stall) return null;
    return clone(stallDetails(stall));
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
      location: payload.location,
      logo_url: payload.logo_url || "",
      category: payload.category || "other",
      status: "pending",
      tier: "free",
      is_active: false,
      created_at: new Date().toISOString(),
    };

    current.stalls.push(stall);
    saveState();
    return clone(stallDetails(stall));
  },

  async update(stallId, ownerId, payload) {
    const current = ensureState();
    const stall = current.stalls.find((entry) => entry.id === stallId);
    if (!stall) throw new Error("Stall not found");
    if (stall.owner_id !== ownerId)
      throw Object.assign(new Error("Forbidden"), { status: 403 });

    const allowed = ["name", "description", "banner_url", "logo_url", "location", "category", "contact_number", "operating_hours", "is_active"];
    for (const key of allowed) if (payload[key] !== undefined) stall[key] = payload[key];
    if (stall.status !== "approved") stall.is_active = false;
    saveState();
    return clone(stallDetails(stall));
  },

  async setPlan(stallId, tier, actorId) {
    const stall = findStallById(stallId);
    if (!stall) fail("Stall not found.", 404);
    if (!["free", "premium"].includes(tier)) fail("Invalid plan.");
    if (getSellerProductCount(stallId) > getPlan(tier).listing_limit) fail("Remove excess listings before changing to this plan.", 409);
    stall.tier = tier;
    audit(actorId, "stall.plan", stallId, tier);
    saveState();
    return clone(stallDetails(stall));
  },

  async updateStatus(stallId, status) {
    const current = ensureState();
    const stall = current.stalls.find((entry) => entry.id === stallId);
    if (!stall) throw new Error("Stall not found");

    if (!["approved", "rejected", "suspended"].includes(status)) fail("Invalid stall status.");
    if (status === "approved" && !approvedUser(stall.owner_id)) fail("Approve the owner's campus registration first.", 403);
    stall.status = status;
    stall.is_active = status === "approved";
    saveState();
    return clone(stallDetails(stall));
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
    publicOnly = true,
    featured = false,
    min_price, max_price,
  } = {}) {
    const current = ensureState();
    const filtered = current.products.filter((product) => {
      const stall = findStallById(product.stall_id);
      const matchActive = (!publicOnly || publicStall(stall)) && (!activeOnly || product.is_active);
      const matchPrice = (min_price == null || product.price >= Number(min_price)) && (max_price == null || product.price <= Number(max_price));
      const matchFeatured = !featured || stall?.tier === "premium";
      const matchCategory = !category || product.category === category;
      const matchStall = !stallId || product.stall_id === stallId;
      const haystack = `${product.name} ${product.description} ${stall?.name || ""}`.toLowerCase();
      const matchQuery = !q || haystack.includes(q.toLowerCase());
      return matchActive && matchCategory && matchStall && matchQuery && matchPrice && matchFeatured;
    });

    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit);
    const data = filtered.slice(start, end).map((product) => ({
      ...product,
      stalls: current.stalls.find((stall) => stall.id === product.stall_id),
    }));

    return { data, total: filtered.length, page: Number(page) };
  },

  async getById(productId, actor) {
    const current = ensureState();
    const product = current.products.find((entry) => entry.id === productId);
    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }

    const stall = findStallById(product.stall_id);
    if ((!product.is_active || !publicStall(stall)) && actor?.role !== "admin" && actor?.id !== stall?.owner_id) fail("Product not found.", 404);
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

    if (stall.status !== "approved" || !approvedUser(stall.owner_id)) fail("An approved store and account are required.", 403);
    const count = current.products.filter(
      (product) => product.stall_id === stallId,
    ).length;
    if (count >= getPlan(stall.tier).listing_limit) {
      const error = new Error(`${getPlan(stall.tier).name} plan limit of ${getPlan(stall.tier).listing_limit} listings reached`);
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

  async update(productId, payload, actor) {
    const current = ensureState();
    const product = current.products.find((entry) => entry.id === productId);
    if (!product) throw new Error("Product not found");

    const stall = findStallById(product.stall_id);
    if (actor?.role !== "admin" && actor?.id !== stall?.owner_id) fail("You can only edit your own products.", 403);
    for (const key of ["name", "description", "price", "stock", "category", "image_url", "is_active"]) {
      if (payload[key] !== undefined) product[key] = payload[key];
    }
    saveState();
    return clone({
      ...product,
      stalls: current.stalls.find((stall) => stall.id === product.stall_id),
    });
  },

  async remove(productId, actor) {
    const current = ensureState();
    const idx = current.products.findIndex((entry) => entry.id === productId);
    if (idx < 0) throw new Error("Product not found");
    const stall = findStallById(current.products[idx].stall_id);
    if (actor?.role !== "admin" && actor?.id !== stall?.owner_id) fail("You can only delete your own products.", 403);
    current.products.splice(idx, 1);
    saveState();
    return true;
  },

  async getRecommendations(userId) {
    const current = ensureState();
    const products = current.products.filter((p) => p.is_active && publicStall(findStallById(p.stall_id))).slice(0, 8);
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
          product.is_active && publicStall(findStallById(product.stall_id)) &&
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
    if (!product.is_active || !publicStall(findStallById(product.stall_id))) fail("Product is unavailable.", 409);
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) fail("Quantity must be a positive whole number.");
    const existingQuantity = current.carts.find((item) => item.user_id === userId && item.product_id === productId)?.quantity || 0;
    if (existingQuantity + Number(quantity) > product.stock) fail("Insufficient stock.", 409);

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
    const product = findProductById(entry.product_id);
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) fail("Quantity must be a positive whole number.");
    if (!product || !product.is_active || !publicStall(findStallById(product.stall_id)) || Number(quantity) > product.stock) fail("Product or quantity unavailable.", 409);
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

const withOrderProductDetails = (order) => ({
  ...order,
  cancellation_deadline: cancellationDeadline(order) === null ? null : new Date(cancellationDeadline(order)).toISOString(),
  can_cancel: canBuyerCancel(order),
  stall: (() => {
    const current = ensureState();
    const product = current.products.find((entry) => entry.id === order.items?.[0]?.product_id);
    const stall = current.stalls.find((entry) => entry.id === (order.stall_id || product?.stall_id));
    return stall ? { id: stall.id, name: stall.name, location: stall.location } : null;
  })(),
  items: (order.items || []).map((item) => {
    const product = ensureState().products.find((entry) => entry.id === item.product_id);
    return {
      ...item,
      product: {
        id: item.product_id,
        name: item.name || item.product_name || product?.name || "Item details unavailable",
        image_url: item.image_url ?? product?.image_url ?? null,
      },
    };
  }),
});

export const orderStore = {
  async create(buyerId, items, deliveryNotes = "", fulfillment = "pickup") {
    const current = ensureState();
    const productIds = items.map((item) => item.product_id);
    const selectedProducts = current.products.filter((product) =>
      productIds.includes(product.id),
    );
    if (selectedProducts.length !== productIds.length) {
      throw new Error("One or more products were not found");
    }

    if (!approvedUser(buyerId)) fail("An approved buyer account is required.", 403);
    const sellerIds = new Set();
    for (const item of items) {
      const product = selectedProducts.find((entry) => entry.id === item.product_id);
      const stall = findStallById(product?.stall_id);
      if (!product?.is_active || !publicStall(stall)) fail("A selected product is no longer available.", 409);
      if (product.stock < item.quantity) fail(`Insufficient stock for ${product.name}.`, 409);
      sellerIds.add(stall.owner_id);
    }
    if (sellerIds.size !== 1) fail("Place a separate order for each store.");
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
        name: product.name,
        image_url: product.image_url || null,
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
      fulfillment,
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
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(withOrderProductDetails),
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
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(withOrderProductDetails),
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
    const transitions = { pending: ["confirmed", "cancelled"], confirmed: ["preparing", "ready", "cancelled"], preparing: ["ready"], ready: ["completed", "delivered"] };
    const buyerCancellation = actorId === order.buyer_id && actorRole !== "admin";
    if (buyerCancellation) {
      if (status !== "cancelled") fail("Buyers can only cancel their orders.", 403);
      if (!canBuyerCancel(order)) fail("You can cancel an unfinished order only within 10 minutes of placing it.", 409);
    } else if (!(transitions[order.status] || []).includes(status)) fail("Invalid order status transition.");
    if (status === "cancelled") for (const item of order.items) {
      const product = findProductById(item.product_id);
      if (product) product.stock += item.quantity;
    }
    order.status = status;
    if (status === "cancelled") order.cancelled_at = new Date().toISOString();
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
          partner: publicUser(findUserById(partnerId)),
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
    if (!approvedUser(userId) || !approvedUser(receiverId)) fail("Messaging requires approved campus accounts.", 403);
    const sender = findUserById(userId), receiver = findUserById(receiverId);
    if (userId === receiverId || !["buyer", "seller"].every((role) => [sender.role, receiver.role].includes(role))) fail("Messages must be between a buyer and a seller.");
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
      current.events
        .slice()
        .map((event) => ({
          ...event,
          stall_count: current.eventStalls.filter(
            (entry) => String(entry.event_id) === String(event.id),
          ).length,
        }))
        .sort((a, b) =>
          String(a.date || "").localeCompare(String(b.date || "")),
        ),
    );
  },

  async getById(eventId) {
    const current = ensureState();

    const event = current.events.find(
      (entry) => String(entry.id) === String(eventId),
    );

    if (!event) {
      const error = new Error("Event not found");
      error.status = 404;
      throw error;
    }

    return clone(event);
  },

  async listStallsForEvent(eventId) {
    const current = ensureState();

    const event = current.events.find(
      (entry) => String(entry.id) === String(eventId),
    );

    if (!event) {
      const error = new Error("Event not found");
      error.status = 404;
      throw error;
    }

    const stalls = current.eventStalls
      .filter((entry) => String(entry.event_id) === String(eventId))
      .map((entry) => {
        const sellerStall = entry.seller_id
          ? current.stalls.find(
              (stall) => String(stall.owner_id) === String(entry.seller_id),
            )
          : null;

        const seller = sellerStall
          ? current.users.find(
              (user) => String(user.id) === String(sellerStall.owner_id),
            )
          : null;

        return {
          ...entry,

          sellerName: seller?.name || "",

          productsAvailable: sellerStall
            ? current.products
                .filter(
                  (product) =>
                    String(product.stall_id) === String(sellerStall.id),
                )
                .map((product) => product.name)
            : [],
        };
      });

    return clone(stalls);
  },

  async submitApplication(sellerId, payload = {}) {
    const current = ensureState();

    const cleanText = (value) => String(value ?? "").trim();

    const eventId = cleanText(payload.eventId);
    const stallName = cleanText(payload.stallName);
    const businessName = cleanText(payload.businessName);
    const productCategory = cleanText(payload.productCategory);
    const productList = cleanText(payload.productList);
    const contactInfo = cleanText(payload.contactInfo);

    const event = current.events.find(
      (entry) => String(entry.id) === String(eventId),
    );

    if (!event) {
      const error = new Error("Event not found");
      error.status = 404;
      throw error;
    }

    if (
      !stallName ||
      !businessName ||
      !productCategory ||
      !productList ||
      !contactInfo
    ) {
      const error = new Error(
        "Please complete all required application fields",
      );
      error.status = 400;
      throw error;
    }

    const stallSize = Number(payload.preferredStallSize);

    const duration = Number(payload.duration);

    if (!Number.isFinite(stallSize) || stallSize <= 0) {
      const error = new Error("Preferred stall size must be greater than zero");
      error.status = 400;
      throw error;
    }

    if (!Number.isInteger(duration) || duration <= 0) {
      const error = new Error("Duration must be a whole number of days");
      error.status = 400;
      throw error;
    }

    const activeStatuses = ["pending", "approved", "reserved"];

    const duplicate = current.applications.find(
      (entry) =>
        String(entry.seller_id) === String(sellerId) &&
        String(entry.event_id) === String(eventId) &&
        activeStatuses.includes(String(entry.status).toLowerCase()),
    );

    if (duplicate) {
      const error = new Error(
        "You already have an active application for this event",
      );
      error.status = 409;
      throw error;
    }

    const application = {
      id: randomUUID(),

      seller_id: sellerId,

      event_id: eventId,

      stall_name: stallName,

      business_name: businessName,

      product_category: productCategory,

      product_list: productList,

      preferred_stall_size: stallSize,

      duration,

      contact_info: contactInfo,

      status: "pending",

      created_at: new Date().toISOString(),
    };

    current.applications.push(application);

    saveState();

    return clone(application);
  },

  async listApplications({ eventId, status, sellerId } = {}) {
    const current = ensureState();

    const normalizedStatus = status ? String(status).toLowerCase() : "";

    const applications = current.applications
      .filter((entry) => {
        const matchesEvent =
          !eventId || String(entry.event_id) === String(eventId);

        const matchesStatus =
          !normalizedStatus ||
          String(entry.status).toLowerCase() === normalizedStatus;

        const matchesSeller =
          !sellerId || String(entry.seller_id) === String(sellerId);

        return matchesEvent && matchesStatus && matchesSeller;
      })
      .map((entry) => {
        const event = current.events.find(
          (item) => String(item.id) === String(entry.event_id),
        );

        return {
          ...entry,

          event: event
            ? {
                id: event.id,

                name: event.name,

                date: event.date,

                end_date: event.end_date || null,

                location: event.location || "",

                description: event.description || "",
              }
            : null,
        };
      })
      .sort((a, b) =>
        String(b.created_at || "").localeCompare(String(a.created_at || "")),
      );

    return clone(applications);
  },
};

export const posStore = {
  async customers(query) {
    if (!query || query.trim().length < 3) return [];
    return ensureState().users.filter((user) => user.role === "buyer" && approvedUser(user.id) &&
      (user.email.toLowerCase() === query.trim().toLowerCase() || user.campus_id?.toLowerCase() === query.trim().toLowerCase()))
      .map(publicUser);
  },
  async list(sellerId) {
    return clone(ensureState().posSales.filter((sale) => sale.seller_id === sellerId).sort((a, b) => b.created_at.localeCompare(a.created_at)));
  },
  async create(sellerId, { request_id, buyer_id, items, cash_received }) {
    const current = ensureState();
    const prior = current.posSales.find((sale) => sale.request_id === request_id && sale.seller_id === sellerId);
    if (prior) return clone(prior);
    const stall = current.stalls.find((entry) => entry.owner_id === sellerId);
    if (!publicStall(stall)) fail("Open an approved stall before recording a sale.", 403);
    const buyer = findUserById(buyer_id);
    if (buyer?.role !== "buyer" || !approvedUser(buyer_id)) fail("Choose an approved CSUCC buyer.", 403);
    const unique = new Set(items.map((item) => item.product_id));
    if (unique.size !== items.length) fail("Duplicate product lines are not allowed.");
    const lines = items.map((item) => {
      const product = findProductById(item.product_id);
      if (!product || product.stall_id !== stall.id || !product.is_active) fail("Choose an active product from your own stall.", 403);
      if (product.stock < item.quantity) fail(`Insufficient stock for ${product.name}.`, 409);
      return { product_id: product.id, name: product.name, quantity: item.quantity, unit_price: product.price };
    });
    const totalCents = lines.reduce((sum, line) => sum + Math.round(line.unit_price * 100) * line.quantity, 0);
    const cashCents = Math.round(cash_received * 100);
    if (cashCents < totalCents) fail("Cash received is less than the sale total.");
    // Validate every line before changing any stock. This store uses a single process.
    for (const line of lines) findProductById(line.product_id).stock -= line.quantity;
    const sale = { id: randomUUID(), request_id, seller_id: sellerId, buyer_id, buyer_name: buyer.name,
      stall_id: stall.id, stall_name: stall.name, items: lines, total: totalCents / 100,
      cash_received: cashCents / 100, change: (cashCents - totalCents) / 100,
      status: "completed", source: "pos", created_at: new Date().toISOString() };
    current.posSales.push(sale);
    audit(sellerId, "pos.sale", sale.id, "Cash sale recorded");
    saveState();
    return clone(sale);
  },
};

export const analyticsStore = {
  async salesSummary(userId, role, period = 30) {
    const current = ensureState();
    const orders = [...current.orders, ...current.posSales].filter((order) => {
      const scoped = role === "admin" ? true : order.seller_id === userId;
      return scoped && ["completed", "delivered"].includes(order.status) && inPeriod(order.created_at, period);
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

  async topProducts(userId, role, period = 30) {
    const current = ensureState();
    const scopedOrders = [...current.orders, ...current.posSales].filter((entry) =>
      (role === "admin" || entry.seller_id === userId) && ["completed", "delivered"].includes(entry.status) && inPeriod(entry.created_at, period),
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

  async categoryBreakdown(userId, role, period = 30) {
    const current = ensureState();
    const scopedOrders = [...current.orders, ...current.posSales].filter((entry) =>
      (role === "admin" || entry.seller_id === userId) && ["completed", "delivered"].includes(entry.status) && inPeriod(entry.created_at, period),
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
