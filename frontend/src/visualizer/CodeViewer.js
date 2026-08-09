import React from 'react';

const languages = [
    { id: 'javascript', label: 'JS' },
    { id: 'python', label: 'PY' },
    { id: 'cpp', label: 'C++' },
    { id: 'java', label: 'JAVA' }
];

const CodeViewer = ({ code = '', activeLine, activeLanguage = 'javascript', onLanguageChange }) => {
    const lines = (code || '// A reference implementation is not available for this language yet.').split('\n');

    return (
        <section className="visualizer-code-panel">
            <header className="visualizer-code-header">
                <p>Reference code</p>
                <div className="visualizer-language-tabs" role="tablist" aria-label="Code language">
                    {languages.map((language) => (
                        <button
                            key={language.id}
                            type="button"
                            role="tab"
                            aria-selected={activeLanguage === language.id}
                            onClick={() => onLanguageChange?.(language.id)}
                            className={activeLanguage === language.id ? 'is-active' : undefined}
                        >
                            {language.label}
                        </button>
                    ))}
                </div>
            </header>
            <div className="visualizer-code-scroll" tabIndex="0" aria-label="Algorithm source code">
                {lines.map((line, index) => {
                    const isActive = activeLine === index + 1;
                    return (
                        <div key={`${index}-${line}`} className={`visualizer-code-line${isActive ? ' is-active' : ''}`}>
                            <span aria-hidden="true">{index + 1}</span>
                            <code>{line || ' '}</code>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default CodeViewer;
