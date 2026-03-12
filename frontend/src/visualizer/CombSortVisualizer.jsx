import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCombSortSteps } from "../algorithms/sorting/combSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import "./CombSortVisualizer.css";

const CombSortVisualizer = () => {
    const defaultArray = [8, 4, 1, 56, 3, 44, 23, 9];
    const [array, setArray] = useState(defaultArray);
    const [inputValue, setInputValue] = useState(defaultArray.join(", "));
    const [arraySize, setArraySize] = useState(8);
    const [activeLanguage, setActiveLanguage] = useState("javascript");
    const containerRef = useRef(null);
    const [steps, setSteps] = useState([]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        setSpeed,
        speed
    ,
        setIndex
    } = useGenericAnimation(steps);

    useEffect(() => {
        const generatedSteps = generateCombSortSteps(array);
        setSteps(generatedSteps);
    }, [array]);

    const handleGenerateRandom = () => {
        const size = Math.min(Math.max(parseInt(arraySize) || 8, 5), 15);
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
        setArray(newArray);
        setInputValue(newArray.join(", "));
        reset();
        toast.success(`Generated ${size} random numbers!`);
    };

    const handleCustomInput = () => {
        const values = inputValue.split(",")
            .map(v => parseInt(v.trim()))
            .filter(v => !isNaN(v));

        if (values.length < 3) {
            toast.error("Please enter at least 3 numbers.");
            return;
        }
        if (values.length > 20) {
            toast.error("Maximum 20 numbers allowed.");
            return;
        }

        setArray(values);
        setArraySize(values.length);
        reset();
        toast.success("Custom array updated!");
    };

    const getBarColorClass = (index) => {
        if (!currentStep || !currentStep.activeIndices) return "comb-bar-default";
        if (currentStep.activeIndices.includes(index)) {
            return currentStep.type === "swap" ? "comb-bar-swapping" : "comb-bar-comparing";
        }
        if (currentStep.type === "final") return "comb-bar-final";
        return "comb-bar-default";
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'gap-update': return 9;
            case 'compare': return 13;
            case 'swap': return 15;
            case 'final': return 22;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.combSort?.[activeLanguage] || "";
    const stats = currentStep?.stats || { gap: array.length, comparisons: 0, swaps: 0, iteration: 0 };

    // Calculate gap indicator position
    const renderGapIndicator = () => {
        if (!currentStep || !currentStep.activeIndices || currentStep.activeIndices.length < 2) return null;

        const [idx1, idx2] = currentStep.activeIndices;
        const left = Math.min(idx1, idx2);
        const right = Math.max(idx1, idx2);

        const arrLen = array?.length || 1;
        const widthPercent = (right - left) * (100 / arrLen);
        const leftPercent = left * (100 / arrLen) + (50 / arrLen);

        return (
            <motion.div
                className="comb-gap-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, left: `${leftPercent}%`, width: `${widthPercent}%` }}
                exit={{ opacity: 0 }}
            >
                <div className="comb-gap-text">Gap: {currentStep.stats.gap}</div>
            </motion.div>
        );
    };

    return (
        <DualView
            algorithmName="Comb Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">Sorting</span>
                    <span className="description-text">
                        {currentStep?.description || "Press Play to begin sorting."}
                    </span>
                </div>
            }
        >
            <div className="comb-layout">
                {/* Dashboard */}
                <div className="comb-dashboard">
                    <div className="comb-stats-card">
                        <div className="comb-card-title">Execution Statistics</div>
                        <div className="comb-stats-grid">
                            <div className="comb-stat-item">
                                <span className="comb-stat-label">Comparisons</span>
                                <span className="comb-stat-value">{stats.comparisons}</span>
                            </div>
                            <div className="comb-stat-item">
                                <span className="comb-stat-label">Swaps</span>
                                <span className="comb-stat-value">{stats.swaps}</span>
                            </div>
                            <div className="comb-stat-item">
                                <span className="comb-stat-label">Iteration</span>
                                <span className="comb-stat-value">{stats.iteration}</span>
                            </div>
                            <div className="comb-stat-item">
                                <span className="comb-stat-label">Progress</span>
                                <span className="comb-stat-value">{currentStepIndex + 1} / {isPlaying ? '?' : 'Sorted'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="comb-gap-card">
                        <div className="comb-card-title">Current Gap</div>
                        <div className="comb-gap-visual">
                            <span className="comb-gap-value-large">{stats.gap}</span>
                            <div className="comb-gap-info">
                                <span className="comb-shrink-tag">Shrink: 1.3</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Decreases per pass</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visualization Canvas */}
                <div className="comb-visualization-canvas" ref={containerRef}>
                    <div className="comb-bars-container">
                        <AnimatePresence>
                            {renderGapIndicator()}
                        </AnimatePresence>

                        <AnimatePresence mode="popLayout">
                            {currentStep?.arraySnapshot?.map((val, idx) => {
                                const maxHeight = 250;
                                const maxValue = Math.max(...array, 1);
                                const height = (val / maxValue) * maxHeight + 30;

                                return (
                                    <motion.div
                                        key={`${idx}-${val}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="comb-bar-wrapper"
                                    >
                                        <div
                                            className={`comb-bar ${getBarColorClass(idx)}`}
                                            style={{ height: `${height}px` }}
                                        >
                                            <span className="comb-bar-value">{val}</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{idx}</span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Controls */}
                    <div className="comb-controls-wrapper" style={{ width: '100%', marginTop: '40px' }}>
                        <AnimationControls
                            onNext={stepForward}
                            onPrev={stepBackward}
                            onPlay={play}
                            onPause={pause}
                            onReset={() => { reset(); }}
                            isPlaying={isPlaying}
                            speed={speed}
                            onSpeedChange={setSpeed}
                        currentStep={currentStepIndex}
                        totalSteps={steps.length}
                        onScrub={setIndex}
                            inputType="none"
                        />
                    </div>
                </div>

                {/* Custom Inputs */}
                <div className="comb-inputs-panel">
                    <div className="comb-input-group">
                        <label>Custom Array</label>
                        <input
                            className="comb-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>
                    <div className="comb-input-group">
                        <label>Size</label>
                        <input
                            className="comb-input"
                            type="number"
                            value={arraySize}
                            onChange={(e) => setArraySize(e.target.value)}
                            style={{ width: '70px' }}
                        />
                    </div>
                    <button className="comb-btn" onClick={handleCustomInput}>Update</button>
                    <button className="comb-btn comb-btn-secondary" onClick={handleGenerateRandom}>Random</button>
                </div>

                {/* Education Panel */}
                <div className="comb-education-panel">
                    <div className="comb-edu-grid">
                        <div className="comb-edu-section">
                            <h3>How It Works</h3>
                            <p>
                                Comb Sort improves upon Bubble Sort by eliminating "turtles"—small values
                                near the end of the list that slow down the sorting process. It does this by
                                comparing elements that are far apart, rather than strictly adjacent.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Gap Strategy</h3>
                            <p>
                                The "gap" starts as the length of the array and shrinks by a factor (usually 1.3)
                                in each iteration until it reaches 1. At gap = 1, the algorithm becomes
                                a standard Bubble Sort, but with most elements already near their correct positions.
                            </p>
                        </div>
                        <div className="comb-edu-section">
                            <h3>Complexity</h3>
                            <div className="comb-complexity-bubble">
                                <div className="comb-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(n log n)</span>
                                </div>
                                <div className="comb-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>O(n²/2^p)</span>
                                </div>
                                <div className="comb-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#f87171' }}>O(n²)</span>
                                </div>
                                <div className="comb-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(1)</span>
                                </div>
                                <div className="comb-complexity-item">
                                    <span>Stable Sort</span>
                                    <span style={{ color: '#f87171' }}>No</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default CombSortVisualizer;
