import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateGCDSteps } from '../algorithms/math/euclideanGcd';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './EuclideanGcdVisualizer.css';

const EuclideanGcdVisualizer = () => {
    const [inputs, setInputs] = useState({ a: 48, b: 18 });
    const [tempInputs, setTempInputs] = useState({ a: 48, b: 18 });
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showAnalogy, setShowAnalogy] = useState(false);

    const steps = useMemo(
        () => generateGCDSteps(inputs.a, inputs.b),
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
        if (tempInputs.a <= 0 || tempInputs.b < 0) {
            toast.error("Please enter positive numbers.");
            return;
        }
        setInputs(tempInputs);
        reset();
        toast.success(`Calculating GCD(${tempInputs.a}, ${tempInputs.b})`);
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return 4;
            case 'divide': return 15;
            case 'swap-prepare': return 21;
            case 'update': return 22;
            case 'completed': return 27;
            default: return 0;
        }
    };

    return (
        <DualView
            algorithmName="Euclidean GCD Algorithm"
            code={algorithmCodes.euclideanGcd?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "The Euclidean Algorithm finds the greatest common divisor of two numbers."}
        >
            <div className="gcd-container">
                <div className="gcd-input-bar">
                    <div className="gcd-input-group">
                        <label>Num A:</label>
                        <input
                            type="number"
                            value={tempInputs.a}
                            onChange={(e) => setTempInputs({ ...tempInputs, a: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="gcd-input-group">
                        <label>Num B:</label>
                        <input
                            type="number"
                            value={tempInputs.b}
                            onChange={(e) => setTempInputs({ ...tempInputs, b: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <button className="apply-btn" onClick={handleApply}>Start</button>
                    <button className="analogy-btn" onClick={() => setShowAnalogy(!showAnalogy)}>
                        {showAnalogy ? 'Hide Analogy' : 'Show Analogy'}
                    </button>
                </div>

                {showAnalogy && (
                    <div className="gcd-analogy-panel">
                        <h4>✂️ The Rope Cutting Analogy</h4>
                        <p>Finding the GCD is like finding the <strong>longest possible measuring stick</strong> that fits exactly into two different lengths of rope without any piece left over.</p>
                        <p>We keep measuring the longer piece with the shorter one and cutting off the remainder until we find the perfect fit!</p>
                    </div>
                )}

                <div className="gcd-visual-area">
                    <div className="gcd-flow-display">
                        <div className="gcd-value-row">
                            <div className={`gcd-box state-a ${currentStep?.type === 'update' ? 'animate-update' : ''}`}>
                                <div className="box-label">A</div>
                                <div className="box-val">{currentStep?.a}</div>
                            </div>

                            <div className="gcd-op-symbol">
                                {currentStep?.type === 'divide' ? '÷' : 'GCD'}
                            </div>

                            <div className={`gcd-box state-b ${currentStep?.type === 'swap-prepare' ? 'animate-move-to-a' : ''}`}>
                                <div className="box-label">B</div>
                                <div className="box-val">{currentStep?.b}</div>
                            </div>

                            {(currentStep?.type === 'divide' || currentStep?.type === 'swap-prepare') && (
                                <>
                                    <div className="gcd-op-symbol">=</div>
                                    <div className="gcd-box state-remainder">
                                        <div className="box-label">Rem</div>
                                        <div className="box-val">{currentStep?.remainder}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {currentStep?.type === 'divide' && (
                            <div className="gcd-equation-detail">
                                {currentStep.a} = {currentStep.quotient} × {currentStep.b} + <span className="highlight-rem">{currentStep.remainder}</span>
                            </div>
                        )}
                    </div>

                    <div className="gcd-history-panel">
                        <h5>History Log</h5>
                        <div className="history-list">
                            {currentStep?.history.map((h, i) => (
                                <div key={i} className="history-item">
                                    {h.a} = {h.q} × {h.b} + <strong>{h.r}</strong>
                                </div>
                            ))}
                            {currentStep?.type === 'completed' && (
                                <div className="history-item result">
                                    GCD = <strong>{currentStep.a}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="gcd-footer">
                    <div className="gcd-complexity">
                        <div className="comp-item">
                            <span className="label">Time:</span>
                            <span className="val">O(log(min(a,b)))</span>
                        </div>
                        <div className="comp-item">
                            <span className="label">Space:</span>
                            <span className="val">O(1)</span>
                        </div>
                    </div>
                    <div className="gcd-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Input</div>
                        <div className="leg-item"><span className="dot blue"></span> Modulo</div>
                        <div className="leg-item"><span className="dot green"></span> Remainder</div>
                        <div className="leg-item"><span className="dot purple"></span> Result</div>
                    </div>
                </div>

                <div className="gcd-controls-wrapper">
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

export default EuclideanGcdVisualizer;
