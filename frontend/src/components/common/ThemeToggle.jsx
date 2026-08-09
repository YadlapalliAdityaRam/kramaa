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
            aria-pressed={!isDark}
            className="theme-toggle"
            title={isDark ? 'Use light theme' : 'Use dark theme'}
        >
            <span className={`theme-toggle-icon ${isDark ? '' : 'is-light'}`}>
                {isDark ? <FaMoon size={15} /> : <FaSun size={15} />}
            </span>
        </button>
    );
};

export default ThemeToggle;
