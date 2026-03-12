import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCountingSortSteps } from "../algorithms/sorting/countingSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import "./CountingSortVisualizer.css";

const CountingSortVisualizer = () => {
    const defaultArray = [4, 2, 2, 8, 3, 3, 1];
    const [array, setArray] = useState(defaultArray);
    const [inputValue, setInputValue] = useState(defaultArray.join(", "));
    const [maxRange, setMaxRange] = useState(9);
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
        const generatedSteps = generateCountingSortSteps(array);
        setSteps(generatedSteps);
    }, [array]);

    const handleGenerateRandom = () => {
        const size = 8;
        const max = Math.min(Math.max(parseInt(maxRange) || 9, 5), 20);
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * max));
        setArray(newArray);
        setInputValue(newArray.join(", "));
        reset();
        toast.success(`Generated random array with range 0-${max - 1}`);
    };

    const handleCustomInput = () => {
        const values = inputValue.split(",")
            .map(v => parseInt(v.trim()))
            .filter(v => !isNaN(v));

        if (values.length < 3) {
            toast.error("Please enter at least 3 numbers.");
            return;
        }
        if (values.length > 15) {
            toast.error("Maximum 15 numbers allowed for clear visualization.");
            return;
        }

        const maxVal = Math.max(...values);
        const minVal = Math.min(...values);
        if (maxVal - minVal > 20) {
            toast.error("Range of values (Max - Min) should not exceed 20.");
            return;
        }

        setArray(values);
        reset();
        toast.success("Array updated!");
    };

    const codeSnippet = algorithmCodes.countingSort?.[activeLanguage] || "";

    const renderArray = (title, data, activeIdx, extraClass = "") => (
        <div className={`counting-section ${extraClass}`}>
            <div className="counting-section-header">
                <span className="counting-section-title">{title}</span>
            </div>
            <div className="counting-array-display">
                <AnimatePresence mode="popLayout">
                    {data?.map((val, idx) => {
                        const isActive = Array.isArray(activeIdx) ? activeIdx.includes(idx) : activeIdx === idx;
                        return (
                            <motion.div
                                key={`${title}-${idx}-${val}`}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className={`counting-element ${isActive ? 'counting-active' : ''} ${val === null ? 'counting-empty' : ''}`}
                            >
                                {val !== null ? val : ""}
                                <span className="counting-idx-label">{idx + (title === "Count Array (Frequency Table)" ? Math.min(...array) : 0)}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'start': return 1;
            case 'count': return 11;
            case 'prefix-sum-start': return 15;
            case 'prefix-sum': return 16;
            case 'output-start': return 21;
            case 'output-place': return 22;
            case 'final': return 26;
            default: return 0;
        }
    };

    const stats = currentStep?.stats || { comparisons: 0, swaps: 0, phase: 'Initializing' };

    return (
        <DualView
            algorithmName="Counting Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">Linear Sort</span>
                    <span className="description-text">
                        {currentStep?.description || "Press Play to start Counting Sort."}
                    </span>
                </div>
            }
        >
            <div className="counting-layout">
                {/* Stats */}
                <div className="counting-dashboard">
                    <div className="counting-card">
                        <div className="counting-card-title">Algorithm Metrics</div>
                        <div className="counting-stats-grid">
                            <div className="counting-stat-item">
                                <span className="counting-stat-label">Phase</span>
                                <span className="counting-stat-value" style={{ color: 'var(--accent-color)' }}>{stats.phase}</span>
                            </div>
                            <div className="counting-stat-item">
                                <span className="counting-stat-label">Array Size (n)</span>
                                <span className="counting-stat-value">{array.length}</span>
                            </div>
                            <div className="counting-stat-item">
                                <span className="counting-stat-label">Range (k)</span>
                                <span className="counting-stat-value">{Math.max(...array) - Math.min(...array) + 1}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Array */}
                {renderArray("Input Array", currentStep?.arraySnapshot || array, currentStep?.activeIndices)}

                <div className="flow-indicator">
                    {currentStep?.type?.includes('count') ? <FaArrowDown style={{ color: '#3b82f6' }} /> :
                        currentStep?.type?.includes('output') ? <FaArrowUp style={{ color: '#10b981' }} /> : null}
                </div>

                {/* Count Array */}
                <div className={`counting-section ${currentStep?.countActiveIndex !== null ? 'counting-count-active' : ''}`}>
                    <div className="counting-section-header">
                        <span className="counting-section-title">Count Array / Frequency Table</span>
                    </div>
                    <div className="counting-array-display">
                        {currentStep?.countArray?.map((val, idx) => (
                            <div
                                key={`count-${idx}`}
                                className={`counting-element ${currentStep.countActiveIndex === idx ? 'counting-count-active' : ''}`}
                                style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: currentStep.countActiveIndex === idx ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)' }}
                            >
                                {val}
                                <span className="counting-idx-label">{idx + Math.min(...array)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flow-indicator">
                    {currentStep?.type?.includes('output') ? <FaArrowDown style={{ color: '#10b981' }} /> : null}
                </div>

                {/* Output Array */}
                {renderArray("Output Sorted Array", currentStep?.outputArray, currentStep?.outputActiveIndex, "output-section")}

                {/* Controls */}
                <div className="cs-controls-wrapper" style={{ width: '100%', marginTop: '20px' }}>
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
                        inputType="none"
                    />
                </div>

                {/* Custom Inputs */}
                <div className="counting-inputs">
                    <div className="counting-input-group" style={{ flex: 1 }}>
                        <label className="counting-stat-label">Custom Elements</label>
                        <input
                            className="counting-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>
                    <div className="counting-input-group">
                        <label className="counting-stat-label">Max Value</label>
                        <input
                            className="counting-input"
                            type="number"
                            value={maxRange}
                            onChange={(e) => setMaxRange(e.target.value)}
                            style={{ width: '80px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end' }}>
                        <button className="counting-btn counting-btn-primary" onClick={handleCustomInput}>Update</button>
                        <button className="counting-btn counting-btn-secondary" onClick={handleGenerateRandom}>Random</button>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default CountingSortVisualizer;
