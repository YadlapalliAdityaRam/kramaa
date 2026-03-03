import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, setCode, language, theme = 'vs-dark', readOnly = false }) => {
    const [isMobileViewport, setIsMobileViewport] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    ));

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const onResize = () => setIsMobileViewport(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
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

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', borderRadius: '8px', backgroundColor: '#1e1e1e' }}>
            <Editor
                height="100%"
                width="100%"
                loading={<div style={{ color: 'white' }}>Loading Editor...</div>}
                language={getMonacoLanguage(language)}
                value={code}
                theme={theme}
                onChange={handleEditorChange}
                options={{
                    readOnly: readOnly,
                    fontSize: isMobileViewport ? 13 : 14,
                    fontFamily: "'Fira Code', 'Fira Mono', monospace",
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
