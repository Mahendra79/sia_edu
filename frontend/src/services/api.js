import axios from "axios";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../utils/storage";

const LOCAL_API_BASE_URL = "http://127.0.0.1:8000/api";
const RENDER_API_BASE_URL = "https://sia-edu.onrender.com/api";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isProdBuild = import.meta.env.PROD;

const isLoopbackApiUrl = (value) => {
  if (!value) {
    return false;
  }

  try {
    const parsedUrl = new URL(value);
    return ["127.0.0.1", "localhost", "::1"].includes(parsedUrl.hostname);
  } catch {
    return /(^|\/\/)(127\.0\.0\.1|localhost)(:|\/|$)/i.test(value);
  }
};

const resolvedApiBaseUrl =
  configuredApiBaseUrl && !(isProdBuild && isLoopbackApiUrl(configuredApiBaseUrl))
    ? configuredApiBaseUrl
    : isProdBuild
      ? RENDER_API_BASE_URL
      : LOCAL_API_BASE_URL;

export const API_BASE_URL = resolvedApiBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

export const AUTH_EXPIRED_EVENT = "sia_edu_auth_expired";

// localStorage is shared across every tab of the same origin, so wiping it here
// logs out every open tab immediately, not just the one that hit the failure.
function forceLogout() {
  clearStoredAuth();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

let refreshPromise = null;

async function performRefresh(refreshToken, user) {
  const res = await axios.post(`${api.defaults.baseURL}/auth/token/refresh/`, { refresh: refreshToken });
  setStoredAuth({
    access: res.data.access,
    refresh: res.data.refresh || refreshToken,
    user,
  });
  return res.data.access;
}

// Refreshes the access token, coordinating across browser tabs so two tabs never
// race to rotate the same refresh token (rotation blacklists the loser's token,
// which previously wiped out the winner's freshly-saved session too).
async function refreshAccessToken(staleAccessToken) {
  const attempt = async () => {
    const current = getStoredAuth();
    // Another tab (or a proactive background refresh) may have already refreshed
    // while we were waiting for the lock/promise below — reuse that instead of
    // racing a second refresh call with an already-rotated refresh token.
    if (current.access && current.access !== staleAccessToken) {
      return current.access;
    }
    if (!current.refresh) {
      forceLogout();
      throw new Error("No refresh token available.");
    }
    try {
      return await performRefresh(current.refresh, current.user);
    } catch (refreshError) {
      const refreshStatus = refreshError.response?.status;
      if ([400, 401, 403].includes(refreshStatus)) {
        const latest = getStoredAuth();
        if (latest.access && latest.access !== staleAccessToken) {
          return latest.access;
        }
        forceLogout();
      }
      throw refreshError;
    }
  };

  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("sia_edu_token_refresh", attempt);
  }

  if (!refreshPromise) {
    refreshPromise = attempt().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Called on a background timer (see AuthContext) so the access token gets renewed
// even during long stretches with no API traffic, e.g. passively watching a video.
export function ensureFreshAccessToken() {
  const { access } = getStoredAuth();
  if (!access) {
    return Promise.resolve(null);
  }
  return refreshAccessToken(access).catch(() => null);
}

api.interceptors.request.use((config) => {
  const { access } = getStoredAuth();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const responseStatus = error.response?.status;
    const excludedRefreshPaths = [
      "/auth/login/",
      "/auth/signup/",
      "/auth/token/refresh/",
      "/auth/password-reset/request/",
      "/auth/password-reset/confirm/",
      "/auth/verify-email/",
      "/auth/resend-verification/",
    ];
    const isExcludedPath = excludedRefreshPaths.some((path) => originalRequest?.url?.includes(path));

    if (responseStatus !== 401 || originalRequest?._retry || isExcludedPath) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const { access: failedAccessToken, refresh } = getStoredAuth();
    if (!refresh) {
      forceLogout();
      return Promise.reject(error);
    }

    try {
      const newAccessToken = await refreshAccessToken(failedAccessToken);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
