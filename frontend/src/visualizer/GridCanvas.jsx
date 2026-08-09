import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './GridCanvas.css';

const GridCanvas = ({ array = [], currentIndices = [], compareIndices = [], sortedIndices = [], type = 'grid' }) => {
    // For 2D N x N grid (like N-Queens, Rat in a Maze)
    const n = Math.floor(Math.sqrt(array.length));
    const isSquareGrid = n * n === array.length && array.length > 0;
    const cols = isSquareGrid ? n : Math.ceil(Math.sqrt(array.length || 1) * 1.5);

    return (
        <div className="grid-canvas">
            <div
                className="grid-container"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    maxWidth: isSquareGrid ? `${Math.min(n * 48, 320)}px` : '100%'
                }}
            >
                <AnimatePresence>
                    {array.map((value, idx) => {
                        let stateClass = 'grid-cell-default';
                        let cellContent = value;

                        const row = isSquareGrid ? Math.floor(idx / n) : 0;
                        const col = isSquareGrid ? idx % n : idx;
                        const isDarkSquare = isSquareGrid && (row + col) % 2 === 1;

                        // 90 = dynamic queen/path, 95 = fixed queen
                        if (value === 90 || value === 95) {
                            stateClass = 'grid-cell-active-path';
                            cellContent = '♕';
                        } else if (value === 10 || value === 0) {
                            stateClass = isDarkSquare ? 'grid-cell-dark' : 'grid-cell-empty';
                            cellContent = '';
                        } else if (value === 2) {
                            stateClass = 'grid-cell-crossed';
                            cellContent = '✗';
                        } else if (value === 1) {
                            stateClass = 'grid-cell-wall';
                            cellContent = '⬛';
                        }

                        if (sortedIndices.includes(idx)) {
                            stateClass = 'grid-cell-completed';
                        } else if (currentIndices.includes(idx)) {
                            stateClass = 'grid-cell-current';
                        } else if (compareIndices.includes(idx)) {
                            stateClass = 'grid-cell-compare';
                        }

                        return (
                            <motion.div
                                key={idx}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`grid-cell ${stateClass}`}
                            >
                                <span className="grid-cell-value">{cellContent}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GridCanvas;
