import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateManacherSteps } from '../algorithms/string/manacher';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './ManacherVisualizer.css';

const DEFAULT_STRING = 'abacaba';

const ManacherVisualizer = () => {
    const [stringInput, setStringInput] = useState(DEFAULT_STRING);
    const [tempInput, setTempInput] = useState(DEFAULT_STRING);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateManacherSteps(stringInput),
        [stringInput]
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

    const handleApply = () => {
        const val = tempInput.trim().toLowerCase();
        if (!val) {
            toast.error('Please enter a string.');
            return;
        }
        if (val.length > 15) {
            toast.error('String too long for visualization (max 15).');
            return;
        }
        setStringInput(val);
        reset();
        toast.success('Manacher\'s initialized!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 14;
            case 'move': return 18;
            case 'mirror': return 20;
            case 'expand': return 21;
            case 'update': return 22;
            case 'completed': return 42;
            default: return 0;
        }
    };

    const renderTransformedGrid = () => {
        if (!currentStep) return null;
        const { transformed, center, right, current, mirror, p } = currentStep;

        return transformed.map((char, idx) => {
            let state = 'default';
            if (char === '#') state = 'hash';

            // Boundary coverage
            const leftBoundary = 2 * center - right;
            if (idx >= leftBoundary && idx <= right && center !== -1) {
                state = 'in-box';
            }

            if (idx === center) state = 'center';
            if (idx === current) {
                state = (currentStep.type === 'expand') ? 'expanding' : 'current';
            }
            if (idx === mirror && mirror !== -1) state = 'mirror';

            // Expansion distance
            const currentRadius = p[idx];
            const isExpansionZone = current === idx && currentStep.type === 'expand';

            return (
                <div key={idx} className={`man-cell-wrapper`}>
                    <div className={`man-cell char-cell state-${state}`}>
                        {char}
                    </div>
                </div>
            );
        });
    };

    const renderRadiusGrid = () => {
        if (!currentStep) return null;
        const { p, current } = currentStep;

        return p.map((val, idx) => {
            let className = 'man-cell radius-cell';
            if (idx === current) className += ' active';

            return (
                <div key={idx} className="man-cell-wrapper">
                    <div className={className}>
                        {val}
                    </div>
                </div>
            );
        });
    };

    return (
        <DualView
            algorithmName="Manacher's Algorithm (Longest Palindrome)"
            code={algorithmCodes.manacher?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Manacher\'s Algorithm finds the longest palindromic substring in O(n).'}
        >
            <div className="man-container">
                <div className="man-input-bar">
                    <div className="man-input-group">
                        <label>Input String:</label>
                        <input
                            type="text"
                            value={tempInput}
                            onChange={(e) => setTempInput(e.target.value)}
                            placeholder="e.g. babad"
                        />
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Apply</button>
                </div>

                <div className="man-visual-area">
                    <div className="man-row">
                        <div className="man-row-label">Transformed Index</div>
                        <div className="man-cells-container">
                            {currentStep?.transformed.map((_, i) => (
                                <div key={i} className="man-cell-wrapper"><div className="man-idx">{i}</div></div>
                            ))}
                        </div>
                    </div>

                    <div className="man-row">
                        <div className="man-row-label">String (T)</div>
                        <div className="man-cells-container">
                            {renderTransformedGrid()}
                        </div>
                    </div>

                    <div className="man-row">
                        <div className="man-row-label">Radii (P)</div>
                        <div className="man-cells-container">
                            {renderRadiusGrid()}
                        </div>
                    </div>

                    {currentStep && (
                        <div className="man-stats">
                            <div className="stat-pill">Center: <strong>{currentStep.center}</strong></div>
                            <div className="stat-pill">Right Boundary: <strong>{currentStep.right}</strong></div>
                            {currentStep.mirror !== -1 && (
                                <div className="stat-pill">Mirror of {currentStep.current}: <strong>{currentStep.mirror}</strong></div>
                            )}
                        </div>
                    )}

                    {currentStep?.longestInfo && (
                        <div className="man-result-card">
                            <h4>Result</h4>
                            <p>Longest Palindromic Substring: <strong>"{currentStep.longestInfo.text}"</strong></p>
                            <p>Length: <strong>{currentStep.longestInfo.length}</strong></p>
                        </div>
                    )}
                </div>

                <div className="man-controls-wrapper">
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

export default ManacherVisualizer;
