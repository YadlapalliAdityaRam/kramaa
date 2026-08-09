import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateInterpolationSearchSteps } from '../algorithms/searching/interpolationSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaCheck, FaRedo } from 'react-icons/fa';
import './InterpolationSearchVisualizer.css';

const DEFAULT_ARRAY = [10, 20, 30, 40, 50, 60, 70];

const createUniformArray = () => {
    const length = 10;
    const start  = 10;
    const step   = 10;
    return Array.from({ length }, (_, index) => start + index * step);
};

const InterpolationSearchVisualizer = () => {
    const [inputVal, setInputVal]         = useState(DEFAULT_ARRAY.join(', '));
    const [targetVal, setTargetVal]       = useState('50');
    const [arrayData, setArrayData]       = useState(DEFAULT_ARRAY);
    const [activeTarget, setActiveTarget] = useState(50);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateInterpolationSearchSteps(arrayData, activeTarget), [arrayData, activeTarget]);

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

    useEffect(() => {
        reset();
    }, [arrayData, activeTarget]);

    const handleApply = () => {
        const parsedArr = inputVal.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        const parsedTarget = parseInt(targetVal, 10);

        if (parsedArr.length === 0) {
            toast.error("Please enter valid numbers for the array.");
            return;
        }
        if (isNaN(parsedTarget)) {
            toast.error("Please enter a valid target number.");
            return;
        }

        const sortedArr = [...new Set(parsedArr)].sort((a, b) => a - b);
        setArrayData(sortedArr);
        setActiveTarget(parsedTarget);
        toast.success("Applied and sorted input array!");
    };

    const handleRandomize = () => {
        const randomArr = createUniformArray();
        const randomTarget = randomArr[Math.floor(Math.random() * randomArr.length)];

        setArrayData(randomArr);
        setActiveTarget(randomTarget);
        setInputVal(randomArr.join(', '));
        setTargetVal(randomTarget.toString());
        toast.success("Generated a uniformly distributed demo array!");
    };

    const codeSnippet = algorithmCodes.interpolationSearch?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'estimate':       return 4;
            case 'compare':        return 7;
            case 'found':          return 7;
            case 'move-left':      return 9;
            case 'move-right':     return 8;
            case 'not-found':      return 11;
            case 'compare-single': return 7;
            default:               return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { low, high, pos, type, formula, discardedIndices = [] } = currentStep || {};
    const safeLow  = low !== undefined && low !== null ? low : -1;
    const safeHigh = high !== undefined && high !== null ? high : -1;
    const safePos  = pos !== undefined && pos !== null ? pos : -1;

    return (
        <DualView
            algorithmName="Interpolation Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="searching"
            description={
                <div className="inp-desc-wrapper">
                    <span className="inp-badge">Proportional Estimator O(log log N)</span>
                    <span className="inp-desc-text">
                        {currentStep?.description || "Press Play to estimate target position using key ratio math."}
                    </span>
                </div>
            }
        >
            <div className="inp-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="inp-input-panel">
                    <div className="inp-input-group">
                        <label className="inp-input-label">Array:</label>
                        <input
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="10, 20, 30, 40, 50"
                            className="inp-text-input"
                        />
                    </div>

                    <div className="inp-input-group">
                        <label className="inp-input-label">Target:</label>
                        <input
                            type="number"
                            value={targetVal}
                            onChange={(e) => setTargetVal(e.target.value)}
                            className="inp-number-input"
                        />
                    </div>

                    <div className="inp-btn-group">
                        <button onClick={handleApply} className="inp-btn inp-btn-primary">
                            <FaCheck /> Find
                        </button>
                        <button onClick={handleRandomize} className="inp-btn inp-btn-secondary">
                            <FaRandom /> Uniform Array
                        </button>
                        <button onClick={() => { setArrayData(DEFAULT_ARRAY); setInputVal(DEFAULT_ARRAY.join(", ")); setActiveTarget(50); setTargetVal('50'); reset(); }} className="inp-btn inp-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="inp-legend">
                        <div className="inp-leg-item"><span className="inp-dot blue"></span> Low / High Bound</div>
                        <div className="inp-leg-item"><span className="inp-dot yellow"></span> Estimated Pos</div>
                        <div className="inp-leg-item"><span className="inp-dot green"></span> Target Found</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Proportional Cell Grid & Math Card ── */}
                <div className="inp-canvas-wrapper">
                    
                    {/* Interpolation Formula Card */}
                    <div className="inp-formula-card">
                        <span className="formula-lbl">Estimation Formula:</span>
                        <code>
                            {formula || `pos = low + [ (target - arr[low]) * (high - low) / (arr[high] - arr[low]) ]`}
                        </code>
                    </div>

                    {/* Array Cells Grid */}
                    <div className="inp-array-grid">
                        {currentArray.map((val, idx) => {
                            let stateClass = 'default';
                            if (discardedIndices.includes(idx)) stateClass = 'discarded';
                            if (idx >= safeLow && idx <= safeHigh) stateClass = 'in-range';
                            if (idx === safeLow || idx === safeHigh) stateClass = 'bound';
                            if (idx === safePos) stateClass = 'pos';
                            if (type === 'found' && idx === safePos) stateClass = 'found';

                            return (
                                <div key={idx} className="inp-cell-wrapper">
                                    <div className={`inp-cell state-${stateClass}`}>
                                        <span className="inp-val">{val}</span>
                                        {idx === safeLow && <span className="inp-ptr-badge low">Low</span>}
                                        {idx === safeHigh && <span className="inp-ptr-badge high">High</span>}
                                        {idx === safePos && <span className="inp-ptr-badge pos">Pos</span>}
                                    </div>
                                    <span className="inp-idx">{idx}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="inp-controls-wrapper">
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

export default InterpolationSearchVisualizer;
