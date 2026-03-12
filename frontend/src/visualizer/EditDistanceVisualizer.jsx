import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateEditDistanceSteps } from "../algorithms/dp/editDistance";
import { algorithmCodes } from "../data/algorithmCodes";
import "./EditDistanceVisualizer.css";

const EditDistanceVisualizer = () => {
    const [str1, setStr1] = useState("horse");
    const [str2, setStr2] = useState("ros");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateEditDistanceSteps(str1, str2), [str1, str2]);

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

    const handleUpdateStrings = () => {
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        switch (true) {
            case desc.includes("match"): return 32;
            case desc.includes("mismatch"): return 45;
            case desc.includes("Insert="): return 45;
            case snapshot.type === 'dp-complete': return 73;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.editDistance?.[activeLanguage] || "";

    // Parse current i and j from description for dependency highlighting
    const match = description?.match(/dp\[(\d+)\]\[(\d+)\]/);
    const currI = match ? parseInt(match[1]) : -1;
    const currJ = match ? parseInt(match[2]) : -1;

    return (
        <DualView
            algorithmName="Edit Distance"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Enter strings and press Play to see the transformation table."}
        >
            <div className="edit-distance-container">
                <div className="table-layout">
                    <div className="grid-wrapper">
                        <table className="dp-grid">
                            <thead>
                                <tr>
                                    <th className="row-header"></th>
                                    {colLabels?.map((char, j) => (
                                        <th key={`col-${j}`}>{char}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table?.map((row, i) => (
                                    <tr key={`row-${i}`}>
                                        <th className="row-header">{rowLabels?.[i]}</th>
                                        {row.map((val, j) => {
                                            const state = cellStates?.[`${i}-${j}`] || 'default';
                                            const isDependency = currI > 0 && currJ > 0 && (
                                                (i === currI - 1 && j === currJ) || // Delete
                                                (i === currI && j === currJ - 1) || // Insert
                                                (i === currI - 1 && j === currJ - 1) // Replace/Match
                                            );

                                            return (
                                                <motion.td
                                                    key={`${i}-${j}`}
                                                    className={`${state} ${isDependency && state !== 'computing' ? 'dependency' : ''}`}
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

                    <div className="stats-panel">
                        <div className="info-box">
                            <div className="box-title">Operation Details</div>
                            <div className="operation-details">
                                {description && (description.includes("Insert=") || description.includes("Characters match")) ? (
                                    <>
                                        {description.includes("Characters match") ? (
                                            <div className="op-item winner">No Operation (Match)</div>
                                        ) : (
                                            <>
                                                <div className={`op-item ${description.includes("(Insert)") ? 'winner' : ''}`}>
                                                    <span>Insert</span>
                                                    <span>{description.match(/Insert=(\d+)/)?.[1]}</span>
                                                </div>
                                                <div className={`op-item ${description.includes("(Delete)") ? 'winner' : ''}`}>
                                                    <span>Delete</span>
                                                    <span>{description.match(/Delete=(\d+)/)?.[1]}</span>
                                                </div>
                                                <div className={`op-item ${description.includes("(Replace)") ? 'winner' : ''}`}>
                                                    <span>Replace</span>
                                                    <span>{description.match(/Replace=(\d+)/)?.[1]}</span>
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        Base cases filled first...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="info-box" style={{ flex: 1 }}>
                            <div className="box-title">Legend</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#fbbf24' }}></div>
                                    <span>Computing Cell</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#38bdf8', opacity: 0.3 }}></div>
                                    <span>Dependency (Neighbors)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981' }}></div>
                                    <span>Optimal Edit Path</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="controls-wrapper">
                    <div className="anim-controls">
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

                    <div className="input-section">
                        <input
                            type="text"
                            className="str-input"
                            value={str1}
                            onChange={(e) => setStr1(e.target.value)}
                            placeholder="Source"
                        />
                        <span style={{ alignSelf: 'center', color: '#94a3b8' }}>→</span>
                        <input
                            type="text"
                            className="str-input"
                            value={str2}
                            onChange={(e) => setStr2(e.target.value)}
                            placeholder="Target"
                        />
                        <button className="btn-edit" onClick={handleUpdateStrings}>Update</button>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default EditDistanceVisualizer;
