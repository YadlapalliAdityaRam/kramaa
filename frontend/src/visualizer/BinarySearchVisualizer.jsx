import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateBinarySearchSteps } from "../algorithms/searching/binarySearch";
import { algorithmCodes } from "../data/algorithmCodes";
import "./BinarySearchVisualizer.css";

const BinarySearchVisualizer = () => {
    const [array, setArray] = useState([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    const [target, setTarget] = useState(70);
    const [inputValue, setInputValue] = useState("70");
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
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { type, indices, description, arraySnapshot } = stepData;

    const handleGenerateArray = () => {
        const newArray = Array.from({ length: 12 }, () => Math.floor(Math.random() * 100))
            .sort((a, b) => a - b);
        setArray(newArray);
        reset();
    };

    const handleSearch = () => {
        const val = parseInt(inputValue);
        if (!isNaN(val)) {
            setTarget(val);
            reset();
        }
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'initialization': return 4;
            case 'compare': return 15;
            case 'found': return 24;
            case 'move': return 34;
            case 'not-found': return 53;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.binarySearch?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Binary Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Enter a target and click Search."}
        >
            <div className="visualizer-container binary-search">
                <div className="search-info">
                    <div className="target-badge">
                        Searching for: <span>{target}</span>
                    </div>
                </div>

                <div className="search-area">
                    <div className="array-container">
                        <AnimatePresence>
                            {arraySnapshot?.map((val, idx) => {
                                const { low, high, mid } = indices || {};
                                const isInactive = (low !== null && idx < low) || (high !== null && idx > high);

                                return (
                                    <motion.div
                                        key={`${idx}-${val}`}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{
                                            opacity: isInactive ? 0.3 : 1,
                                            scale: indices?.mid === idx ? 1.2 : 1,
                                            translateY: indices?.mid === idx ? -20 : 0
                                        }}
                                        className={`search-element 
                                            ${isInactive ? 'inactive' : ''}
                                            ${low === idx ? 'low' : ''}
                                            ${high === idx ? 'high' : ''}
                                            ${mid === idx ? 'mid' : ''}
                                            ${type === 'found' && mid === idx ? 'found' : ''}
                                        `}
                                    >
                                        {val}
                                        {low === idx && <span className="index-marker marker-low">Low</span>}
                                        {high === idx && <span className="index-marker marker-high">High</span>}
                                        {mid === idx && <span className="index-marker marker-mid">Mid</span>}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
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
                        type="number"
                        placeholder="Target"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button onClick={handleSearch}>Search</button>
                    <button onClick={handleGenerateArray} style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>Random</button>
                </div>
            </div>
        </DualView>
    );
};

export default BinarySearchVisualizer;
