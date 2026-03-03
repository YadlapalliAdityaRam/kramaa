import axios from 'axios';

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 409, 422]);
const SAFE_NETWORK_RETRY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const UNSAFE_NETWORK_RETRY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const BACKEND_DOWN_COOLDOWN_MS = 30000;
const AUTH_EXPIRED_NOTICE_COOLDOWN_MS = 1500;
const LOCAL_HOSTNAME_PATTERN = /^(localhost|127\.0\.0\.1)$/i;
const PRIVATE_IPV4_PATTERN = /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)$/i;

const normalizeApiBaseUrl = (url) => {
    const trimmed = String(url || '').trim().replace(/\/+$/, '');
    if (!trimmed) return null;
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const isLocalOrPrivateHostname = (hostname) => {
    const normalized = String(hostname || '').trim();
    if (!normalized) return false;
    return LOCAL_HOSTNAME_PATTERN.test(normalized) || PRIVATE_IPV4_PATTERN.test(normalized);
};

const isLocalOrPrivateApiBaseUrl = (apiBaseUrl) => {
    const normalized = String(apiBaseUrl || '').trim();
    if (!/^https?:\/\//i.test(normalized)) return false;
    try {
        const parsed = new URL(normalized);
        return isLocalOrPrivateHostname(parsed.hostname);
    } catch (error) {
        return false;
    }
};

const shouldPreferSameOriginApi = () => {
    if (typeof window === 'undefined') return false;
    return !isLocalOrPrivateHostname(window.location.hostname);
};

const buildApiBaseUrls = () => {
    const fromList = String(import.meta.env.VITE_API_URLS || '').trim();
    const fromSingle = String(import.meta.env.VITE_API_URL || '').trim();
    const disableAutoSiblingFailover = String(import.meta.env.VITE_DISABLE_PORT_FAILOVER || '').trim().toLowerCase() === 'true';
    const enableAutoSiblingFailover = String(import.meta.env.VITE_ENABLE_PORT_FAILOVER || '').trim().toLowerCase() === 'true';

    const candidates = fromList
        ? fromList.split(',').map((entry) => entry.trim()).filter(Boolean)
        : (fromSingle ? [fromSingle] : ['/api']);

    const normalized = candidates
        .map(normalizeApiBaseUrl)
        .filter(Boolean);

    let unique = [...new Set(normalized)];

    // Public/tunnel hosts cannot reach this machine's localhost directly.
    // Force same-origin API route so Vite proxy can forward requests.
    if (shouldPreferSameOriginApi()) {
        unique = unique.map((apiBaseUrl) => (
            isLocalOrPrivateApiBaseUrl(apiBaseUrl) ? '/api' : apiBaseUrl
        ));
        unique = [...new Set(unique.map(normalizeApiBaseUrl).filter(Boolean))];
    }

    // If only one local backend is configured, auto-include the sibling port as failover.
    // Only auto-add sibling port if explicitly enabled.
    // This prevents false connection refused errors when users run a single backend instance.
    if (!disableAutoSiblingFailover && enableAutoSiblingFailover && unique.length === 1) {
        const only = unique[0];
        if (only.startsWith('http://localhost:5000')) unique.push('http://localhost:5001/api');
        if (only.startsWith('http://127.0.0.1:5000')) unique.push('http://127.0.0.1:5001/api');
        if (only.startsWith('http://localhost:5001')) unique.push('http://localhost:5000/api');
        if (only.startsWith('http://127.0.0.1:5001')) unique.push('http://127.0.0.1:5000/api');
    }

    return [...new Set(unique)];
};

const API_BASE_URLS = buildApiBaseUrls();
let activeBackendIndex = 0;
let backendSelectionResolved = false;
let backendSelectionPromise = null;
const backendDownUntil = new Map();
let lastAuthExpiredNoticeAt = 0;

const toSocketBaseUrl = (apiBaseUrl) => {
    const normalized = String(apiBaseUrl || '').trim();
    if (!normalized) {
        if (typeof window !== 'undefined') return window.location.origin;
        return '';
    }

    // Same-origin API (e.g. /api) should resolve to current host for socket transport.
    if (normalized.startsWith('/')) {
        if (typeof window !== 'undefined') return window.location.origin;
        return '';
    }

    if (typeof window !== 'undefined' && shouldPreferSameOriginApi() && isLocalOrPrivateApiBaseUrl(normalized)) {
        return window.location.origin;
    }

    return normalized.replace(/\/api\/?$/, '');
};

const normalizeIndex = (index) => {
    if (!Number.isInteger(index)) return 0;
    if (index < 0) return 0;
    if (index >= API_BASE_URLS.length) return API_BASE_URLS.length - 1;
    return index;
};

const markBackendDown = (index) => {
    const normalized = normalizeIndex(index);
    backendDownUntil.set(normalized, Date.now() + BACKEND_DOWN_COOLDOWN_MS);
};

const clearBackendDown = (index) => {
    const normalized = normalizeIndex(index);
    backendDownUntil.delete(normalized);
};

const isBackendDown = (index) => {
    const normalized = normalizeIndex(index);
    const until = backendDownUntil.get(normalized);
    if (!until) return false;
    if (Date.now() >= until) {
        backendDownUntil.delete(normalized);
        return false;
    }
    return true;
};

const emitAuthExpired = (message) => {
    const now = Date.now();
    if (now - lastAuthExpiredNoticeAt < AUTH_EXPIRED_NOTICE_COOLDOWN_MS) return;
    lastAuthExpiredNoticeAt = now;

    if (typeof window !== 'undefined') {
        try {
            window.dispatchEvent(new CustomEvent('krama:auth-expired', {
                detail: { message: message || 'Session expired. Please login again.' }
            }));
        } catch (error) {
            // noop
        }
    }
};

const emitLoadingEvent = (phase) => {
    if (typeof window === 'undefined') return;
    try {
        window.dispatchEvent(new CustomEvent(`krama:loading:${phase}`));
    } catch (error) {
        // noop
    }
};

const shouldFailover = (error, config) => {
    if (!config || API_BASE_URLS.length <= 1) return false;

    const method = String(config.method || 'GET').toUpperCase();
    const statusCode = error?.response?.status;
    if (statusCode) {
        // In dual-backend setups, one instance can be behind and return 404 for valid routes.
        // Retry once on the secondary backend for any method.
        if (statusCode === 404) {
            return true;
        }

        if (NON_RETRYABLE_STATUS_CODES.has(statusCode)) return false;
        return RETRYABLE_STATUS_CODES.has(statusCode);
    }

    const errorCode = String(error?.code || '');
    const errorMessage = String(error?.message || '').toLowerCase();
    const isNetworkErrorCode =
        errorCode === 'ECONNABORTED' ||
        errorCode === 'ERR_NETWORK' ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ECONNRESET';
    const isNetworkErrorMessage =
        errorMessage.includes('network') ||
        errorMessage.includes('refused') ||
        errorMessage.includes('reset') ||
        errorMessage.includes('failed to fetch');
    const isNetworkError = isNetworkErrorCode || (!statusCode && isNetworkErrorMessage);
    if (!isNetworkError) return false;

    if (SAFE_NETWORK_RETRY_METHODS.has(method)) return true;

    // Retry unsafe methods only when connection was hard-failed before app-level handling.
    // Avoid retries on generic timeout to reduce duplicate side effects.
    const isHardConnectionFailure =
        (
            errorCode === 'ERR_NETWORK' ||
            errorCode === 'ECONNREFUSED' ||
            errorCode === 'ECONNRESET'
        ) &&
        isNetworkErrorMessage;

    return UNSAFE_NETWORK_RETRY_METHODS.has(method) && isHardConnectionFailure;
};

export const getApiBaseUrls = () => [...API_BASE_URLS];
export const getCurrentApiBaseUrl = () => API_BASE_URLS[normalizeIndex(activeBackendIndex)] || '';
export const getSocketBaseUrls = () => API_BASE_URLS.map(toSocketBaseUrl);
export const getCurrentSocketBaseUrl = () => toSocketBaseUrl(getCurrentApiBaseUrl());
export const getSocketClientOptions = (overrides = {}) => {
    const forcePolling = String(import.meta.env.VITE_SOCKET_TRANSPORT || '').trim().toLowerCase() === 'polling'
        || Boolean(import.meta.env.DEV);

    const baseOptions = {
        transports: forcePolling ? ['polling'] : ['websocket', 'polling'],
        upgrade: !forcePolling,
        rememberUpgrade: !forcePolling,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
    };

    return {
        ...baseOptions,
        ...(overrides || {})
    };
};

const isBackendCandidateReachable = async (apiBaseUrl) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    try {
        // Use a public endpoint for reachability checks to avoid 401 noise in console.
        const probeUrl = `${String(apiBaseUrl || '').replace(/\/+$/, '')}/problems?page=1&limit=1`;
        const response = await fetch(probeUrl, {
            method: 'GET',
            signal: controller.signal
        });

        // A foreign service on same port often returns 404.
        return response.status !== 404;
    } catch (error) {
        return false;
    } finally {
        clearTimeout(timer);
    }
};

const resolvePreferredBackendIndex = async () => {
    if (backendSelectionResolved || API_BASE_URLS.length <= 1) {
        backendSelectionResolved = true;
        return normalizeIndex(activeBackendIndex);
    }

    if (backendSelectionPromise) {
        return backendSelectionPromise;
    }

    backendSelectionPromise = (async () => {
        const preferredOrder = [
            normalizeIndex(activeBackendIndex),
            ...API_BASE_URLS
                .map((_, index) => index)
                .filter((index) => index !== normalizeIndex(activeBackendIndex))
        ];

        for (const index of preferredOrder) {
            if (isBackendDown(index)) continue;
            const reachable = await isBackendCandidateReachable(API_BASE_URLS[index]);
            if (reachable) {
                activeBackendIndex = index;
                clearBackendDown(index);
                backendSelectionResolved = true;
                return index;
            }
            markBackendDown(index);
        }

        backendSelectionResolved = true;
        return normalizeIndex(activeBackendIndex);
    })();

    return backendSelectionPromise;
};

const api = axios.create({
    baseURL: getCurrentApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 15000,
    withCredentials: true
});

api.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('token');
        const nextConfig = config;

        if (!nextConfig.headers) nextConfig.headers = {};
        if (token) {
            nextConfig.headers.Authorization = `Bearer ${token}`;
        }

        if (!Array.isArray(nextConfig.__backendTriedIndices)) {
            nextConfig.__backendTriedIndices = [];
        }

        if (!Number.isInteger(nextConfig.__backendIndex) && nextConfig.__backendTriedIndices.length === 0) {
            await resolvePreferredBackendIndex();
        }

        const backendIndex = normalizeIndex(
            Number.isInteger(nextConfig.__backendIndex) ? nextConfig.__backendIndex : activeBackendIndex
        );

        const healthyBackendIndex = API_BASE_URLS.findIndex(
            (_, index) => !isBackendDown(index) && !nextConfig.__backendTriedIndices.includes(index)
        );
        const resolvedBackendIndex = isBackendDown(backendIndex) && healthyBackendIndex !== -1
            ? healthyBackendIndex
            : backendIndex;

        const finalBackendIndex = Number.isInteger(resolvedBackendIndex) && resolvedBackendIndex >= 0
            ? resolvedBackendIndex
            : backendIndex;

        nextConfig.__backendIndex = finalBackendIndex;
        nextConfig.baseURL = API_BASE_URLS[finalBackendIndex] || getCurrentApiBaseUrl();

        if (nextConfig.__backendTriedIndices.length === 0) {
            nextConfig.__backendTriedIndices.push(finalBackendIndex);
        }

        emitLoadingEvent('start');
        return nextConfig;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        emitLoadingEvent('end');
        const usedIndex = Number.isInteger(response?.config?.__backendIndex)
            ? response.config.__backendIndex
            : activeBackendIndex;
        activeBackendIndex = normalizeIndex(usedIndex);
        clearBackendDown(activeBackendIndex);
        return response;
    },
    async (error) => {
        emitLoadingEvent('end');
        const config = error?.config;
        const statusCode = error?.response?.status;
        const requestUrl = String(config?.url || '').toLowerCase();
        const isAuthEndpoint =
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register') ||
            requestUrl.includes('/auth/me') ||
            requestUrl.includes('/auth/logout');

        if (statusCode === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            emitAuthExpired(error?.response?.data?.message || 'Session expired. Please login again.');
            return Promise.reject(error);
        }

        if (Number.isInteger(config?.__backendIndex)) {
            if (!statusCode || RETRYABLE_STATUS_CODES.has(statusCode) || statusCode === 404) {
                markBackendDown(config.__backendIndex);
                backendSelectionResolved = false;
                backendSelectionPromise = null;
            }
        }

        if (!shouldFailover(error, config)) {
            return Promise.reject(error);
        }

        const triedIndices = Array.isArray(config.__backendTriedIndices)
            ? [...config.__backendTriedIndices]
            : [];

        const nextIndex = API_BASE_URLS.findIndex((_, index) => !triedIndices.includes(index) && !isBackendDown(index));
        const fallbackIndex = API_BASE_URLS.findIndex((_, index) => !triedIndices.includes(index));
        const selectedIndex = nextIndex !== -1 ? nextIndex : fallbackIndex;
        if (selectedIndex === -1) {
            return Promise.reject(error);
        }

        config.__backendIndex = selectedIndex;
        config.__backendTriedIndices = [...triedIndices, selectedIndex];
        config.baseURL = API_BASE_URLS[selectedIndex];

        return api.request(config);
    }
);

export default api;
