import axios from 'axios';

// Vite default base URL pointing to the Express server API
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-two-snowy-22.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send cookies for refresh token flows
  headers: {
    'Content-Type': 'application/json',
  },
});

let storeReference = null;

// Helper to inject store reference dynamically to avoid circular dependencies
export const injectStore = (store) => {
  storeReference = store;
};

// Request Interceptor: Attach access token if present
api.interceptors.request.use(
  (config) => {
    if (storeReference) {
      const state = storeReference.getState();
      const token = state.auth ? state.auth.token : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401 Unauthorized errors
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid refreshing on login routes
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/register')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Run refresh token request
        // Send existing refresh token in body in case cookies are blocked in cross-origin dev environments
        let localRefreshToken = null;
        if (storeReference) {
          const state = storeReference.getState();
          // We can read refresh token from state if we store it
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: localRefreshToken },
          { withCredentials: true }
        );

        const { accessToken } = response.data;

        if (storeReference) {
          storeReference.dispatch({
            type: 'auth/setToken',
            payload: accessToken,
          });
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh failed → log user out
        if (storeReference) {
          storeReference.dispatch({ type: 'auth/logout' });
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
