import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateKnapsackSteps } from "../algorithms/dp/knapsack";
import { algorithmCodes } from "../data/algorithmCodes";
import "./KnapsackVisualizer.css";

const KnapsackVisualizer = () => {
    const [capacity, setCapacity] = useState(7);
    const [weights, setWeights] = useState([1, 3, 4, 5]);
    const [values, setValues] = useState([1, 4, 5, 7]);
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateKnapsackSteps(capacity, weights, values), [capacity, weights, values]);

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
    const { table, cellStates, rowLabels, colLabels, description, type } = stepData;

    const handleReset = () => {
        setCapacity(7);
        setWeights([1, 3, 4, 5]);
        setValues([1, 4, 5, 7]);
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        switch (true) {
            case desc.includes("Item") && desc.includes("Include"): return 30;
            case desc.includes("doesn't fit"): return 54;
            case desc.includes("max("): return 42;
            case snapshot.type === 'dp-complete': return 84;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.knapsack?.[activeLanguage] || "";

    // Extract current i and j from description for inventory highlighting
    const match = description?.match(/Item (\d+).*capacity (\d+)/);
    const currentI = match ? parseInt(match[1]) : -1;
    const currentJ = match ? parseInt(match[2]) : -1;

    return (
        <DualView
            algorithmName="0/1 Knapsack (DP)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Press Play to start building the DP table."}
        >
            <div className="knapsack-container">
                <div className="knapsack-layout">
                    <div className="table-wrapper">
                        <table className="dp-table">
                            <thead>
                                <tr>
                                    <th>Item \ Cap</th>
                                    {colLabels?.map(label => <th key={label}>{label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {table?.map((row, i) => (
                                    <tr key={i}>
                                        <td style={{ background: '#1e293b', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                            {rowLabels?.[i]}
                                        </td>
                                        {row.map((val, j) => {
                                            const state = cellStates?.[`${i}-${j}`] || 'default';
                                            return (
                                                <motion.td
                                                    key={`${i}-${j}`}
                                                    className={state}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    {val}
                                                </motion.td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="inventory-panel">
                        <div className="inventory-card">
                            <div className="card-title">Item Inventory</div>
                            <div className="item-list">
                                {weights.map((w, idx) => (
                                    <div
                                        key={idx}
                                        className={`item-row ${currentI === idx + 1 ? 'active' : ''}`}
                                    >
                                        <span>Item {idx + 1}</span>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <span className="badge badge-w">W:{w}</span>
                                            <span className="badge badge-v">V:{values[idx]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {description && description.includes("Include =") && (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="decision-box"
                            >
                                <strong>Decision Logic:</strong>
                                <p style={{ fontSize: '0.75rem', marginTop: '8px' }}>
                                    {description.split('.')[0]}.
                                </p>
                            </motion.div>
                        )}

                        <div className="inventory-card" style={{ flex: 1 }}>
                            <div className="card-title">Legend</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#fbbf24' }}></div>
                                    <span>Computing Cell</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#38bdf8', opacity: 0.3 }}></div>
                                    <span>Filled Value</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981' }}></div>
                                    <span>Optimal Choice</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="knapsack-controls">
                    <div className="anim-controls-wrapper">
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

export default KnapsackVisualizer;
