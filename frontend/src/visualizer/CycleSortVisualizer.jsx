import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateCycleSortSteps } from '../algorithms/sorting/cycleSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './CycleSortVisualizer.css';

const DEFAULT_ARRAY = [5, 2, 8, 4, 1, 9, 3, 7];

const CycleSortVisualizer = () => {
    const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
    const [arraySize, setArraySize] = useState(8);
    const [showIntuition, setShowIntuition] = useState(true);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

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
        const newArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 90) + 10);
        setArrayInput(newArray);
        reset();
        toast.success(`Generated random array of size ${arraySize}!`);
    };

    const handleManualInput = (newArray) => {
        setArrayInput(newArray);
        setArraySize(newArray.length);
        reset();
        toast.success('Array updated!');
    };

    const handleSizeChange = (e) => {
        const newSize = parseInt(e.target.value, 10);
        setArraySize(newSize);
        const newArray = Array.from({ length: newSize }, () => Math.floor(Math.random() * 90) + 10);
        setArrayInput(newArray);
        reset();
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return 4;
            case 'pickup': return 16;
            case 'count': return 21;
            case 'place': return 35;
            case 'rotate-start': return 45;
            case 'completed': return 74;
            default: return 0;
        }
    };

    const renderArray = () => {
        if (!currentStep) return null;
        const { array, sortedIndices, heldItem, heldFrom, scanningIdx, targetPos } = currentStep;

        return (
            <div className="cycle-visualization-stack">
                <div className="cycle-array-container">
                    {array.map((val, idx) => {
                        let state = 'default';
                        if (sortedIndices.includes(idx)) state = 'sorted';
                        if (idx === scanningIdx) state = 'scanning';
                        if (idx === targetPos) state = 'target';
                        if (idx === heldFrom && heldItem === null) state = 'empty';
                        if (currentStep.type === 'pickup' && idx === heldFrom) state = 'pickup';

                        return (
                            <div key={idx} className="cycle-cell-wrapper">
                                <div className={`cycle-cell state-${state}`} id={`cell-${idx}`}>
                                    {val}
                                </div>
                                <div className="cycle-idx">{idx}</div>
                            </div>
                        );
                    })}
                </div>

                {/* SVG Overlay for Arrows */}
                {heldItem !== null && targetPos !== -1 && (
                    <svg className="cycle-arrows-overlay">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                            </marker>
                        </defs>
                        {/* Logic to draw arrow from held to target would go here, 
                            but for visual intuition we can highlight target slot */}
                    </svg>
                )}
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Cycle Sort (Minimal Writes)"
            code={algorithmCodes.cycleSort?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Cycle Sort minimizes array writes by placing each element directly into its final position.'}
        >
            <div className="cycle-container">
                <div className="cycle-header-bar">
                    <button className="floyd-toggle-btn" onClick={() => setShowIntuition(!showIntuition)}>
                        {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                    </button>
                    <div className="cycle-settings">
                        <label>Size: {arraySize}</label>
                        <input
                            type="range"
                            min="4"
                            max="12"
                            value={arraySize}
                            onChange={handleSizeChange}
                        />
                    </div>
                    <div className="cycle-stats-mini">
                        <div className="mini-stat">Writes: <span>{currentStep?.writes || 0}</span></div>
                    </div>
                </div>

                {showIntuition && (
                    <div className="floyd-intuition-panel">
                        <h4>🏷️ The Numbered Lockers Analogy</h4>
                        <p>
                            Imagine sorting items into lockers where each item has a specific home based on its value.
                        </p>
                        <ul>
                            <li><strong>Pick up</strong> an item from a locker.</li>
                            <li><strong>Count</strong> how many items are smaller than it to find its "Correct Locker".</li>
                            <li><strong>Place</strong> it there, and if another item was in its way, pick that one up and repeat!</li>
                        </ul>
                        <p className="edu-note-small">This minimizes "Writes" because every item moves to its final home only once.</p>
                    </div>
                )}

                <div className="cycle-visual-area">
                    {renderArray()}

                    <div className="cycle-held-section">
                        <div className="held-label">Held Element</div>
                        <div className={`held-slot ${currentStep?.heldItem !== null ? 'active' : ''}`}>
                            {currentStep?.heldItem !== null ? (
                                <div className="held-item-disc">
                                    {currentStep?.heldItem}
                                </div>
                            ) : (
                                <div className="held-item-empty">Empty</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="floyd-footer">
                    <div className="floyd-complexity">
                        <div className="comp-item">
                            <span className="label">Time Complexity:</span>
                            <span className="val">O(N²)</span>
                        </div>
                        <div className="comp-item">
                            <span className="label">Space Complexity:</span>
                            <span className="val">O(1)</span>
                        </div>
                    </div>
                    <div className="floyd-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Current</div>
                        <div className="leg-item"><span className="dot blue"></span> Home (Target)</div>
                        <div className="leg-item"><span className="dot red"></span> Cycle/Held</div>
                        <div className="leg-item"><span className="dot green"></span> Sorted</div>
                    </div>
                </div>

                <div className="cycle-controls-wrapper">
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

export default CycleSortVisualizer;
