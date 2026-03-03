import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SHOW_DELAY_MS = 300;
const ROUTE_SETTLE_MS = 220;
const HIDE_AFTER_COMPLETE_MS = 200;

const readReducedMotion = () => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const TopProgressBar = () => {
    const location = useLocation();
    const [routeBusy, setRouteBusy] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(readReducedMotion);
    const showDelayRef = useRef(null);
    const progressTimerRef = useRef(null);
    const hideTimerRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');

        const onChange = (event) => {
            setReducedMotion(Boolean(event.matches));
        };

        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', onChange);
            return () => media.removeEventListener('change', onChange);
        }

        media.addListener(onChange);
        return () => media.removeListener(onChange);
    }, []);

    useEffect(() => {
        setRouteBusy(true);
        const settleTimer = setTimeout(() => setRouteBusy(false), ROUTE_SETTLE_MS);
        return () => clearTimeout(settleTimer);
    }, [location.pathname, location.search]);

    useEffect(() => {
        const onStart = () => {
            setActiveRequests((value) => value + 1);
        };

        const onEnd = () => {
            setActiveRequests((value) => Math.max(0, value - 1));
        };

        window.addEventListener('krama:loading:start', onStart);
        window.addEventListener('krama:loading:end', onEnd);
        return () => {
            window.removeEventListener('krama:loading:start', onStart);
            window.removeEventListener('krama:loading:end', onEnd);
        };
    }, []);

    const busy = useMemo(() => routeBusy || activeRequests > 0, [routeBusy, activeRequests]);

    useEffect(() => {
        clearTimeout(showDelayRef.current);
        clearInterval(progressTimerRef.current);
        clearTimeout(hideTimerRef.current);

        if (busy) {
            if (!visible) {
                showDelayRef.current = setTimeout(() => {
                    setVisible(true);
                    setProgress(8);
                }, SHOW_DELAY_MS);
                return undefined;
            }

            progressTimerRef.current = setInterval(() => {
                setProgress((value) => {
                    if (value >= 80) return value;
                    const remaining = 80 - value;
                    const delta = reducedMotion
                        ? Math.max(5, remaining * 0.42)
                        : Math.max(1.2, remaining * 0.18);
                    return Math.min(80, value + delta);
                });
            }, reducedMotion ? 230 : 120);
            return undefined;
        }

        if (!visible) {
            setProgress(0);
            return undefined;
        }

        setProgress(100);
        hideTimerRef.current = setTimeout(() => {
            setVisible(false);
            setProgress(0);
        }, reducedMotion ? 110 : HIDE_AFTER_COMPLETE_MS);

        return undefined;
    }, [busy, visible, reducedMotion]);

    useEffect(() => () => {
        clearTimeout(showDelayRef.current);
        clearInterval(progressTimerRef.current);
        clearTimeout(hideTimerRef.current);
    }, []);

    if (!visible) return null;
    const tipPosition = Math.max(2, Math.min(100, progress));

    return (
        <div className="top-progress-root pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]">
            <div
                className="top-progress-bar h-full rounded-r-sm transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
            >
                <span className="top-progress-sheen block h-full w-14" />
            </div>
            {!reducedMotion && (
                <span className="top-progress-tip" style={{ left: `calc(${tipPosition}% - 6px)` }} />
            )}
        </div>
    );
};

export default TopProgressBar;
