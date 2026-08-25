import api from "./api";

const productService = {
  getAll: async (params) => {
    try {
      const response = await api.get("/products", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getOne: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRecommendations: async (userId) => {
    try {
      const response = await api.get(`/products/recommendations/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSimilar: async (id) => {
    try {
      const response = await api.get(`/products/${id}/similar`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default productService;