import React, { useEffect, useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('krama-theme');
        return saved ? saved === 'dark' : true; // default dark
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.setAttribute('data-theme', 'dark');
            localStorage.setItem('krama-theme', 'dark');
        } else {
            root.setAttribute('data-theme', 'light');
            localStorage.setItem('krama-theme', 'light');
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(prev => !prev)}
            aria-label="Toggle theme"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: isDark ? '#fbbf24' : '#6366f1',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                fontSize: '1rem',
                flexShrink: 0
            }}
        >
            <span style={{
                display: 'inline-flex',
                transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)'
            }}>
                {isDark ? <FaMoon size={15} /> : <FaSun size={15} />}
            </span>
        </button>
    );
};

export default ThemeToggle;
