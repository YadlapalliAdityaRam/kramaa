import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateTwoPointersSteps } from '../algorithms/searching/twoPointers';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './TwoPointersVisualizer.css';

const DEFAULT_ARRAY  = [1, 2, 4, 6, 8, 10];
const DEFAULT_TARGET = 10;

const TwoPointersVisualizer = () => {
    const [array,       setArray]       = useState(DEFAULT_ARRAY);
    const [target,      setTarget]      = useState(DEFAULT_TARGET);
    const [arrayInput,  setArrayInput]  = useState(DEFAULT_ARRAY.join(', '));
    const [targetInput, setTargetInput] = useState(String(DEFAULT_TARGET));
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateTwoPointersSteps(array, target),
        [array, target]
    );

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play, pause, reset,
        stepForward, stepBackward,
        setIndex, speed, setSpeed
    } = useGenericAnimation(steps);

    const handleApply = () => {
        const parsed = arrayInput
            .split(/[\s,]+/)
            .filter(Boolean)
            .map(Number)
            .filter(Number.isFinite);

        if (parsed.length < 2) {
            toast.error('Enter at least 2 numbers.');
            return;
        }
        if (parsed.length > 12) {
            toast.error('Maximum 12 elements allowed.');
            return;
        }
        const tgt = Number(targetInput);
        if (!Number.isFinite(tgt)) {
            toast.error('Enter a valid target number.');
            return;
        }
        setArray(parsed);
        setTarget(tgt);
        reset();
        toast.success('Two Pointers initialized!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info':       return 1;
            case 'init':       return 4;
            case 'compare':    return 7;
            case 'found':      return 11;
            case 'move-left':  return 14;
            case 'move-right': return 17;
            case 'not-found':  return 21;
            case 'completed':  return 24;
            default:           return 0;
        }
    };

    const codeSnippet = algorithmCodes.twoPointers?.[activeLanguage] || '';

    const step = currentStep || {};
    const {
        arraySnapshot = array,
        leftPointer   = 0,
        rightPointer  = (array.length - 1),
        leftValue     = null,
        rightValue    = null,
        sum           = null,
        foundPair     = [],
        discardedIndices = [],
        decision      = ''
    } = step;

    const isFound = step.type === 'found' || step.type === 'completed' && foundPair.length > 0;

    const sumClass = () => {
        if (isFound || step.type === 'found') return 'match';
        if (sum !== null && sum < target) return 'low';
        if (sum !== null && sum > target) return 'high';
        return '';
    };

    const getCellClass = (idx) => {
        if (discardedIndices.includes(idx)) return 'discarded';
        if (isFound && foundPair.includes(idx)) return 'found';
        if (idx === leftPointer && idx === rightPointer) return 'found';
        if (idx === leftPointer)  return 'left-active';
        if (idx === rightPointer) return 'right-active';
        return '';
    };

    return (
        <DualView
            algorithmName="Two Pointers Technique"
            code={codeSnippet}
            activeLine={getActiveLine(step)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={step.description || 'Use a left and right pointer on a sorted array to find pairs with a target sum in O(n) time.'}
        >
            <div className="tp-wrapper">

                {/* Input Panel */}
                <div className="tp-input-panel">
                    <div className="tp-field">
                        <label>Sorted Array</label>
                        <input
                            type="text"
                            value={arrayInput}
                            onChange={e => setArrayInput(e.target.value)}
                            placeholder="e.g. 1, 2, 4, 6, 8, 10"
                        />
                    </div>
                    <div className="tp-field" style={{ maxWidth: 120 }}>
                        <label>Target Sum</label>
                        <input
                            type="number"
                            value={targetInput}
                            onChange={e => setTargetInput(e.target.value)}
                        />
                    </div>
                    <button className="tp-apply-btn" onClick={handleApply}>
                        ▶ Apply
                    </button>
                </div>

                {/* Visualization Canvas */}
                <div className="tp-canvas">

                    {/* Stats Row */}
                    <div className="tp-stats-row">
                        <div className="tp-stat-card">
                            <span className="tp-stat-lbl">Target Sum</span>
                            <span className="tp-stat-val cyan">{target}</span>
                        </div>
                        <div className="tp-stat-card">
                            <span className="tp-stat-lbl">Left Ptr</span>
                            <span className="tp-stat-val cyan">
                                {leftValue !== null ? leftValue : '—'}
                                <span style={{ fontSize: '0.65rem', marginLeft: 4, opacity: 0.7 }}>
                                    [{leftPointer >= 0 ? leftPointer : '—'}]
                                </span>
                            </span>
                        </div>
                        <div className="tp-stat-card">
                            <span className="tp-stat-lbl">Right Ptr</span>
                            <span className="tp-stat-val purple">
                                {rightValue !== null ? rightValue : '—'}
                                <span style={{ fontSize: '0.65rem', marginLeft: 4, opacity: 0.7 }}>
                                    [{rightPointer >= 0 ? rightPointer : '—'}]
                                </span>
                            </span>
                        </div>
                        {sum !== null && (
                            <div className="tp-stat-card">
                                <span className="tp-stat-lbl">Current Sum</span>
                                <span className={`tp-stat-val ${sumClass()}`}>{sum}</span>
                            </div>
                        )}
                        {(step.type === 'found' || (step.type === 'completed' && foundPair.length > 0)) && (
                            <div className="tp-stat-card">
                                <span className="tp-stat-lbl">Found Pair</span>
                                <span className="tp-stat-val green">
                                    [{arraySnapshot[foundPair[0]]}, {arraySnapshot[foundPair[1]]}]
                                </span>
                            </div>
                        )}
                        {step.type === 'not-found' && (
                            <div className="tp-stat-card">
                                <span className="tp-stat-lbl">Result</span>
                                <span className="tp-stat-val red">No Pair</span>
                            </div>
                        )}
                    </div>

                    {/* Array Visualization with Pointer Labels */}
                    <div className="tp-array-stage">

                        {/* Pointer Badges Row (above the array) */}
                        <div className="tp-pointer-row">
                            {arraySnapshot.map((_, idx) => (
                                <div key={idx} className="tp-pointer-slot">
                                    {idx === leftPointer && idx === rightPointer ? (
                                        <span className="tp-pointer-badge left-ptr">L=R</span>
                                    ) : idx === leftPointer ? (
                                        <span className="tp-pointer-badge left-ptr">L</span>
                                    ) : idx === rightPointer ? (
                                        <span className="tp-pointer-badge right-ptr">R</span>
                                    ) : null}
                                </div>
                            ))}
                        </div>

                        {/* Array Cells */}
                        <div className="tp-array-row">
                            {arraySnapshot.map((val, idx) => (
                                <div key={idx} className={`tp-cell ${getCellClass(idx)}`}>
                                    {val}
                                    <span className="tp-cell-idx">{idx}</span>
                                </div>
                            ))}
                        </div>

                    </div>

                    {/* Sum Display */}
                    {sum !== null && (
                        <div className="tp-sum-display">
                            <span style={{ color: '#06b6d4', fontWeight: 800 }}>L={leftValue}</span>
                            <span className="tp-arrow">+</span>
                            <span style={{ color: '#a855f7', fontWeight: 800 }}>R={rightValue}</span>
                            <span className="tp-arrow">=</span>
                            <span className={`tp-sum-val ${sumClass()}`}>{sum}</span>
                            <span className="tp-arrow">vs Target</span>
                            <span style={{ fontWeight: 800 }}>{target}</span>
                        </div>
                    )}

                    {/* Decision Badge */}
                    {decision && (
                        <div className="tp-decision">{decision}</div>
                    )}

                </div>

                {/* Animation Controls */}
                <div className="tp-controls-wrapper">
                    <AnimationControls
                        inputType="none"
                        isPlaying={isPlaying}
                        onPlay={play}
                        onPause={pause}
                        onReset={reset}
                        onNext={stepForward}
                        onPrev={stepBackward}
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

export default TwoPointersVisualizer;
