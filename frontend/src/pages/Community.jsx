import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getCurrentApiBaseUrl } from '../utils/api';
import toast from 'react-hot-toast';
import ReportModal from '../components/common/ReportModal';
import SkeletonCard from '../components/common/SkeletonCard';
import FollowButton from '../components/social/FollowButton';
import {
    FaPlus, FaSearch, FaComment, FaEye, FaHeart, FaTimes,
    FaArrowLeft, FaReply, FaSortAmountDown, FaFire, FaClock,
    FaRegHeart, FaRegComment, FaUserCircle, FaHashtag, FaImage,
    FaThumbsDown, FaRegThumbsDown, FaShareAlt, FaFlag, FaBookmark, FaRegBookmark, FaTrash, FaUsers, FaFileAlt, FaExternalLinkAlt
} from 'react-icons/fa';
import { useSelector } from 'react-redux';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Helpers
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const relativeTime = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
};

const CATEGORIES = ['All', 'General', 'Interview', 'Career', 'Showcase', 'Problem', 'Official'];
const SORT_OPTIONS = [
    { value: 'latest', label: 'Latest', icon: <FaClock /> },
    { value: 'popular', label: 'Popular', icon: <FaFire /> },
    { value: 'mostReplied', label: 'Most Replied', icon: <FaComment /> },
];

const CATEGORY_COLORS = {
    General: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    Interview: { bg: 'rgba(234,179,8,0.12)', color: '#facc15', border: 'rgba(234,179,8,0.3)' },
    Career: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    Showcase: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
    Problem: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
    Official: { bg: 'rgba(236,72,153,0.12)', color: '#ec4899', border: 'rgba(236,72,153,0.3)' },
};
const DEFAULT_AVATAR_PATTERN = /(^|\/)default-avatar\.png$/i;

const normalizeUser = (rawUser) => {
    const user = rawUser && typeof rawUser === 'object' ? rawUser : {};
    const rawAvatar = typeof user.avatar === 'string' ? user.avatar.trim() : '';
    return {
        ...user,
        _id: String(user._id || user.id || ''),
        id: String(user.id || user._id || ''),
        avatar: rawAvatar && !DEFAULT_AVATAR_PATTERN.test(rawAvatar) ? rawAvatar : '',
        username: typeof user.username === 'string' && user.username.trim()
            ? user.username.trim()
            : 'Unknown'
    };
};

const normalizeThread = (rawThread) => {
    const thread = rawThread && typeof rawThread === 'object' ? rawThread : {};
    const normalizedTags = Array.isArray(thread.tags)
        ? thread.tags.filter(Boolean)
        : (typeof thread.tags === 'string'
            ? thread.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
            : []);

    return {
        ...thread,
        _id: String(thread._id || thread.id || ''),
        id: String(thread.id || thread._id || ''),
        title: typeof thread.title === 'string' ? thread.title : '',
        content: typeof thread.content === 'string' ? thread.content : '',
        tags: normalizedTags,
        user: normalizeUser(thread.user),
        repliesCount: Number(thread.repliesCount) || 0,
        likesCount: Number(thread.likesCount) || 0,
        dislikesCount: Number(thread.dislikesCount) || 0,
        views: Number(thread.views) || 0,
        createdAt: thread.createdAt || new Date().toISOString()
    };
};

const normalizeThreadList = (list) => (
    Array.isArray(list)
        ? list.map(normalizeThread).filter((item) => Boolean(item._id))
        : []
);

const normalizeSuggestedUser = (rawEntry) => {
    const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
    const normalizedUser = normalizeUser(entry);
    return {
        ...entry,
        ...normalizedUser,
        problemsSolved: Number(entry.problemsSolved ?? entry.stats?.totalProblems) || 0,
        isFollowing: Boolean(entry.isFollowing)
    };
};

const stripApiSuffix = (baseUrl) => String(baseUrl || '').replace(/\/api\/?$/, '');
const joinUrl = (baseUrl, path) => `${String(baseUrl || '').replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;
const EMBEDDED_UPLOAD_PATH_PATTERN = /(?:^|\/)(?:public\/)?(?:api\/)?uploads\/.+$/i;

const getBackendBaseUrl = () => {
    // Prefer explicit env base URL in production.
    const configuredApiUrl = String(
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_API_BASE_URL ||
        ''
    ).trim().replace(/\/+$/, '');
    const configuredBaseUrl = configuredApiUrl ? stripApiSuffix(configuredApiUrl) : '';
    if (configuredBaseUrl) return configuredBaseUrl;

    // Secondary fallback: explicit backend/socket host.
    const configuredBackendUrl = String(
        import.meta.env.VITE_SOCKET_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        ''
    ).trim().replace(/\/+$/, '');
    if (/^https?:\/\//i.test(configuredBackendUrl)) {
        return stripApiSuffix(configuredBackendUrl);
    }

    // Fall back to runtime API base used by axios.
    const runtimeApiBaseUrl = String(getCurrentApiBaseUrl() || '').trim().replace(/\/+$/, '');
    if (/^https?:\/\//i.test(runtimeApiBaseUrl)) {
        return stripApiSuffix(runtimeApiBaseUrl);
    }

    // Same-origin fallback.
    if (typeof window !== 'undefined') return String(window.location.origin || '').replace(/\/+$/, '');
    return '';
};

const normalizeUploadPath = (rawPath) => {
    let path = String(rawPath || '').trim().replace(/\\/g, '/');
    if (!path) return '';

    // Remove leading ./ and convert legacy "public/uploads/*" to "/uploads/*".
    path = path.replace(/^\.\//, '');
    const embeddedUploadMatch = !/^https?:\/\//i.test(path)
        ? path.match(EMBEDDED_UPLOAD_PATH_PATTERN)
        : null;
    if (embeddedUploadMatch) {
        path = embeddedUploadMatch[0];
    }
    path = path.replace(/^public\/uploads\//i, '/uploads/');
    path = path.replace(/^\/public\/uploads\//i, '/uploads/');
    path = path.replace(/^api\/uploads\//i, '/uploads/');
    path = path.replace(/^\/api\/uploads\//i, '/uploads/');

    if (/^uploads\//i.test(path)) return `/${path}`;
    if (/^\/uploads\//i.test(path)) return path;
    return path;
};

const toApiUploadPath = (normalizedPath) => {
    const pathValue = String(normalizedPath || '').trim();
    if (!pathValue.startsWith('/uploads/')) return null;
    return `/api${pathValue}`;
};

const getImageUrl = (url) => {
    if (!url) return null;
    const raw = String(url).trim();
    if (!raw) return null;
    if (/^(data:|blob:)/i.test(raw)) return raw;

    // Normalize the path first
    const normalizedPath = normalizeUploadPath(raw);

    // Upload assets are stored on the backend. Prefer the backend-hosted absolute URL first so
    // deployed frontends (for example Vercel) do not start with a broken /uploads request.
    if (normalizedPath.startsWith('/uploads/')) {
        const backendBaseUrl = getBackendBaseUrl();
        if (backendBaseUrl) return joinUrl(backendBaseUrl, normalizedPath);

        const apiUploadPath = toApiUploadPath(normalizedPath);
        if (apiUploadPath) return apiUploadPath;

        return normalizedPath;
    }

    if (/^https?:\/\//i.test(raw)) {
        try {
            const parsed = new URL(raw);
            const path = normalizeUploadPath(`${parsed.pathname}${parsed.search || ''}`);
            if (path.startsWith('/uploads/')) {
                const backendBaseUrl = getBackendBaseUrl();
                if (backendBaseUrl) return joinUrl(backendBaseUrl, path);

                const apiUploadPath = toApiUploadPath(path);
                return apiUploadPath || path;
            }
            return raw;
        } catch (error) {
            // Fall through
        }
    }

    return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
};

const getImageCandidates = (url) => {
    const raw = String(url || '').trim();
    if (!raw) return [];

    const candidates = [];
    const preferred = getImageUrl(raw);
    if (preferred) candidates.push(preferred);
    if (raw && raw !== preferred) candidates.push(raw);

    const normalizedPath = normalizeUploadPath(raw);
    if (normalizedPath.startsWith('/')) {
        const backendBaseUrl = getBackendBaseUrl();
        if (backendBaseUrl) candidates.push(joinUrl(backendBaseUrl, normalizedPath));

        const apiUploadPath = toApiUploadPath(normalizedPath);
        if (apiUploadPath) candidates.push(apiUploadPath);

        if (typeof window !== 'undefined') candidates.push(joinUrl(window.location.origin, normalizedPath));
        candidates.push(normalizedPath);
    }

    return [...new Set(candidates.filter(Boolean))];
};

const getAvatarFallbackUrl = (username = 'U', size = 32) => (
    `https://ui-avatars.com/api/?name=${encodeURIComponent(String(username || 'U'))}&background=1a1a2e&color=60a5fa&bold=true&size=${size}`
);

