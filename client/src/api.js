import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Get stored URL or determine default
const getBaseUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return localStorage.getItem('server_url') || '';
  }
  // For web/electron, use relative path (proxy handles it)
  return '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to update base URL dynamically if needed
api.interceptors.request.use((config) => {
  const url = getBaseUrl();
  if (url && !config.baseURL) {
    config.baseURL = url;
  }
  return config;
});

export const setServerUrl = (url) => {
  // Remove trailing slash
  const cleanUrl = url.replace(/\/$/, '');
  localStorage.setItem('server_url', cleanUrl);
  api.defaults.baseURL = cleanUrl;
  window.location.reload(); // Reload to apply changes
};

export const getServerUrl = () => localStorage.getItem('server_url');

export default api;
