import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCocktailShakerSortSteps } from "../algorithms/sorting/cocktailShakerSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import "./CocktailShakerVisualizer.css";

const CocktailShakerVisualizer = () => {
    const defaultArray = [8, 3, 7, 4, 9, 2, 6];
    const [array, setArray] = useState(defaultArray);
    const [inputValue, setInputValue] = useState(defaultArray.join(", "));
    const [arraySize, setArraySize] = useState(7);
    const [activeLanguage, setActiveLanguage] = useState("javascript");
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
        const generatedSteps = generateCocktailShakerSortSteps(array);
        setSteps(generatedSteps);
    }, [array]);

    const handleGenerateRandom = () => {
        const size = Math.min(Math.max(parseInt(arraySize) || 7, 5), 15);
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
        reset();
        toast.success("Custom array updated!");
    };

    const getBarColorClass = (index) => {
        if (!currentStep || !currentStep.activeIndices) return "cs-bar-default";
        if (currentStep.activeIndices.includes(index)) {
            return currentStep.type === "swap" ? "cs-bar-swapping" : "cs-bar-comparing";
        }
        if (currentStep.sortedIndices && currentStep.sortedIndices.includes(index)) {
            return "cs-bar-sorted";
        }
        return "cs-bar-default";
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        // Lines based on the logic in algorithmCodes.js
        switch (snapshot.type) {
            case 'forward-start': return 10;
            case 'compare': return snapshot.stats.passDirection === 'forward' ? 12 : 28;
            case 'swap': return snapshot.stats.passDirection === 'forward' ? 14 : 30;
            case 'backward-start': return 25;
            case 'cycle-complete': return 35;
            case 'final': return 39;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.cocktailShakerSort?.[activeLanguage] || "";

    const stats = currentStep?.stats || { comparisons: 0, swaps: 0, cycle: 0, passDirection: 'none' };

    return (
        <DualView
            algorithmName="Cocktail Shaker Sort"
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
            <div className="cs-layout">
                {/* Stats Dashboard */}
                <div className="cs-dashboard">
                    <div className="cs-stats-card">
                        <div className="cs-card-title">Execution Statistics</div>
                        <div className="cs-stats-grid">
                            <div className="cs-stat-item">
                                <span className="cs-stat-label">Comparisons</span>
                                <span className="cs-stat-value">{stats.comparisons}</span>
                            </div>
                            <div className="cs-stat-item">
                                <span className="cs-stat-label">Swaps</span>
                                <span className="cs-stat-value">{stats.swaps}</span>
                            </div>
                            <div className="cs-stat-item">
                                <span className="cs-stat-label">Cycles</span>
                                <span className="cs-stat-value">{stats.cycle}</span>
                            </div>
                            <div className="cs-stat-item">
                                <span className="cs-stat-label">Step</span>
                                <span className="cs-stat-value">{currentStepIndex + 1} / {isPlaying ? '?' : 'Done'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="cs-direction-card">
                        <div className="cs-card-title">Current Pass</div>
                        <div className="cs-direction-indicator">
                            <span className={`cs-arrow ${stats.passDirection === 'forward' ? 'cs-arrow-active' : ''}`}>→</span>
                            <span className="cs-direction-text">Forward Pass</span>
                        </div>
                        <div className="cs-direction-indicator">
                            <span className={`cs-arrow cs-arrow-reverse ${stats.passDirection === 'backward' ? 'cs-arrow-active' : ''}`}>←</span>
                            <span className="cs-direction-text">Backward Pass</span>
                        </div>
                    </div>
                </div>

                {/* Visualization Canvas */}
                <div className="cs-visualization-canvas">
                    <div className="cs-bars-container">
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
                                        className="cs-bar-wrapper"
                                    >
                                        <div
                                            className={`cs-bar ${getBarColorClass(idx)}`}
                                            style={{ height: `${height}px` }}
                                        >
                                            <span className="cs-bar-value">{val}</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{idx}</span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Controls */}
                    <div className="cs-controls-wrapper" style={{ width: '100%', marginTop: '40px' }}>
                        <AnimationControls
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
                            inputType="none" // Hide internal array controls
                        />
                    </div>
                </div>

                {/* Custom Inputs */}
                <div className="cs-inputs-panel">
                    <div className="cs-input-group">
                        <label>Custom Array (comma separated)</label>
                        <input
                            className="cs-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="e.g. 5, 2, 9, 1"
                        />
                    </div>
                    <div className="cs-input-group">
                        <label>Array Size</label>
                        <input
                            className="cs-input"
                            type="number"
                            value={arraySize}
                            onChange={(e) => setArraySize(e.target.value)}
                            style={{ width: '80px' }}
                        />
                    </div>
                    <button className="cs-btn" onClick={handleCustomInput}>Update Array</button>
                    <button className="cs-btn cs-btn-secondary" onClick={handleGenerateRandom}>Generate Random</button>
                </div>

                {/* Education Panel */}
                <div className="cs-education-panel">
                    <div className="cs-edu-grid">
                        <div className="cs-edu-section">
                            <h3>How It Works</h3>
                            <p>
                                Cocktail Shaker Sort is a bidirectional variation of Bubble Sort.
                                It traverses the array in both directions alternately.
                                Each cycle consists of a forward pass (moving the largest unsorted element to the end)
                                and a backward pass (moving the smallest unsorted element to the beginning).
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Key Idea</h3>
                            <p>
                                By sorting in both directions, "turtles" (small elements near the end of the array)
                                are moved quickly to the front, which significantly improves on Bubble Sort's
                                performance in certain cases.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>O(n²)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#f87171' }}>O(n²)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Stable Sort</span>
                                    <span style={{ color: '#34d399' }}>Yes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default CocktailShakerVisualizer;
