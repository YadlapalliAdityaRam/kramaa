import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import TreeCanvas from './TreeCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateHeapSortSteps } from '../algorithms/sorting/heapSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaCheck, FaRedo } from 'react-icons/fa';
import './HeapSortVisualizer.css';

const DEFAULT_ARRAY = [4, 10, 3, 5, 1, 8, 7];

const buildTreeFromArray = (arr, heapSize) => {
    if (!arr || arr.length === 0) return null;
    const effectiveSize = (heapSize !== undefined && heapSize !== null) ? heapSize : arr.length;
    if (effectiveSize === 0) return null;

    const nodes = arr.slice(0, effectiveSize).map((val, i) => ({
        id: `hs_${i}`,
        value: val,
        label: `${val}`,
        arrayIndex: i,
        left: null,
        right: null
    }));
    for (let i = 0; i < nodes.length; i++) {
        const li = 2 * i + 1;
        const ri = 2 * i + 2;
        if (li < nodes.length) nodes[i].left = nodes[li];
        if (ri < nodes.length) nodes[i].right = nodes[ri];
    }
    return nodes[0];
};

const HeapSortVisualizer = () => {
    const [inputValue, setInputValue]         = useState(DEFAULT_ARRAY.join(', '));
    const [arrayData, setArrayData]           = useState(DEFAULT_ARRAY);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateHeapSortSteps(arrayData, true), [arrayData]);

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
    }, [arrayData]);

    const handleApply = () => {
        const parsed = inputValue.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers separated by commas.");
            return;
        }
        if (parsed.length > 15) {
            toast.error("Maximum 15 elements allowed.");
            return;
        }
        setArrayData(parsed);
        toast.success("Array applied!");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 7 }, () => Math.floor(Math.random() * 90) + 10);
        setArrayData(randomArr);
        setInputValue(randomArr.join(', '));
        toast.success("Array randomized!");
    };

    const codeSnippet = algorithmCodes.heapSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'heapify-start': return 4;
            case 'compare':       return 17;
            case 'swap':          return 20;
            case 'swap-root':     return 8;
            case 'reduce-heap':   return 9;
            default:              return 0;
        }
    };

    const treeData = useMemo(() => {
        if (!currentStep) return buildTreeFromArray(arrayData, arrayData.length);
        const size = currentStep.heapSize !== undefined ? currentStep.heapSize : (currentStep.arraySnapshot?.length || arrayData.length);
        return buildTreeFromArray(currentStep.arraySnapshot || arrayData, size);
    }, [currentStep, arrayData]);

    const nodeStates = useMemo(() => {
        if (!currentStep) return {};
        const states = {};
        const size = currentStep.heapSize !== undefined ? currentStep.heapSize : (currentStep.arraySnapshot?.length || arrayData.length);

        for (let i = 0; i < size; i++) {
            states[`hs_${i}`] = 'default';
        }
        if (currentStep.activeNode !== undefined && currentStep.activeNode < size) {
            states[`hs_${currentStep.activeNode}`] = 'root-node';
        }
        if (currentStep.compareNodes) {
            currentStep.compareNodes.forEach(idx => {
                if (idx < size) states[`hs_${idx}`] = 'comparing';
            });
        }
        if (currentStep.swapNodes) {
            currentStep.swapNodes.forEach(idx => {
                if (idx < size) states[`hs_${idx}`] = 'swapping';
            });
        }
        return states;
    }, [currentStep, arrayData]);

    const currentArray = currentStep?.arraySnapshot || arrayData;
    const heapSize     = currentStep?.heapSize ?? arrayData.length;

    return (
        <DualView
            algorithmName="Heap Sort (Binary Heap Representation)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="sorting"
            description={
                <div className="hs-desc-wrapper">
                    <span className="hs-badge">Max-Heap Tree O(N log N)</span>
                    <span className="hs-desc-text">
                        {currentStep?.description || 'Press Play to build Max-Heap and extract maximum elements to the end.'}
                    </span>
                </div>
            }
        >
            <div className="hs-visualizer-wrapper">

                {/* ── Top Input Panel ──────────────────────────────────────── */}
                <div className="hs-input-panel">
                    <div className="hs-input-group">
                        <label className="hs-input-label">Custom Array:</label>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="4, 10, 3, 5, 1"
                            className="hs-text-input"
                        />
                        <button onClick={handleApply} className="hs-btn hs-btn-primary">
                            <FaCheck /> Apply
                        </button>
                    </div>

                    <div className="hs-btn-group">
                        <button onClick={handleRandomize} className="hs-btn hs-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setArrayData(DEFAULT_ARRAY); setInputValue(DEFAULT_ARRAY.join(", ")); reset(); }} className="hs-btn hs-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="hs-legend">
                        <div className="hs-leg-item"><span className="hs-dot blue"></span> Heap Root</div>
                        <div className="hs-leg-item"><span className="hs-dot yellow"></span> Comparing</div>
                        <div className="hs-leg-item"><span className="hs-dot red"></span> Swapping</div>
                        <div className="hs-leg-item"><span className="hs-dot green"></span> Sorted (Extracted)</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Binary Heap Tree & Array View ───────── */}
                <div className="hs-canvas-wrapper">
                    
                    {/* Binary Heap Tree */}
                    <div className="hs-tree-panel">
                        <div className="hs-card-title">Binary Max-Heap Representation</div>
                        <div className="hs-tree-canvas-wrap">
                            <TreeCanvas treeData={treeData} nodeStates={nodeStates} />
                        </div>
                    </div>

                    {/* Array Representation */}
                    <div className="hs-array-panel">
                        <div className="hs-card-title">Array Representation</div>
                        <div className="hs-array-row">
                            {currentArray.map((val, idx) => {
                                const isSorted = idx >= heapSize;
                                const isRoot   = idx === currentStep?.activeNode;
                                const isComp   = currentStep?.compareNodes?.includes(idx);
                                const isSwap   = currentStep?.swapNodes?.includes(idx);

                                let stateClass = 'default';
                                if (isSorted) stateClass = 'sorted';
                                else if (isSwap) stateClass = 'swap';
                                else if (isComp) stateClass = 'compare';
                                else if (isRoot) stateClass = 'root';

                                return (
                                    <div key={idx} className={`hs-arr-cell ${stateClass}`}>
                                        <span className="hs-val">{val}</span>
                                        <span className="hs-idx">[{idx}]</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="hs-controls-wrapper">
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

export default HeapSortVisualizer;
