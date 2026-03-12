import { useEffect, useState } from 'react';

const FADE_OUT_MS = 280;

const LoaderOverlay = ({ visible = true, message = 'Preparing workspace' }) => {
    const [mounted, setMounted] = useState(visible);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            return undefined;
        }

        const timer = setTimeout(() => setMounted(false), FADE_OUT_MS);
        return () => clearTimeout(timer);
    }, [visible]);

    if (!mounted) return null;

    return (
        <div
            className={`loader-overlay fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            role="status"
            aria-live="polite"
            aria-label={message}
        >
            <div className="loader-overlay-glow pointer-events-none absolute inset-0" />
            <div className="loader-overlay-grid pointer-events-none absolute inset-0" />
            <div className="loader-overlay-vignette pointer-events-none absolute inset-0" />

            <div className="loader-overlay-panel relative z-10 flex flex-col items-center gap-5 px-8 py-7">
                <div className="relative grid h-24 w-24 place-items-center">
                    <div
                        className="loader-ring-spin absolute inset-0 rounded-full border-[1.5px]"
                        style={{ borderColor: 'var(--loader-ring-outer)', borderTopColor: 'var(--loader-ring-outer-accent)' }}
                    />
                    <div
                        className="loader-ring-spin loader-ring-reverse absolute inset-[8px] rounded-full border-[1.5px]"
                        style={{ borderColor: 'var(--loader-ring-inner)', borderRightColor: 'var(--loader-ring-inner-accent)' }}
                    />
                    <div
                        className="loader-ring-spin loader-ring-ambient absolute inset-[17px] rounded-full border"
                        style={{ borderColor: 'var(--loader-ring-ambient)', borderBottomColor: 'var(--loader-ring-ambient-accent)' }}
                    />
                    <div className="loader-logo-pulse text-[1.75rem] font-extrabold tracking-tight" style={{ color: 'var(--loader-logo-color)' }}>
                        K
                    </div>
                </div>

                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em]" style={{ color: 'var(--loader-accent-color)' }}>
                    Kramaa
                </p>
                <p className="text-xs font-medium tracking-[0.12em]" style={{ color: 'var(--loader-message-color)' }}>
                    {message}
                </p>

                <div className="loader-progress-track h-[4px] w-52 overflow-hidden rounded-full">
                    <div className="loader-progress-fill h-full w-full rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default LoaderOverlay;
