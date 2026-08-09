import React, { useState, useMemo } from "react";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateKnapsackSteps } from "../algorithms/dp/knapsack";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaCheck, FaRedo } from "react-icons/fa";
import "./KnapsackVisualizer.css";

const DEFAULT_WEIGHTS  = [1, 3, 4, 5];
const DEFAULT_VALUES   = [1, 4, 5, 7];
const DEFAULT_CAPACITY = 7;

const KnapsackVisualizer = () => {
    const [capacity, setCapacity]         = useState(DEFAULT_CAPACITY);
    const [weights, setWeights]           = useState(DEFAULT_WEIGHTS);
    const [values, setValues]             = useState(DEFAULT_VALUES);
    const [inputWeightsStr, setInputWeightsStr] = useState(DEFAULT_WEIGHTS.join(', '));
    const [inputValuesStr, setInputValuesStr]   = useState(DEFAULT_VALUES.join(', '));
    const [inputCapStr, setInputCapStr]         = useState(String(DEFAULT_CAPACITY));
    const [activeLanguage, setActiveLanguage]   = useState("javascript");

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
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { table, cellStates, rowLabels, colLabels, description } = stepData;

    const handleApply = () => {
        try {
            const wArr = inputWeightsStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            const vArr = inputValuesStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
            const cap  = parseInt(inputCapStr.trim(), 10);

            if (wArr.length === 0 || vArr.length === 0) throw new Error("Enter valid non-empty weights and values.");
            if (wArr.length !== vArr.length) throw new Error("Weights and values count must match.");
            if (wArr.length > 7) throw new Error("Maximum 7 items allowed for clear layout.");
            if (isNaN(cap) || cap <= 0 || cap > 15) throw new Error("Capacity must be between 1 and 15.");

            setWeights(wArr);
            setValues(vArr);
            setCapacity(cap);
            reset();
            toast.success("Applied new 0/1 Knapsack configuration!");
        } catch (err) {
            toast.error(err.message || "Invalid input.");
        }
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        if (desc.includes("max(") || (desc.includes("Item") && desc.includes("Include"))) return 9;
        if (desc.includes("doesn't fit")) return 14;
        if (snapshot.type === 'dp-complete' || snapshot.type === 'complete') return 18;
        return 6;
    };

    const codeSnippet = algorithmCodes.knapsack?.[activeLanguage] || "";

    const match    = description?.match(/Item (\d+).*capacity (\d+)/);
    const currentI = match ? parseInt(match[1], 10) : -1;

    return (
        <DualView
            algorithmName="0/1 Knapsack (Dynamic Programming)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="dp"
            description={
                <div className="ks-desc-wrapper">
                    <span className="ks-badge">0/1 DP Table O(N × W)</span>
                    <span className="ks-badge-desc">
                        {description || "Press Play to compute optimal item combinations using DP."}
                    </span>
                </div>
            }
        >
            <div className="ks-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="ks-input-panel">
                    <div className="ks-input-group">
                        <label className="ks-input-label">Weights:</label>
                        <input
                            type="text"
                            value={inputWeightsStr}
                            onChange={(e) => setInputWeightsStr(e.target.value)}
                            placeholder="1, 3, 4, 5"
                            className="ks-text-input"
                        />
                    </div>

                    <div className="ks-input-group">
                        <label className="ks-input-label">Values:</label>
                        <input
                            type="text"
                            value={inputValuesStr}
                            onChange={(e) => setInputValuesStr(e.target.value)}
                            placeholder="1, 4, 5, 7"
                            className="ks-text-input"
                        />
                    </div>

                    <div className="ks-input-group">
                        <label className="ks-input-label">Cap (W):</label>
                        <input
                            type="number"
                            min="1"
                            max="15"
                            value={inputCapStr}
                            onChange={(e) => setInputCapStr(e.target.value)}
                            className="ks-number-input"
                        />
                    </div>

                    <div className="ks-btn-group">
                        <button onClick={handleApply} className="ks-btn ks-btn-primary">
                            <FaCheck /> Solve
                        </button>
                        <button onClick={() => { setWeights(DEFAULT_WEIGHTS); setValues(DEFAULT_VALUES); setCapacity(DEFAULT_CAPACITY); setInputWeightsStr(DEFAULT_WEIGHTS.join(', ')); setInputValuesStr(DEFAULT_VALUES.join(', ')); setInputCapStr(String(DEFAULT_CAPACITY)); reset(); }} className="ks-btn ks-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    {/* Top Compact Legend Pills */}
                    <div className="ks-legend">
                        <div className="ks-leg-item"><span className="ks-dot yellow"></span> Computing</div>
                        <div className="ks-leg-item"><span className="ks-dot blue"></span> DP Filled</div>
                        <div className="ks-leg-item"><span className="ks-dot green"></span> Optimal Choice</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: 2D DP Table & Inventory Card ─────── */}
                <div className="ks-canvas-wrapper">
                    
                    {/* DP Table */}
                    <div className="ks-table-card">
                        <div className="ks-card-title">2D DP Matrix <code>dp[i][w]</code></div>
                        <div className="ks-table-scroll">
                            <table className="ks-dp-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-corner">Item \ Cap</th>
                                        {colLabels?.map(label => <th key={label}>{label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {table?.map((row, i) => (
                                        <tr key={i}>
                                            <th className="row-header">{rowLabels?.[i]}</th>
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

                    {/* Inventory Items List */}
                    <div className="ks-inventory-card">
                        <div className="ks-card-title">Items Inventory</div>
                        <div className="ks-item-list">
                            {weights.map((w, idx) => {
                                const isActive = currentI === idx + 1;
                                return (
                                    <div key={idx} className={`ks-item-chip ${isActive ? 'active' : ''}`}>
                                        <span className="item-name">Item {idx + 1}</span>
                                        <div className="item-badges">
                                            <span className="badge badge-w">W: {w}</span>
                                            <span className="badge badge-v">V: {values[idx]}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="ks-controls-wrapper">
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

export default KnapsackVisualizer;
