import React from 'react';
import { motion } from 'framer-motion';
import './AnimationCanvas.css';

const AnimationCanvas = ({ array, currentIndices, compareIndices, sortedIndices }) => {
    // Calculate max value for height scaling
    const maxValue = Math.max(...array, 1);

    return (
        <div className="animation-canvas">
            <div className="bars-container">
                {array.map((value, idx) => {
                    // Determine bar state
                    let stateClass = '';
                    let backgroundColor = 'var(--bar-unsorted)';

                    if (sortedIndices.includes(idx)) {
                        backgroundColor = 'var(--bar-sorted)'; // Green (Strictly Sorted)
                        stateClass = 'element-complete';
                    } else if (currentIndices.includes(idx)) { // Swapping/Active
                        backgroundColor = 'var(--bar-swapping)'; // Purple (Swap)
                        stateClass = 'element-active';
                    } else if (compareIndices.includes(idx)) { // Comparing
                        stateClass = 'element-active';

                        // Strict 2-color comparison rule
                        if (compareIndices[0] === idx) {
                            backgroundColor = 'var(--bar-compare-1)'; // Cyan
                        } else if (compareIndices[1] === idx) {
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
                            {(currentIndices.includes(idx) || compareIndices.includes(idx)) && (
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
