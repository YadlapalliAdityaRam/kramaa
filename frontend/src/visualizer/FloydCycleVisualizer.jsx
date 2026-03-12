import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFloydCycleSteps } from '../algorithms/graphs/floydCycle';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './FloydCycleVisualizer.css';

const DEFAULT_VALS = [1, 2, 3, 4, 5, 6];

const FloydCycleVisualizer = () => {
    const [listValues, setListValues] = useState(DEFAULT_VALS);
    const [cycleBack, setCycleBack] = useState(2);
    const [showIntuition, setShowIntuition] = useState(true);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateFloydCycleSteps(listValues, cycleBack),
        [listValues, cycleBack]
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

    const handleRandomize = () => {
        const len = Math.floor(Math.random() * 4) + 5; // 5-8 nodes
        const newVals = Array.from({ length: len }, (_, i) => i + 1);
        const newCycle = Math.random() > 0.3 ? Math.floor(Math.random() * (len - 1)) : -1;
        setListValues(newVals);
        setCycleBack(newCycle);
        reset();
        toast.success('Generated random linked list!');
    };

    const toggleCycle = () => {
        if (cycleBack === -1) {
            setCycleBack(Math.floor(listValues.length / 2));
            toast.success('Cycle added!');
        } else {
            setCycleBack(-1);
            toast.success('Cycle removed!');
        }
        reset();
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 65;
            case 'move': return 138;
            case 'meet': return 125;
            case 'done': return 153;
            default: return 0;
        }
    };

    const renderNodes = () => {
        if (!currentStep) return null;
        const nodeList = currentStep.nodes || [];
        const slow = currentStep.slow;
        const fast = currentStep.fast;
        const cb = currentStep.cycleBack;

        const nodeRadius = 30;
        const spacing = 100;

        return (
            <svg className="floyd-svg" viewBox={`0 0 ${Math.max(800, nodeList.length * spacing + 100)} 300`}>
                <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
                    </marker>
                    <marker id="arrow-cycle" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L9,3 z" fill="#a855f7" />
                    </marker>
                </defs>

                {/* Edges */}
                {nodeList.map((_, i) => {
                    if (i === nodeList.length - 1) {
                        if (cb !== -1) {
                            // Cycle edge
                            const fromX = i * spacing + 50 + nodeRadius;
                            const toX = cb * spacing + 50;
                            const midX = (fromX + toX) / 2;
                            return (
                                <path
                                    key="cycle-edge"
                                    d={`M ${fromX} 150 Q ${midX} 250 ${toX} 185`}
                                    fill="none"
                                    stroke="#a855f7"
                                    strokeWidth="3"
                                    strokeDasharray="5,5"
                                    markerEnd="url(#arrow-cycle)"
                                    className="cycle-path-anim"
                                />
                            );
                        }
                        return null;
                    }
                    return (
                        <line
                            key={`edge-${i}`}
                            x1={i * spacing + 50 + nodeRadius}
                            y1="150"
                            x2={(i + 1) * spacing + 50 - nodeRadius}
                            y2="150"
                            stroke="#64748b"
                            strokeWidth="2"
                            markerEnd="url(#arrow)"
                        />
                    );
                })}

                {/* NULL at end */}
                {cb === -1 && nodeList.length > 0 && (
                    <text x={nodeList.length * spacing - 20} y="155" fill="#64748b" fontSize="14" fontWeight="bold">NULL</text>
                )}

                {/* Nodes */}
                {nodeList.map((node, i) => {
                    const isSlow = slow === i;
                    const isFast = fast === i;
                    const isMet = currentStep.met && currentStep.meetNode === i;

                    let className = 'node-circle';
                    if (isMet) className += ' state-met';
                    else if (isSlow || isFast) className += ' state-active';

                    return (
                        <g key={`node-${i}`} transform={`translate(${i * spacing + 50}, 150)`}>
                            <circle r={nodeRadius} className={className} />
                            <text dy=".3em" textAnchor="middle" fill="white" fontWeight="bold">{node.value}</text>

                            {/* Pointers */}
                            {isSlow && (
                                <g transform="translate(0, -50)" className="pointer tortoise">
                                    <text textAnchor="middle" fontSize="24">🐢</text>
                                    <text y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3b82f6">SLOW</text>
                                </g>
                            )}
                            {isFast && (
                                <g transform={`translate(${isSlow ? 20 : 0}, -50)`} className="pointer hare">
                                    <text textAnchor="middle" fontSize="24">🐇</text>
                                    <text y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444">FAST</text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        );
    };

    return (
        <DualView
            algorithmName="Floyd's Cycle Detection (Tortoise & Hare)"
            code={algorithmCodes.floydCycle?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Watch how the Tortoise and Hare move through the list.'}
        >
            <div className="floyd-container">
                <div className="floyd-top-bar">
                    <button className="floyd-toggle-btn" onClick={() => setShowIntuition(!showIntuition)}>
                        {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                    </button>
                    <div className="floyd-actions">
                        <button className="cs-btn cs-btn-secondary" onClick={handleRandomize}>Random List</button>
                        <button className="cs-btn cs-btn-primary" onClick={toggleCycle}>
                            {cycleBack === -1 ? 'Add Cycle' : 'Remove Cycle'}
                        </button>
                    </div>
                </div>

                {showIntuition && (
                    <div className="floyd-intuition-panel">
                        <h4>🏃 The Two Runners Analogy</h4>
                        <p>
                            Imagine a <strong>Tortoise (Slow)</strong> and a <strong>Hare (Fast)</strong> running on a track.
                            The Hare runs twice as fast as the Tortoise.
                        </p>
                        <ul>
                            <li>If the track is straight, the Hare just hits the end.</li>
                            <li>If the track is <strong>circular</strong>, the Hare will eventually lap the Tortoise and they will meet!</li>
                        </ul>
                    </div>
                )}

                <div className="floyd-visual-area">
                    {renderNodes()}
                </div>

                <div className="floyd-footer">
                    <div className="floyd-complexity">
                        <div className="comp-item">
                            <span className="label">Time Complexity:</span>
                            <span className="val">O(N)</span>
                        </div>
                        <div className="comp-item">
                            <span className="label">Space Complexity:</span>
                            <span className="val">O(1)</span>
                        </div>
                    </div>
                    <div className="floyd-legend">
                        <div className="leg-item"><span className="dot blue"></span> Slow</div>
                        <div className="leg-item"><span className="dot red"></span> Fast</div>
                        <div className="leg-item"><span className="dot green"></span> Meet</div>
                        <div className="leg-item"><span className="dot purple"></span> Cycle</div>
                    </div>
                </div>

                <div className="floyd-controls">
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

export default FloydCycleVisualizer;
