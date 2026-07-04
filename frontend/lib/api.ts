import axios from "axios";
import { BACKEND_URL } from "@/config";

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Automatic Token Refresh Interceptor ─────────────────────────────
// When any request gets a 401/403, try refreshing the access token once
// and retry the original request. If refresh fails → redirect to login.

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown | null) {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  refreshQueue = [];
}

// Routes that should NOT trigger a refresh attempt
const AUTH_ROUTES = ["/api/v1/auth/login", "/api/v1/auth/signup", "/api/v1/auth/refresh", "/api/v1/auth/google"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only intercept 401/403, skip auth routes, skip already-retried requests
    const isAuthRoute = AUTH_ROUTES.some((route) => originalRequest?.url?.includes(route));
    if ((status !== 401 && status !== 403) || isAuthRoute || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => {
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await api.post("/api/v1/auth/refresh");
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Redirect to login — only in browser context
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Auth API ────────────────────────────────────────────────────────

export async function signupUser(data: {
  email: string;
  password: string;
  name: string;
}) {
  return api.post("/api/v1/auth/signup", data);
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  return api.post("/api/v1/auth/login", data);
}

export async function logoutUser() {
  return api.post("/api/v1/auth/logout");
}

export async function refreshToken() {
  return api.post("/api/v1/auth/refresh");
}

export async function googleAuth(idToken: string) {
  return api.post("/api/v1/auth/google", { idToken });
}

export default api;

