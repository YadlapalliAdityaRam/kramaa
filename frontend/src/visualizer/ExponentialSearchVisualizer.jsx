import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateExponentialSearchSteps } from '../algorithms/searching/exponentialSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './ExponentialSearchVisualizer.css';

const DEFAULT_ARRAY = [2, 4, 7, 10, 14, 18, 21, 25, 30, 35, 42, 48, 55, 62, 70, 85];

const ExponentialSearchVisualizer = () => {
    const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
    const [target, setTarget] = useState(21);
    const [tempTarget, setTempTarget] = useState(21);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showIntuition, setShowIntuition] = useState(true);

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
        const size = 15 + Math.floor(Math.random() * 5);
        const newArray = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 2)
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
        switch (step.phase) {
            case 'start': return 10;
            case 'exponential': return 25;
            case 'binary': return 47;
            default: return 0;
        }
    };

    const renderArray = () => {
        if (!currentStep) return null;
        const { arraySnapshot, indices, low, high, mid, type, phase } = currentStep;

        return (
            <div className={`exp-array-grid ${phase === 'binary' ? 'in-binary' : ''}`}>
                {arraySnapshot.map((val, idx) => {
                    let state = 'default';

                    // Range shading
                    if (low !== null && high !== null) {
                        if (idx >= low && idx <= high) state = 'range';
                        else state = 'excluded';
                    }

                    // Highlight active indices
                    if (indices.includes(idx)) state = 'active';
                    if (idx === mid) state = 'mid';

                    if (type === 'found' && indices.includes(idx)) state = 'found';
                    if (type === 'not-found') state = 'excluded';

                    return (
                        <div key={idx} className="exp-cell-wrapper">
                            <div className={`exp-cell state-${state}`} id={`cell-${idx}`}>
                                {val}
                            </div>
                            <div className="exp-idx">{idx}</div>
                            {phase === 'exponential' && idx === indices[0] && (
                                <div className="exp-leap-arrow">🚀</div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Exponential Search"
            code={algorithmCodes.exponentialSearch?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Find a range, then binary search."}
        >
            <div className="exp-container">
                <div className="exp-input-bar-enhanced">
                    <button className="floyd-toggle-btn" onClick={() => setShowIntuition(!showIntuition)}>
                        {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                    </button>
                    <div className="target-input-group">
                        <label>Target:</label>
                        <input
                            type="number"
                            value={tempTarget}
                            onChange={(e) => setTempTarget(parseInt(e.target.value) || 0)}
                        />
                        <button className="apply-btn-small" onClick={handleApplyTarget}>Set</button>
                    </div>
                    <div className="exp-phase-display">
                        Phase: <span>{currentStep?.phase?.toUpperCase() || 'IDLE'}</span>
                    </div>
                </div>

                {showIntuition && (
                    <div className="floyd-intuition-panel">
                        <h4>📖 The Dictionary Analogy</h4>
                        <p>
                            Imagine finding a word in a huge dictionary. You don't flip every page!
                        </p>
                        <ul>
                            <li><strong>Step 1 (The Leap):</strong> Jump ahead in bigger and bigger steps (1, 2, 4, 8, 16...) until you've gone <em>past</em> your target.</li>
                            <li><strong>Step 2 (The Refinement):</strong> Now that you know which "range" the word is in, use <strong>Binary Search</strong> to find the exact page.</li>
                        </ul>
                        <p className="edu-note-small">This is extremely fast for large datasets because you reach the target area exponentially.</p>
                    </div>
                )}

                <div className="exp-visual-area">
                    {renderArray()}
                </div>

                <div className="exp-educational-footer">
                    <div className="exp-complexity">
                        <div className="comp-item">
                            <span className="label">Time Complexity:</span>
                            <span className="val">O(log i)</span>
                        </div>
                        <div className="comp-item">
                            <span className="label">Space Complexity:</span>
                            <span className="val">O(1)</span>
                        </div>
                    </div>
                    <div className="exp-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Checking</div>
                        <div className="leg-item"><span className="dot blue"></span> Identified Range</div>
                        <div className="leg-item"><span className="dot orange"></span> Binary Mid</div>
                        <div className="leg-item"><span className="dot gray"></span> Eliminated</div>
                        <div className="leg-item"><span className="dot green"></span> Found</div>
                    </div>
                </div>

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
                        onGenerateRandom={handleGenerateRandom}
                        onManualInput={handleManualInput}
                    />
                </div>
            </div>
        </DualView>
    );
};

export default ExponentialSearchVisualizer;
