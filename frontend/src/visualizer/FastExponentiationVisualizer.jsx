import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFastExpSteps } from '../algorithms/math/fastExponentiation';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaInfoCircle, FaRedo } from 'react-icons/fa';
import './FastExponentiationVisualizer.css';

const FastExponentiationVisualizer = () => {
    const [inputs, setInputs]         = useState({ base: 3, exp: 13 });
    const [tempInputs, setTempInputs] = useState({ base: 3, exp: 13 });
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showAnalogy, setShowAnalogy] = useState(true);

    const steps = useMemo(
        () => generateFastExpSteps(inputs.base, inputs.exp),
        [inputs]
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
        if (tempInputs.base < 1 || tempInputs.exp < 0) {
            toast.error("Please enter positive base and non-negative exponent.");
            return;
        }
        if (tempInputs.exp > 500) {
            toast.error("Exponent max 500 for visualization.");
            return;
        }
        setInputs(tempInputs);
        reset();
        toast.success(`Calculating ${tempInputs.base}^${tempInputs.exp}`);
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info':      return 6;
            case 'check-bit': return 7;
            case 'multiply':  return 8;
            case 'square':    return 10;
            case 'completed': return 14;
            default:          return 0;
        }
    };

    const codeSnippet = algorithmCodes.fastExponentiation?.[activeLanguage] || '';
    const stepData    = currentStep || {};

    return (
        <DualView
            algorithmName="Fast Exponentiation (Binary Exponentiation)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="math"
            description={
                <div className="fe-desc-wrapper">
                    <span className="fe-badge">Repeated Squaring O(log N)</span>
                    <span className="fe-desc-text">
                        {currentStep?.description || "Press Play to compute powers in O(log N) steps using binary power rule."}
                    </span>
                </div>
            }
        >
            <div className="fe-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="fe-input-panel">
                    <div className="fe-input-group">
                        <label className="fe-input-label">Base (x):</label>
                        <input
                            type="number"
                            min="1"
                            value={tempInputs.base}
                            onChange={(e) => setTempInputs({ ...tempInputs, base: parseInt(e.target.value, 10) || 0 })}
                            className="fe-number-input"
                        />
                    </div>

                    <div className="fe-input-group">
                        <label className="fe-input-label">Exponent (n):</label>
                        <input
                            type="number"
                            min="0"
                            value={tempInputs.exp}
                            onChange={(e) => setTempInputs({ ...tempInputs, exp: parseInt(e.target.value, 10) || 0 })}
                            className="fe-number-input"
                        />
                    </div>

                    <div className="fe-btn-group">
                        <button onClick={handleApply} className="fe-btn fe-btn-primary">
                            <FaCheck /> Calculate
                        </button>
                        <button onClick={() => setShowAnalogy(!showAnalogy)} className="fe-btn fe-btn-outline">
                            <FaInfoCircle /> {showAnalogy ? 'Hide Analogy' : 'Show Analogy'}
                        </button>
                        <button onClick={() => { setInputs({ base: 3, exp: 13 }); setTempInputs({ base: 3, exp: 13 }); reset(); }} className="fe-btn fe-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="fe-legend">
                        <div className="fe-leg-item"><span className="fe-dot blue"></span> Current Base</div>
                        <div className="fe-leg-item"><span className="fe-dot yellow"></span> Active Bit (1)</div>
                        <div className="fe-leg-item"><span className="fe-dot green"></span> Running Result</div>
                    </div>
                </div>

                {/* Stair Doubling Analogy Callout */}
                {showAnalogy && (
                    <div className="fe-analogy-panel">
                        <h4>🧗 The Stair Doubling Analogy</h4>
                        <p>
                            Instead of performing 1,000 separate multiplications (3 × 3 × 3...), we <strong>square the base</strong> in every step: 3¹ → 3² → 3⁴ → 3⁸!
                        </p>
                        <p>
                            By looking at the binary representation of the exponent, we only multiply the running result when the binary bit is <code>1</code>!
                        </p>
                    </div>
                )}

                {/* ── Main Canvas Stage: Binary Bits & State Metrics ──────── */}
                <div className="fe-canvas-wrapper">
                    
                    {/* Binary Bits Row */}
                    <div className="fe-bits-card">
                        <div className="fe-card-title">Binary Representation of Exponent ({inputs.exp})</div>
                        <div className="fe-bits-row">
                            {(stepData.bits || []).map((bit, idx) => {
                                const isCurrent = stepData.bitIdx === idx;
                                const isPassed  = idx < (stepData.bitIdx || 0);

                                let bitClass = 'default';
                                if (isCurrent) bitClass = 'active';
                                else if (isPassed) bitClass = 'passed';

                                return (
                                    <div key={idx} className={`fe-bit-cell ${bitClass}`}>
                                        <span className="bit-val">{bit}</span>
                                        <span className="bit-pos">2^{idx}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* State Metrics Grid */}
                    <div className="fe-metrics-row">
                        <div className="fe-metric-box">
                            <span className="m-lbl">Current Base (x)</span>
                            <span className="m-val blue">{stepData.currentBase ?? inputs.base}</span>
                        </div>
                        <div className="fe-metric-box">
                            <span className="m-lbl">Running Result</span>
                            <span className="m-val green">{stepData.result ?? 1}</span>
                        </div>
                        <div className="fe-metric-box">
                            <span className="m-lbl">Remaining Exponent</span>
                            <span className="m-val yellow">{stepData.currentExponent ?? inputs.exp}</span>
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="fe-controls-wrapper">
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

export default FastExponentiationVisualizer;
