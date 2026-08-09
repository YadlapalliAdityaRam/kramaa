import React, { useState, useMemo } from "react";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateEditDistanceSteps } from "../algorithms/dp/editDistance";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaCheck, FaRandom, FaRedo } from "react-icons/fa";
import "./EditDistanceVisualizer.css";

const EditDistanceVisualizer = () => {
    const [str1, setStr1]                 = useState("horse");
    const [str2, setStr2]                 = useState("ros");
    const [tempStr1, setTempStr1]         = useState("horse");
    const [tempStr2, setTempStr2]         = useState("ros");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateEditDistanceSteps(str1, str2), [str1, str2]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        setIndex,
        speed,
        setSpeed
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { table, cellStates, rowLabels, colLabels, description } = stepData;

    const handleApply = () => {
        if (!tempStr1 || !tempStr2) {
            toast.error("Both strings must be non-empty.");
            return;
        }
        if (tempStr1.length > 8 || tempStr2.length > 8) {
            toast.error("Max 8 characters per string for clear grid rendering.");
            return;
        }
        setStr1(tempStr1);
        setStr2(tempStr2);
        reset();
        toast.success("Updated strings for Edit Distance!");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        if (desc.includes("match")) return 12;
        if (desc.includes("mismatch") || desc.includes("Insert=")) return 14;
        if (snapshot.type === 'dp-complete' || snapshot.type === 'complete') return 23;
        return 11;
    };

    const codeSnippet = algorithmCodes.editDistance?.[activeLanguage] || "";

    const match  = description?.match(/dp\[(\d+)\]\[(\d+)\]/);
    const currI  = match ? parseInt(match[1], 10) : -1;
    const currJ  = match ? parseInt(match[2], 10) : -1;

    return (
        <DualView
            algorithmName="Edit Distance (Levenshtein Distance)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="dp"
            description={
                <div className="ed-desc-wrapper">
                    <span className="ed-badge">Dynamic Programming O(M × N)</span>
                    <span className="ed-desc-text">
                        {description || "Press Play to compute minimum operations (Insert, Delete, Replace)."}
                    </span>
                </div>
            }
        >
            <div className="ed-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="ed-input-panel">
                    <div className="ed-input-group">
                        <label className="ed-input-label">Word 1:</label>
                        <input
                            type="text"
                            value={tempStr1}
                            onChange={(e) => setTempStr1(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="horse"
                            className="ed-text-input"
                        />
                    </div>

                    <div className="ed-input-group">
                        <label className="ed-input-label">Word 2:</label>
                        <input
                            type="text"
                            value={tempStr2}
                            onChange={(e) => setTempStr2(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="ros"
                            className="ed-text-input"
                        />
                    </div>

                    <div className="ed-btn-group">
                        <button onClick={handleApply} className="ed-btn ed-btn-primary">
                            <FaCheck /> Apply
                        </button>
                        <button onClick={() => { setStr1("horse"); setStr2("ros"); setTempStr1("horse"); setTempStr2("ros"); reset(); }} className="ed-btn ed-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="ed-legend">
                        <div className="ed-leg-item"><span className="ed-dot yellow"></span> Computing</div>
                        <div className="ed-leg-item"><span className="ed-dot blue"></span> Dependency</div>
                        <div className="ed-leg-item"><span className="ed-dot green"></span> Final Distance</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: 2D Matrix Table ───────────────── */}
                <div className="ed-canvas-wrapper">
                    <div className="ed-table-card">
                        <div className="ed-card-header">
                            <span>2D DP Table <code>dp[i][j]</code></span>
                        </div>
                        <div className="ed-table-scroll">
                            <table className="ed-dp-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-corner">w1 \ w2</th>
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
                                                    (i === currI - 1 && j === currJ) ||
                                                    (i === currI && j === currJ - 1) ||
                                                    (i === currI - 1 && j === currJ - 1)
                                                );

                                                return (
                                                    <td
                                                        key={`${i}-${j}`}
                                                        className={`cell-${state} ${isDependency && state !== 'computing' ? 'cell-dependency' : ''}`}
                                                    >
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="ed-controls-wrapper">
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

export default EditDistanceVisualizer;
