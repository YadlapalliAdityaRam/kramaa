import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCocktailShakerSortSteps } from "../algorithms/sorting/cocktailShakerSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaRandom, FaCheck, FaRedo } from "react-icons/fa";
import "./CocktailShakerVisualizer.css";

const DEFAULT_ARRAY = [8, 3, 7, 4, 9, 2, 6];

const CocktailShakerVisualizer = () => {
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
        const generatedSteps = generateCocktailShakerSortSteps(array);
        setSteps(generatedSteps);
    }, [array]);

    const handleGenerateRandom = () => {
        const size = 8;
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 15);
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
        const isForward = snapshot.stats?.passDirection === 'forward';
        switch (snapshot.type) {
            case 'forward-start':  return 9;
            case 'compare':        return isForward ? 10 : 22;
            case 'swap':           return isForward ? 11 : 23;
            case 'backward-start': return 21;
            case 'cycle-complete': return 28;
            case 'final':          return 31;
            default:               return 0;
        }
    };

    const codeSnippet = algorithmCodes.cocktailShakerSort?.[activeLanguage] || "";
    const currentArray = currentStep?.array || array;
    const maxValue     = Math.max(...currentArray, 1);

    return (
        <DualView
            algorithmName="Cocktail Shaker Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="cs-desc-wrapper">
                    <span className="cs-badge">Bidirectional Bubble Sort</span>
                    <span className="cs-desc-text">
                        {currentStep?.description || "Press Play to observe bidirectional passes sorting elements in both directions."}
                    </span>
                </div>
            }
        >
            <div className="cs-visualizer-wrapper">

                {/* ── Top Input Panel ──────────────────────────────────────── */}
                <div className="cs-input-panel">
                    <div className="cs-input-group">
                        <label className="cs-input-label">Custom Array:</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomInput()}
                            placeholder="e.g. 8, 3, 7, 4, 9"
                            className="cs-text-input"
                        />
                        <button onClick={handleCustomInput} className="cs-btn cs-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="cs-btn-group">
                        <button onClick={handleGenerateRandom} className="cs-btn cs-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArray(DEFAULT_ARRAY); setInputValue(DEFAULT_ARRAY.join(", ")); reset(); }} className="cs-btn cs-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="cs-legend">
                        <div className="cs-leg-item"><span className="cs-dot cs-dot-compare"></span> Comparing</div>
                        <div className="cs-leg-item"><span className="cs-dot cs-dot-swap"></span> Swapping</div>
                        <div className="cs-leg-item"><span className="cs-dot cs-dot-sorted"></span> Sorted</div>
                    </div>
                </div>

                {/* ── Main Array Visualization Bars ─────────────────────── */}
                <div className="cs-canvas-wrapper">
                    <div className="cs-bars-container">
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
                                        className="cs-bar-wrapper"
                                    >
                                        <div
                                            className={`cs-bar ${colorClass}`}
                                            style={{ height: `${heightPercent}%` }}
                                        >
                                            <span className="cs-bar-val">{val}</span>
                                        </div>
                                        <span className="cs-bar-idx">{index}</span>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="cs-controls-wrapper">
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

export default CocktailShakerVisualizer;
