import React from 'react';
import { motion } from 'framer-motion';

const LANGUAGES = [
    { id: 'javascript', label: 'JS' },
    { id: 'python', label: 'PY' },
    { id: 'cpp', label: 'C++' },
    { id: 'java', label: 'JAVA' }
];

const CodeViewer = ({ code = "", activeLine, activeLanguage = 'javascript', onLanguageChange }) => {
    // Basic syntax highlighting logic (can be expanded)
    const lines = (code || "").split('\n');

    return (
        <div className="glass-panel" style={{
            padding: '18px',
            borderRadius: '16px',
            fontFamily: 'monospace',
            fontSize: '0.92rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--viz-panel-bg, #171717)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.28)'
        }}>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'var(--viz-card-bg, #1e1e1e)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => onLanguageChange && onLanguageChange(lang.id)}
                            style={{
                                background: activeLanguage === lang.id ? '#2563eb' : 'var(--viz-card-bg, #1e1e1e)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: activeLanguage === lang.id ? '#ffffff' : 'var(--text-primary)',
                                padding: '0 14px',
                                minHeight: '38px',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                fontWeight: activeLanguage === lang.id ? '700' : '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                outline: 'none'
                            }}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#ff5f56', borderRadius: '50%' }}></div>
                    <div style={{ width: '10px', height: '10px', background: '#ffbd2e', borderRadius: '50%' }}></div>
                    <div style={{ width: '10px', height: '10px', background: '#27c93f', borderRadius: '50%' }}></div>
                </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                {lines.map((line, index) => {
                    const isActive = activeLine === index + 1; // 1-based index from step generator
                    return (
                        <motion.div
                            key={index}
                            initial={false}
                            animate={{
                                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent'
                            }}
                            style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'flex',
                                gap: '16px'
                            }}
                        >
                            <span style={{ color: 'var(--text-muted)', minWidth: '24px', textAlign: 'right', userSelect: 'none', fontWeight: 600 }}>{index + 1}</span>
                            <code style={{ color: isActive ? '#ffffff' : 'var(--text-primary)' }}>{line}</code>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default CodeViewer;
