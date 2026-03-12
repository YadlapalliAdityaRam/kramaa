import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import TreeCanvas from './TreeCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateHeapSteps } from '../algorithms/trees/heap';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlus, FaMinus, FaRandom, FaExchangeAlt } from 'react-icons/fa';
import './HeapVisualizer.css';

const HeapVisualizer = () => {
    const [mode, setMode] = useState('min');
    const [inputVal, setInputVal] = useState('');
    const [heapData, setHeapData] = useState([10, 5, 20, 3, 8, 15, 2]);
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
        const parsed = inputVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers");
            return;
        }
        if (parsed.length > 15) {
            toast.error("Maximum 15 elements for visualization");
            return;
        }
        setHeapData(parsed);
        // setInputVal(''); Don't clear if they applied an array
        toast.success(`Applied new array`);
    };

    const handleInsert = () => {
        const parsed = inputVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers");
            return;
        }
        if (heapData.length + parsed.length > 15) {
            toast.error("Maximum 15 elements for visualization");
            return;
        }
        setHeapData([...heapData, ...parsed]);
        setInputVal('');
        toast.success(`Inserted ${parsed.join(', ')}`);
    };

    const handleExtract = () => {
        if (heapData.length === 0) {
            toast.error("Heap is empty");
            return;
        }
        // Extraction logic is handled by the step generator
        // We just need to trigger the animation
        // However, to make it interactive, we might want to update the actual heapData
        // after the animation finishes. For now, we'll let the user see the process.
        toast.success(`Extracting ${mode === 'min' ? 'Minimum' : 'Maximum'}`);
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 7 }, () => Math.floor(Math.random() * 99) + 1);
        setHeapData(randomArr);
        toast.success("Heap randomized");
    };

    const codeSnippet = algorithmCodes.heap?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'insert': return 3;
            case 'compare': return 9;
            case 'swap': return 11;
            case 'extract-start': return 18;
            case 'extract-move': return 21;
            case 'check': return 31;
            default: return 0;
        }
    };

    return (
        <DualView
            algorithmName={`Heap (${mode === 'min' ? 'Min' : 'Max'}) — Priority Queue`}
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "A Heap is an efficient way to manage priorities."}
        >
            <div className="heap-container">
                <div className="heap-input-bar">
                    <div className="heap-controls-left">
                        <div className="heap-input-group" style={{ flexWrap: 'wrap' }}>
                            <label>Values:</label>
                            <input
                                type="text"
                                className="heap-value-input"
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleApplyArray()}
                                placeholder="e.g. 10, 5, 20"
                                style={{ width: '220px' }}
                            />
                        </div>
                        <button className="heap-btn btn-primary" onClick={handleApplyArray}>
                            Apply Array
                        </button>
                        <button className="heap-btn btn-secondary" onClick={handleInsert}>
                            <FaPlus /> Insert
                        </button>
                    </div>

                    <div className="heap-mode-toggle">
                        <button
                            className={`mode-btn ${mode === 'min' ? 'active' : ''}`}
                            onClick={() => setMode('min')}
                        >
                            Min Heap
                        </button>
                        <button
                            className={`mode-btn ${mode === 'max' ? 'active' : ''}`}
                            onClick={() => setMode('max')}
                        >
                            Max Heap
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="heap-btn btn-secondary" onClick={handleRandomize}>
                            <FaRandom /> Random
                        </button>
                        <button className="heap-btn btn-ghost" onClick={handleExtract}>
                            <FaMinus /> Extract {mode === 'min' ? 'Min' : 'Max'}
                        </button>
                    </div>
                </div>

                <div className="heap-visual-grid">
                    <div className="heap-tree-area">
                        <TreeCanvas
                            treeData={currentStep?.treeData}
                            nodeStates={currentStep?.nodeStates}
                        />
                    </div>

                    <div className="heap-array-panel">
                        <div className="panel-label">
                            <FaExchangeAlt /> Array Representation [A[i]]
                        </div>
                        <div className="heap-array-display">
                            {(currentStep?.arraySnapshot || heapData).map((val, idx) => {
                                const isHighlighted = currentStep?.highlightIndices?.includes(idx);
                                const isRoot = idx === 0;
                                return (
                                    <div key={idx} className="array-item">
                                        <div className={`array-box ${isHighlighted ? 'highlight' : ''} ${isRoot ? 'root-box' : ''}`}>
                                            {val}
                                        </div>
                                        <div className="array-idx">{idx}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="heap-footer">
                    <div className="heap-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Comparing</div>
                        <div className="leg-item"><span className="dot orange"></span> Swapping</div>
                        <div className="leg-item"><span className="dot green"></span> Satisfied</div>
                        <div className="leg-item"><span className="dot blue"></span> Root</div>
                    </div>
                    <div className="leg-item" style={{ color: '#64748b' }}>
                        * Left: 2i+1 | Right: 2i+2
                    </div>
                </div>

                <div className="heap-controls-wrapper">
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
