import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './GridCanvas.css';

const GridCanvas = ({ array, currentIndices = [], compareIndices = [], sortedIndices = [], type = 'grid' }) => {
    // For arrays that represent a 2D N x N grid (like N-Queens, Rat in Maze)
    // N is the square root of the array length
    const n = Math.floor(Math.sqrt(array.length));
    const isSquareGrid = n * n === array.length;

    // For Sieve or others, it might just be a 1D number grid
    // If it's a square grid, columns = n. Otherwise we make it a wrapped flex/grid.
    const cols = isSquareGrid ? n : Math.ceil(Math.sqrt(array.length) * 1.5);

    return (
        <div className="grid-canvas">
            <div
                className="grid-container"
                style={{
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    maxWidth: isSquareGrid ? '500px' : '100%'
                }}
            >
                <AnimatePresence>
                    {array.map((value, idx) => {
                        let stateClass = 'grid-cell-default';

                        // Heuristic: If it's N-Queens / Rat in Maze, 90 = queen/path, 10 = empty
                        // If it's Subset Sum or Sieve, values might be different
                        let cellContent = value;
                        let isHighlighted = false;

                        if (value === 90) {
                            stateClass = 'grid-cell-active-path'; // e.g. Queen or Path
                            cellContent = '♕';
                        } else if (value === 10 || value === 0) {
                            stateClass = 'grid-cell-empty';
                            cellContent = '';
                        } else if (value === 2) {
                            stateClass = 'grid-cell-crossed'; // Sieve non-prime
                            cellContent = '✗';
                        } else if (value > 2) {
                            // Sieve prime candidate - we put the actual number? 
                            // Wait, the sieve generator sends i * 3 + 5. I should change the sieve generator to just send 'i'.
                            cellContent = value;
                        }

                        if (sortedIndices.includes(idx)) {
                            stateClass = 'grid-cell-completed'; // Green
                        } else if (currentIndices.includes(idx)) {
                            stateClass = 'grid-cell-current'; // Yellow/Purple
                        } else if (compareIndices.includes(idx)) {
                            stateClass = 'grid-cell-compare'; // Cyan
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
