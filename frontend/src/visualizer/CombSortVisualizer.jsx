import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCombSortSteps } from "../algorithms/sorting/combSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaRandom, FaCheck, FaRedo } from "react-icons/fa";
import "./CombSortVisualizer.css";

const DEFAULT_ARRAY = [8, 4, 1, 56, 3, 44, 23, 9];

const CombSortVisualizer = () => {
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
        const generatedSteps = generateCombSortSteps(array);
        setSteps(generatedSteps);
    }, [array]);

    const handleGenerateRandom = () => {
        const size = 8;
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
        setArray(newArray);
        setInputValue(newArray.join(", "));
        reset();
        toast.success(`Generated ${size} random numbers!`);
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

        setArray(values);
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
            case 'gap-update': return 7;
            case 'compare':    return 11;
            case 'swap':       return 12;
            case 'final':      return 18;
            default:           return 0;
        }
    };

    const codeSnippet = algorithmCodes.combSort?.[activeLanguage] || "";
    const currentArray = currentStep?.array || array;
    const maxValue     = Math.max(...currentArray, 1);
    const stats        = currentStep?.stats || { gap: array.length, comparisons: 0, swaps: 0 };

    return (
        <DualView
            algorithmName="Comb Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="comb-desc-wrapper">
                    <span className="comb-badge">Gap-Based Sorting</span>
                    <span className="comb-desc-text">
                        {currentStep?.description || "Press Play to observe Comb Sort eliminating turtles with a shrinking gap factor (1.3)."}
                    </span>
                    <span className="comb-gap-pill">
                        Current Gap: <strong>{stats.gap}</strong>
                    </span>
                </div>
            }
        >
            <div className="comb-visualizer-wrapper">

                {/* ── Top Input Panel ──────────────────────────────────────── */}
                <div className="comb-input-panel">
                    <div className="comb-input-group">
                        <label className="comb-input-label">Custom Array:</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomInput()}
                            placeholder="e.g. 8, 4, 1, 56, 3"
                            className="comb-text-input"
                        />
                        <button onClick={handleCustomInput} className="comb-btn comb-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="comb-btn-group">
                        <button onClick={handleGenerateRandom} className="comb-btn comb-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArray(DEFAULT_ARRAY); setInputValue(DEFAULT_ARRAY.join(", ")); reset(); }} className="comb-btn comb-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="comb-legend">
                        <div className="comb-leg-item"><span className="comb-dot comb-dot-compare"></span> Gap Comparing</div>
                        <div className="comb-leg-item"><span className="comb-dot comb-dot-swap"></span> Swapping</div>
                        <div className="comb-leg-item"><span className="comb-dot comb-dot-final"></span> Sorted</div>
                    </div>
                </div>

                {/* ── Main Array Visualization Bars ─────────────────────── */}
                <div className="comb-canvas-wrapper">
                    <div className="comb-bars-container">
                        <AnimatePresence mode="popLayout">
                            {currentArray.map((val, index) => {
                                const heightPercent = Math.max(15, (val / maxValue) * 100);
                                const colorClass = getBarColorClass(index);

                                return (
                                    <motion.div
                                        key={`${index}-${val}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.25 }}
                                        className="comb-bar-wrapper"
                                    >
                                        <div
                                            className={`comb-bar ${colorClass}`}
                                            style={{ height: `${heightPercent}%` }}
                                        >
                                            <span className="comb-bar-val">{val}</span>
                                        </div>
                                        <span className="comb-bar-idx">{index}</span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="comb-controls-wrapper">
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

export default CombSortVisualizer;
