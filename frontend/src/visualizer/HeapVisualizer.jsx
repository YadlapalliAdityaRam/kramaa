import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import TreeCanvas from './TreeCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateHeapSteps } from '../algorithms/trees/heap';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlus, FaRandom, FaExchangeAlt, FaRedo } from 'react-icons/fa';
import './HeapVisualizer.css';

const DEFAULT_ARRAY = [10, 5, 20, 3, 8, 15, 2];

const buildTreeFromArray = (arr) => {
    if (!arr || arr.length === 0) return null;
    const nodes = arr.map((val, i) => ({
        id: `hp_${i}`,
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

const HeapVisualizer = () => {
    const [mode, setMode]                 = useState('min');
    const [inputVal, setInputVal]         = useState('');
    const [heapData, setHeapData]         = useState(DEFAULT_ARRAY);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateHeapSteps(heapData, mode),
        [heapData, mode]
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
    }, [mode, heapData]);

    const handleApplyArray = () => {
        const parsed = inputVal.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers.");
            return;
        }
        if (parsed.length > 15) {
            toast.error("Maximum 15 elements for visualization.");
            return;
        }
        setHeapData(parsed);
        toast.success("Applied new heap array!");
    };

    const handleInsert = () => {
        const parsed = inputVal.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers to insert.");
            return;
        }
        if (heapData.length + parsed.length > 15) {
            toast.error("Maximum 15 elements for visualization.");
            return;
        }
        setHeapData([...heapData, ...parsed]);
        setInputVal('');
        toast.success(`Inserted ${parsed.join(', ')}`);
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 7 }, () => Math.floor(Math.random() * 99) + 1);
        setHeapData(randomArr);
        toast.success("Heap randomized!");
    };

    const codeSnippet = algorithmCodes.heap?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'insert':       return 3;
            case 'compare':      return 10;
            case 'swap':         return 11;
            case 'extract-start':return 16;
            case 'extract-move': return 21;
            case 'check':        return 30;
            default:             return 0;
        }
    };

    const stepData = currentStep || {};

    const treeData = useMemo(() => {
        if (stepData.treeData) return stepData.treeData;
        if (stepData.arraySnapshot && stepData.arraySnapshot.length > 0) {
            return buildTreeFromArray(stepData.arraySnapshot);
        }
        return buildTreeFromArray(heapData);
    }, [stepData, heapData]);

    return (
        <DualView
            algorithmName={`Heap (${mode === 'min' ? 'Min-Heap' : 'Max-Heap'}) — Priority Queue`}
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="trees"
            description={
                <div className="hp-desc-wrapper">
                    <span className="hp-badge">{mode === 'min' ? 'Min Priority Queue' : 'Max Priority Queue'} O(log N)</span>
                    <span className="hp-desc-text">
                        {currentStep?.description || "Press Play to observe heapify sift-up and sift-down operations."}
                    </span>
                </div>
            }
        >
            <div className="hp-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="hp-input-panel">
                    <div className="hp-input-group">
                        <label className="hp-input-label">Numbers:</label>
                        <input
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                            placeholder="10, 5, 20..."
                            className="hp-text-input"
                        />
                        <button onClick={handleInsert} className="hp-btn hp-btn-primary">
                            <FaPlus /> Insert
                        </button>
                    </div>

                    <div className="hp-btn-group">
                        <button onClick={() => setMode(mode === 'min' ? 'max' : 'min')} className="hp-btn hp-btn-secondary">
                            <FaExchangeAlt /> {mode === 'min' ? 'Switch to Max-Heap' : 'Switch to Min-Heap'}
                        </button>
                        <button onClick={handleRandomize} className="hp-btn hp-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setHeapData(DEFAULT_ARRAY); setInputVal(''); reset(); }} className="hp-btn hp-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="hp-legend">
                        <div className="hp-leg-item"><span className="hp-dot yellow"></span> Comparing</div>
                        <div className="hp-leg-item"><span className="hp-dot green"></span> Root Priority</div>
                        <div className="hp-leg-item"><span className="hp-dot purple"></span> Swapping</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Binary Tree & Array Chips ────────── */}
                <div className="hp-canvas-wrapper">
                    
                    {/* Binary Max/Min Heap Tree */}
                    <div className="hp-tree-panel">
                        <div className="hp-card-title">Binary Heap Tree</div>
                        <div className="hp-canvas-box">
                            <TreeCanvas
                                treeData={treeData}
                                nodeStates={stepData.nodeStates || {}}
                            />
                        </div>
                    </div>

                    {/* Heap Array State Chips */}
                    <div className="hp-array-panel">
                        <div className="hp-card-title">Array Representation <code>heap[i]</code></div>
                        <div className="hp-array-grid">
                            {(stepData.arraySnapshot || stepData.array || heapData).map((val, idx) => {
                                const state = stepData.nodeStates?.[`hp_${idx}`] || 'default';
                                return (
                                    <div key={idx} className="hp-chip-wrapper">
                                        <div className={`hp-chip state-${state}`}>
                                            <span className="hp-val">{val}</span>
                                        </div>
                                        <span className="hp-idx">idx {idx}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="hp-controls-wrapper">
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

export default HeapVisualizer;
