import axios from 'axios';
import config from '../config/env';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('paylink_token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiration and unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const publicRoutes = ['/login', '/register', '/pay/', '/payment-success', '/payment-cancelled'];
      const isPublicRoute = publicRoutes.some((route) => window.location.pathname.includes(route));

      // Avoid redirecting when already on a public/auth route
      if (!isPublicRoute) {
        localStorage.removeItem('paylink_token');
        localStorage.removeItem('paylink_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Standardized error message extraction from Axios errors.
 */
export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (!error) return fallback;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return typeof error.response.data.error === 'string' ? error.response.data.error : fallback;
  if (error.message) return error.message;
  return fallback;
}

export default api;
