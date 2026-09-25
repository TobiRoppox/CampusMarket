import api from "./api.js";

const eventService = {
  // Public events
  getAll: (params = {}) => api.get("/events", { params }),

  getOne: (eventId) => api.get(`/events/${eventId}`),

  getStalls: (eventId) => api.get(`/events/${eventId}/stalls`),

  // Seller applications
  submitSellerApplication: (payload) =>
    api.post("/seller-applications", payload),

  getMyApplications: (params = {}) =>
    api.get("/seller-applications/my", { params }),

  // Admin application review
  getApplications: (params = {}) => api.get("/seller-applications", { params }),

  reviewApplication: (id, payload) => api.put(`/seller-applications/${id}/review`, payload),
};

export default eventService;
