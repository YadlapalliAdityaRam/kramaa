import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFibonacciSearchSteps } from '../algorithms/searching/fibonacciSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaCheck, FaInfoCircle, FaRedo } from 'react-icons/fa';
import './FibonacciSearchVisualizer.css';

const DEFAULT_ARRAY = [3, 7, 12, 18, 21, 25, 30, 36, 40, 45, 52, 60, 68, 75, 82];

const FibonacciSearchVisualizer = () => {
    const [arrayInput, setArrayInput]         = useState(DEFAULT_ARRAY);
    const [target, setTarget]                 = useState(25);
    const [tempTarget, setTempTarget]         = useState(25);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showIntuition, setShowIntuition]   = useState(true);

    const steps = useMemo(
        () => generateFibonacciSearchSteps(arrayInput, target),
        [arrayInput, target]
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

    const handleApplyTarget = () => {
        setTarget(tempTarget);
        reset();
        toast.success(`Target updated to ${tempTarget}!`);
    };

    const handleGenerateRandom = () => {
        const size = 15;
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 2)
            .sort((a, b) => a - b);
        setArrayInput(newArray);
        const randomTarget = newArray[Math.floor(Math.random() * size)];
        setTarget(randomTarget);
        setTempTarget(randomTarget);
        reset();
        toast.success('Random sorted array and target generated!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info':      return 5;
            case 'check':     return 12;
            case 'narrow':    return 13;
            case 'found':     return 18;
            case 'not-found': return 25;
            default:          return 0;
        }
    };

    const codeSnippet = algorithmCodes.fibonacciSearch?.[activeLanguage] || '';
    const stepData    = currentStep || {};
    const activeProbe = stepData.probeIdx !== undefined ? stepData.probeIdx : stepData.i;
    const currentFib  = stepData.fib !== undefined ? stepData.fib : stepData.fibM;

    const renderArray = () => {
        if (!currentStep) return null;
        const { arraySnapshot, offset, type } = currentStep;

        return (
            <div className="fib-array-grid">
                {arraySnapshot.map((val, idx) => {
                    let state = 'default';

                    if (offset !== undefined && offset !== -1 && idx <= offset) state = 'excluded';
                    if (idx === activeProbe) state = 'check';
                    if (type === 'found' && idx === activeProbe) state = 'found';
                    if (type === 'not-found') state = 'excluded';

                    return (
                        <div key={idx} className="fib-cell-wrapper">
                            <div className={`fib-cell state-${state}`} id={`cell-${idx}`}>
                                <span className="fib-val">{val}</span>
                                {idx === activeProbe && <span className="fib-ptr-badge">Probe idx</span>}
                            </div>
                            <span className="fib-idx">[{idx}]</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Fibonacci Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="searching"
            description={
                <div className="fib-desc-wrapper">
                    <span className="fib-badge">Fibonacci Intervals O(log N)</span>
                    <span className="fib-desc-text">
                        {currentStep?.description || 'Press Play to observe searching using Fibonacci numbers to divide intervals.'}
                    </span>
                </div>
            }
        >
            <div className="fib-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="fib-input-panel">
                    <div className="fib-input-group">
                        <label className="fib-input-label">Target Number:</label>
                        <input
                            type="number"
                            value={tempTarget}
                            onChange={(e) => setTempTarget(Number(e.target.value))}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyTarget()}
                            className="fib-number-input"
                        />
                        <button onClick={handleApplyTarget} className="fib-btn fib-btn-primary">
                            <FaCheck /> Find
                        </button>
                    </div>

                    <div className="fib-btn-group">
                        <button onClick={handleGenerateRandom} className="fib-btn fib-btn-secondary">
                            <FaRandom /> Random Array
                        </button>
                        <button onClick={() => setShowIntuition(!showIntuition)} className="fib-btn fib-btn-outline">
                            <FaInfoCircle /> {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                        </button>
                        <button onClick={reset} className="fib-btn fib-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="fib-legend">
                        <div className="fib-leg-item"><span className="fib-dot blue"></span> Probe Cell</div>
                        <div className="fib-leg-item"><span className="fib-dot green"></span> Target Found</div>
                        <div className="fib-leg-item"><span className="fib-dot gray"></span> Excluded</div>
                    </div>
                </div>

                {/* Intuition Callout */}
                {showIntuition && (
                    <div className="fib-intuition-panel">
                        <h4>🧬 The Fibonacci Rhythm</h4>
                        <p>
                            Fibonacci Search uses <strong>Fibonacci numbers</strong> (1, 1, 2, 3, 5, 8, 13...) to divide a sorted array instead of simple binary halves!
                        </p>
                        <ul>
                            <li><strong>Division:</strong> Divides array into uneven Fibonacci intervals.</li>
                            <li><strong>Speed:</strong> Uses only addition and subtraction operations—avoiding division instructions.</li>
                        </ul>
                    </div>
                )}

                {/* ── Main Canvas Stage: Array Cells & Fibonacci Values ───── */}
                <div className="fib-canvas-wrapper">
                    <div className="fib-metrics-row">
                        <div className="fib-metric-card">
                            <span className="metric-lbl">Fm (Current)</span>
                            <span className="metric-val">{currentFib ?? '-'}</span>
                        </div>
                        <div className="fib-metric-card">
                            <span className="metric-lbl">Fm-1</span>
                            <span className="metric-val">{stepData.fib1 ?? '-'}</span>
                        </div>
                        <div className="fib-metric-card">
                            <span className="metric-lbl">Fm-2</span>
                            <span className="metric-val">{stepData.fib2 ?? '-'}</span>
                        </div>
                        <div className="fib-metric-card">
                            <span className="metric-lbl">Offset</span>
                            <span className="metric-val">{stepData.offset ?? '-1'}</span>
                        </div>
                    </div>

                    {renderArray()}
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="fib-controls-wrapper">
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

export default FibonacciSearchVisualizer;
