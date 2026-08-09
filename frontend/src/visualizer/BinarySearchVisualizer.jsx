import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateBinarySearchSteps } from "../algorithms/searching/binarySearch";
import { algorithmCodes } from "../data/algorithmCodes";
import { FaSearch, FaRandom, FaRedo, FaBullseye } from "react-icons/fa";
import "./BinarySearchVisualizer.css";

const DEFAULT_ARRAY = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const DEFAULT_TARGET = 70;

const BinarySearchVisualizer = () => {
    const [array, setArray]               = useState(DEFAULT_ARRAY);
    const [target, setTarget]             = useState(DEFAULT_TARGET);
    const [inputValue, setInputValue]     = useState(String(DEFAULT_TARGET));
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateBinarySearchSteps(array, target), [array, target]);

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
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { type, indices, description, arraySnapshot } = stepData;

    const handleSearch = () => {
        const val = parseInt(inputValue, 10);
        if (!isNaN(val)) {
            setTarget(val);
            reset();
        }
    };

    const handleGenerateRandom = () => {
        const count = 10;
        const newArray = Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10)
            .sort((a, b) => a - b);
        // Ensure array elements are unique for clean rendering
        const uniqueArray = Array.from(new Set(newArray));
        setArray(uniqueArray);
        const randomTarget = uniqueArray[Math.floor(Math.random() * uniqueArray.length)];
        setTarget(randomTarget);
        setInputValue(String(randomTarget));
        reset();
    };

    const handleResetDemo = () => {
        setArray(DEFAULT_ARRAY);
        setTarget(DEFAULT_TARGET);
        setInputValue(String(DEFAULT_TARGET));
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'initialization': return 4;
            case 'compare':        return 15;
            case 'found':          return 24;
            case 'move':           return 34;
            case 'not-found':      return 53;
            default:               return 0;
        }
    };

    const codeSnippet = algorithmCodes.binarySearch?.[activeLanguage] || "";
    const activeArray  = arraySnapshot || array;

    return (
        <DualView
            algorithmName="Binary Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={
                <div className="bs-desc-wrapper">
                    <span className="bs-badge">Sorted Array Search</span>
                    <span className="bs-desc-text">
                        {description || "Enter a target value and press Search to observe logarithmic O(log N) search."}
                    </span>
                </div>
            }
        >
            <div className="bs-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="bs-input-panel">
                    <div className="bs-input-group">
                        <label className="bs-input-label">
                            <FaBullseye className="bs-icon" />
                            Target Value
                        </label>
                        <input
                            type="number"
                            placeholder="Target"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                            className="bs-target-input"
                        />
                        <button onClick={handleSearch} className="bs-btn bs-btn-primary">
                            <FaSearch /> Search
                        </button>
                    </div>

                    <div className="bs-btn-group">
                        <button onClick={handleGenerateRandom} className="bs-btn bs-btn-secondary">
                            <FaRandom /> Random Sorted
                        </button>
                        <button onClick={handleResetDemo} className="bs-btn bs-btn-outline">
                            <FaRedo /> Reset Demo
                        </button>
                    </div>

                    <div className="bs-target-display">
                        Target: <strong>{target}</strong>
                    </div>
                </div>

                {/* ── Main Array Visualization Canvas ───────────────────── */}
                <div className="bs-canvas-wrapper">
                    <div className="bs-array-container">
                        <AnimatePresence mode="popLayout">
                            {activeArray.map((val, idx) => {
                                const { low, high, mid } = indices || {};
                                const isInactive = (low !== undefined && low !== null && idx < low) || 
                                                   (high !== undefined && high !== null && idx > high);
                                const isMid   = mid === idx;
                                const isLow   = low === idx;
                                const isHigh  = high === idx;
                                const isFound = type === 'found' && isMid;

                                return (
                                    <motion.div
                                        key={`${idx}-${val}`}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: isInactive ? 0.35 : 1,
                                            scale: isFound ? 1.25 : (isMid ? 1.12 : 1),
                                            y: isFound ? -14 : (isMid ? -8 : 0)
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`bs-element-box ${isInactive ? 'is-inactive' : ''} ${isFound ? 'is-found' : (isMid ? 'is-mid' : '')} ${isLow ? 'is-low' : ''} ${isHigh ? 'is-high' : ''}`}
                                    >
                                        {/* Value */}
                                        <span className="bs-element-val">{val}</span>

                                        {/* Array Index */}
                                        <span className="bs-element-idx">{idx}</span>

                                        {/* Marker Badges (Low / Mid / High / Found) */}
                                        <div className="bs-markers-column">
                                            {isFound && <span className="bs-marker bs-marker-found">MATCH</span>}
                                            {!isFound && isMid && <span className="bs-marker bs-marker-mid">MID</span>}
                                            {isLow && <span className="bs-marker bs-marker-low">LOW</span>}
                                            {isHigh && <span className="bs-marker bs-marker-high">HIGH</span>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── Scrubber & YouTube Controls ───────────────────────── */}
                <div className="bs-controls-wrapper">
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

export default BinarySearchVisualizer;
