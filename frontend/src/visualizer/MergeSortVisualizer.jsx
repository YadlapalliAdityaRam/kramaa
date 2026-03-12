import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateMergeSortSteps } from "../algorithms/sorting/mergeSort";
import { algorithmCodes } from "../data/algorithmCodes";
import "./MergeSortVisualizer.css";

const MergeSortVisualizer = () => {
    const [array, setArray] = useState([38, 27, 43, 3, 9, 82, 10]);
    const [inputValue, setInputValue] = useState("");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateMergeSortSteps(array), [array]);

    const {
        currentStep,
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
    const { type, indices, range, level, description, arraySnapshot } = stepData;

    const handleGenerateArray = () => {
        const newArray = Array.from({ length: 8 }, () => Math.floor(Math.random() * 100));
        setArray(newArray);
        reset();
    };

    const handleCustomArray = () => {
        const custom = inputValue.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (custom.length > 0) {
            setArray(custom);
            reset();
        }
    };

    // Helper to determine if an element in the main sequence is part of the current active range
    const isElementActive = (idx) => {
        if (!range) return false;
        return idx >= range.left && idx <= range.right;
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'split': return 4;
            case 'merge_start': return 10;
            case 'compare': return 12;
            case 'overwrite': return 13;
            case 'completed': return 1;
            default: return 0;
        }
    };

    // Render the recursion tree based on the current step's context
    const renderRecursionLevels = () => {
        const totalLevels = Math.ceil(Math.log2(array.length)) + 1;
        const rows = [];

        for (let l = 0; l <= totalLevels; l++) {
            const isCurrentLevel = level === l;
            const isParentLevel = level > l;

            rows.push(
                <div key={l} className="level-row">
                    <AnimatePresence mode="wait">
                        {(isCurrentLevel || isParentLevel) && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className={`array-block ${isCurrentLevel ? 'active' : ''} ${isCurrentLevel && type === 'split' ? 'splitting' : ''} ${isCurrentLevel && (type === 'merge_start' || type === 'overwrite') ? 'merging' : ''}`}
                            >
                                {arraySnapshot?.map((val, idx) => {
                                    const inRange = isElementActive(idx);
                                    if (!inRange && isCurrentLevel) return null;

                                    return (
                                        <motion.div
                                            key={`${l}-${idx}-${val}`}
                                            layout
                                            className={`array-element 
                                                ${inRange ? '' : 'inactive'}
                                                ${indices?.includes(idx) && type === 'compare' ? 'comparing' : ''}
                                                ${indices?.includes(idx) && type === 'overwrite' ? 'overwriting' : ''}
                                            `}
                                        >
                                            {val}
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }
        return rows;
    };

    const codeSnippet = algorithmCodes.mergeSort?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Merge Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Click Play to start Merge Sort"}
        >
            <div className="visualizer-container merge-sort">
                <div className="recursion-levels">
                    {renderRecursionLevels()}
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
                        placeholder="e.g. 38, 27, 43, 3"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button onClick={handleCustomArray}>Update</button>
                    <button onClick={handleGenerateArray}>Random</button>
                </div>
            </div>
        </DualView>
    );
};

export default MergeSortVisualizer;
