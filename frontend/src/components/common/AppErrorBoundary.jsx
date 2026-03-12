import React from 'react';
import { Link } from 'react-router-dom';

class AppErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMessage: '' };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            errorMessage: error?.message || 'Unexpected UI error'
        };
    }

    componentDidCatch(error, info) {
        // Keep the full stack in console for production debugging.
        // eslint-disable-next-line no-console
        console.error('UI crash captured by AppErrorBoundary:', error, info);
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const showDebug = String(import.meta.env.MODE || '').toLowerCase() !== 'production';
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px'
            }}>
                <div style={{
                    maxWidth: '640px',
                    width: '100%',
                    border: '1px solid rgba(248,113,113,0.35)',
                    borderRadius: '14px',
                    background: 'rgba(15,23,42,0.92)',
                    padding: '20px'
                }}>
                    <h2 style={{ margin: 0, color: '#fecaca', fontSize: '1.15rem' }}>Page crashed unexpectedly</h2>
                    <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginTop: '8px' }}>
                        This page hit a runtime error. Reload to retry. If it keeps happening, share the console error and route with admin.
                    </p>
                    {showDebug && (
                        <pre style={{
                            marginTop: '10px',
                            padding: '10px',
                            borderRadius: '10px',
                            background: 'rgba(2,6,23,0.75)',
                            border: '1px solid rgba(148,163,184,0.25)',
                            color: '#fca5a5',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {this.state.errorMessage}
                        </pre>
                    )}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            style={{
                                border: 'none',
                                borderRadius: '10px',
                                background: '#2563eb',
                                color: '#fff',
                                padding: '10px 14px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Reload
                        </button>
                        <Link
                            to="/"
                            style={{
                                textDecoration: 'none',
                                borderRadius: '10px',
                                background: 'rgba(148,163,184,0.2)',
                                color: '#e2e8f0',
                                padding: '10px 14px',
                                fontWeight: 700
                            }}
                        >
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}

export default AppErrorBoundary;
