import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const SIZE_STYLE = {
    sm: { height: 32, padding: '0 12px', fontSize: '0.78rem', borderRadius: 10 },
    md: { height: 40, padding: '0 16px', fontSize: '0.86rem', borderRadius: 12 },
    lg: { height: 44, padding: '0 18px', fontSize: '0.9rem', borderRadius: 12 }
};

const FollowButton = ({
    targetUserId,
    isSelf = false,
    initialFollowing = false,
    size = 'md',
    style = {},
    disabled = false,
    onStateChange
}) => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const [isFollowing, setIsFollowing] = useState(Boolean(initialFollowing));
    const [isBusy, setIsBusy] = useState(false);

    useEffect(() => {
        setIsFollowing(Boolean(initialFollowing));
    }, [initialFollowing, targetUserId]);

    const buttonStyle = useMemo(() => {
        const base = SIZE_STYLE[size] || SIZE_STYLE.md;
        const followingStyle = isFollowing
            ? {
                background: 'rgba(96,165,250,0.14)',
                border: '1px solid rgba(96,165,250,0.45)',
                color: '#93c5fd'
            }
            : {
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: '1px solid rgba(96,165,250,0.35)',
                color: '#f8fafc'
            };

        return {
            ...base,
            ...followingStyle,
            minWidth: base.height + 26,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: isBusy || disabled ? 'not-allowed' : 'pointer',
            opacity: isBusy || disabled ? 0.65 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            ...style
        };
    }, [size, isFollowing, isBusy, disabled, style]);

    const handleToggleFollow = async () => {
        if (!targetUserId || isSelf || isBusy || disabled) return;

        if (!isAuthenticated) {
            toast.error('Please login to follow users');
            navigate('/login');
            return;
        }

        setIsBusy(true);
        try {
            if (isFollowing) {
                await api.post('/unfollow', { followingId: targetUserId });
                setIsFollowing(false);
                if (typeof onStateChange === 'function') onStateChange(false);
            } else {
                await api.post('/follow', { followingId: targetUserId });
                setIsFollowing(true);
                if (typeof onStateChange === 'function') onStateChange(true);
            }
        } catch (error) {
            const message = error?.response?.data?.message || 'Unable to update follow state';
            toast.error(message);
        } finally {
            setIsBusy(false);
        }
    };

    if (!targetUserId || isSelf) return null;

    return (
        <button
            type="button"
            style={buttonStyle}
            onClick={handleToggleFollow}
            disabled={isBusy || disabled}
            aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
        >
            {isBusy ? '...' : (isFollowing ? 'Following ✓' : 'Follow')}
        </button>
    );
};

export default FollowButton;
