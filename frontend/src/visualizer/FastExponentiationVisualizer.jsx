import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFastExpSteps } from '../algorithms/math/fastExponentiation';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaArrowUp, FaBolt, FaLayerGroup } from 'react-icons/fa';
import './FastExponentiationVisualizer.css';

const FastExponentiationVisualizer = () => {
    const [inputs, setInputs] = useState({ base: 3, exp: 13 });
    const [tempInputs, setTempInputs] = useState({ base: 3, exp: 13 });
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showAnalogy, setShowAnalogy] = useState(false);

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
            toast.error("Please enter a positive base and non-negative exponent.");
            return;
        }
        if (tempInputs.exp > 1000) {
            toast.error("Exponent too large for visualization (max 1000).");
            return;
        }
        setInputs(tempInputs);
        reset();
        toast.success(`Calculating ${tempInputs.base}^${tempInputs.exp}`);
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return 10;
            case 'check-bit': return 16;
            case 'multiply': return 18;
            case 'square': return 31;
            case 'completed': return 38;
            default: return 0;
        }
    };

    return (
        <DualView
            algorithmName="Fast Exponentiation (Binary)"
            code={algorithmCodes.fastExponentiation?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Binary Exponentiation reduces the number of multiplications using the binary power rule."}
        >
            <div className="fast-exp-container">
                <div className="fast-exp-input-bar">
                    <div className="exp-input-group">
                        <label>Base:</label>
                        <input
                            type="number"
                            value={tempInputs.base}
                            onChange={(e) => setTempInputs({ ...tempInputs, base: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="exp-input-group">
                        <label>Exponent:</label>
                        <input
                            type="number"
                            value={tempInputs.exp}
                            onChange={(e) => setTempInputs({ ...tempInputs, exp: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <button className="apply-btn" onClick={handleApply}>Start</button>
                    <button className="analogy-btn" onClick={() => setShowAnalogy(!showAnalogy)}>
                        {showAnalogy ? 'Hide Analogy' : 'Show Analogy'}
                    </button>
                </div>

                {showAnalogy && (
                    <div className="fast-exp-analogy-panel">
                        <h4>🧗 The Stair Doubling Analogy</h4>
                        <p>Imagine you have to climb 1,000 stairs. Instead of taking 1,000 tiny steps, what if you could <strong>double your power</strong> with every leap?</p>
                        <p>Fast Exponentiation squares the base in every step. This means you reach huge powers (like a million) in just 20 "double-leaps" instead of doing a million tiny multiplications!</p>
                    </div>
                )}

                <div className="fast-exp-visual-area">
                    <div className="binary-panel">
                        <h5>Binary Decomposition (LSB to MSB)</h5>
                        <div className="bits-row">
                            {currentStep?.bits.map((bit, i) => (
                                <div key={i} className={`bit-box ${currentStep?.bitIdx === i ? 'active-bit' : ''} ${i < (currentStep?.bitIdx || 0) ? 'passed-bit' : ''}`}>
                                    <div className="bit-val">{bit}</div>
                                    <div className="bit-pos">2^{i}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="variables-display">
                        <div className={`var-card base-card ${currentStep?.type === 'square' ? 'anim-square' : ''}`}>
                            <div className="var-label"><FaLayerGroup /> Current Power (Base²)</div>
                            <div className="var-val">{currentStep?.base}</div>
                        </div>

                        <div className="var-card exp-card">
                            <div className="var-label"><FaArrowUp /> Remaining Exponent</div>
                            <div className="var-val">{currentStep?.exp}</div>
                        </div>

                        <div className={`var-card result-card ${currentStep?.type === 'multiply' ? 'anim-multiply' : ''} ${currentStep?.type === 'completed' ? 'anim-completed' : ''}`}>
                            <div className="var-label"><FaBolt /> Running Result</div>
                            <div className="var-val">{currentStep?.result}</div>
                        </div>
                    </div>
                </div>

                <div className="fast-exp-footer">
                    <div className="fast-exp-complexity">
                        <div className="comp-item">
                            <span className="label">Time:</span>
                            <span className="val">O(log exp)</span>
                        </div>
                        <div className="comp-item">
                            <span className="label">Space:</span>
                            <span className="val">O(1)</span>
                        </div>
                    </div>
                    <div className="fast-exp-legend">
                        <div className="leg-item"><span className="dot purple"></span> Active Bit</div>
                        <div className="leg-item"><span className="dot blue"></span> Squaring</div>
                        <div className="leg-item"><span className="dot green"></span> Multiplying</div>
                        <div className="leg-item"><span className="dot gray"></span> No Op</div>
                    </div>
                </div>

                <div className="fast-exp-controls-wrapper">
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
