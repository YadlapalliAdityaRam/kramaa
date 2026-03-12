import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateZAlgorithmSteps } from '../algorithms/string/zAlgorithm';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './ZAlgorithmVisualizer.css';

const DEFAULT_TEXT = 'AABCAAB';
const DEFAULT_PATTERN = 'AAB';

const ZAlgorithmVisualizer = () => {
    const [text, setText] = useState(DEFAULT_TEXT);
    const [pattern, setPattern] = useState(DEFAULT_PATTERN);
    const [textInput, setTextInput] = useState(DEFAULT_TEXT);
    const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateZAlgorithmSteps(text, pattern),
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
        const t = textInput.trim().toLowerCase();
        const p = patternInput.trim().toLowerCase();
        if (!t || !p) {
            toast.error('Both text and pattern are required.');
            return;
        }
        if (t.length > 25) {
            toast.error('Text is too long for visualization (max 25).');
            return;
        }
        setText(t);
        setPattern(p);
        reset();
        toast.success('Z-Algorithm initialized!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 10;
            case 'box-range': return 17;
            case 'inside-box': return 33;
            case 'compare': return 19;
            case 'copy-existing': return 35;
            case 'box-extension': return 42;
            case 'found': return 22;
            case 'completed': return 35;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.zAlgorithm?.[activeLanguage] || '';

    const renderConcatCells = () => {
        if (!currentStep) return null;
        const chars = currentStep.concat;
        const { l, r, currentIdx, kIdx, patternLen } = currentStep;

        return chars.map((char, idx) => {
            let state = 'default';

            // Highlight special character
            if (char === '$') state = 'separator';

            // Z-box bounds
            if (idx >= l && idx <= r && l !== -1) {
                state = 'box';
            }

            // Prefix comparison (left side)
            if (idx === kIdx) {
                state = 'prefix-compare';
            }

            // Current position (right side)
            if (idx === r && (currentStep.type === 'compare' || currentStep.type === 'mismatch')) {
                state = currentStep.type === 'mismatch' ? 'mismatch' : 'comparing';
            }

            if (idx === currentIdx) {
                state = 'current';
            }

            return (
                <div key={idx} className={`z-cell z-char-cell state-${state}`}>
                    <span className="z-char">{char}</span>
                    <span className="z-idx">{idx}</span>
                </div>
            );
        });
    };

    const renderZArrayCells = () => {
        if (!currentStep) return null;
        const zArr = currentStep.z;
        const { currentIdx } = currentStep;

        return zArr.map((val, idx) => {
            let state = 'default';
            if (idx === currentIdx) state = 'active';
            if (idx === 0) state = 'first';

            return (
                <div key={idx} className={`z-cell z-val-cell state-${state}`}>
                    {idx === 0 ? 'X' : val}
                </div>
            );
        });
    };

    return (
        <DualView
            algorithmName="Z-Algorithm (String Matching)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Build the Z-array to find the pattern in linear time.'}
        >
            <div className="z-container">
                <div className="z-input-bar">
                    <div className="z-input-group">
                        <label>Text:</label>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                        />
                    </div>
                    <div className="z-input-group">
                        <label>Pattern:</label>
                        <input
                            type="text"
                            value={patternInput}
                            onChange={(e) => setPatternInput(e.target.value)}
                        />
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Apply</button>
                </div>

                <div className="z-visual-area">
                    <div className="z-row z-char-row">
                        <div className="z-row-label">String (P + $ + T)</div>
                        <div className="z-cells-container">
                            {renderConcatCells()}
                        </div>
                    </div>

                    <div className="z-row z-val-row">
                        <div className="z-row-label">Z-Array</div>
                        <div className="z-cells-container">
                            {renderZArrayCells()}
                        </div>
                    </div>

                    {currentStep && currentStep.l !== -1 && (
                        <div className="z-box-info">
                            Current Z-box: <strong>[L={currentStep.l}, R={currentStep.r}]</strong>
                        </div>
                    )}
                </div>

                <div className="z-controls-wrapper">
                    <AnimationControls inputType="none"
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

export default ZAlgorithmVisualizer;
