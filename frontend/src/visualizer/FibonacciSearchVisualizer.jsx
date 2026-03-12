import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFibonacciSearchSteps } from '../algorithms/searching/fibonacciSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaArrowRight, FaSearchPlus, FaGripLinesVertical, FaInfoCircle } from 'react-icons/fa';
import './FibonacciSearchVisualizer.css';

const DEFAULT_ARRAY = [3, 7, 12, 18, 21, 25, 30, 36, 40, 45, 52, 60, 68, 75, 82];

const FibonacciSearchVisualizer = () => {
    const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
    const [target, setTarget] = useState(25);
    const [tempTarget, setTempTarget] = useState(25);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showIntuition, setShowIntuition] = useState(true);

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
        const size = 12 + Math.floor(Math.random() * 5);
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 2)
            .sort((a, b) => a - b);
        setArrayInput(newArray);
        const randomTarget = newArray[Math.floor(Math.random() * size)];
        setTarget(randomTarget);
        setTempTarget(randomTarget);
        reset();
        toast.success('Random sorted array and target generated!');
    };

    const handleManualInput = (newArray) => {
        const sorted = [...newArray].sort((a, b) => a - b);
        setArrayInput(sorted);
        reset();
        toast.success('Array updated and sorted!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return 11;
            case 'check': return 33;
            case 'narrow': return 41;
            case 'found': return 62;
            case 'not-found': return 81;
            default: return 0;
        }
    };

    return (
        <DualView
            algorithmName="Fibonacci Search"
            code={algorithmCodes.fibonacciSearch?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Find a location using Fibonacci-based intervals."}
        >
            <div className="fib-search-container">
                <div className="fib-input-bar">
                    <button className="toggle-intuition-btn" onClick={() => setShowIntuition(!showIntuition)}>
                        {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                    </button>
                    <div className="target-control">
                        <label>Target:</label>
                        <input
                            type="number"
                            value={tempTarget}
                            onChange={(e) => setTempTarget(parseInt(e.target.value) || 0)}
                        />
                        <button className="apply-target-btn" onClick={handleApplyTarget}>Set</button>
                    </div>
                </div>

                {showIntuition && (
                    <div className="fib-intuition-panel">
                        <h4>🧬 The Fibonacci Rhythm</h4>
                        <p>
                            Fibonacci Search uses <strong>Fibonacci numbers</strong> instead of simple halves to divide a library shelf!
                        </p>
                        <div className="edu-grid">
                            <div className="edu-item"><FaSearchPlus /> <strong>Divide:</strong> Fibonacci numbers split the shelf into uneven but mathematical parts.</div>
                            <div className="edu-item"><FaArrowRight /> <strong>Leap:</strong> Move using Fibonacci steps (Fm, Fm-1, Fm-2).</div>
                            <div className="edu-item"><FaInfoCircle /> <strong>Gears:</strong> It only uses addition and subtraction—no costly divisions!</div>
                        </div>
                    </div>
                )}

                <div className="fib-dashboard">
                    <div className="fib-gear">
                        <span className="label">Fk</span>
                        <div className={`val ${currentStep?.fib !== null ? 'pulse' : ''}`}>{currentStep?.fib ?? '-'}</div>
                    </div>
                    <div className="fib-gear">
                        <span className="label">Fk-1</span>
                        <div className={`val ${currentStep?.fib1 !== null ? 'pulse' : ''}`}>{currentStep?.fib1 ?? '-'}</div>
                    </div>
                    <div className="fib-gear">
                        <span className="label">Fk-2</span>
                        <div className={`val ${currentStep?.fib2 !== null ? 'pulse' : ''}`}>{currentStep?.fib2 ?? '-'}</div>
                    </div>
                    <div className="fib-gear offset-gear">
                        <span className="label">Offset</span>
                        <div className="val">{currentStep?.offset ?? '-'}</div>
                    </div>
                </div>

                <div className="fib-visual-area">
                    <div className="fib-array">
                        {arrayInput.map((val, idx) => {
                            let state = 'default';
                            if (currentStep) {
                                if (idx === currentStep.probeIdx) state = 'probe';
                                else if (idx < currentStep.low || idx > currentStep.high) state = 'eliminated';
                                else state = 'active';

                                if (currentStep.type === 'found' && idx === currentStep.probeIdx) state = 'found';
                                if (currentStep.type === 'not-found') state = 'eliminated';
                            }

                            return (
                                <div key={idx} className="fib-cell-wrapper">
                                    <div className={`fib-cell state-${state}`}>
                                        {val}
                                    </div>
                                    <div className="fib-idx">{idx}</div>
                                    {currentStep?.probeIdx === idx && (
                                        <div className="fib-pointer">🔍</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="fib-footer">
                    <div className="fib-complexity">
                        <div className="comp-item">
                            <span className="label">Time:</span>
                            <span className="val">O(log N)</span>
                        </div>
                        <div className="comp-item">
                            <span className="label">Space:</span>
                            <span className="val">O(1)</span>
                        </div>
                    </div>
                    <div className="fib-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Probing</div>
                        <div className="leg-item"><span className="dot blue"></span> Active Range</div>
                        <div className="leg-item"><span className="dot gray"></span> Eliminated</div>
                        <div className="leg-item"><span className="dot green"></span> Found</div>
                    </div>
                </div>

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
                        onGenerateRandom={handleGenerateRandom}
                        onManualInput={handleManualInput}
                    />
                </div>
            </div>
        </DualView>
    );
};

export default FibonacciSearchVisualizer;
