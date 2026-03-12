import React, { useEffect, useState } from 'react';
import CodeViewer from './CodeViewer';

const DualView = ({ children, code, activeLine, algorithmName, description, activeLanguage, onLanguageChange }) => {
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 1024 : false
    ));

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return (
        <div
            className="visualizer-ui theatre-mode"
            style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '12px' : '18px',
                minHeight: isMobile ? 'auto' : 'calc(100vh - var(--nav-height) - 32px)',
                padding: isMobile ? '12px' : '20px 22px',
                overflowY: 'auto'
            }}
        >
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
                <div
                    className="glass-panel theatre-stage"
                    style={{
                        flex: 1,
                        padding: isMobile ? '14px' : '20px 22px',
                        borderRadius: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
                        <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{algorithmName}</h2>
                    </div>

                    <div
                        style={{
                            background: 'var(--viz-card-bg, #222222)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '8px 14px',
                            borderRadius: '12px',
                            fontSize: isMobile ? '0.84rem' : '0.9rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '12px',
                            flexShrink: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {description || 'Ready to start'}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: isMobile ? '240px' : '350px' }}>
                        {children}
                    </div>
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    minWidth: isMobile ? 0 : '300px',
                    maxWidth: isMobile ? '100%' : '380px'
                }}
            >
                <CodeViewer
                    code={code}
                    activeLine={activeLine}
                    activeLanguage={activeLanguage}
                    onLanguageChange={onLanguageChange}
                />
            </div>
        </div>
    );
};

export default DualView;
