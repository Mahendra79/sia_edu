import axios from "axios";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "../utils/storage";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

let refreshPromise = null;

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
    const { refresh, user } = getStoredAuth();
    if (!refresh) {
      clearStoredAuth();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = axios
        .post(`${api.defaults.baseURL}/auth/token/refresh/`, { refresh })
        .then((res) => {
          setStoredAuth({
            access: res.data.access,
            refresh: res.data.refresh || refresh,
            user,
          });
          return res.data.access;
        })
        .catch((refreshError) => {
          clearStoredAuth();
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newAccessToken = await refreshPromise;
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  },
);

export default api;
