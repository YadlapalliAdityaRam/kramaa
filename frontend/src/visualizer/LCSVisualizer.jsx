import React, { useState, useMemo } from "react";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateLCSSteps } from "../algorithms/dp/lcs";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaCheck, FaRedo } from "react-icons/fa";
import "./LCSVisualizer.css";

const LCSVisualizer = () => {
    const [str1, setStr1]                       = useState("ABCBDAB");
    const [str2, setStr2]                       = useState("BDCAB");
    const [inputStr1, setInputStr1]             = useState("ABCBDAB");
    const [inputStr2, setInputStr2]             = useState("BDCAB");
    const [activeLanguage, setActiveLanguage]   = useState("javascript");

    const steps = useMemo(() => generateLCSSteps(str1, str2), [str1, str2]);

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
    const { table, cellStates, rowLabels, colLabels, description, type } = stepData;

    const handleApply = () => {
        const s1 = inputStr1.trim().toUpperCase();
        const s2 = inputStr2.trim().toUpperCase();
        if (!s1 || !s2) {
            toast.error("Please enter non-empty strings.");
            return;
        }
        if (s1.length > 10 || s2.length > 10) {
            toast.error("Maximum 10 characters per string allowed.");
            return;
        }
        setStr1(s1);
        setStr2(s2);
        reset();
        toast.success("Applied new strings!");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        if (desc.includes("Match!") || desc.includes("==")) return 8;
        if (desc.includes("max(") || desc.includes("≠")) return 10;
        if (snapshot.type === 'dp-complete') return 14;
        return 6;
    };

    const codeSnippet = algorithmCodes.lcs?.[activeLanguage] || "";

    const match = description?.match(/dp\[(\d+)\]\[(\d+)\]/);
    const currI = match ? parseInt(match[1], 10) : -1;
    const currJ = match ? parseInt(match[2], 10) : -1;
    const char1 = description?.match(/'(.)' ==/)?.[1] || description?.match(/'(.)' ≠/)?.[1];
    const char2 = description?.match(/== '(.)'/)?.[1] || description?.match(/≠ '(.)'/)?.[1];
    const lcsResult = description?.match(/LCS = "(.*)"/)?.[1];

    return (
        <DualView
            algorithmName="Longest Common Subsequence (LCS)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="dp"
            description={
                <div className="lcs-desc-wrapper">
                    <span className="lcs-badge">2D DP Matrix O(M × N)</span>
                    <span className="lcs-desc-text">
                        {description || "Press Play to build the LCS dynamic programming table."}
                    </span>
                </div>
            }
        >
            <div className="lcs-visualizer-wrapper">

                {/* Top Input Controls Panel */}
                <div className="lcs-input-panel">
                    <div className="lcs-input-group">
                        <label className="lcs-input-label">Str 1:</label>
                        <input
                            type="text"
                            value={inputStr1}
                            onChange={(e) => setInputStr1(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            className="lcs-text-input"
                        />
                    </div>

                    <div className="lcs-input-group">
                        <label className="lcs-input-label">Str 2:</label>
                        <input
                            type="text"
                            value={inputStr2}
                            onChange={(e) => setInputStr2(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            className="lcs-text-input"
                        />
                    </div>

                    <div className="lcs-btn-group">
                        <button onClick={handleApply} className="lcs-btn lcs-btn-primary">
                            <FaCheck /> Compute
                        </button>
                        <button onClick={() => { setStr1("ABCBDAB"); setStr2("BDCAB"); setInputStr1("ABCBDAB"); setInputStr2("BDCAB"); reset(); }} className="lcs-btn lcs-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="lcs-legend">
                        <div className="lcs-leg-item"><span className="lcs-dot yellow"></span> Computing</div>
                        <div className="lcs-leg-item"><span className="lcs-dot green"></span> Match (+1)</div>
                        <div className="lcs-leg-item"><span className="lcs-dot blue"></span> Mismatch (Max)</div>
                    </div>
                </div>

                {/* Main Stage: 2D DP Table & Active Match Status */}
                <div className="lcs-canvas-wrapper">
                    
                    {/* DP Matrix Table Card */}
                    <div className="lcs-table-card">
                        <div className="lcs-card-title">LCS Matrix <code>dp[i][j]</code></div>
                        <div className="lcs-table-scroll">
                            <table className="lcs-dp-grid">
                                <thead>
                                    <tr>
                                        <th className="sticky-corner">Str1 \ Str2</th>
                                        {colLabels?.map((char, j) => (
                                            <th key={`col-${j}`} className={currJ === j && char === char2 ? 'char-matched' : ''}>
                                                {char}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {table?.map((row, i) => (
                                        <tr key={`row-${i}`}>
                                            <th className={`row-header ${currI === i && rowLabels?.[i] === char1 ? 'char-matched' : ''}`}>
                                                {rowLabels?.[i]}
                                            </th>
                                            {row.map((val, j) => {
                                                const state = cellStates?.[`${i}-${j}`] || 'default';
                                                return (
                                                    <td key={`${i}-${j}`} className={`cell-${state}`}>
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

                    {/* Side Info & Result Card */}
                    <div className="lcs-info-card">
                        <h4 className="card-title">Comparison State</h4>

                        <div className="char-compare-box">
                            <div className="char-badge">{char1 || '-'}</div>
                            <span className="compare-op">{description?.includes('Match!') ? '==' : '≠'}</span>
                            <div className="char-badge">{char2 || '-'}</div>
                        </div>

                        {lcsResult && (
                            <div className="lcs-result-box">
                                <span className="res-lbl">LCS String:</span>
                                <span className="res-val">"{lcsResult}"</span>
                            </div>
                        )}
                    </div>

                </div>

                {/* YouTube Video Player Controls */}
                <div className="lcs-controls-wrapper">
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

export default LCSVisualizer;
