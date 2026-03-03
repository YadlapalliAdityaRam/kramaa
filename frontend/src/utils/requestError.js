export const getRequestErrorMessage = (error, fallbackMessage = 'Request failed') => {
    const apiMessage = error?.response?.data?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
        return apiMessage.trim();
    }

    const validationErrors = error?.response?.data?.errors;
    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        const joined = validationErrors
            .map((entry) => entry?.message || entry?.msg || '')
            .filter(Boolean)
            .join(', ');
        if (joined) return joined;
    }

    const errorCode = String(error?.code || '').toUpperCase();
    const rawMessage = String(error?.message || '').toLowerCase();

    const isTimeoutIssue = errorCode === 'ECONNABORTED' || rawMessage.includes('timeout');
    if (isTimeoutIssue) {
        return 'Request timed out while waiting for the backend. Please try again.';
    }

    const isNetworkIssue =
        errorCode === 'ERR_NETWORK' ||
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ECONNRESET' ||
        rawMessage.includes('network') ||
        rawMessage.includes('refused') ||
        rawMessage.includes('reset') ||
        rawMessage.includes('failed to fetch') ||
        rawMessage.includes('load failed');

    if (isNetworkIssue) {
        return 'Backend server is unreachable. Please start your configured backend URL and try again.';
    }

    const directMessage = String(error?.message || '').trim();
    if (directMessage) {
        return directMessage;
    }

    return fallbackMessage;
};
