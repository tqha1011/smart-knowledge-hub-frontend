import axios from "axios";

const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: url,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach the access token to the Authorization header for all requests except those to the /auth/ endpoints
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const url = (config.url ?? "").toString();
  const isAuthEndpoint = url.includes("/auth/") || url.endsWith("/auth");
  if (token && !isAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
