import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import TreeCanvas from "./TreeCanvas";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateRedBlackTreeSteps } from "../algorithms/trees/redBlackTree";
import { algorithmCodes } from "../data/algorithmCodes";
import "./RedBlackTreeVisualizer.css";

const RedBlackTreeVisualizer = () => {
    const [inputValues, setInputValues] = useState([15, 10, 25, 5, 20]);
    const [newVal, setNewVal] = useState("");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateRedBlackTreeSteps(inputValues), [inputValues]);

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
    const { treeData, nodeStates, description } = stepData;

    const handleBuildTree = () => {
        if (!newVal.trim()) return;
        const vals = newVal.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
        if (vals.length > 0) {
            setInputValues(vals);
            reset();
        }
    };

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
        // Basic mapping for RB tree logic
        switch (true) {
            case snapshot.description.includes("Insert"): return 1;
            case snapshot.description.includes("rotate"): return 10;
            case snapshot.description.includes("Color flip") || snapshot.description.includes("recolor"): return 20;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.redBlackTree?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Red-Black Tree"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Enter values and press Play to see the Red-Black Tree balancing process."}
        >
            <div className="rb-tree-container">
                <div className="rbt-dashboard">
                    {/* Left side: Input Controls */}
                    <div className="rbt-input-section">
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Tree Input</div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>Enter comma-separated values to build</p>
                        <div className="input-group">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. 10, 20, 30 or 15"
                                value={newVal}
                                onChange={(e) => setNewVal(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        if (newVal.includes(',')) handleBuildTree();
                                        else handleAddNode();
                                    }
                                }}
                            />
                            <button className="btn-add" onClick={() => newVal.includes(',') ? handleBuildTree() : handleAddNode()}>
                                {newVal.includes(',') ? 'Build Tree' : 'Insert Node'}
                            </button>
                            <button className="btn-random" onClick={handleRandom}>Random Array</button>
                        </div>

                        <div className="legend-bar" style={{ justifyContent: 'flex-start', marginTop: '10px' }}>
                            <div className="legend-item"><div className="l-dot black" style={{ background: '#1f2937' }}></div> Black</div>
                            <div className="legend-item"><div className="l-dot red" style={{ background: '#ef4444' }}></div> Red</div>
                            <div className="legend-item"><div className="l-dot visiting" style={{ background: '#06b6d4' }}></div> Search</div>
                            <div className="legend-item"><div className="l-dot rotated" style={{ background: '#ec4899' }}></div> Rotate</div>
                        </div>
                    </div>

                    {/* Right side: Properties Dashboard */}
                    <div className="rbt-properties-section">
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Algorithm Complexities</div>
                        <div className="rbt-props-grid">
                            <div className="rbt-prop-card">
                                <span className="rbt-prop-label">Time (Search)</span>
                                <span className="rbt-prop-value">O(log N)</span>
                            </div>
                            <div className="rbt-prop-card">
                                <span className="rbt-prop-label">Time (Insert)</span>
                                <span className="rbt-prop-value">O(log N)</span>
                            </div>
                            <div className="rbt-prop-card">
                                <span className="rbt-prop-label">Time (Delete)</span>
                                <span className="rbt-prop-value">O(log N)</span>
                            </div>
                            <div className="rbt-prop-card">
                                <span className="rbt-prop-label">Space</span>
                                <span className="rbt-prop-value">O(N)</span>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px', lineHeight: '1.4' }}>
                            Red-Black Trees maintain balance by ensuring no path from the root to a leaf is more than twice as long as any other path, guaranteeing <b>O(log N)</b> operations.
                        </div>
                    </div>
                </div>

                {/* Array Display */}
                {stepData?.arraySnapshot && stepData.arraySnapshot.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        {stepData.arraySnapshot.map((val, idx) => {
                            const isHighlighted = stepData.activeArrayIndex === idx;
                            const isProcessing = stepData.activeArrayIndex !== -1 && idx > stepData.activeArrayIndex;
                            return (
                                <div key={idx} style={{ textAlign: 'center' }}>
                                    <div style={{
                                        border: isHighlighted ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                                        background: isHighlighted ? 'rgba(239, 68, 68, 0.2)' : (isProcessing ? 'rgba(15,23,42,0.4)' : 'rgba(30,41,59,0.5)'),
                                        color: isHighlighted ? '#fff' : (isProcessing ? '#64748b' : '#cbd5e1'),
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        fontWeight: '600',
                                        minWidth: '40px',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {val}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', fontWeight: isHighlighted ? 'bold' : 'normal' }}>{idx}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="tree-display-area">
                    {(!treeData || !treeData.id) && (
                        <div className="rbt-empty-state">
                            <h3>Tree is Empty</h3>
                            <p>Enter values above and click "Build Tree" or "Random Array".</p>
                        </div>
                    )}
                    <TreeCanvas
                        treeData={treeData}
                        nodeStates={nodeStates || {}}
                    />
                </div>

                <div className="controls-section">
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
            </div>
        </DualView>
    );
};

export default RedBlackTreeVisualizer;
