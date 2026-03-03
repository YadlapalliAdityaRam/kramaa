const STORAGE_KEY_SAFE_PATTERN = /[^a-zA-Z0-9:_-]/g;

export const AUTH_LOGOUT_BROADCAST_KEY = 'krama:auth:logout-at';

const normalizeStoragePart = (value) => (
    String(value || '')
        .trim()
        .replace(STORAGE_KEY_SAFE_PATTERN, '_')
        .toLowerCase()
);

export const getAuthUserStorageScope = (user) => {
    const rawId = user?.id || user?._id || user?.email;
    const normalized = normalizeStoragePart(rawId);
    return normalized || null;
};

export const buildProblemDraftStorageKey = ({ problemId, language, userScope }) => {
    const pid = normalizeStoragePart(problemId);
    const lang = normalizeStoragePart(language);
    const scope = normalizeStoragePart(userScope);
    if (!pid || !lang || !scope) return null;
    return `krama:draft:problem:${pid}:${lang}:${scope}`;
};

export const buildContestDraftStorageKey = ({ contestId, problemId, language, userScope }) => {
    const cid = normalizeStoragePart(contestId);
    const pid = normalizeStoragePart(problemId);
    const lang = normalizeStoragePart(language);
    const scope = normalizeStoragePart(userScope);
    if (!cid || !pid || !lang || !scope) return null;
    return `krama:draft:contest:${cid}:${pid}:${lang}:${scope}`;
};

const toDraftPayload = ({ code, starterTemplate }) => ({
    version: 1,
    updatedAt: Date.now(),
    code: String(code || ''),
    starterTemplate: String(starterTemplate || '')
});

export const writeEditorDraft = ({ storageKey, code, starterTemplate }) => {
    if (!storageKey) return;
    try {
        const payload = toDraftPayload({ code, starterTemplate });
        localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
        // Ignore quota/serialization errors
    }
};

const parseLegacyDraftString = (raw) => {
    if (typeof raw !== 'string' || !raw) return null;
    return raw;
};

export const readEditorDraft = ({ storageKey, starterTemplate }) => {
    if (!storageKey) return null;
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return null;

        let parsed = null;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return parseLegacyDraftString(raw);
        }

        if (typeof parsed === 'string') {
            return parsed;
        }

        if (!parsed || typeof parsed !== 'object') {
            return null;
        }

        const storedCode = String(parsed.code || '');
        const storedStarterTemplate = String(parsed.starterTemplate || '');
        const currentStarterTemplate = String(starterTemplate || '');

        // If the user never modified code (still same as old starter), auto-upgrade to latest starter.
        if (
            storedCode &&
            storedStarterTemplate &&
            currentStarterTemplate &&
            storedCode === storedStarterTemplate &&
            storedStarterTemplate !== currentStarterTemplate
        ) {
            return currentStarterTemplate;
        }

        return storedCode || null;
    } catch {
        return null;
    }
};

export const clearLegacyUnscopedEditorDrafts = () => {
    try {
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (/^problem_[^_]+_(javascript|python|java|cpp|c)$/i.test(key)) {
                keysToDelete.push(key);
                continue;
            }
            if (/^contest_[^_]+_prob_[^_]+_(javascript|python|java|cpp|c)$/i.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => localStorage.removeItem(key));
    } catch {
        // Ignore localStorage access errors
    }
};

export const broadcastLogoutToOtherTabs = () => {
    try {
        localStorage.setItem(AUTH_LOGOUT_BROADCAST_KEY, String(Date.now()));
    } catch {
        // Ignore localStorage access errors
    }
};

