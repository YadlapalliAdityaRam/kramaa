import React, { useState, useMemo } from "react";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateMergeSortSteps } from "../algorithms/sorting/mergeSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaRandom, FaCheck, FaRedo } from "react-icons/fa";
import "./MergeSortVisualizer.css";

const DEFAULT_ARRAY = [38, 27, 43, 3, 9, 82, 10];

const MergeSortVisualizer = () => {
    const [array, setArray]                   = useState(DEFAULT_ARRAY);
    const [inputValue, setInputValue]         = useState("38, 27, 43, 3, 9, 82, 10");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateMergeSortSteps(array), [array]);

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
    const { type, indices, range, description, arraySnapshot } = stepData;

    const handleGenerateArray = () => {
        const newArray = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
        setArray(newArray);
        setInputValue(newArray.join(", "));
        reset();
        toast.success("Random array generated!");
    };

    const handleCustomArray = () => {
        const custom = inputValue.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        if (custom.length >= 2 && custom.length <= 15) {
            setArray(custom);
            reset();
            toast.success("Array applied!");
        } else {
            toast.error("Please enter between 2 and 15 numbers.");
        }
    };

    const isElementActive = (idx) => {
        if (!range) return false;
        return idx >= range.left && idx <= range.right;
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'split':       return 4;
            case 'merge_start': return 10;
            case 'compare':     return 12;
            case 'overwrite':   return 13;
            case 'completed':   return 1;
            default:            return 0;
        }
    };

    const codeSnippet = algorithmCodes.mergeSort?.[activeLanguage] || "";
    const displayArray = arraySnapshot || array;
    const maxVal = Math.max(...displayArray, 1);

    return (
        <DualView
            algorithmName="Merge Sort (Divide & Conquer)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="mrg-desc-wrapper">
                    <span className="mrg-badge">Divide & Conquer O(N log N)</span>
                    <span className="mrg-desc-text">
                        {description || "Click Play to start observing Merge Sort."}
                    </span>
                </div>
            }
        >
            <div className="mrg-visualizer-wrapper">

                {/* Top Input Control Panel */}
                <div className="mrg-input-panel">
                    <div className="mrg-input-group">
                        <label className="mrg-input-label">Array:</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomArray()}
                            placeholder="38, 27, 43, 3, 9, 82, 10"
                            className="mrg-text-input"
                        />
                        <button onClick={handleCustomArray} className="mrg-btn mrg-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="mrg-btn-group">
                        <button onClick={handleGenerateArray} className="mrg-btn mrg-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArray(DEFAULT_ARRAY); setInputValue("38, 27, 43, 3, 9, 82, 10"); reset(); }} className="mrg-btn mrg-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="mrg-legend">
                        <div className="mrg-leg-item"><span className="mrg-dot blue"></span> Active Sub-array</div>
                        <div className="mrg-leg-item"><span className="mrg-dot yellow"></span> Comparing</div>
                        <div className="mrg-leg-item"><span className="mrg-dot green"></span> Overwriting / Merged</div>
                    </div>
                </div>

                {/* Main Visual Stage: Dynamic Bar Chart & Cells */}
                <div className="mrg-canvas-wrapper">
                    <div className="mrg-bars-container">
                        {displayArray.map((val, idx) => {
                            const inRange    = isElementActive(idx);
                            const isComparing = indices?.includes(idx) && type === 'compare';
                            const isOverwrite = indices?.includes(idx) && type === 'overwrite';
                            const heightPct   = Math.max((val / maxVal) * 100, 15);

                            let barClass = 'mrg-bar';
                            if (inRange)    barClass += ' active-range';
                            if (isComparing) barClass += ' comparing';
                            if (isOverwrite) barClass += ' overwriting';
                            if (type === 'completed') barClass += ' completed';

                            return (
                                <div key={idx} className="mrg-bar-wrapper">
                                    <div
                                        className={barClass}
                                        style={{ height: `${heightPct}%` }}
                                    >
                                        <span className="mrg-bar-val">{val}</span>
                                    </div>
                                    <span className="mrg-bar-idx">[{idx}]</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* YouTube Video Player Controls */}
                <div className="mrg-controls-wrapper">
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

export default MergeSortVisualizer;
