import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateExponentialSearchSteps } from '../algorithms/searching/exponentialSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaCheck, FaRedo } from 'react-icons/fa';
import './ExponentialSearchVisualizer.css';

const DEFAULT_ARRAY = [2, 4, 7, 10, 14, 18, 21, 25, 30, 35, 42, 48, 55, 62, 70, 85];

const ExponentialSearchVisualizer = () => {
    const [arrayInput, setArrayInput]     = useState(DEFAULT_ARRAY);
    const [target, setTarget]             = useState(21);
    const [tempTarget, setTempTarget]     = useState(21);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateExponentialSearchSteps(arrayInput, target),
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
        const size = 16;
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 2)
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
        switch (step.phase) {
            case 'start':       return 2;
            case 'exponential': return 4;
            case 'binary':      return 8;
            default:            return 0;
        }
    };

    const codeSnippet = algorithmCodes.exponentialSearch?.[activeLanguage] || '';

    const renderArray = () => {
        if (!currentStep) return null;
        const { arraySnapshot, indices = [], low, high, mid, type, phase } = currentStep;

        return (
            <div className={`exp-array-grid ${phase === 'binary' ? 'in-binary' : ''}`}>
                {arraySnapshot.map((val, idx) => {
                    let state = 'default';

                    if (low !== null && high !== null && low !== undefined && high !== undefined) {
                        if (idx >= low && idx <= high) state = 'range';
                        else state = 'excluded';
                    }

                    if (indices.includes(idx)) state = 'active';
                    if (idx === mid) state = 'mid';
                    if (type === 'found' && indices.includes(idx)) state = 'found';
                    if (type === 'not-found') state = 'excluded';

                    return (
                        <div key={idx} className="exp-cell-wrapper">
                            <div className={`exp-cell state-${state}`} id={`cell-${idx}`}>
                                <span className="exp-val">{val}</span>
                                {phase === 'exponential' && indices.includes(idx) && (
                                    <span className="exp-bound-badge">Bound</span>
                                )}
                            </div>
                            <span className="exp-idx">{idx}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Exponential Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="searching"
            description={
                <div className="exp-desc-wrapper">
                    <span className="exp-badge">Unbounded Array Search O(log i)</span>
                    <span className="exp-desc-text">
                        {currentStep?.description || 'Press Play to double search bounds exponentially (1, 2, 4, 8...), then binary search.'}
                    </span>
                </div>
            }
        >
            <div className="exp-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="exp-input-panel">
                    <div className="exp-input-group">
                        <label className="exp-input-label">Target Number:</label>
                        <input
                            type="number"
                            value={tempTarget}
                            onChange={(e) => setTempTarget(Number(e.target.value))}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyTarget()}
                            className="exp-number-input"
                        />
                        <button onClick={handleApplyTarget} className="exp-btn exp-btn-primary">
                            <FaCheck /> Find
                        </button>
                    </div>

                    <div className="exp-btn-group">
                        <button onClick={handleGenerateRandom} className="exp-btn exp-btn-secondary">
                            <FaRandom /> Random Array
                        </button>
                        <button onClick={reset} className="exp-btn exp-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="exp-legend">
                        <div className="exp-leg-item"><span className="exp-dot blue"></span> Bound Leap</div>
                        <div className="exp-leg-item"><span className="exp-dot yellow"></span> Binary Range</div>
                        <div className="exp-leg-item"><span className="exp-dot green"></span> Target Found</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Array Cells ────────────────────── */}
                <div className="exp-canvas-wrapper">
                    {renderArray()}
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="exp-controls-wrapper">
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

export default ExponentialSearchVisualizer;
