import { redirectToLogin } from "../shared/navigation";
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearSession,
  isDemoSession,
  getAccessToken,
  getRefreshToken,
  setSession,
  getSessionVersion,
} from "../shared/authSession";
import { disconnectRealtime } from "./realtimeService";

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
  "/auth/demo-config",
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
  const request = config as RetriableRequestConfig;
  if (
    request._retrySessionVersion &&
    request._retrySessionVersion !== getSessionVersion()
  )
    throw new Error("Session changed; request cancelled.");
  request._sessionVersion = getSessionVersion();
  const token = getAccessToken();
  const url = (config.url ?? "").toString();
  const isPublicAuthEndpoint = PUBLIC_AUTH_PATHS.some((path) =>
    url.includes(path),
  );
  const isDemoStart =
    url.endsWith("/auth/demo-session") && config.method === "post";
  if (token && !isPublicAuthEndpoint && !isDemoStart) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Marks a request as already retried once after a token refresh — prevents
// an endlessly-looping refresh if the retried request also comes back 401.
interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _sessionVersion?: string;
  _retrySessionVersion?: string;
}

let isRefreshing = false;
let pendingRequests: {
  resolve: (version: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function resolvePendingRequests(version: string) {
  pendingRequests.forEach(({ resolve }) => resolve(version));
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

    const requestVersion = originalRequest._sessionVersion;
    if (
      requestVersion !== getSessionVersion() ||
      !originalRequest.headers.Authorization
    )
      return Promise.reject(error);
    if (isDemoSession()) {
      disconnectRealtime();
      clearSession();
      redirectToLogin(true);
      return Promise.reject(error);
    }
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      disconnectRealtime();
      clearSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (version) => {
            originalRequest._retrySessionVersion = version;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const { authService } = await import("./authService");
      const result = await authService.refresh(refreshToken);
      if (getSessionVersion() !== requestVersion)
        throw new Error("Session changed; refresh discarded.");
      setSession(result.accessToken, result.refreshToken);
      const refreshedVersion = getSessionVersion();
      originalRequest._retrySessionVersion = refreshedVersion;
      resolvePendingRequests(refreshedVersion);
      return api(originalRequest);
    } catch (refreshError) {
      rejectPendingRequests(refreshError);
      if (getSessionVersion() === requestVersion) {
        disconnectRealtime();
        clearSession();
        redirectToLogin();
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
