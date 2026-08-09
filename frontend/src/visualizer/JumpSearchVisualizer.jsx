import React, { useEffect, useMemo, useState } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateJumpSearchSteps } from '../algorithms/searching/jumpSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaCheck, FaRedo } from 'react-icons/fa';
import './JumpSearchVisualizer.css';

const DEFAULT_ARRAY = [1, 3, 5, 7, 9, 11, 13, 15, 17];

const createJumpFriendlyArray = () => {
    const length = 12;
    const start  = 2;
    const gap    = 3;
    return Array.from({ length }, (_, index) => start + index * gap);
};

const JumpSearchVisualizer = () => {
    const [inputVal, setInputVal]         = useState(DEFAULT_ARRAY.join(', '));
    const [targetVal, setTargetVal]       = useState('11');
    const [arrayData, setArrayData]       = useState(DEFAULT_ARRAY);
    const [activeTarget, setActiveTarget] = useState(11);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateJumpSearchSteps(arrayData, activeTarget),
        [arrayData, activeTarget]
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

    useEffect(() => {
        reset();
    }, [arrayData, activeTarget, reset]);

    const handleApply = () => {
        const parsedArr = inputVal.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        const parsedTarget = parseInt(targetVal, 10);

        if (parsedArr.length === 0) {
            toast.error('Please enter valid numbers for the array.');
            return;
        }
        if (isNaN(parsedTarget)) {
            toast.error('Please enter a valid target number.');
            return;
        }

        const sortedArr = [...parsedArr].sort((a, b) => a - b);
        setArrayData(sortedArr);
        setActiveTarget(parsedTarget);
        toast.success('Applied and sorted array for Jump Search!');
    };

    const handleRandomize = () => {
        const randomArr = createJumpFriendlyArray();
        const randomTarget = randomArr[Math.floor(Math.random() * randomArr.length)];

        setArrayData(randomArr);
        setActiveTarget(randomTarget);
        setInputVal(randomArr.join(', '));
        setTargetVal(String(randomTarget));
        toast.success('Generated a sorted demo array for Jump Search!');
    };

    const codeSnippet = algorithmCodes.jumpSearch?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init':      return 3;
            case 'jump':      return 7;
            case 'linear':    return 12;
            case 'found':     return 13;
            case 'not-found': return 17;
            default:          return 0;
        }
    };

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const { blockStart, blockEnd, activeIndex, type, jumpStep } = currentStep || {};
    const safeStart = blockStart !== undefined && blockStart !== null ? blockStart : -1;
    const safeEnd   = blockEnd !== undefined && blockEnd !== null ? blockEnd : -1;

    return (
        <DualView
            algorithmName="Jump Search (Block Search)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="searching"
            description={
                <div className="jmp-desc-wrapper">
                    <span className="jmp-badge">Fixed Block Jump O(√N)</span>
                    <span className="jmp-desc-text">
                        {currentStep?.description || "Press Play to observe block jumping (step size = √N) followed by linear scan."}
                    </span>
                </div>
            }
        >
            <div className="jmp-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="jmp-input-panel">
                    <div className="jmp-input-group">
                        <label className="jmp-input-label">Array:</label>
                        <input
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="1, 3, 5, 7, 9"
                            className="jmp-text-input"
                        />
                    </div>

                    <div className="jmp-input-group">
                        <label className="jmp-input-label">Target:</label>
                        <input
                            type="number"
                            value={targetVal}
                            onChange={(e) => setTargetVal(e.target.value)}
                            className="jmp-number-input"
                        />
                    </div>

                    <div className="jmp-btn-group">
                        <button onClick={handleApply} className="jmp-btn jmp-btn-primary">
                            <FaCheck /> Find
                        </button>
                        <button onClick={handleRandomize} className="jmp-btn jmp-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArrayData(DEFAULT_ARRAY); setInputVal(DEFAULT_ARRAY.join(", ")); setActiveTarget(11); setTargetVal('11'); reset(); }} className="jmp-btn jmp-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="jmp-legend">
                        <div className="jmp-leg-item"><span className="jmp-dot blue"></span> Active Jump Block</div>
                        <div className="jmp-leg-item"><span className="jmp-dot yellow"></span> Linear Scan Cell</div>
                        <div className="jmp-leg-item"><span className="jmp-dot green"></span> Target Found</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Array Grid with Jump Blocks ───────── */}
                <div className="jmp-canvas-wrapper">
                    <div className="jmp-info-card">
                        <span>Block Jump Step Size <code>m = ⌊√N⌋ = {jumpStep || Math.floor(Math.sqrt(currentArray.length))}</code></span>
                    </div>

                    <div className="jmp-array-grid">
                        {currentArray.map((val, idx) => {
                            let stateClass = 'default';

                            if (safeStart !== -1 && safeEnd !== -1 && idx >= safeStart && idx <= safeEnd) {
                                stateClass = 'in-block';
                            }
                            if (idx === activeIndex) stateClass = 'active';
                            if (type === 'found' && idx === activeIndex) stateClass = 'found';

                            return (
                                <div key={idx} className="jmp-cell-wrapper">
                                    <div className={`jmp-cell state-${stateClass}`}>
                                        <span className="jmp-val">{val}</span>
                                        {idx === safeStart && <span className="jmp-ptr-badge start">Block Start</span>}
                                        {idx === safeEnd && <span className="jmp-ptr-badge end">Block End</span>}
                                    </div>
                                    <span className="jmp-idx">{idx}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="jmp-controls-wrapper">
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

export default JumpSearchVisualizer;
