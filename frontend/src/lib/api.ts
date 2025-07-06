import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // for cookies/session if needed
});

// Attach token from localStorage to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const login = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password });
export const register = (name: string, email: string, password: string) =>
  api.post("/api/auth/register", { name, email, password });

// Properties
export const getProperties = (params = {}) => api.get("/api/properties", { params });
export const getProperty = (id: string) => api.get(`/api/properties/${id}`);
export const getUserProperties = (userId: string, token?: string) =>
  api.get(`/api/properties?createdBy=${userId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
export const getMyProperties = (token?: string) =>
  api.get('/api/properties/mine', token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

// Favorites
export const getFavorites = () => api.get("/api/favorites");
export const addFavorite = (propertyId: string) => api.post(`/api/favorites/${propertyId}`);
export const removeFavorite = (propertyId: string) => api.delete(`/api/favorites/${propertyId}`);

// Recommendations
export const getRecommendations = () => api.get("/api/recommendations");
export const recommendProperty = (propertyId: string, recipientEmail: string, message: string) =>
  api.post(`/api/recommendations/${propertyId}`, { recipientEmail, message });

// Admin (CSV Import)
export const importPropertiesCSV = (formData: FormData) =>
  api.post("/api/csv-import/", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const getImportTemplate = () => api.get("/api/csv-import/template");

export const addProperty = (data: any, token?: string) =>
  api.post("/api/properties", data, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
export const editProperty = (id: string, data: any, token?: string) =>
  api.put(`/api/properties/${id}`, data, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
export const deleteProperty = (id: string, token?: string) =>
  api.delete(`/api/properties/${id}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

export const aiPropertyEvaluation = (propertyData: any) =>
  api.post("/api/properties/ai-evaluate", propertyData);

export default api; 