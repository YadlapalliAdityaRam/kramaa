import axios from 'axios';

const normalizeApiBaseUrl = (url) => {
    const trimmed = String(url || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '/api';
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const viteApiUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : '';
const reactApiUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_URL : '';
const apiBaseUrl = normalizeApiBaseUrl(viteApiUrl || reactApiUrl || '/api');

// Create a centralized Axios instance
const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include Auth Token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
