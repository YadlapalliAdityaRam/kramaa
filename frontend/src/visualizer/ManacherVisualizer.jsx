import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateManacherSteps } from '../algorithms/string/manacher';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRedo } from 'react-icons/fa';
import './ManacherVisualizer.css';

const DEFAULT_STRING = 'abacaba';

const ManacherVisualizer = () => {
    const [stringInput, setStringInput]       = useState(DEFAULT_STRING);
    const [tempInput, setTempInput]           = useState(DEFAULT_STRING);
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
        toast.success("Manacher's initialized!");
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init':      return 14;
            case 'move':      return 18;
            case 'mirror':    return 20;
            case 'expand':    return 21;
            case 'update':    return 22;
            case 'completed': return 42;
            default:          return 0;
        }
    };

    const renderTransformedGrid = () => {
        if (!currentStep) return null;
        const { transformed, center, right, current, mirror, p } = currentStep;

        return transformed.map((char, idx) => {
            let state = 'default';
            if (char === '#') state = 'hash';

            const leftBoundary = 2 * center - right;
            if (idx >= leftBoundary && idx <= right && center !== -1) {
                state = 'in-box';
            }

            if (idx === center) state = 'center';
            if (idx === current) {
                state = (currentStep.type === 'expand') ? 'expanding' : 'current';
            }
            if (idx === mirror && mirror !== -1) state = 'mirror';

            return (
                <div key={idx} className="man-cell-wrapper">
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

    const stepData = currentStep || {};

    return (
        <DualView
            algorithmName="Manacher's Algorithm (Longest Palindromic Substring)"
            code={algorithmCodes.manacher?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="string"
            description={
                <div className="man-desc-wrapper">
                    <span className="man-badge">Palindromic Radii O(N)</span>
                    <span className="man-desc-text">
                        {currentStep?.description || "Manacher's Algorithm finds the longest palindromic substring in linear O(N) time."}
                    </span>
                </div>
            }
        >
            <div className="man-visualizer-wrapper">

                {/* Top Input Control Panel */}
                <div className="man-input-panel">
                    <div className="man-input-group">
                        <label className="man-input-label">Input String:</label>
                        <input
                            type="text"
                            value={tempInput}
                            onChange={(e) => setTempInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="abacaba"
                            className="man-text-input"
                        />
                        <button className="man-btn man-btn-primary" onClick={handleApply}>
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="man-btn-group">
                        <button onClick={() => { setStringInput(DEFAULT_STRING); setTempInput(DEFAULT_STRING); reset(); }} className="man-btn man-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="man-legend">
                        <div className="man-leg-item"><span className="man-dot yellow"></span> Center</div>
                        <div className="man-leg-item"><span className="man-dot green"></span> Mirror</div>
                        <div className="man-leg-item"><span className="man-dot purple"></span> Expanding</div>
                    </div>
                </div>

                {/* Main Visual Stage */}
                <div className="man-canvas-wrapper">
                    <div className="man-row">
                        <div className="man-row-label">Index</div>
                        <div className="man-cells-container">
                            {currentStep?.transformed?.map((_, i) => (
                                <div key={i} className="man-cell-wrapper"><div className="man-idx">[{i}]</div></div>
                            ))}
                        </div>
                    </div>

                    <div className="man-row">
                        <div className="man-row-label">Transformed T</div>
                        <div className="man-cells-container">
                            {renderTransformedGrid()}
                        </div>
                    </div>

                    <div className="man-row">
                        <div className="man-row-label">Radii P[i]</div>
                        <div className="man-cells-container">
                            {renderRadiusGrid()}
                        </div>
                    </div>

                    {currentStep && (
                        <div className="man-stats-row">
                            <div className="man-stat-card">
                                <span className="stat-lbl">Center (C)</span>
                                <span className="stat-val yellow">{stepData.center ?? '-'}</span>
                            </div>
                            <div className="man-stat-card">
                                <span className="stat-lbl">Right Boundary (R)</span>
                                <span className="stat-val blue">{stepData.right ?? '-'}</span>
                            </div>
                            {stepData.mirror !== undefined && stepData.mirror !== -1 && (
                                <div className="man-stat-card">
                                    <span className="stat-lbl">Mirror of {stepData.current}</span>
                                    <span className="stat-val green">{stepData.mirror}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {stepData.longestInfo && (
                        <div className="man-result-box">
                            <span className="res-title">Longest Palindromic Substring</span>
                            <span className="res-val">"{stepData.longestInfo.text}" (Length: {stepData.longestInfo.length})</span>
                        </div>
                    )}
                </div>

                {/* YouTube Video Player Controls */}
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
