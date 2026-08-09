import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, setCode, language, theme, readOnly = false }) => {
    const [isMobileViewport, setIsMobileViewport] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    ));

    const [isLightMode, setIsLightMode] = useState(() => {
        if (typeof document === 'undefined') return false;
        return document.documentElement.getAttribute('data-theme') === 'light';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const onResize = () => setIsMobileViewport(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);

        // Observer for data-theme changes on document.documentElement
        const observer = new MutationObserver(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setIsLightMode(currentTheme === 'light');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => {
            window.removeEventListener('resize', onResize);
            observer.disconnect();
        };
    }, []);

    const getMonacoLanguage = (lang) => {
        switch (lang) {
            case 'c': return 'c';
            case 'cpp': return 'cpp';
            case 'python': return 'python';
            case 'java': return 'java';
            case 'javascript': return 'javascript';
            default: return 'javascript';
        }
    };

    const handleEditorChange = (value) => {
        if (!readOnly) {
            setCode(value || '');
        }
    };

    // Determine effective monaco theme
    const effectiveTheme = theme ? (theme === 'vs-dark' && isLightMode ? 'vs' : theme) : (isLightMode ? 'vs' : 'vs-dark');

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            borderRadius: '8px',
            backgroundColor: isLightMode ? '#ffffff' : '#0d1117',
            border: '1px solid var(--ws-border, rgba(255, 255, 255, 0.1))'
        }}>
            <Editor
                height="100%"
                width="100%"
                loading={<div style={{ color: 'var(--ws-text, #ffffff)', padding: '20px' }}>Loading Editor...</div>}
                language={getMonacoLanguage(language)}
                value={code}
                theme={effectiveTheme}
                onChange={handleEditorChange}
                options={{
                    readOnly: readOnly,
                    fontSize: isMobileViewport ? 13 : 14,
                    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    formatOnType: true,
                    formatOnPaste: true,
                    wordWrap: isMobileViewport ? 'on' : 'off',
                    lineNumbersMinChars: isMobileViewport ? 3 : 5,
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    acceptSuggestionOnEnter: 'smart',
                    suggestOnTriggerCharacters: true,
                }}
            />
        </div>
    );
};

export default CodeEditor;