const getAvatarUrl = (avatar, username = 'U', size = 32) => {
    const raw = String(avatar || '').trim();
    if (!raw || DEFAULT_AVATAR_PATTERN.test(raw)) return getAvatarFallbackUrl(username, size);
    return getImageUrl(raw) || getAvatarFallbackUrl(username, size);
};

const handleAvatarImageError = (event, originalAvatar, username = 'U', size = 32) => {
    const img = event.currentTarget;
    const raw = String(originalAvatar || '').trim();
    const fallback = getAvatarFallbackUrl(username, size);
    const candidates = (!raw || DEFAULT_AVATAR_PATTERN.test(raw))
        ? [fallback]
        : [...getImageCandidates(raw), fallback];
    const currentSrc = String(img.getAttribute('src') || '');
    const currentIndex = candidates.findIndex((candidate) => candidate === currentSrc);
    const nextSrc = candidates[currentIndex + 1];

    if (nextSrc && nextSrc !== currentSrc) {
        img.src = nextSrc;
        return;
    }

    img.onerror = null;
    img.src = fallback;
};

const isPdfAttachment = (url) => /\.pdf(?:$|[?#])/i.test(String(url || '').trim());

const getAttachmentFallbackDataUrl = (label = 'Attachment unavailable') => {
    const safeLabel = String(label || 'Attachment unavailable');
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="640" height="280" fill="url(#bg)"/>
  <rect x="26" y="26" width="588" height="228" rx="14" fill="none" stroke="#334155" stroke-width="2"/>
  <circle cx="120" cy="140" r="28" fill="#1d4ed8" opacity="0.25"/>
  <text x="320" y="130" text-anchor="middle" fill="#cbd5e1" font-size="22" font-family="Arial, sans-serif">Image could not be loaded</text>
  <text x="320" y="164" text-anchor="middle" fill="#93c5fd" font-size="18" font-family="Arial, sans-serif">${safeLabel}</text>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getAttachmentHref = (url) => {
    const resolved = getImageUrl(url);
    if (resolved) return resolved;
    const normalizedPath = normalizeUploadPath(url);
    if (!normalizedPath) return '';
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    if (normalizedPath.startsWith('/')) {
        const backendBaseUrl = getBackendBaseUrl();
        if (backendBaseUrl) return joinUrl(backendBaseUrl, normalizedPath);
        if (typeof window !== 'undefined') return joinUrl(window.location.origin, normalizedPath);
    }
    return normalizedPath;
};

const handleAttachmentImageError = (event, originalUrl) => {
    const img = event.currentTarget;
    const candidates = getImageCandidates(originalUrl);
    const currentSrc = String(img.getAttribute('src') || '');
    const currentIndex = candidates.findIndex((candidate) => candidate === currentSrc);
    const nextSrc = candidates[currentIndex + 1];

    if (nextSrc && nextSrc !== currentSrc) {
        img.src = nextSrc;
        return;
    }

    img.onerror = null;
    img.src = getAttachmentFallbackDataUrl('Open from source if needed');
    img.style.objectFit = 'contain';
    img.style.background = 'rgba(2,6,23,0.72)';
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Shared Styles
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const glass = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    backdropFilter: 'blur(12px)',
};

const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#f0f0f0',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'border-color 0.2s',
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Thread Card (list view)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ThreadCard = ({
    thread,
    onClick,
    onLike,
    onShare,
    onReport,
    onToggleSave,
    onDeleteThread,
    currentUserId,
    currentUsername = '',
    isAuthenticated,
    followState = false,
    onFollowStateChange
}) => {
    const cat = CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.General;
    const ownerId = (thread.user?._id || thread.user?.id || '').toString();
    const canDelete = Boolean(currentUserId) && ownerId === currentUserId;
    const safeTags = Array.isArray(thread.tags) ? thread.tags : [];
    const resolvedAttachmentUrl = getImageUrl(thread.imageUrl);
    const ownerUsername = String(thread.user?.username || '').trim().toLowerCase();
    const normalizedCurrentUsername = String(currentUsername || '').trim().toLowerCase();
    const isSelfAuthor = Boolean(
        (ownerId && currentUserId && ownerId === String(currentUserId || '')) ||
        (ownerUsername && normalizedCurrentUsername && ownerUsername === normalizedCurrentUsername)
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
            onClick={onClick}
            style={{
                ...glass,
                padding: '20px 24px',
                marginBottom: '12px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
            }}
        >
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#e8e8e8', fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
                    {thread.title || 'Untitled Thread'}
                </h4>
                <span style={{
                    background: cat.bg, color: cat.color, fontSize: '0.72rem', padding: '3px 10px',
                    borderRadius: '6px', border: `1px solid ${cat.border}`, fontWeight: 500, whiteSpace: 'nowrap', marginLeft: '12px'
                }}>
                    {thread.category}
                </span>
            </div>

            {/* Content preview */}
            <p style={{ color: '#9ca3af', fontSize: '0.88rem', margin: '0 0 12px', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {thread.content}
            </p>

            {/* Thumbnail preview if image exists */}
            {thread.imageUrl && (
                <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', height: '120px', background: 'rgba(0,0,0,0.2)' }}>
                    {isPdfAttachment(thread.imageUrl) ? (
                        <a
                            href={getAttachmentHref(thread.imageUrl)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                textDecoration: 'none',
                                color: '#e2e8f0',
                                background: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(168,85,247,0.18))',
                                fontWeight: 600
                            }}
                        >
                            <FaFileAlt />
                            Open PDF Attachment
                            <FaExternalLinkAlt size={11} />
                        </a>
                    ) : resolvedAttachmentUrl ? (
                        <img
                            src={resolvedAttachmentUrl}
                            alt="attachment preview"
                            onError={(e) => handleAttachmentImageError(e, thread.imageUrl)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94a3b8',
                            fontSize: '0.82rem'
                        }}>
                            Attachment unavailable
                        </div>
                    )}
                </div>
            )}

            {/* Tags */}
            {safeTags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {safeTags.map((t, i) => (
                        <span key={i} style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: '6px', color: '#8b9cb5' }}>
                            #{t}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: '#6b7280', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <Link to={`/profile/${thread.user?.username}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <img
                            src={getAvatarUrl(thread.user?.avatar, thread.user?.username, 28)}
                            onError={(e) => handleAvatarImageError(e, thread.user?.avatar, thread.user?.username, 28)}
                            alt=""
                            style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid rgba(96,165,250,0.4)' }}
                        />
                        <span style={{ color: '#60a5fa', fontWeight: 500, cursor: 'pointer' }}>{thread.user?.username || 'Unknown'}</span>
                        <span style={{ color: '#6b7280' }}>•</span>
                        <span style={{ color: '#6b7280' }}>{relativeTime(thread.createdAt)}</span>
                    </Link>
                    {ownerId && !isSelfAuthor && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <FollowButton
                                targetUserId={ownerId}
                                isSelf={isSelfAuthor}
                                initialFollowing={Boolean(followState)}
                                size="sm"
                                onStateChange={onFollowStateChange}
                            />
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaEye size={12} /> {thread.views || 0}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaRegComment size={12} /> {thread.repliesCount || 0}</span>
                    <motion.span
                        whileTap={{ scale: 1.3 }}
                        onClick={(e) => { e.stopPropagation(); if (isAuthenticated) onLike(thread._id, 'like'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: isAuthenticated ? 'pointer' : 'default', color: thread.hasLiked ? '#ef4444' : 'inherit' }}
                    >
                        {thread.hasLiked ? <FaHeart size={12} /> : <FaRegHeart size={12} />} {thread.likesCount || 0}
                    </motion.span>
                    <motion.span
                        whileTap={{ scale: 1.3 }}
                        onClick={(e) => { e.stopPropagation(); if (isAuthenticated) onLike(thread._id, 'dislike'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: isAuthenticated ? 'pointer' : 'default', color: thread.hasDisliked ? '#ef4444' : 'inherit' }}
                    >
                        {thread.hasDisliked ? <FaThumbsDown size={12} /> : <FaRegThumbsDown size={12} />} {thread.dislikesCount || 0}
                    </motion.span>
                    <motion.span whileTap={{ scale: 1.2 }} onClick={(e) => onShare(thread._id, e)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaShareAlt size={12} />
                    </motion.span>
                    {isAuthenticated && (
                        <motion.span whileTap={{ scale: 1.2 }} onClick={(e) => onReport(thread._id, thread.user?._id, e)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FaFlag size={12} />
                        </motion.span>
                    )}
                    {canDelete && (
                        <motion.span
                            whileTap={{ scale: 1.2 }}
                            onClick={(e) => { e.stopPropagation(); onDeleteThread(thread._id); }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}
                            title="Delete post"
                        >
                            <FaTrash size={12} />
                        </motion.span>
                    )}
                    {isAuthenticated && (
                        <motion.span
                            whileTap={{ scale: 1.2 }}
                            onClick={(e) => { e.stopPropagation(); onToggleSave(thread._id); }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: thread.isSaved ? '#f59e0b' : '#9ca3af' }}
                            title={thread.isSaved ? 'Remove from saved posts' : 'Save post'}
                        >
                            {thread.isSaved ? <FaBookmark size={12} /> : <FaRegBookmark size={12} />}
                        </motion.span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Reply Component (recursive nesting)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ReplyItem = ({ reply, depth = 0, onLike, onReplyClick, onReport, isAuthenticated }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
            padding: '14px 16px',
            marginLeft: depth > 0 ? '24px' : 0,
            borderLeft: depth > 0 ? '2px solid rgba(96,165,250,0.15)' : 'none',
            marginTop: '8px',
            background: depth > 0 ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.02)',
            borderRadius: '10px',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Link to={`/profile/${reply.user?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <img
                    src={getAvatarUrl(reply.user?.avatar, reply.user?.username, 24)}
                    onError={(e) => handleAvatarImageError(e, reply.user?.avatar, reply.user?.username, 24)}
                    alt=""
                    style={{ width: 20, height: 20, borderRadius: '50%' }}
                />
                <span style={{ color: '#60a5fa', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>{reply.user?.username}</span>
                <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>â€¢ {relativeTime(reply.createdAt)}</span>
                {reply.isEdited && <span style={{ color: '#6b7280', fontSize: '0.7rem', fontStyle: 'italic' }}>(edited)</span>}
            </Link>
        </div>

        <p style={{ color: '#d1d5db', fontSize: '0.9rem', margin: '0 0 10px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {reply.content}
        </p>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#6b7280' }}>
            <motion.span
                whileTap={{ scale: 1.3 }}
                onClick={() => isAuthenticated && onLike(reply._id, 'like')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: isAuthenticated ? 'pointer' : 'default', color: reply.hasLiked ? '#ef4444' : 'inherit' }}
            >
                {reply.hasLiked ? <FaHeart size={11} /> : <FaRegHeart size={11} />} {reply.likesCount || 0}
            </motion.span>
            <motion.span
                whileTap={{ scale: 1.3 }}
                onClick={() => isAuthenticated && onLike(reply._id, 'dislike')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: isAuthenticated ? 'pointer' : 'default', color: reply.hasDisliked ? '#ef4444' : 'inherit' }}
            >
                {reply.hasDisliked ? <FaThumbsDown size={11} /> : <FaRegThumbsDown size={11} />} {reply.dislikesCount || 0}
            </motion.span>
            {depth < 2 && isAuthenticated && (
                <span onClick={() => onReplyClick(reply._id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <FaReply size={11} /> Reply
                </span>
            )}
            {isAuthenticated && (
                <motion.span whileTap={{ scale: 1.2 }} onClick={(e) => onReport(reply._id, reply.user?._id, e)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <FaFlag size={11} /> Report
                </motion.span>
            )}
        </div>
    </motion.div>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Thread Detail View
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ThreadDetail = ({
    threadId,
    onBack,
    isAuthenticated,
    onLike,
    onShare,
    onReport,
    onToggleSave,
    onDeleteThread,
    currentUserId,
    currentUsername = '',
    savedThreadIds = [],
    followState = false,
    onFollowStateChange
}) => {
    const [thread, setThread] = useState(null);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // null = reply to thread, else commentId
    const [loading, setLoading] = useState(true);
    const [repliesLoading, setRepliesLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [repliesPage, setRepliesPage] = useState(1);
    const [repliesHasMore, setRepliesHasMore] = useState(false);

    const fetchThread = useCallback(async () => {
        try {
            const res = await api.get(`/doubts/${threadId}/detail`);
            setThread(res.data?.thread ? normalizeThread(res.data.thread) : null);
        } catch { toast.error('Failed to load thread'); onBack(); }
    }, [threadId, onBack]);

    const fetchReplies = useCallback(async (page = 1, reset = false) => {
        try {
            setRepliesLoading(true);
            const res = await api.get(`/doubts/${threadId}/replies`, { params: { page, limit: 20 } });
            const items = normalizeThreadList(res.data?.replies);
            setReplies(prev => reset ? items : [...(Array.isArray(prev) ? prev : []), ...items]);
            setRepliesHasMore(Boolean(res.data?.pagination?.hasMore));
            setRepliesPage(page);
        } catch { /* silent */ } finally { setRepliesLoading(false); }
    }, [threadId]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchThread();
            await fetchReplies(1, true);
            setLoading(false);
        };
        init();
    }, [fetchThread, fetchReplies]);

    const handleLike = async (id, type = 'like') => {
        if (!isAuthenticated) return toast.error('Login to react');
        try {
            const res = await api.post(`/doubts/${id}/like`, { type });
            if (id === threadId) {
                setThread(prev => ({
                    ...prev,
                    likesCount: res.data.likesCount,
                    dislikesCount: res.data.dislikesCount,
                    hasLiked: res.data.hasLiked,
                    hasDisliked: res.data.hasDisliked
                }));
            } else {
                setReplies(prev => (Array.isArray(prev) ? prev : []).map(r =>
                    r._id === id ? {
                        ...r,
                        likesCount: res.data.likesCount,
                        dislikesCount: res.data.dislikesCount,
                        hasLiked: res.data.hasLiked,
                        hasDisliked: res.data.hasDisliked
                    } : r
                ));
            }
        } catch (err) { toast.error('Login to react'); }
    };

    const handlePostReply = async () => {
        if (!isAuthenticated) return toast.error('Login to comment');
        if (!replyText.trim()) return;
        setPosting(true);
        try {
            await api.post('/doubts/create', {
                content: replyText,
                parentCommentId: replyingTo || threadId,
            });
            toast.success('Reply posted!');
            setReplyText('');
            setReplyingTo(null);
            await fetchReplies(1, true);
            // Update thread reply count
            setThread(prev => (prev ? { ...prev, repliesCount: (prev.repliesCount || 0) + 1 } : prev));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to post reply');
        } finally { setPosting(false); }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: 32, height: 32, border: '3px solid rgba(96,165,250,0.2)', borderTopColor: '#60a5fa', borderRadius: '50%', margin: '0 auto 16px' }}
                />
                Loading thread...
            </div>
        );
    }

    if (!thread) return null;

    const cat = CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.General;
    const isSaved = savedThreadIds.includes(thread._id) || thread.isSaved;
    const safeReplies = Array.isArray(replies) ? replies : [];
    const threadOwnerId = (thread.user?._id || thread.user?.id || '').toString();
    const canDeleteThread = Boolean(currentUserId) && threadOwnerId === currentUserId;
    const safeTags = Array.isArray(thread.tags) ? thread.tags : [];
    const resolvedAttachmentUrl = getImageUrl(thread.imageUrl);
    const threadOwnerUsername = String(thread.user?.username || '').trim().toLowerCase();
    const normalizedCurrentUsername = String(currentUsername || '').trim().toLowerCase();
    const isSelfAuthor = Boolean(
        (threadOwnerId && currentUserId && threadOwnerId === String(currentUserId || '')) ||
        (threadOwnerUsername && normalizedCurrentUsername && threadOwnerUsername === normalizedCurrentUsername)
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Back button */}
            <motion.button
                whileHover={{ x: -3 }}
                onClick={onBack}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
                    color: '#60a5fa', cursor: 'pointer', fontSize: '0.95rem', marginBottom: '20px', padding: 0
                }}
            >
                <FaArrowLeft /> Back to Community
            </motion.button>

            {/* Thread header */}
            <div style={{ ...glass, padding: '28px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, color: '#f0f0f0', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.4, flex: 1 }}>
                        {thread.title || 'Untitled Thread'}
                    </h2>
                    <span style={{
                        background: cat.bg, color: cat.color, fontSize: '0.8rem', padding: '4px 12px',
                        borderRadius: '8px', border: `1px solid ${cat.border}`, fontWeight: 500, marginLeft: '16px'
                    }}>
                        {thread.category}
                    </span>
                </div>

                {/* Author info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '0.88rem' }}>
                    <Link to={`/profile/${thread.user?.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <img
                            src={getAvatarUrl(thread.user?.avatar, thread.user?.username, 36)}
                            onError={(e) => handleAvatarImageError(e, thread.user?.avatar, thread.user?.username, 36)}
                            alt=""
                            style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(96,165,250,0.3)' }}
                        />
                        <div>
                            <span style={{ color: '#60a5fa', fontWeight: 600 }}>{thread.user?.username}</span>
                            <span style={{ color: '#6b7280', marginLeft: '8px' }}>â€¢ {relativeTime(thread.createdAt)}</span>
                            {thread.isEdited && <span style={{ color: '#6b7280', marginLeft: '8px', fontStyle: 'italic', fontSize: '0.8rem' }}>(edited)</span>}
                        </div>
                    </Link>
                    {threadOwnerId && !isSelfAuthor && (
                        <FollowButton
                            targetUserId={threadOwnerId}
                            isSelf={isSelfAuthor}
                            initialFollowing={Boolean(followState)}
                            size="sm"
                            onStateChange={onFollowStateChange}
                        />
                    )}
                </div>

                {/* Tags */}
                {safeTags.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {safeTags.map((t, i) => (
                            <span key={i} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '8px', color: '#8b9cb5', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaHashtag size={10} />{t}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    {thread.content}
                </div>

                {/* Attached Image */}
                {thread.imageUrl && (
                    <div style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {isPdfAttachment(thread.imageUrl) ? (
                            <a
                                href={getAttachmentHref(thread.imageUrl)}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    width: '100%',
                                    minHeight: '92px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 18px',
                                    gap: '12px',
                                    textDecoration: 'none',
                                    color: '#e2e8f0',
                                    background: 'rgba(15,23,42,0.55)'
                                }}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                                    <FaFileAlt />
                                    Attachment (PDF)
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontWeight: 600 }}>
                                    Open
                                    <FaExternalLinkAlt size={12} />
                                </span>
                            </a>
                        ) : resolvedAttachmentUrl ? (
                            <img
                                src={resolvedAttachmentUrl}
                                alt="attachment"
                                onError={(e) => handleAttachmentImageError(e, thread.imageUrl)}
                                style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', background: 'rgba(0,0,0,0.4)', display: 'block' }}
                            />
                        ) : (
                            <div style={{
                                minHeight: '90px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                                fontSize: '0.9rem',
                                background: 'rgba(15,23,42,0.45)'
                            }}>
                                Attachment unavailable
                            </div>
                        )}
                    </div>
                )}

                {/* Stats bar */}
                <div style={{ display: 'flex', gap: '24px', fontSize: '0.88rem', color: '#6b7280', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaEye size={13} /> {thread.views} views</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaComment size={13} /> {thread.repliesCount || 0} replies</span>
                    <motion.span
                        whileTap={{ scale: 1.3 }}
                        onClick={() => isAuthenticated && onLike(thread._id, 'like')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isAuthenticated ? 'pointer' : 'default', color: thread.hasLiked ? '#ef4444' : 'inherit', transition: 'color 0.2s' }}
                    >
                        {thread.hasLiked ? <FaHeart size={13} /> : <FaRegHeart size={13} />} {thread.likesCount || 0} likes
                    </motion.span>
                    <motion.span
                        whileTap={{ scale: 1.3 }}
                        onClick={() => isAuthenticated && onLike(thread._id, 'dislike')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isAuthenticated ? 'pointer' : 'default', color: thread.hasDisliked ? '#ef4444' : 'inherit', transition: 'color 0.2s' }}
                    >
                        {thread.hasDisliked ? <FaThumbsDown size={13} /> : <FaRegThumbsDown size={13} />} {thread.dislikesCount || 0} dislikes
                    </motion.span>

                    <div style={{ flex: 1 }}></div>

                    <motion.span whileTap={{ scale: 1.1 }} onClick={(e) => onShare(thread._id, e)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <FaShareAlt size={13} /> Share
                    </motion.span>
                    {isAuthenticated && (
                        <motion.span whileTap={{ scale: 1.1 }} onClick={(e) => onReport(thread._id, thread.user?._id, e)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <FaFlag size={13} /> Report
                        </motion.span>
                    )}
                    {canDeleteThread && (
                        <motion.span
                            whileTap={{ scale: 1.1 }}
                            onClick={() => onDeleteThread(thread._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#f87171' }}
                        >
                            <FaTrash size={13} /> Delete
                        </motion.span>
                    )}
                    {isAuthenticated && (
                        <motion.span
                            whileTap={{ scale: 1.1 }}
                            onClick={() => onToggleSave(thread._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: isSaved ? '#f59e0b' : '#9ca3af' }}
                        >
                            {isSaved ? <FaBookmark size={13} /> : <FaRegBookmark size={13} />} {isSaved ? 'Saved' : 'Save'}
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Replies Section */}
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ color: '#e0e0e0', fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaComment size={14} style={{ color: '#60a5fa' }} /> Replies ({thread.repliesCount || 0})
                </h3>

                {safeReplies.length > 0 ? (
                    <>
                        {safeReplies.map(reply => (
                            <ReplyItem
                                key={reply._id}
                                reply={reply}
                                depth={reply.depth || 0}
                                onLike={onLike}
                                onReport={onReport}
                                onReplyClick={(id) => setReplyingTo(id)}
                                isAuthenticated={isAuthenticated}
                            />
                        ))}
                        {repliesHasMore && (
                            <button
                                onClick={() => fetchReplies(repliesPage + 1)}
                                disabled={repliesLoading}
                                style={{
                                    width: '100%', padding: '10px', marginTop: '12px', ...glass,
                                    color: '#60a5fa', cursor: 'pointer', fontSize: '0.88rem', textAlign: 'center'
                                }}
                            >
                                {repliesLoading ? 'Loading...' : 'Load More Replies'}
                            </button>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#4b5563', ...glass }}>
                        <FaRegComment size={28} style={{ marginBottom: '12px', opacity: 0.4 }} />
                        <p style={{ margin: 0 }}>No replies yet. Be the first to respond!</p>
                    </div>
                )}
            </div>

            {/* Reply compose */}
            {isAuthenticated ? (
                <div style={{ ...glass, padding: '20px' }}>
                    {replyingTo && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px 12px', background: 'rgba(96,165,250,0.08)', borderRadius: '8px', fontSize: '0.82rem', color: '#60a5fa' }}>
                            <span>Replying to a comment</span>
                            <FaTimes size={12} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo(null)} />
                        </div>
                    )}
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        maxLength={5000}
                        style={{ ...inputStyle, resize: 'vertical', marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePostReply}
                            disabled={posting || !replyText.trim()}
                            style={{
                                padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                                border: 'none', borderRadius: '10px', fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer',
                                opacity: posting || !replyText.trim() ? 0.6 : 1, fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <FaReply size={12} /> {posting ? 'Posting...' : 'Post Reply'}
                        </motion.button>
                    </div>
                </div>
            ) : (
                <div style={{ ...glass, padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                    <FaUserCircle size={20} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>Login to join the discussion</p>
                </div>
            )}
        </motion.div>
    );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Create Thread Modal
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const COMPANY_TAGS = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix'];

const CreateThreadModal = ({ isOpen, onClose, onSuccess, isAuthenticated }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('General');
    const [tags, setTags] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size should be less than 5MB");
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return toast.error('Login to post');
        if (!title.trim() || !content.trim()) return toast.error("Title and Content are required");

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('content', content.trim());
            formData.append('category', category);

            const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
            tagsArray.forEach(tag => formData.append('tags[]', tag));

            if (image) {
                formData.append('image', image);
            }

            await api.post('/doubts/create', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Thread created!");
            onSuccess();
            onClose();
            setTitle(''); setContent(''); setCategory('General'); setTags(''); setImage(null); setImagePreview(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create thread");
        } finally { setLoading(false); }
    };

    const handleAddTag = (tag) => {
        const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
        if (!currentTags.includes(tag.toLowerCase())) {
            currentTags.push(tag.toLowerCase());
            setTags(currentTags.join(', '));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--bg-card-dark)', borderRadius: '20px', padding: 'clamp(16px, 3vw, 32px)',
                    width: 'min(620px, 92vw)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(156, 163, 175, 0.2)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 700 }}>ðŸš€ Start a Discussion</h2>
                    <motion.button whileHover={{ rotate: 90 }} onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}><FaTimes /></motion.button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Title</label>
                        <input
                            type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="What's on your mind?"
                            maxLength={200}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card-dark)' }}>
                                <option value="General" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card-dark)' }}>General</option>
                                <option value="Interview" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card-dark)' }}>Interview Experience</option>
                                <option value="Career" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card-dark)' }}>Career Advice</option>
                                <option value="Showcase" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card-dark)' }}>Project Showcase</option>
                                <option value="Problem" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card-dark)' }}>Problem Discussion</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Tags (comma separated)</label>
                            <input
                                type="text" value={tags} onChange={e => setTags(e.target.value)}
                                placeholder="e.g. dp, system-design"
                                style={inputStyle}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                {COMPANY_TAGS.map(company => (
                                    <span
                                        key={company}
                                        onClick={() => handleAddTag(company)}
                                        style={{
                                            fontSize: '0.72rem', background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
                                            padding: '4px 10px', borderRadius: '12px', cursor: 'pointer',
                                            border: '1px solid rgba(96,165,250,0.3)', userSelect: 'none'
                                        }}
                                    >
                                        +{company}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Content</label>
                        <textarea
                            value={content} onChange={e => setContent(e.target.value)}
                            placeholder="Share your thoughts, ask a question, or discuss a concept..."
                            rows={6}
                            maxLength={5000}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {/* Image Upload Area */}
                    <div>
                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500 }}>Attachment (Optional)</label>
                        {!imagePreview ? (
                            <div style={{
                                border: '1px dashed rgba(156, 163, 175, 0.4)', borderRadius: '10px', padding: '20px',
                                textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s'
                            }} onClick={() => document.getElementById('imageUpload').click()}>
                                <FaImage size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Click to upload an image or PDF (Max 5MB)</p>
                                <input id="imageUpload" type="file" accept="image/*,application/pdf" hidden onChange={handleImageChange} />
                            </div>
                        ) : (
                            <div style={{ position: 'relative', display: 'inline-block', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(156, 163, 175, 0.3)' }}>
                                {image?.type?.startsWith('image/') ? (
                                    <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                                ) : (
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', textAlign: 'center' }}>
                                        ðŸ“„ {image?.name}
                                    </div>
                                )}
                                <button type="button" onClick={removeImage} style={{
                                    position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white',
                                    border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    backdropFilter: 'blur(4px)'
                                }}>
                                    <FaTimes size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit" disabled={loading}
                            style={{
                                padding: '10px 28px', background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white',
                                border: 'none', borderRadius: '10px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1, fontSize: '0.9rem'
                            }}
                        >
                            {loading ? 'Posting...' : 'Post Thread'}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Main Community Component
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Community = () => {
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const [threads, setThreads] = useState([]);
    const [yourThreads, setYourThreads] = useState([]);
    const [yourLoading, setYourLoading] = useState(false);
    const [yourPage, setYourPage] = useState(1);
    const [yourHasMore, setYourHasMore] = useState(false);
    const [savedThreads, setSavedThreads] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [showFeedSkeleton, setShowFeedSkeleton] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortOption, setSortOption] = useState('latest');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeThreadId, setActiveThreadId] = useState(null);
    const [reportData, setReportData] = useState({ isOpen: false, contentId: null, contentType: 'Doubt', reportedUserId: null });
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));
    const [followMap, setFollowMap] = useState({});
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [suggestedLoading, setSuggestedLoading] = useState(false);
    const currentUserId = (user?._id || user?.id || '').toString();
    const currentUsername = String(user?.username || '').trim();
    const isMobile = viewportWidth <= 768;
    const isTablet = viewportWidth > 768 && viewportWidth <= 1100;

    const fetchThreads = useCallback(async (pageNum = 1, reset = false) => {
        try {
            setLoading(true);
            const res = await api.get('/doubts/community', {
                params: { page: pageNum, limit: 15, sort: sortOption, category: categoryFilter }
            });
            const items = normalizeThreadList(res.data?.threads);
            setThreads(prev => reset ? items : [...(Array.isArray(prev) ? prev : []), ...items]);
            setHasMore(Boolean(res.data?.pagination?.hasMore));
            setPage(pageNum);
        } catch {
            toast.error("Failed to load community threads");
        } finally { setLoading(false); }
    }, [sortOption, categoryFilter]);

    useEffect(() => { fetchThreads(1, true); }, [fetchThreads]);

    useEffect(() => {
        if (!(loading && page === 1)) {
            setShowFeedSkeleton(false);
            return undefined;
        }

        const timer = setTimeout(() => setShowFeedSkeleton(true), 300);
        return () => clearTimeout(timer);
    }, [loading, page]);

    useEffect(() => {
        const threadIdFromUrl = searchParams.get('threadId');
        if (threadIdFromUrl) {
            setActiveThreadId(threadIdFromUrl);
        }
    }, [searchParams]);

    const fetchYourThreads = useCallback(async (pageNum = 1, reset = false, silent = false) => {
        if (!isAuthenticated) {
            setYourThreads([]);
            setYourHasMore(false);
            setYourPage(1);
            return;
        }
        try {
            setYourLoading(true);
            const res = await api.get('/doubts/my-posts', {
                params: { page: pageNum, limit: 8, sort: 'latest' }
            });
            const items = normalizeThreadList(res.data?.threads);
            setYourThreads(prev => reset ? items : [...(Array.isArray(prev) ? prev : []), ...items]);
            setYourHasMore(Boolean(res.data?.pagination?.hasMore));
            setYourPage(pageNum);
        } catch {
            if (!silent) toast.error('Failed to load your posts');
        } finally {
            setYourLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchYourThreads(1, true, true);
    }, [fetchYourThreads]);

    const fetchSavedThreads = useCallback(async (silent = false) => {
        if (!isAuthenticated) {
            setSavedThreads([]);
            return;
        }
        try {
            setSavedLoading(true);
            const res = await api.get('/doubts/saved');
            setSavedThreads(normalizeThreadList(res.data?.threads));
        } catch {
            if (!silent) toast.error('Failed to load saved posts');
        } finally {
            setSavedLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchSavedThreads();
    }, [fetchSavedThreads]);

    const fetchFollowMap = useCallback(async () => {
        if (!isAuthenticated || !currentUserId) {
            setFollowMap({});
            return;
        }

        try {
            let pageNum = 1;
            let hasMorePages = true;
            const maxPages = 5;
            const nextMap = {};

            while (hasMorePages && pageNum <= maxPages) {
                const res = await api.get(`/following/${currentUserId}`, {
                    params: { page: pageNum, limit: 100 }
                });
                const rows = Array.isArray(res.data?.users) ? res.data.users : [];
                rows.forEach((row) => {
                    if (row?._id) nextMap[String(row._id)] = true;
                });

                const totalPages = Number(res.data?.pagination?.pages || 1);
                hasMorePages = pageNum < totalPages;
                pageNum += 1;
            }

            setFollowMap(nextMap);
        } catch (error) {
            setFollowMap({});
        }
    }, [isAuthenticated, currentUserId]);

    useEffect(() => {
        fetchFollowMap();
    }, [fetchFollowMap]);

    const fetchSuggestedUsers = useCallback(async () => {
        if (!isAuthenticated) {
            setSuggestedUsers([]);
            return;
        }

        try {
            setSuggestedLoading(true);
            const res = await api.get('/suggested-users', { params: { limit: 6 } });
            const rows = Array.isArray(res.data?.users) ? res.data.users.map(normalizeSuggestedUser) : [];
            setSuggestedUsers(rows);
            setFollowMap((prev) => {
                const next = { ...(prev || {}) };
                rows.forEach((entry) => {
                    const uid = String(entry?._id || '');
                    if (uid && entry?.isFollowing !== undefined) {
                        next[uid] = Boolean(entry.isFollowing);
                    }
                });
                return next;
            });
        } catch (error) {
            setSuggestedUsers([]);
        } finally {
            setSuggestedLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchSuggestedUsers();
    }, [fetchSuggestedUsers]);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleLike = async (id, type = 'like') => {
        if (!isAuthenticated) return toast.error('Login to react');
        try {
            const res = await api.post(`/doubts/${id}/like`, { type });
            setThreads(prev => (Array.isArray(prev) ? prev : []).map(t =>
                t._id === id ? {
                    ...t,
                    likesCount: res.data.likesCount,
                    dislikesCount: res.data.dislikesCount,
                    hasLiked: res.data.hasLiked,
                    hasDisliked: res.data.hasDisliked
                } : t
            ));
            setYourThreads(prev => (Array.isArray(prev) ? prev : []).map(t =>
                t._id === id ? {
                    ...t,
                    likesCount: res.data.likesCount,
                    dislikesCount: res.data.dislikesCount,
                    hasLiked: res.data.hasLiked,
                    hasDisliked: res.data.hasDisliked
                } : t
            ));
        } catch { toast.error('Login to react'); }
    };

    const handleShare = (id, e) => {
        e?.stopPropagation();
        const url = `${window.location.origin}/community?threadId=${id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
    };

    const handleReport = (id, reportedUserId, e) => {
        e?.stopPropagation();
        if (!isAuthenticated) return toast.error('Login to report');
        setReportData({ isOpen: true, contentId: id, contentType: 'Doubt', reportedUserId });
    };

    const handleToggleSave = async (threadId) => {
        if (!isAuthenticated) return toast.error('Login to save posts');
        try {
            const res = await api.post(`/doubts/${threadId}/save`);
            const nextSaved = Boolean(res.data?.saved);

            setThreads(prev => (Array.isArray(prev) ? prev : []).map(t => (
                t._id === threadId ? { ...t, isSaved: nextSaved } : t
            )));
            setYourThreads(prev => (Array.isArray(prev) ? prev : []).map(t => (
                t._id === threadId ? { ...t, isSaved: nextSaved } : t
            )));

            if (!nextSaved) {
                setSavedThreads(prev => (Array.isArray(prev) ? prev : []).filter(t => t._id !== threadId));
            } else {
                await fetchSavedThreads(true);
            }

            toast.success(nextSaved ? 'Post saved' : 'Removed from saved posts');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update saved posts');
        }
    };

    const handleAuthorFollowStateChange = useCallback((authorId, nextState) => {
        const normalizedAuthorId = String(authorId || '');
        if (!normalizedAuthorId) return;
        setFollowMap((prev) => ({
            ...(prev || {}),
            [normalizedAuthorId]: Boolean(nextState)
        }));
        setSuggestedUsers((prev) => (Array.isArray(prev) ? prev : []).map((entry) => (
            String(entry?._id || '') === normalizedAuthorId
                ? { ...entry, isFollowing: Boolean(nextState) }
                : entry
        )));
    }, []);

    const handleDeleteThread = async (threadId) => {
        if (!isAuthenticated) return toast.error('Login to delete your post');
        const confirmed = window.confirm('Delete this post? This action cannot be undone.');
        if (!confirmed) return;

        try {
            await api.delete(`/doubts/${threadId}`);
            setThreads(prev => (Array.isArray(prev) ? prev : []).filter(t => t._id !== threadId));
            setYourThreads(prev => (Array.isArray(prev) ? prev : []).filter(t => t._id !== threadId));
            setSavedThreads(prev => (Array.isArray(prev) ? prev : []).filter(t => t._id !== threadId));
            if (activeThreadId === threadId) {
                setActiveThreadId(null);
                const nextParams = new URLSearchParams(searchParams);
                nextParams.delete('threadId');
                setSearchParams(nextParams, { replace: true });
            }
            toast.success('Post deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete post');
        }
    };

    const openThreadDetail = (threadId) => {
        setActiveThreadId(threadId);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('threadId', threadId);
        setSearchParams(nextParams, { replace: false });
    };

    const closeThreadDetail = () => {
        setActiveThreadId(null);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('threadId');
        setSearchParams(nextParams, { replace: true });
    };

    // Client-side search filter
    const safeThreads = Array.isArray(threads) ? threads : [];
    const safeYourThreads = Array.isArray(yourThreads) ? yourThreads : [];
    const safeSavedThreads = Array.isArray(savedThreads) ? savedThreads : [];
    const normalizedSearch = String(searchQuery || '').trim().toLowerCase();
    const filteredThreads = normalizedSearch
        ? safeThreads.filter((t) => (
            String(t?.title || '').toLowerCase().includes(normalizedSearch) ||
            String(t?.content || '').toLowerCase().includes(normalizedSearch)
        ))
        : safeThreads;
    const visibleThreads = Array.isArray(filteredThreads) ? filteredThreads : [];
    const savedThreadIds = safeSavedThreads
        .map((t) => String(t?._id || ''))
        .filter(Boolean);
    const activeThreadSummary = [...safeThreads, ...safeYourThreads, ...safeSavedThreads]
        .find((item) => item?._id === activeThreadId);
    const activeThreadAuthorId = String(activeThreadSummary?.user?._id || activeThreadSummary?.user?.id || '');
    const activeThreadFollowState = Boolean(followMap[activeThreadAuthorId]);

    // If a thread is active, show detail view
    if (activeThreadId) {
        return (
            <div className="main-content">
                <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '20px 12px' : '40px 20px' }}>
                    <AnimatePresence mode="wait">
                        <ThreadDetail
                            key={activeThreadId}
                            threadId={activeThreadId}
                            onBack={closeThreadDetail}
                            isAuthenticated={isAuthenticated}
                            onLike={handleLike}
                            onShare={handleShare}
                            onReport={handleReport}
                            onToggleSave={handleToggleSave}
                            onDeleteThread={handleDeleteThread}
                            currentUserId={currentUserId}
                            currentUsername={currentUsername}
                            savedThreadIds={savedThreadIds}
                            followState={activeThreadFollowState}
                            onFollowStateChange={(nextState) => {
                                handleAuthorFollowStateChange(activeThreadAuthorId, nextState);
                            }}
                        />
                    </AnimatePresence>
                </div>
                {reportData.isOpen && (
                    <ReportModal
                        isOpen={reportData.isOpen}
                        onClose={() => setReportData((prev) => ({ ...prev, isOpen: false }))}
                        contentId={reportData.contentId}
                        contentType={reportData.contentType}
                        reportedUserId={reportData.reportedUserId}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="main-content">
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 12px' : '40px 20px' }}>

                {/* â”€â”€ Header â”€â”€ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{
                            margin: '0 0 8px', fontSize: isMobile ? '1.9rem' : '2.4rem', fontWeight: 800,
                            background: 'linear-gradient(135deg, #f0f0f0 0%, #60a5fa 50%, #a78bfa 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            Community
                        </h1>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '1rem' }}>
                            Discuss solutions, share interviews, and help others grow.
                        </p>
                    </div>
                    {isAuthenticated ? (
                        <motion.button
                            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(236,72,153,0.3)' }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white', border: 'none',
                                padding: '12px 28px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px',
                                borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(236,72,153,0.2)'
                            }}
                        >
                            <FaPlus size={12} /> New Thread
                        </motion.button>
                    ) : (
                        <div style={{ color: '#4b5563', fontSize: '0.88rem', fontStyle: 'italic', padding: '12px 0' }}>Login to start a discussion</div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isTablet || isMobile ? '1fr' : '1fr 320px', gap: isMobile ? '18px' : '32px', alignItems: 'start' }}>

                    {/* â”€â”€ Main Feed â”€â”€ */}
                    <div>
                        {/* Search + Sort bar */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, position: 'relative', minWidth: isMobile ? '100%' : '200px' }}>
                                <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#4b5563', fontSize: '0.85rem' }} />
                                <input
                                    type="text"
                                    placeholder="Search discussions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ ...inputStyle, paddingLeft: '40px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)', width: isMobile ? '100%' : 'auto', overflowX: 'auto' }}>
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSortOption(opt.value)}
                                        style={{
                                            padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                            background: sortOption === opt.value ? 'rgba(96,165,250,0.15)' : 'transparent',
                                            color: sortOption === opt.value ? '#60a5fa' : '#6b7280',
                                            fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
                                        }}
                                    >
                                        {opt.icon} {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category pills */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {CATEGORIES.map(cat => {
                                const active = categoryFilter === cat;
                                const catColor = CATEGORY_COLORS[cat];
                                return (
                                    <motion.button
                                        key={cat}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setCategoryFilter(cat)}
                                        style={{
                                            padding: '7px 18px', borderRadius: '20px', cursor: 'pointer',
                                            background: active ? (catColor ? catColor.bg : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.04)',
                                            color: active ? (catColor ? catColor.color : '#f0f0f0') : '#6b7280',
                                            fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s', whiteSpace: 'nowrap',
                                            border: active ? `1px solid ${catColor ? catColor.border : 'rgba(255,255,255,0.2)'}` : '1px solid transparent'
                                        }}
                                    >
                                        {cat}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Thread List */}
                        <AnimatePresence mode="popLayout">
                            {loading && page === 1 ? (
                                showFeedSkeleton ? (
                                    <motion.div key="loading-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '12px' }}>
                                        <SkeletonCard />
                                        <SkeletonCard />
                                        <SkeletonCard />
                                        <SkeletonCard />
                                    </motion.div>
                                ) : (
                                    <div style={{ minHeight: '240px' }} />
                                )
                            ) : visibleThreads.length > 0 ? (
                                [
                                    ...visibleThreads.map(thread => (
                                        <ThreadCard
                                            key={thread._id}
                                            thread={thread}
                                            onClick={() => openThreadDetail(thread._id)}
                                            onLike={handleLike}
                                            onShare={handleShare}
                                            onReport={handleReport}
                                            onToggleSave={handleToggleSave}
                                            onDeleteThread={handleDeleteThread}
                                            currentUserId={currentUserId}
                                            currentUsername={currentUsername}
                                            isAuthenticated={isAuthenticated}
                                            followState={Boolean(followMap[String(thread.user?._id || thread.user?.id || '')])}
                                            onFollowStateChange={(nextState) => handleAuthorFollowStateChange(String(thread.user?._id || thread.user?.id || ''), nextState)}
                                        />
                                    )),
                                    hasMore && !searchQuery && (
                                        <motion.button
                                            key="load-more-btn"
                                            whileHover={{ scale: 1.01 }}
                                            onClick={() => fetchThreads(page + 1)}
                                            disabled={loading}
                                            style={{
                                                width: '100%', padding: '14px', marginTop: '8px', ...glass,
                                                color: '#60a5fa', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'center', fontWeight: 500
                                            }}
                                        >
                                            {loading ? 'Loading...' : 'Load More Threads'}
                                        </motion.button>
                                    )
                                ]
                            ) : (
                                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{ textAlign: 'center', padding: '60px 20px', color: '#4b5563', ...glass }}
                                >
                                    <FaComment style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.2 }} />
                                    <h3 style={{ color: '#6b7280', fontWeight: 600 }}>No threads found</h3>
                                    <p style={{ margin: 0, color: '#4b5563' }}>
                                        {searchQuery ? 'Try a different search.' : 'Be the first to create a discussion!'}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* â”€â”€ Sidebar â”€â”€ */}
                    <div style={{ position: isTablet || isMobile ? 'static' : 'sticky', top: '100px' }}>
                        {/* Your Posts */}
                        {isAuthenticated && (
                            <div style={{ ...glass, padding: '20px', marginBottom: '20px' }}>
                                <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: '14px', color: '#e0e0e0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaUserCircle size={13} style={{ color: '#60a5fa' }} /> Your Posts
                                </h3>

                                {yourLoading && safeYourThreads.length === 0 ? (
                                    <div style={{ color: '#6b7280', fontSize: '0.84rem' }}>Loading your posts...</div>
                                ) : safeYourThreads.length === 0 ? (
                                    <div style={{ color: '#6b7280', fontSize: '0.84rem' }}>You have not posted yet.</div>
                                ) : (
                                    <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                                            {safeYourThreads.map((thread) => (
                                                <motion.div
                                                    key={thread._id}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    style={{
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        aspectRatio: '1 / 1'
                                                    }}
                                                    onClick={() => openThreadDetail(thread._id)}
                                                >
                                                    {thread.imageUrl ? (
                                                        isPdfAttachment(thread.imageUrl) ? (
                                                            <div
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    flexDirection: 'column',
                                                                    gap: '6px',
                                                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.22))',
                                                                    color: '#e2e8f0'
                                                                }}
                                                            >
                                                                <FaFileAlt size={20} />
                                                                <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>PDF</span>
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={getImageUrl(thread.imageUrl)}
                                                                alt={thread.title || 'Post'}
                                                                onError={(e) => handleAttachmentImageError(e, thread.imageUrl)}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                            />
                                                        )
                                                    ) : (
                                                        <div style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '10px',
                                                            background: 'linear-gradient(135deg, rgba(96,165,250,0.22), rgba(236,72,153,0.2))'
                                                        }}>
                                                            <span style={{
                                                                color: '#e5e7eb',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                lineHeight: 1.25,
                                                                textAlign: 'center',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 4,
                                                                WebkitBoxOrient: 'vertical'
                                                            }}>
                                                                {thread.title || thread.content || 'Untitled Post'}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        background: 'linear-gradient(180deg, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.78) 100%)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        pointerEvents: 'none'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px', pointerEvents: 'auto' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteThread(thread._id);
                                                                }}
                                                                style={{
                                                                    border: 'none',
                                                                    background: 'rgba(239,68,68,0.78)',
                                                                    color: '#fff',
                                                                    borderRadius: '999px',
                                                                    width: '22px',
                                                                    height: '22px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                title="Delete post"
                                                            >
                                                                <FaTrash size={10} />
                                                            </button>
                                                        </div>

                                                        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                                                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.68rem', color: '#f9fafb', fontWeight: 600 }}>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaHeart size={9} /> {thread.likesCount || 0}</span>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaComment size={9} /> {thread.repliesCount || 0}</span>
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><FaEye size={9} /> {thread.views || 0}</span>
                                                            </div>
                                                            <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.62rem', marginTop: '4px' }}>
                                                                {relativeTime(thread.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {yourHasMore && (
                                    <button
                                        onClick={() => fetchYourThreads(yourPage + 1, false, true)}
                                        disabled={yourLoading}
                                        style={{
                                            width: '100%',
                                            marginTop: '10px',
                                            border: '1px solid rgba(96,165,250,0.25)',
                                            background: 'rgba(96,165,250,0.12)',
                                            color: '#60a5fa',
                                            borderRadius: '8px',
                                            padding: '8px 10px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: yourLoading ? 'not-allowed' : 'pointer',
                                            opacity: yourLoading ? 0.7 : 1
                                        }}
                                    >
                                        {yourLoading ? 'Loading...' : 'Load More'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Saved Posts */}
                        {isAuthenticated && (
                            <div style={{ ...glass, padding: '20px', marginBottom: '20px' }}>
                                <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: '14px', color: '#e0e0e0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaBookmark size={13} style={{ color: '#f59e0b' }} /> Saved Posts
                                </h3>

                                {savedLoading ? (
                                    <div style={{ color: '#6b7280', fontSize: '0.84rem' }}>Loading saved posts...</div>
                                ) : safeSavedThreads.length === 0 ? (
                                    <div style={{ color: '#6b7280', fontSize: '0.84rem' }}>No saved posts yet.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {safeSavedThreads.map((thread) => (
                                            <div
                                                key={thread._id}
                                                style={{
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '10px',
                                                    padding: '10px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => openThreadDetail(thread._id)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4 }}>
                                                            {thread.title || 'Untitled Thread'}
                                                        </div>
                                                        <div style={{ color: '#6b7280', fontSize: '0.74rem', marginTop: '4px' }}>
                                                            {relativeTime(thread.createdAt)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleSave(thread._id);
                                                        }}
                                                        style={{
                                                            border: 'none',
                                                            background: 'rgba(245,158,11,0.15)',
                                                            color: '#f59e0b',
                                                            borderRadius: '8px',
                                                            padding: '6px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        title="Remove from saved posts"
                                                    >
                                                        <FaBookmark size={11} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Suggested Coders */}
                        {isAuthenticated && (
                            <div style={{ ...glass, padding: '20px', marginBottom: '20px' }}>
                                <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: '14px', color: '#e0e0e0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaUsers size={13} style={{ color: '#60a5fa' }} /> Suggested Coders
                                </h3>

                                {suggestedLoading ? (
                                    <div style={{ color: '#6b7280', fontSize: '0.84rem' }}>Loading suggestions...</div>
                                ) : suggestedUsers.length === 0 ? (
                                    <div style={{ color: '#6b7280', fontSize: '0.84rem' }}>No suggestions right now.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {suggestedUsers.slice(0, 6).map((entry) => {
                                            const uid = String(entry?._id || '');
                                            const isSelf = uid && uid === currentUserId;
                                            return (
                                                <div
                                                    key={uid || entry?.username}
                                                    style={{
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '10px',
                                                        padding: '10px',
                                                        background: 'rgba(255,255,255,0.02)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                                        <Link
                                                            to={`/profile/${entry?.username || ''}`}
                                                            style={{ textDecoration: 'none', color: 'inherit', minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        >
                                                            <img
                                                                src={getAvatarUrl(entry?.avatar, entry?.username, 40)}
                                                                onError={(e) => handleAvatarImageError(e, entry?.avatar, entry?.username, 40)}
                                                                alt=""
                                                                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(96,165,250,0.35)' }}
                                                            />
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {entry?.username || 'Unknown'}
                                                                </div>
                                                                <div style={{ color: '#6b7280', fontSize: '0.72rem' }}>
                                                                    {Number(entry?.problemsSolved || 0)} solved
                                                                </div>
                                                            </div>
                                                        </Link>

                                                        <FollowButton
                                                            targetUserId={uid}
                                                            isSelf={isSelf}
                                                            initialFollowing={Boolean(followMap[uid] ?? entry?.isFollowing)}
                                                            size="sm"
                                                            onStateChange={(nextState) => handleAuthorFollowStateChange(uid, nextState)}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Trending Tags */}
                        <div style={{ ...glass, padding: '24px', marginBottom: '20px' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: '16px', color: '#e0e0e0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaHashtag size={13} style={{ color: '#60a5fa' }} /> Trending Tags
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['DP', 'Graphs', 'Google', 'Amazon', 'System Design', 'Interview', 'Arrays', 'Trees'].map(t => (
                                    <motion.span
                                        key={t}
                                        whileHover={{ scale: 1.05, background: 'rgba(96,165,250,0.12)' }}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: '20px',
                                            fontSize: '0.82rem', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}
                                    >
                                        #{t}
                                    </motion.span>
                                ))}
                            </div>
                        </div>

                        {/* Community Stats */}
                        <div style={{
                            ...glass,
                            padding: '24px', marginBottom: '20px',
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))',
                            border: '1px solid rgba(96,165,250,0.1)'
                        }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: '16px', color: '#e0e0e0', fontWeight: 600 }}>ðŸ“Š Community Stats</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.88rem' }}>
                                    <span>Total Threads</span>
                                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{safeThreads.length}+</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.88rem' }}>
                                    <span>Active Categories</span>
                                    <span style={{ color: '#a78bfa', fontWeight: 600 }}>{CATEGORIES.length - 1}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rules */}
                        <div style={{ ...glass, padding: '24px' }}>
                            <h3 style={{ marginTop: 0, fontSize: '1.05rem', marginBottom: '12px', color: '#e0e0e0', fontWeight: 600 }}>ðŸ“œ Community Rules</h3>
                            <ul style={{ margin: 0, paddingLeft: '16px', color: '#6b7280', fontSize: '0.82rem', lineHeight: 1.8 }}>
                                <li>Be respectful and constructive</li>
                                <li>No spam or self-promotion</li>
                                <li>Use appropriate categories</li>
                                <li>No sharing of solutions during contests</li>
                                <li>Report inappropriate content</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <CreateThreadModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        isAuthenticated={isAuthenticated}
                        onSuccess={async () => {
                            await fetchThreads(1, true);
                            await fetchYourThreads(1, true, true);
                        }}
                    />
                )}
                {reportData.isOpen && (
                    <ReportModal
                        isOpen={reportData.isOpen}
                        onClose={() => setReportData({ ...reportData, isOpen: false })}
                        contentId={reportData.contentId}
                        contentType={reportData.contentType}
                        reportedUserId={reportData.reportedUserId}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Community;

