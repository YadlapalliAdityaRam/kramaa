import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateQuickSortSteps } from "../algorithms/sorting/quickSort";
import { algorithmCodes } from "../data/algorithmCodes";
import "./QuickSortVisualizer.css";

const QuickSortVisualizer = () => {
    const [array, setArray] = useState([45, 23, 89, 12, 56, 34, 78, 9, 67, 30]);
    const [inputValue, setInputValue] = useState("");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateQuickSortSteps(array), [array]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        speed,
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { type, indices, pivotIndex, pointers, range, description, arraySnapshot } = stepData;

    const handleGenerateArray = () => {
        const newArray = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
        setArray(newArray);
        reset();
    };

    const handleCustomArray = () => {
        const custom = inputValue.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (custom.length > 0) {
            setArray(custom.slice(0, 15)); // Limit to 15 for better UI
            reset();
        }
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'select-pivot': return 2;
            case 'compare': return 16;
            case 'swap': return 29;
            case 'place-pivot': return 41;
            case 'sorted': return 49;
            case 'completed': return 72;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.quickSort?.[activeLanguage] || "";

    // Helper to calculate partition line position
    const getPartitionStyles = () => {
        if (!range) return { display: 'none' };
        const elementWidth = 62; // 50px + 12px gap
        return {
            left: `${range.low * elementWidth}px`,
            width: `${(range.high - range.low + 1) * elementWidth - 12}px`
        };
    };

    return (
        <DualView
            algorithmName="Quick Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Click Play to start partitioning the array."}
        >
            <div className="visualizer-container quick-sort">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Pivot Value</div>
                        <div className="stat-value">{pivotIndex !== undefined ? arraySnapshot[pivotIndex] : '-'}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Current Range</div>
                        <div className="stat-value">
                            {range ? `[${range.low}, ${range.high}]` : 'Completed'}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Step Type</div>
                        <div className="stat-value" style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                            {type?.replace('-', ' ') || 'Idle'}
                        </div>
                    </div>
                </div>

                <div className="sorting-area">
                    <div className="array-container" style={{ position: 'relative' }}>
                        <AnimatePresence>
                            {arraySnapshot?.map((val, idx) => {
                                const isPivot = pivotIndex === idx;
                                const isComparing = indices?.includes(idx) && type === 'compare';
                                const isSwapping = indices?.includes(idx) && type === 'swap';
                                const isInactive = range && (idx < range.low || idx > range.high);

                                // Simplified "Sorted" detection for UI
                                // Usually quicksort marks pivot as sorted after place-pivot
                                const isSortedMark = type === 'sorted' && indices?.includes(idx);

                                return (
                                    <motion.div
                                        key={`${idx}-${val}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{
                                            opacity: isInactive ? 0.2 : 1,
                                            height: 50 + (val * 1.5) // Adjust height based on value
                                        }}
                                        className={`sort-element 
                                            ${isPivot ? 'pivot' : ''} 
                                            ${isComparing ? 'comparing' : ''}
                                            ${isSwapping ? 'swapping' : ''}
                                            ${isSortedMark ? 'sorted' : ''}
                                            ${isInactive ? 'inactive' : ''}
                                        `}
                                    >
                                        {val}

                                        {/* Pivot Marker */}
                                        {isPivot && <div className="marker marker-pivot">P</div>}

                                        {/* Pointers i and j */}
                                        <div className="pointer-markers">
                                            {pointers?.i === idx && <div className="marker marker-i" style={{ bottom: '-30px' }}>i</div>}
                                            {pointers?.j === idx && <div className="marker marker-j" style={{ bottom: '-60px' }}>j</div>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Partition Range Underline */}
                        {range && (
                            <motion.div
                                className="partition-indicator"
                                initial={false}
                                animate={getPartitionStyles()}
                            />
                        )}
                    </div>
                </div>

                <div className="cs-controls-wrapper" style={{ width: '100%', marginTop: 'auto' }}>
                    <AnimationControls
                        inputType="none"
                        onNext={stepForward}
                        onPrev={stepBackward}
                        onPlay={play}
                        onPause={pause}
                        onReset={reset}
                        isPlaying={isPlaying}
                        speed={speed}
                        onSpeedChange={setSpeed}
                        currentStep={currentStepIndex}
                        totalSteps={steps.length}
                        onScrub={setIndex}
                    />
                </div>

                <div className="input-controls">
                    <input
                        type="text"
                        placeholder="e.g. 5, 2, 8, 1"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button className="btn-primary" onClick={handleCustomArray}>Custom Array</button>
                    <button className="btn-secondary" onClick={handleGenerateArray}>Randomize</button>
                </div>
            </div>
        </DualView>
    );
};

export default QuickSortVisualizer;
