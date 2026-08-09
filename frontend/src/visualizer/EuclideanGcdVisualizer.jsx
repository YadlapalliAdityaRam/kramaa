import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateGCDSteps } from '../algorithms/math/euclideanGcd';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaInfoCircle, FaRedo } from 'react-icons/fa';
import './EuclideanGcdVisualizer.css';

const EuclideanGcdVisualizer = () => {
    const [inputs, setInputs]         = useState({ a: 48, b: 18 });
    const [tempInputs, setTempInputs] = useState({ a: 48, b: 18 });
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showAnalogy, setShowAnalogy] = useState(true);

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
            case 'info':         return 2;
            case 'divide':       return 4;
            case 'swap-prepare': return 3;
            case 'update':       return 5;
            case 'completed':    return 7;
            default:             return 0;
        }
    };

    const codeSnippet = algorithmCodes.euclideanGcd?.[activeLanguage] || '';
    const stepData    = currentStep || {};

    return (
        <DualView
            algorithmName="Euclidean GCD Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="math"
            description={
                <div className="gcd-desc-wrapper">
                    <span className="gcd-badge">Modulus Reduction O(log min(a, b))</span>
                    <span className="gcd-desc-text">
                        {currentStep?.description || "Press Play to observe Euclidean reduction: GCD(a, b) = GCD(b, a % b)."}
                    </span>
                </div>
            }
        >
            <div className="gcd-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="gcd-input-panel">
                    <div className="gcd-input-group">
                        <label className="gcd-input-label">Num A:</label>
                        <input
                            type="number"
                            min="1"
                            value={tempInputs.a}
                            onChange={(e) => setTempInputs({ ...tempInputs, a: parseInt(e.target.value, 10) || 0 })}
                            className="gcd-number-input"
                        />
                    </div>

                    <div className="gcd-input-group">
                        <label className="gcd-input-label">Num B:</label>
                        <input
                            type="number"
                            min="0"
                            value={tempInputs.b}
                            onChange={(e) => setTempInputs({ ...tempInputs, b: parseInt(e.target.value, 10) || 0 })}
                            className="gcd-number-input"
                        />
                    </div>

                    <div className="gcd-btn-group">
                        <button onClick={handleApply} className="gcd-btn gcd-btn-primary">
                            <FaCheck /> Start
                        </button>
                        <button onClick={() => setShowAnalogy(!showAnalogy)} className="gcd-btn gcd-btn-outline">
                            <FaInfoCircle /> {showAnalogy ? 'Hide Analogy' : 'Show Analogy'}
                        </button>
                        <button onClick={() => { setInputs({ a: 48, b: 18 }); setTempInputs({ a: 48, b: 18 }); reset(); }} className="gcd-btn gcd-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="gcd-legend">
                        <div className="gcd-leg-item"><span className="gcd-dot blue"></span> Variable A</div>
                        <div className="gcd-leg-item"><span className="gcd-dot purple"></span> Variable B</div>
                        <div className="gcd-leg-item"><span className="gcd-dot green"></span> Final GCD</div>
                    </div>
                </div>

                {/* Rope Cutting Analogy Callout */}
                {showAnalogy && (
                    <div className="gcd-analogy-panel">
                        <h4>✂️ The Rope Cutting Analogy</h4>
                        <p>
                            Finding the GCD is like measuring two ropes with the longest possible ruler so that both ropes can be evenly measured without remainder!
                        </p>
                        <p>
                            We repeatedly measure <code>A</code> with <code>B</code> and replace <code>A</code> with the remainder <code>A % B</code> until <code>B</code> reaches <code>0</code>!
                        </p>
                    </div>
                )}

                {/* ── Main Canvas Stage: Reduction Boxes & Equation ──────── */}
                <div className="gcd-canvas-wrapper">
                    
                    {/* Math Boxes */}
                    <div className="gcd-boxes-row">
                        <div className={`gcd-card-box box-a ${stepData.type === 'update' ? 'active-update' : ''}`}>
                            <span className="box-lbl">Variable A</span>
                            <span className="box-val">{stepData.a ?? inputs.a}</span>
                        </div>

                        <div className="gcd-op-symbol">
                            {stepData.type === 'divide' ? 'mod' : '='}
                        </div>

                        <div className={`gcd-card-box box-b ${stepData.type === 'swap-prepare' ? 'active-swap' : ''}`}>
                            <span className="box-lbl">Variable B</span>
                            <span className="box-val">{stepData.b ?? inputs.b}</span>
                        </div>

                        <div className="gcd-op-symbol">=</div>

                        <div className="gcd-card-box box-rem">
                            <span className="box-lbl">Remainder (A % B)</span>
                            <span className="box-val">{stepData.rem !== undefined ? stepData.rem : '-'}</span>
                        </div>
                    </div>

                    {/* Result Callout */}
                    {stepData.type === 'completed' && (
                        <div className="gcd-result-banner">
                            ✨ GCD({inputs.a}, {inputs.b}) = <strong>{stepData.gcd || stepData.a}</strong>
                        </div>
                    )}

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
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
