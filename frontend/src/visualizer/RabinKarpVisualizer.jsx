import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateRabinKarpSteps } from '../algorithms/string/rabinKarp';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRedo } from 'react-icons/fa';
import './RabinKarpVisualizer.css';

const DEFAULT_TEXT = 'ABCCDDAEFG';
const DEFAULT_PATTERN = 'CDD';

const RabinKarpVisualizer = () => {
    const [text, setText]                 = useState(DEFAULT_TEXT);
    const [pattern, setPattern]           = useState(DEFAULT_PATTERN);
    const [textInput, setTextInput]       = useState(DEFAULT_TEXT);
    const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateRabinKarpSteps(text, pattern),
        [text, pattern]
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
        const t = textInput.trim().toUpperCase();
        const p = patternInput.trim().toUpperCase();
        if (!t || !p) {
            toast.error('Both text and pattern are required.');
            return;
        }
        if (p.length > t.length) {
            toast.error('Pattern cannot be longer than text.');
            return;
        }
        setText(t);
        setPattern(p);
        reset();
        toast.success('Rabin-Karp initialized!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info':      return 40;
            case 'compare':   return step.patternIndex >= 0 ? 56 : 48;
            case 'match':     return 71;
            case 'mismatch':  return 62;
            case 'completed': return 85;
            default:          return 0;
        }
    };

    const codeSnippet = algorithmCodes.rabinKarp?.[activeLanguage] || '';

    const renderTextCells = () => {
        if (!currentStep) return null;
        const textChars = currentStep.textData || text.split('');
        const shift = currentStep.shiftIndex;
        const patLen = pattern.length;

        return textChars.map((char, idx) => {
            let state = 'default';

            if (idx >= shift && idx < shift + patLen) {
                state = 'window';
            }
            if (currentStep.textIndex === idx) {
                state = currentStep.type === 'mismatch' ? 'mismatch' : 'comparing';
            }
            if (currentStep.matches && currentStep.matches.some(mIdx => idx >= mIdx && idx < mIdx + patLen)) {
                state = 'matched';
            }

            return (
                <div key={idx} className={`rk-cell rk-text-cell state-${state}`}>
                    <span className="rk-char">{char}</span>
                    <span className="rk-idx">[{idx}]</span>
                </div>
            );
        });
    };

    const renderPatternCells = () => {
        const patChars = pattern.split('');
        return patChars.map((char, idx) => {
            let state = 'default';
            if (currentStep && currentStep.patternIndex === idx) {
                state = currentStep.type === 'mismatch' ? 'mismatch' : 'comparing';
            }
            return (
                <div key={idx} className={`rk-cell rk-pat-cell state-${state}`}>
                    {char}
                </div>
            );
        });
    };

    const stepData = currentStep || {};
    const patHash  = stepData.hashes?.pattern;
    const winHash  = stepData.hashes?.window;
    const hashesMatch = patHash !== undefined && patHash === winHash;

    return (
        <DualView
            algorithmName="Rabin-Karp Algorithm (Rolling Hash Matcher)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="string"
            description={
                <div className="rk-desc-wrapper">
                    <span className="rk-badge">Rolling Hash O(N + M)</span>
                    <span className="rk-desc-text">
                        {currentStep?.description || 'Sliding pattern window with rolling hash comparisons.'}
                    </span>
                </div>
            }
        >
            <div className="rk-visualizer-wrapper">

                {/* Top Input Control Panel */}
                <div className="rk-input-panel">
                    <div className="rk-input-group">
                        <label className="rk-input-label">Text:</label>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="ABCCDDAEFG"
                            className="rk-text-input"
                        />
                    </div>

                    <div className="rk-input-group">
                        <label className="rk-input-label">Pattern:</label>
                        <input
                            type="text"
                            value={patternInput}
                            onChange={(e) => setPatternInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="CDD"
                            className="rk-text-input rk-pat-input"
                        />
                    </div>

                    <div className="rk-btn-group">
                        <button className="rk-btn rk-btn-primary" onClick={handleApply}>
                            <FaCheck /> Find
                        </button>
                        <button onClick={() => { setText(DEFAULT_TEXT); setPattern(DEFAULT_PATTERN); setTextInput(DEFAULT_TEXT); setPatternInput(DEFAULT_PATTERN); reset(); }} className="rk-btn rk-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="rk-legend">
                        <div className="rk-leg-item"><span className="rk-dot blue"></span> Window</div>
                        <div className="rk-leg-item"><span className="rk-dot yellow"></span> Comparing</div>
                        <div className="rk-leg-item"><span className="rk-dot green"></span> Match</div>
                    </div>
                </div>

                {/* Main Visual Stage */}
                <div className="rk-canvas-wrapper">
                    
                    {/* Hash Metrics Header */}
                    <div className="rk-hashes-row">
                        <div className={`rk-hash-card ${hashesMatch ? 'match' : ''}`}>
                            <span className="hash-lbl">Pattern Hash</span>
                            <span className="hash-val green">{patHash ?? '-'}</span>
                        </div>
                        <div className={`rk-hash-card ${hashesMatch ? 'match' : ''}`}>
                            <span className="hash-lbl">Window Hash</span>
                            <span className="hash-val blue">{winHash ?? '-'}</span>
                        </div>
                    </div>

                    {/* Text Array Cells */}
                    <div className="rk-text-display">
                        {renderTextCells()}
                    </div>

                    {/* Sliding Pattern Window */}
                    <div className="rk-pattern-display" style={{ transform: `translateX(${(stepData.shiftIndex || 0) * 48}px)` }}>
                        {renderPatternCells()}
                    </div>

                </div>

                {/* YouTube Video Player Controls */}
                <div className="rk-controls-wrapper">
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

export default RabinKarpVisualizer;
