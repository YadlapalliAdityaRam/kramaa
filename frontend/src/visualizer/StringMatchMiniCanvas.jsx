import React from 'react';
import { motion } from 'framer-motion';
import './BoyerMooreVisualizer.css'; // Reuse CSS

const StringMatchMiniCanvas = ({ textData = [], target = '', currentStep = {} }) => {
    const text = Array.isArray(textData) ? textData.join('') : String(textData || '');
    const pattern = String(target || '');
    const shiftAmount = currentStep?.shiftIndex || 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', height: '100%', overflowY: 'auto' }}>
            {/* Text Row */}
            <div className="bm-row bm-text-row" style={{ flexWrap: 'wrap', marginBottom: '8px' }}>
                <div className="bm-row-label" style={{ fontSize: '0.8rem', padding: '4px' }}>Text</div>
                <div className="bm-boxes" style={{ flexWrap: 'wrap', gap: '4px' }}>
                    {text.split('').map((char, index) => {
                        let stateClass = '';
                        if (currentStep?.textIndex === index) {
                            if (currentStep?.type === 'compare') stateClass = 'bm-comparing';
                            else if (currentStep?.type === 'match') stateClass = 'bm-matched';
                            else if (currentStep?.type === 'mismatch') stateClass = 'bm-mismatched';
                        }
                        if (currentStep?.matches?.some(startIdx => index >= startIdx && index < startIdx + pattern.length)) {
                            stateClass = 'bm-fully-matched';
                        }

                        return (
                            <div key={`text-${index}`} className={`bm-box ${stateClass}`} style={{ width: '28px', height: '28px', fontSize: '1rem' }}>
                                {char}
                                <div className="bm-index" style={{ fontSize: '0.6rem' }}>{index}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pattern Row */}
            <div className="bm-row bm-pattern-row" style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '8px' }}>
                <div className="bm-row-label" style={{ fontSize: '0.8rem', padding: '4px' }}>Pattern</div>
                <div className="bm-boxes bm-pattern-container" style={{ gap: '4px' }}>
                    {Array(shiftAmount).fill(0).map((_, i) => (
                        <div key={`spacer-${i}`} className="bm-box bm-spacer" style={{ width: '28px', height: '28px' }}></div>
                    ))}
                    {pattern.split('').map((char, index) => {
                        let stateClass = '';
                        if (currentStep?.patternIndex === index) {
                            if (currentStep?.type === 'compare') stateClass = 'bm-comparing';
                            else if (currentStep?.type === 'match') stateClass = 'bm-matched';
                            else if (currentStep?.type === 'mismatch' || currentStep?.type === 'shift-calc') stateClass = 'bm-mismatched';
                        }
                        if (currentStep?.foundAt === shiftAmount) {
                            stateClass = 'bm-fully-matched';
                        }
                        return (
                            <motion.div
                                layout
                                key={`pat-${index}`}
                                className={`bm-box bm-pattern-box ${stateClass}`}
                                style={{ width: '28px', height: '28px', fontSize: '1rem' }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                {char}
                                <div className="bm-index" style={{ fontSize: '0.6rem' }}>{index}</div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            {/* Rolling Hashes (for Rabin-Karp) */}
            {currentStep?.hashes && (
                <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    borderLeft: '4px solid var(--accent-primary)'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--accent-primary)' }}>Rolling Hashes:</div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div>Pattern Hash: <span style={{ fontFamily: 'monospace', color: '#6fbfff' }}>{currentStep.hashes.pattern}</span></div>
                        <div>Window Hash: <span style={{ fontFamily: 'monospace', color: currentStep.hashes.window === currentStep.hashes.pattern ? '#4ade80' : '#ffa5a5' }}>
                            {currentStep.hashes.window}
                        </span></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StringMatchMiniCanvas;
