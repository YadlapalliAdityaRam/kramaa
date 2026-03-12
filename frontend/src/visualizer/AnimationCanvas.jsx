import React from 'react';
import { motion } from 'framer-motion';
import './AnimationCanvas.css';

const AnimationCanvas = ({ array, currentIndices = [], compareIndices = [], sortedIndices = [] }) => {
    // Ensure inputs are arrays (fallback for single-index emitters)
    const current = Array.isArray(currentIndices) ? currentIndices : [currentIndices];
    const compare = Array.isArray(compareIndices) ? compareIndices : [compareIndices];
    const sorted = Array.isArray(sortedIndices) ? sortedIndices : [sortedIndices];

    // Calculate max value for height scaling
    const maxValue = Math.max(...array, 1);

    return (
        <div className="animation-canvas">
            <div className="bars-container">
                {array.map((value, idx) => {
                    // Determine bar state
                    let stateClass = '';
                    let backgroundColor = 'var(--bar-unsorted)';

                    if (sorted.includes(idx)) {
                        backgroundColor = 'var(--bar-sorted)'; // Green (Strictly Sorted)
                        stateClass = 'element-complete';
                    } else if (current.includes(idx)) { // Swapping/Active
                        backgroundColor = 'var(--bar-swapping)'; // Purple (Swap)
                        stateClass = 'element-active';
                    } else if (compare.includes(idx)) { // Comparing
                        stateClass = 'element-active';

                        // Strict 2-color comparison rule
                        if (compare[0] === idx) {
                            backgroundColor = 'var(--bar-compare-1)'; // Cyan
                        } else if (compare[1] === idx) {
                            backgroundColor = 'var(--bar-compare-2)'; // Pink
                        } else {
                            backgroundColor = 'var(--bar-compare-1)'; // Fallback
                        }
                    }

                    // Dynamic height calculation
                    const height = `${(value / maxValue) * 100}%`;

                    return (
                        <motion.div
                            key={idx}
                            layout
                            className={`array-bar ${stateClass}`}
                            style={{
                                height,
                                backgroundColor
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <span className="bar-value">{value}</span>
                            {(current.includes(idx) || compare.includes(idx)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bar-pointer"
                                >
                                    ↓
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnimationCanvas;
