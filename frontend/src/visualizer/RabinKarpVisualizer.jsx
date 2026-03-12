import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateRabinKarpSteps } from '../algorithms/string/rabinKarp';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './RabinKarpVisualizer.css';

const DEFAULT_TEXT = 'ABCCDDAEFG';
const DEFAULT_PATTERN = 'CDD';

const RabinKarpVisualizer = () => {
    const [text, setText] = useState(DEFAULT_TEXT);
    const [pattern, setPattern] = useState(DEFAULT_PATTERN);
    const [textInput, setTextInput] = useState(DEFAULT_TEXT);
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
        const t = textInput.trim();
        const p = patternInput.trim();
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
            case 'info': return 40;
            case 'compare': return step.patternIndex >= 0 ? 56 : 48;
            case 'match': return 71;
            case 'mismatch': return 62;
            case 'completed': return 85;
            default: return 0;
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

            // Is it currently in the sliding window?
            if (idx >= shift && idx < shift + patLen) {
                state = 'window';
            }

            // Is it the specific character being compared?
            if (currentStep.textIndex === idx) {
                state = currentStep.type === 'mismatch' ? 'mismatch' : 'comparing';
            }

            // Is it part of a recorded match?
            if (currentStep.matches && currentStep.matches.includes(idx - currentStep.patternIndex) && currentStep.patternIndex >= 0) {
                // Complex condition to avoid overlap highlights if not needed
            }

            // Simplify match highlighting for text
            if (currentStep.matches && currentStep.matches.some(mIdx => idx >= mIdx && idx < mIdx + patLen)) {
                state = 'matched';
            }

            return (
                <div key={idx} className={`rk-cell rk-text-cell state-${state}`}>
                    <span className="rk-char">{char}</span>
                    <span className="rk-idx">{idx}</span>
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

    return (
        <DualView
            algorithmName="Rabin-Karp Algorithm (Rolling Hash)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Sliding window with hash comparisons.'}
        >
            <div className="rk-container">
                <div className="rk-input-bar">
                    <div className="rk-input-group">
                        <label>Text:</label>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />
                    </div>
                    <div className="rk-input-group">
                        <label>Pattern:</label>
                        <input
                            type="text"
                            value={patternInput}
                            onChange={(e) => setPatternInput(e.target.value)}
                        />
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Apply</button>
                </div>

                <div className="rk-visual-area">
                    <div className="rk-hashes">
                        <div className={`rk-hash-box ${currentStep?.hashes?.pattern === currentStep?.hashes?.window ? 'match' : ''}`}>
                            <span className="rk-hash-label">Pattern Hash:</span>
                            <span className="rk-hash-val">{currentStep?.hashes?.pattern ?? '-'}</span>
                        </div>
                        <div className={`rk-hash-box ${currentStep?.hashes?.pattern === currentStep?.hashes?.window ? 'match' : ''}`}>
                            <span className="rk-hash-label">Window Hash:</span>
                            <span className="rk-hash-val">{currentStep?.hashes?.window ?? '-'}</span>
                        </div>
                    </div>

                    <div className="rk-text-display">
                        {renderTextCells()}
                    </div>

                    <div className="rk-pattern-display" style={{ transform: `translateX(${(currentStep?.shiftIndex || 0) * 44}px)` }}>
                        {renderPatternCells()}
                    </div>
                </div>

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
