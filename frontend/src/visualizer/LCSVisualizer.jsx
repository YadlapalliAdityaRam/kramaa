import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateLCSSteps } from "../algorithms/dp/lcs";
import { algorithmCodes } from "../data/algorithmCodes";
import "./LCSVisualizer.css";

const LCSVisualizer = () => {
    const [str1, setStr1] = useState("ABCBDAB");
    const [str2, setStr2] = useState("BDCAB");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

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
            case desc.includes("Match!") || desc.includes("=="): return 29;
            case desc.includes("max(") || desc.includes("≠"): return 41;
            case snapshot.type === 'dp-complete': return 76;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.lcs?.[activeLanguage] || "";

    // Parse current i and j from description for dependency highlighting
    const match = description?.match(/dp\[(\d+)\]\[(\d+)\]/);
    const currI = match ? parseInt(match[1]) : -1;
    const currJ = match ? parseInt(match[2]) : -1;
    const isMatchOp = description?.includes("Match!");
    const isMismatchOp = description?.includes("max(");

    // Extract characters being compared
    const char1 = description?.match(/'(.)' ==/)?.[1] || description?.match(/'(.)' ≠/)?.[1];
    const char2 = description?.match(/== '(.)'/)?.[1] || description?.match(/≠ '(.)'/)?.[1];

    // Extract final result
    const lcsResult = description?.match(/LCS = "(.*)"/)?.[1];

    return (
        <DualView
            algorithmName="Longest Common Subsequence"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Enter strings and press Play to build the LCS table."}
        >
            <div className="lcs-container">
                <div className="table-layout">
                    <div className="grid-wrapper">
                        <table className="dp-grid">
                            <thead>
                                <tr>
                                    <th className="row-header"></th>
                                    {colLabels?.map((char, j) => (
                                        <th key={`col-${j}`} className={currJ === j && char === char2 ? 'matched-char' : ''}>
                                            {char}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table?.map((row, i) => (
                                    <tr key={`row-${i}`}>
                                        <th className={`row-header ${currI === i && rowLabels?.[i] === char1 ? 'matched-char' : ''}`}>
                                            {rowLabels?.[i]}
                                        </th>
                                        {row.map((val, j) => {
                                            const state = cellStates?.[`${i}-${j}`] || 'default';
                                            let isDependency = false;
                                            let depType = '';

                                            if (currI > 0 && currJ > 0) {
                                                if (isMatchOp && i === currI - 1 && j === currJ - 1) {
                                                    isDependency = true;
                                                    depType = 'dependency-match';
                                                } else if (isMismatchOp && ((i === currI - 1 && j === currJ) || (i === currI && j === currJ - 1))) {
                                                    isDependency = true;
                                                    depType = 'dependency';
                                                }
                                            }

                                            return (
                                                <motion.td
                                                    key={`${i}-${j}`}
                                                    className={`${state} ${isDependency && state !== 'computing' ? depType : ''}`}
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
                            <div className="box-title">Current Operation</div>
                            <div className="logic-display">
                                {isMatchOp ? (
                                    <div className="logic-step match">
                                        <strong>Characters Match!</strong><br />
                                        '{char1}' == '{char2}'<br />
                                        dp[i][j] = dp[i-1][j-1] + 1
                                    </div>
                                ) : isMismatchOp ? (
                                    <div className="logic-step mismatch">
                                        <strong>Characters Mismatch</strong><br />
                                        '{char1}' ≠ '{char2}'<br />
                                        dp[i][j] = max(Top, Left)
                                    </div>
                                ) : (
                                    <div className="logic-step">
                                        Waiting for operation...
                                    </div>
                                )}
                            </div>
                        </div>

                        {type === 'dp-complete' && lcsResult && (
                            <motion.div
                                className="result-display"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                            >
                                LCS: "{lcsResult}"
                            </motion.div>
                        )}

                        <div className="info-box" style={{ flex: 1 }}>
                            <div className="box-title">Legend</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#fbbf24' }}></div>
                                    <span>Computing Cell</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#10b981', opacity: 0.3 }}></div>
                                    <span>Match Found (Diagonal + 1)</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#38bdf8', opacity: 0.3 }}></div>
                                    <span>Mismatch (max Top/Left)</span>
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
                            onChange={(e) => setStr1(e.target.value.toUpperCase())}
                            placeholder="String 1"
                        />
                        <span style={{ alignSelf: 'center', color: '#94a3b8' }}>&</span>
                        <input
                            type="text"
                            className="str-input"
                            value={str2}
                            onChange={(e) => setStr2(e.target.value.toUpperCase())}
                            placeholder="String 2"
                        />
                        <button className="btn-lcs" onClick={handleUpdateStrings}>Update</button>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default LCSVisualizer;
