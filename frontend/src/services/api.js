import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productService = {
  getAll: (params) => api.get("/products", { params }),
  getOne: (id) => api.get(`/products/${id}`),
  getRecommendations: (userId) =>
    api.get(`/products/recommendations/${userId}`),
  getSimilar: (id) => api.get(`/products/${id}/similar`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const orderService = {
  getBuyerOrders: () => api.get("/orders/buyer"),
  getSellerOrders: (params) => api.get("/orders/seller", { params }),
  updateStatus: (orderId, status) =>
    api.put(`/orders/${orderId}/status`, { status }),
};

export const messageService = {
  getConversations: () => api.get("/messages"),
  getMessages: (partnerId) => api.get(`/messages/${partnerId}`),
  send: (payload) => api.post("/messages", payload),
};

export const analyticsService = {
  getSales: (period = 30) =>
    api.get("/analytics/sales", { params: { period } }),
  getTopProducts: () => api.get("/analytics/products/top"),
  getCategories: () => api.get("/analytics/categories"),
};

export const behaviorService = {
  log: (productId, action) => api.post(`/behavior/${productId}`, { action }),
};

export const authService = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (data) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

export const cartService = {
  get: () => api.get("/cart"),
  add: (productId, quantity) =>
    api.post("/cart", { product_id: productId, quantity }),
  update: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
  clear: () => api.delete("/cart/clear"),
};

export const adminService = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  getPendingStalls: () => api.get("/admin/stalls/pending"),
  banUser: (userId, ban) => api.put(`/admin/users/${userId}/ban`, { ban }),
};

export const stallService = {
  create: (data) => api.post("/stalls", data),
  getAll: () => api.get("/stalls"),
  getMy: () => api.get("/stalls/my"),
  get: (stallId) => api.get(`/stalls/${stallId}`),
  update: (stallId, data) => api.put(`/stalls/${stallId}`, data),
  updateStatus: (stallId, status) =>
    api.put(`/stalls/${stallId}/status`, { status }),
};

export default api;
