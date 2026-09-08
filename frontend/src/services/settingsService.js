import api from "./api.js";

const settingsService = {
  // Get the currently logged-in user
  getProfile: () => api.get("/auth/me"),

  // Update seller profile information
  updateProfile: (profileData) => api.put("/auth/profile", profileData),

  // Optional password update
  updatePassword: (passwordData) => api.put("/auth/password", passwordData),
};

export default settingsService;
