import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCountingSortSteps } from "../algorithms/sorting/countingSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaRandom, FaCheck, FaRedo } from "react-icons/fa";
import "./CountingSortVisualizer.css";

const DEFAULT_ARRAY = [4, 2, 2, 8, 3, 3, 1];

const CountingSortVisualizer = () => {
    const [array, setArray]               = useState(DEFAULT_ARRAY);
    const [inputValue, setInputValue]     = useState(DEFAULT_ARRAY.join(", "));
    const [activeLanguage, setActiveLanguage] = useState("javascript");
    const [steps, setSteps]               = useState([]);

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
        speed,
        setIndex
    } = useGenericAnimation(steps);

    useEffect(() => {
        const generatedSteps = generateCountingSortSteps(array);
        setSteps(generatedSteps);
    }, [array]);

    const handleGenerateRandom = () => {
        const size = 8;
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 9) + 1);
        setArray(newArray);
        setInputValue(newArray.join(", "));
        reset();
        toast.success(`Generated ${size} numbers (range 1-9)!`);
    };

    const handleCustomInput = () => {
        const values = inputValue.split(",")
            .map(v => parseInt(v.trim(), 10))
            .filter(v => !isNaN(v));

        if (values.length < 3) {
            toast.error("Please enter at least 3 numbers.");
            return;
        }
        if (values.length > 15) {
            toast.error("Maximum 15 numbers allowed.");
            return;
        }
        if (values.some(v => v < 0 || v > 15)) {
            toast.error("Counting sort visualizer accepts numbers between 0 and 15.");
            return;
        }

        setArray(values);
        reset();
        toast.success("Custom array updated!");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'init':             return 4;
            case 'count-increment': return 8;
            case 'accumulate-start':return 11;
            case 'accumulate':      return 12;
            case 'output-place':    return 17;
            case 'complete':        return 21;
            default:                return 0;
        }
    };

    const codeSnippet = algorithmCodes.countingSort?.[activeLanguage] || "";
    const stepData    = currentStep || {};
    const { counts, output, activeInputIdx, activeCountIdx, activeOutputIdx, description } = stepData;

    return (
        <DualView
            algorithmName="Counting Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="cnt-desc-wrapper">
                    <span className="cnt-badge">Non-Comparison Sort O(N + K)</span>
                    <span className="cnt-desc-text">
                        {description || "Press Play to observe non-comparison frequency counting sorting elements in linear time."}
                    </span>
                </div>
            }
        >
            <div className="cnt-visualizer-wrapper">

                {/* ── Top Input Panel ──────────────────────────────────────── */}
                <div className="cnt-input-panel">
                    <div className="cnt-input-group">
                        <label className="cnt-input-label">Custom Array (0-15):</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomInput()}
                            placeholder="e.g. 4, 2, 2, 8, 3"
                            className="cnt-text-input"
                        />
                        <button onClick={handleCustomInput} className="cnt-btn cnt-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="cnt-btn-group">
                        <button onClick={handleGenerateRandom} className="cnt-btn cnt-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArray(DEFAULT_ARRAY); setInputValue(DEFAULT_ARRAY.join(", ")); reset(); }} className="cnt-btn cnt-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Input, Frequency Count, Output Arrays ── */}
                <div className="cnt-canvas-wrapper">
                    
                    {/* 1. Input Array */}
                    <div className="cnt-array-card">
                        <div className="cnt-card-header">Input Array <code>arr</code></div>
                        <div className="cnt-pills-row">
                            {array.map((val, idx) => (
                                <div
                                    key={`in-${idx}`}
                                    className={`cnt-pill ${activeInputIdx === idx ? 'active-in' : ''}`}
                                >
                                    <span className="cnt-val">{val}</span>
                                    <span className="cnt-idx">[{idx}]</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Frequency Count Array */}
                    <div className="cnt-array-card">
                        <div className="cnt-card-header">Frequency Count Array <code>count</code></div>
                        <div className="cnt-pills-row">
                            {(counts || []).map((cnt, val) => (
                                <div
                                    key={`cnt-${val}`}
                                    className={`cnt-pill cnt-pill-count ${activeCountIdx === val ? 'active-cnt' : ''}`}
                                >
                                    <span className="cnt-val">{cnt}</span>
                                    <span className="cnt-idx">val: {val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Sorted Output Array */}
                    <div className="cnt-array-card">
                        <div className="cnt-card-header">Sorted Output Array <code>output</code></div>
                        <div className="cnt-pills-row">
                            {Array.from({ length: array.length }).map((_, idx) => {
                                const val = output ? output[idx] : undefined;
                                const isFilled = val !== undefined && val !== null;

                                return (
                                    <div
                                        key={`out-${idx}`}
                                        className={`cnt-pill cnt-pill-out ${activeOutputIdx === idx ? 'active-out' : ''} ${isFilled ? 'filled' : 'empty'}`}
                                    >
                                        <span className="cnt-val">{isFilled ? val : '-'}</span>
                                        <span className="cnt-idx">[{idx}]</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="cnt-controls-wrapper">
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

            </div>
        </DualView>
    );
};

export default CountingSortVisualizer;
