import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateCycleSortSteps } from '../algorithms/sorting/cycleSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaCheck, FaRedo, FaInfoCircle, FaHdd } from 'react-icons/fa';
import './CycleSortVisualizer.css';

const DEFAULT_ARRAY = [5, 2, 8, 4, 1, 9, 3, 7];

const CycleSortVisualizer = () => {
    const [arrayInput, setArrayInput]         = useState(DEFAULT_ARRAY);
    const [inputValue, setInputValue]         = useState(DEFAULT_ARRAY.join(", "));
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showIntuition, setShowIntuition]   = useState(true);

    const steps = useMemo(
        () => generateCycleSortSteps(arrayInput),
        [arrayInput]
    );

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

    const handleGenerateRandom = () => {
        const size = 8;
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 85) + 10);
        setArrayInput(newArray);
        setInputValue(newArray.join(", "));
        reset();
        toast.success(`Generated random array!`);
    };

    const handleCustomInput = () => {
        const values = inputValue.split(",")
            .map(v => parseInt(v.trim(), 10))
            .filter(v => !isNaN(v));

        if (values.length < 3) {
            toast.error("Please enter at least 3 numbers.");
            return;
        }
        if (values.length > 15) {
            toast.error("Maximum 15 numbers allowed.");
            return;
        }

        setArrayInput(values);
        reset();
        toast.success("Custom array updated!");
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info':         return 4;
            case 'pickup':       return 5;
            case 'count':        return 10;
            case 'place':        return 16;
            case 'rotate-start': return 27;
            case 'completed':    return 31;
            default:             return 0;
        }
    };

    const currentArray = currentStep?.array || arrayInput;
    const maxValue     = Math.max(...currentArray, 1);
    const codeSnippet  = algorithmCodes.cycleSort?.[activeLanguage] || '';
    const stepData     = currentStep || {};

    return (
        <DualView
            algorithmName="Cycle Sort (Optimal Memory Writes)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="cyc-desc-wrapper">
                    <span className="cyc-badge">In-Place O(N²) / O(1) Memory Writes</span>
                    <span className="cyc-desc-text">
                        {currentStep?.description || 'Press Play to observe Cycle Sort performing theoretically minimum memory writes.'}
                    </span>
                </div>
            }
        >
            <div className="cyc-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="cyc-input-panel">
                    <div className="cyc-input-group">
                        <label className="cyc-input-label">Array:</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomInput()}
                            placeholder="5, 2, 8, 4, 1"
                            className="cyc-text-input"
                        />
                        <button onClick={handleCustomInput} className="cyc-btn cyc-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="cyc-btn-group">
                        <button onClick={handleGenerateRandom} className="cyc-btn cyc-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => setShowIntuition(!showIntuition)} className="cyc-btn cyc-btn-outline">
                            <FaInfoCircle /> {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                        </button>
                        <button onClick={() => { setArrayInput(DEFAULT_ARRAY); setInputValue(DEFAULT_ARRAY.join(", ")); reset(); }} className="cyc-btn cyc-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="cyc-legend">
                        <div className="cyc-leg-item"><span className="cyc-dot cyc-dot-held"></span> Held Element</div>
                        <div className="cyc-leg-item"><span className="cyc-dot cyc-dot-scan"></span> Scanning Index</div>
                        <div className="cyc-leg-item"><span className="cyc-dot cyc-dot-target"></span> Target Pos</div>
                        <div className="cyc-leg-item"><span className="cyc-dot cyc-dot-sorted"></span> Sorted</div>
                    </div>
                </div>

                {/* Educational Intuition Card */}
                {showIntuition && (
                    <div className="cyc-intuition-panel">
                        <h4>🔄 The Minimal Write Advantage</h4>
                        <p>
                            Cycle Sort decomposes the array into permutation cycles. Each element is placed directly into its <strong>final sorted position</strong>, making at most <strong>O(N) total writes</strong> to memory—ideal for Flash or EEPROM storage!
                        </p>
                    </div>
                )}

                {/* ── Main Canvas Stage: Live Metrics & Animated Bars ─────── */}
                <div className="cyc-canvas-wrapper">

                    {/* Cycle State Dashboard Cards */}
                    <div className="cyc-metrics-row">
                        <div className="cyc-metric-card held-card">
                            <span className="m-lbl">Held Element</span>
                            <span className="m-val purple">
                                {stepData.heldItem !== undefined && stepData.heldItem !== null ? stepData.heldItem : '-'}
                            </span>
                        </div>
                        <div className="cyc-metric-card">
                            <span className="m-lbl">Target Position (Pos)</span>
                            <span className="m-val red">
                                {stepData.targetPos !== undefined && stepData.targetPos !== -1 ? `idx ${stepData.targetPos}` : '-'}
                            </span>
                        </div>
                        <div className="cyc-metric-card">
                            <span className="m-lbl">Memory Writes</span>
                            <span className="m-val green">
                                <FaHdd style={{ fontSize: '0.9rem', marginRight: '4px' }} /> {stepData.writes ?? 0}
                            </span>
                        </div>
                    </div>

                    {/* Animated Bar Chart Grid */}
                    <div className="cyc-bars-container">
                        {currentArray.map((val, idx) => {
                            const heightPercent = Math.max(22, (val / maxValue) * 100);

                            const isSorted  = stepData.sortedIndices?.includes(idx);
                            const isScan    = idx === stepData.scanningIdx;
                            const isTarget  = idx === stepData.targetPos;
                            const isHeldFrom= idx === stepData.heldFrom;

                            let stateClass = 'default';
                            let badgeLabel = null;

                            if (isSorted) { stateClass = 'sorted'; badgeLabel = 'Sorted'; }
                            if (isTarget) { stateClass = 'target'; badgeLabel = 'Target'; }
                            if (isScan)   { stateClass = 'scanning'; badgeLabel = 'Scan'; }
                            if (isHeldFrom) { stateClass = 'held'; badgeLabel = 'Held'; }

                            return (
                                <div key={idx} className="cyc-bar-wrapper">
                                    {badgeLabel && (
                                        <span className={`cyc-top-badge badge-${stateClass}`}>
                                            {badgeLabel}
                                        </span>
                                    )}
                                    <div
                                        className={`cyc-bar ${stateClass}`}
                                        style={{ height: `${heightPercent}%` }}
                                    >
                                        <span className="cyc-bar-val">{val}</span>
                                    </div>
                                    <span className="cyc-bar-idx">[{idx}]</span>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="cyc-controls-wrapper">
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

export default CycleSortVisualizer;
