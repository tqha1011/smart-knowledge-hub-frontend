import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setSession,
} from "../shared/authSession";

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
  "/auth/refresh",
  "/auth/logout",
];

// Interceptor to attach the access token to the Authorization header for all requests except public auth endpoints
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  const url = (config.url ?? "").toString();
  const isPublicAuthEndpoint = PUBLIC_AUTH_PATHS.some((path) =>
    url.includes(path),
  );
  if (token && !isPublicAuthEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Marks a request as already retried once after a token refresh — prevents
// an endlessly-looping refresh if the retried request also comes back 401.
interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let pendingRequests: {
  resolve: () => void;
  reject: (error: unknown) => void;
}[] = [];

function resolvePendingRequests() {
  pendingRequests.forEach(({ resolve }) => resolve());
  pendingRequests = [];
}

function rejectPendingRequests(error: unknown) {
  pendingRequests.forEach(({ reject }) => reject(error));
  pendingRequests = [];
}

// On a 401 from a protected endpoint, transparently exchange the stored
// refresh token for a new access/refresh pair and retry the original
// request once. Concurrent 401s while a refresh is already in flight queue
// up rather than each triggering their own refresh call — the backend
// rotates (and revokes) the refresh token on every use, so firing several
// at once would invalidate each other's tokens.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = (originalRequest?.url ?? "").toString();

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      requestUrl.includes("/auth/refresh") ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: () => resolve(api(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const { authService } = await import("./authService");
      const result = await authService.refresh(refreshToken);
      setSession(result.accessToken, result.refreshToken);
      resolvePendingRequests();
      return api(originalRequest);
    } catch (refreshError) {
      rejectPendingRequests(refreshError);
      clearSession();
      window.location.href = "/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
