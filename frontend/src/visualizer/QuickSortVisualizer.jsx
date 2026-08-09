import React, { useState, useMemo } from "react";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateQuickSortSteps } from "../algorithms/sorting/quickSort";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaRandom, FaCheck, FaRedo } from "react-icons/fa";
import "./QuickSortVisualizer.css";

const DEFAULT_ARRAY = [45, 23, 89, 12, 56, 34, 78, 9, 67, 30];

const QuickSortVisualizer = () => {
    const [array, setArray]                   = useState(DEFAULT_ARRAY);
    const [inputValue, setInputValue]         = useState("45, 23, 89, 12, 56, 34, 78, 9, 67, 30");
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
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { type, indices, pivotIndex, pointers, range, description, arraySnapshot } = stepData;

    const handleGenerateArray = () => {
        const newArray = Array.from({ length: 10 }, () => Math.floor(Math.random() * 90) + 10);
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

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'select-pivot': return 2;
            case 'compare':      return 16;
            case 'swap':         return 29;
            case 'place-pivot':  return 41;
            case 'sorted':       return 49;
            case 'completed':    return 72;
            default:             return 0;
        }
    };

    const codeSnippet = algorithmCodes.quickSort?.[activeLanguage] || "";
    const displayArray = arraySnapshot || array;
    const maxVal = Math.max(...displayArray, 1);

    return (
        <DualView
            algorithmName="Quick Sort (Pivot Partitioning)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="qs-desc-wrapper">
                    <span className="qs-badge">Pivot Partitioning O(N log N)</span>
                    <span className="qs-desc-text">
                        {description || "Click Play to start observing Quick Sort partitioning."}
                    </span>
                </div>
            }
        >
            <div className="qs-visualizer-wrapper">

                {/* Top Input Control Panel */}
                <div className="qs-input-panel">
                    <div className="qs-input-group">
                        <label className="qs-input-label">Array:</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomArray()}
                            placeholder="45, 23, 89, 12, 56, 34..."
                            className="qs-text-input"
                        />
                        <button onClick={handleCustomArray} className="qs-btn qs-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="qs-btn-group">
                        <button onClick={handleGenerateArray} className="qs-btn qs-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArray(DEFAULT_ARRAY); setInputValue("45, 23, 89, 12, 56, 34, 78, 9, 67, 30"); reset(); }} className="qs-btn qs-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="qs-legend">
                        <div className="qs-leg-item"><span className="qs-dot purple"></span> Pivot</div>
                        <div className="qs-leg-item"><span className="qs-dot yellow"></span> Compare</div>
                        <div className="qs-leg-item"><span className="qs-dot red"></span> Swap</div>
                        <div className="qs-leg-item"><span className="qs-dot green"></span> Sorted</div>
                    </div>
                </div>

                {/* Main Visual Stage: Bars & Pointers */}
                <div className="qs-canvas-wrapper">
                    <div className="qs-bars-container">
                        {displayArray.map((val, idx) => {
                            const isPivot     = pivotIndex === idx;
                            const isComparing = indices?.includes(idx) && type === 'compare';
                            const isSwapping  = indices?.includes(idx) && type === 'swap';
                            const isSorted    = type === 'sorted' && indices?.includes(idx);
                            const isInactive  = range && (idx < range.low || idx > range.high);
                            const heightPct   = Math.max((val / maxVal) * 100, 15);

                            let barClass = 'qs-bar';
                            if (isPivot)     barClass += ' pivot';
                            if (isComparing) barClass += ' comparing';
                            if (isSwapping)  barClass += ' swapping';
                            if (isSorted || type === 'completed') barClass += ' sorted';
                            if (isInactive)  barClass += ' inactive';

                            return (
                                <div key={idx} className="qs-bar-wrapper">
                                    <div className="qs-pointer-tags">
                                        {pointers?.i === idx && <span className="ptr-badge i-ptr">i</span>}
                                        {pointers?.j === idx && <span className="ptr-badge j-ptr">j</span>}
                                    </div>
                                    <div
                                        className={barClass}
                                        style={{ height: `${heightPct}%` }}
                                    >
                                        <span className="qs-bar-val">{val}</span>
                                    </div>
                                    <span className="qs-bar-idx">[{idx}]</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* YouTube Video Player Controls */}
                <div className="qs-controls-wrapper">
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

export default QuickSortVisualizer;
