// api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://sentiment-aware-journaling-backend.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 120000, // FIX 1: 120 second timeout on all requests
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// REQUEST INTERCEPTOR: Attach access token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Auto-refresh on 401 (but skip auth endpoints)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // FIX 3: Also skip token/refresh endpoint to prevent infinite loop
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login')
      || originalRequest.url?.includes('/auth/register')
      || originalRequest.url?.includes('/token/refresh/');

    if (isAuthEndpoint) {
      console.log("Auth endpoint failed - not attempting token refresh");
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        console.log("🔄 Access token expired, refreshing...");

        // FIX 1: Add timeout to refresh request specifically
        const response = await axios.post(
          `${BASE_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken },
          { timeout: 120000 } // 120s timeout for cold start
        );

        // FIX 2: Save BOTH new tokens (rotation fix)
        const { access, refresh } = response.data;
        await AsyncStorage.setItem("accessToken", access);
        if (refresh) {
          await AsyncStorage.setItem("refreshToken", refresh);
        }

        api.defaults.headers.common.Authorization = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;

        processQueue(null, access);
        isRefreshing = false;

        console.log("✅ Token refreshed successfully");
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        console.log("❌ Token refresh failed - logging out");

        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");

        if (global.onTokenExpired) {
          global.onTokenExpired();
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;