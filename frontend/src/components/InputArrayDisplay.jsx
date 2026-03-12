import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InputArrayDisplay = ({ arraySnapshot, activeArrayIndex }) => {
    if (!arraySnapshot || arraySnapshot.length === 0) return null;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <AnimatePresence>
                {arraySnapshot.map((val, idx) => {
                    const isHighlighted = Array.isArray(activeArrayIndex)
                        ? activeArrayIndex.includes(idx)
                        : activeArrayIndex === idx;

                    // Simple processing logic based on the max highlight so far (fallback mostly for single index traversals)
                    const maxActive = Array.isArray(activeArrayIndex) ? Math.max(...activeArrayIndex) : activeArrayIndex;
                    const isProcessing = maxActive !== -1 && idx > maxActive;
                    return (
                        <motion.div
                            key={`${idx}-${val}`}
                            style={{ textAlign: 'center' }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{
                                border: isHighlighted ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                background: isHighlighted ? 'rgba(239, 68, 68, 0.2)' : (isProcessing ? 'rgba(15,23,42,0.4)' : 'rgba(30,41,59,0.5)'),
                                color: isHighlighted ? '#fff' : (isProcessing ? '#64748b' : '#cbd5e1'),
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                minWidth: '40px',
                                transition: 'all 0.3s ease'
                            }}>
                                {val}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', fontWeight: isHighlighted ? 'bold' : 'normal' }}>
                                {idx}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default InputArrayDisplay;
