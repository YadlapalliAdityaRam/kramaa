import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateSieveSteps } from "../algorithms/math/sieve";
import { algorithmCodes } from "../data/algorithmCodes";
import "./SieveVisualizer.css";

const SieveVisualizer = () => {
    const [limit, setLimit] = useState(100);
    const [inputValue, setInputValue] = useState("100");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateSieveSteps(limit), [limit]);

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
    const { type, grid, description, currentPrime, currentMultiple } = stepData;

    const handleUpdateLimit = () => {
        const val = Math.min(Math.max(parseInt(inputValue) || 10, 10), 400);
        setLimit(val);
        setInputValue(val.toString());
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'initialization': return 1;
            case 'found-prime': return 16;
            case 'crossing-out': return 25;
            case 'completed': return 14;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.sieve?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Sieve of Eratosthenes"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Find primes using the Sieve method."}
        >
            <div className="visualizer-container sieve">
                <div className="sieve-stats">
                    <div className="stat-item">
                        <div className="dot current"></div>
                        <span>Current Prime</span>
                    </div>
                    <div className="stat-item">
                        <div className="dot prime"></div>
                        <span>Primes Found</span>
                    </div>
                    <div className="stat-item">
                        <div className="dot crossed"></div>
                        <span>Crossed Out</span>
                    </div>
                </div>

                <div className="sieve-grid" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(limit))}, 1fr)` }}>
                    <AnimatePresence>
                        {grid?.map((item) => (
                            <motion.div
                                key={item.value}
                                layout
                                className={`sieve-cell ${item.status}`}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                {item.value}
                            </motion.div>
                        ))}
                    </AnimatePresence>
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
                    <span>Limit:</span>
                    <input
                        type="number"
                        className="limit-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button className="btn-generate" onClick={handleUpdateLimit}>Update Grid</button>
                </div>
            </div>
        </DualView>
    );
};

export default SieveVisualizer;
