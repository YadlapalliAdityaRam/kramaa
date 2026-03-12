import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import TreeCanvas from './TreeCanvas';
import InputArrayDisplay from '../components/InputArrayDisplay';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateHeapSortSteps } from '../algorithms/sorting/heapSort';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaExchangeAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './HeapSortVisualizer.css';

// Build a tree structure out of an array for TreeCanvas
const buildTreeFromArray = (arr, heapSize) => {
    if (arr.length === 0 || heapSize === 0) return null;
    const nodes = arr.slice(0, heapSize).map((val, i) => ({
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
    const [inputVal, setInputVal] = useState('4, 10, 3, 5, 1');
    const [arrayData, setArrayData] = useState([4, 10, 3, 5, 1]);
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
        const parsed = inputVal.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (parsed.length === 0) {
            toast.error("Please enter valid numbers separated by commas.");
            return;
        }
        if (parsed.length > 15) {
            toast.error("Maximum 15 elements allowed for clear visualization.");
            return;
        }
        setArrayData(parsed);
        toast.success("Array applied");
    };

    const handleRandomize = () => {
        const randomArr = Array.from({ length: 8 }, () => Math.floor(Math.random() * 99) + 1);
        setArrayData(randomArr);
        setInputVal(randomArr.join(', '));
        toast.success("Array randomized");
    };

    const codeSnippet = algorithmCodes.heapSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'heapify-start': return 13;
            case 'compare': return 17;
            case 'swap': return 28;
            case 'swap-root': return 43;
            case 'reduce-heap': return 45;
            default: return 0;
        }
    };

    // Calculate dynamic node states based on the current step
    const treeData = useMemo(() => {
        if (!currentStep) return null;
        return buildTreeFromArray(currentStep.arraySnapshot, currentStep.heapSize);
    }, [currentStep]);

    const nodeStates = useMemo(() => {
        if (!currentStep) return {};
        const states = {};
        for (let i = 0; i < currentStep.heapSize; i++) {
            states[`hs_${i}`] = 'default';
        }

        if (currentStep.activeNode !== undefined) {
             states[`hs_${currentStep.activeNode}`] = 'root-node'; // Blue
        }
        if (currentStep.compareNodes) {
             currentStep.compareNodes.forEach(idx => {
                 states[`hs_${idx}`] = 'compare-node'; // Yellow
             });
        }
        if (currentStep.swapNodes) {
             currentStep.swapNodes.forEach(idx => {
                 // only mark if within heap size bounds
                 if (idx < currentStep.heapSize) states[`hs_${idx}`] = 'swap-node'; // Red
             });
        }
        return states;
    }, [currentStep]);

    return (
        <DualView
            algorithmName="Heap Sort"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Build a Max Heap, then repeatedly swap the root with the last element."}
        >
            <div className="heapsort-container">
                <div className="heapsort-input-bar">
                    <div className="heapsort-input-group">
                        <label>Array:</label>
                        <input
                            type="text"
                            className="heapsort-value-input"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 4, 10, 3, 5, 1"
                        />
                    </div>
                    <button className="hs-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="hs-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="heapsort-visual-grid">
                    <div className="heapsort-tree-area">
                        <div className="panel-label">
                            Max Heap (Size: {currentStep ? currentStep.heapSize : arrayData.length})
                        </div>
                        <div className="tree-wrapper">
                            <TreeCanvas
                                treeData={treeData}
                                nodeStates={nodeStates}
                            />
                        </div>
                    </div>

                    <div className="heapsort-array-panel">
                        <div className="panel-label">
                            <FaExchangeAlt /> Array Representation
                        </div>
                        <div className="heapsort-array-display">
                            {(currentStep?.arraySnapshot || arrayData).map((val, idx) => {
                                let boxClass = 'array-box';
                                const isSorted = currentStep?.sortedIndices?.includes(idx);
                                const isRoot = idx === currentStep?.activeNode;
                                const isComparing = currentStep?.compareNodes?.includes(idx);
                                const isSwapping = currentStep?.swapNodes?.includes(idx);

                                if (isSorted) boxClass += ' sorted-box';
                                else if (isSwapping) boxClass += ' swap-box';
                                else if (isComparing) boxClass += ' compare-box';
                                else if (isRoot) boxClass += ' root-box';

                                const isInHeap = currentStep ? idx < currentStep.heapSize : true;
                                if (!isInHeap && !isSorted) boxClass += ' dim-box'; 

                                return (
                                    <div key={idx} className="array-item">
                                        <div className={boxClass}>
                                            {val}
                                        </div>
                                        <div className="array-idx">{idx}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="heapsort-footer">
                    <div className="heapsort-legend">
                        <div className="leg-item"><span className="dot blue"></span> Root / Active</div>
                        <div className="leg-item"><span className="dot yellow"></span> Comparing</div>
                        <div className="leg-item"><span className="dot red"></span> Swapping</div>
                        <div className="leg-item"><span className="dot green"></span> Sorted</div>
                    </div>
                </div>

                <div className="heapsort-controls-wrapper">
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

                {/* Education Panel */}
                <div className="cs-education-panel">
                    <div className="cs-edu-grid">
                        <div className="cs-edu-section">
                            <h3>How It Works</h3>
                            <p>
                                Heap Sort works by visualizing the elements of the array as a special kind of complete binary tree called a heap. 
                                First, it builds a <strong>Max-Heap</strong> from the input array, where the largest element becomes the root.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>The Sorting Process</h3>
                            <p>
                                It then repeatedly swaps the root (the maximum value) with the last element of the heap, 
                                effectively placing the largest number in its correct sorted position. The heap size is reduced by 1, 
                                and the remaining properties of the heap are restored by "heapifying" the new root downwards. 
                                This repeats until the heap is empty and the array is sorted.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(n log n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>O(n log n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#f87171' }}>O(n log n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Stable Sort</span>
                                    <span style={{ color: '#f87171' }}>No</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default HeapSortVisualizer;
