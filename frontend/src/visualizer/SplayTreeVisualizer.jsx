import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import TreeCanvas from "./TreeCanvas";
import InputArrayDisplay from "../components/InputArrayDisplay";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateSplayTreeSteps } from "../algorithms/trees/splayTree";
import { algorithmCodes } from "../data/algorithmCodes";
import "./SplayTreeVisualizer.css";

const SplayTreeVisualizer = () => {
    const [inputValues, setInputValues] = useState([15, 10, 25, 5, 20]);
    const [newVal, setNewVal] = useState("");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateSplayTreeSteps(inputValues), [inputValues]);

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
    const { treeData, nodeStates, description, type } = stepData;

    const handleAddNode = () => {
        const val = parseInt(newVal);
        if (!isNaN(val) && !inputValues.includes(val)) {
            setInputValues([...inputValues, val]);
            setNewVal("");
            reset();
        }
    };

    const handleRandom = () => {
        const randomVals = Array.from({ length: 6 }, () => Math.floor(Math.random() * 50));
        setInputValues([...new Set(randomVals)]);
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        // Basic mapping for splay tree logic
        switch (true) {
            case snapshot.description.includes("Insert"): return 147;
            case snapshot.description.includes("Zig-Zig"): return 54;
            case snapshot.description.includes("Zig-Zag"): return 70;
            case snapshot.description.includes("Zig:"): return 91;
            case snapshot.type === 'tree-complete': return 243;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.splayTree?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Splay Tree"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Enter values and press Play to see the splaying process."}
        >
            <div className="splay-tree-container">
                <div className="legend-bar">
                    <div className="legend-item"><div className="l-dot unvisited" style={{ background: '#64748b' }}></div> Default</div>
                    <div className="legend-item"><div className="l-dot visiting" style={{ background: '#fbbf24' }}></div> Searching</div>
                    <div className="legend-item"><div className="l-dot rotated" style={{ background: '#38bdf8' }}></div> Rotating</div>
                    <div className="legend-item"><div className="l-dot inserted" style={{ background: '#10b981' }}></div> New Node</div>
                </div>

                {stepData?.arraySnapshot && (
                    <InputArrayDisplay
                        arraySnapshot={stepData.arraySnapshot}
                        activeArrayIndex={stepData.activeArrayIndex}
                    />
                )}

                <div className="tree-display-area">
                    {description && description.includes("Zig") && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rotation-overlay"
                        >
                            {description.split(':')[0]}
                        </motion.div>
                    )}
                    <TreeCanvas
                        treeData={treeData}
                        nodeStates={nodeStates || {}}
                    />
                </div>

                <div className="controls-section">
                    <div className="cs-controls-wrapper">
                        <AnimationControls inputType="none"
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

                    <div className="input-group">
                        <input
                            type="number"
                            className="input-field"
                            placeholder="Add value (0-99)"
                            value={newVal}
                            onChange={(e) => setNewVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddNode()}
                        />
                        <button className="btn-add" onClick={handleAddNode}>Insert & Splay</button>
                        <button className="btn-random" onClick={handleRandom}>Random Tree</button>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default SplayTreeVisualizer;
