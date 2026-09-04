import axios from "axios";

const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL: url,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth endpoints that are public (no session yet) and must NOT receive a
// Bearer token — everything else, including protected /auth/* endpoints
// like /auth/users and /auth/password, gets the token attached below.
const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/otp/send",
  "/auth/otp/verify",
  "/auth/password/recovery",
];

// Interceptor to attach the access token to the Authorization header for all requests except public auth endpoints
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  const url = (config.url ?? "").toString();
  const isPublicAuthEndpoint = PUBLIC_AUTH_PATHS.some((path) =>
    url.includes(path),
  );
  if (token && !isPublicAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
