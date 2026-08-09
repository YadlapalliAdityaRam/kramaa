import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFloydCycleSteps } from '../algorithms/graphs/floydCycle';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaRandom, FaProjectDiagram, FaInfoCircle, FaRedo } from 'react-icons/fa';
import './FloydCycleVisualizer.css';

const DEFAULT_VALS = [1, 2, 3, 4, 5, 6];

const FloydCycleVisualizer = () => {
    const [listValues, setListValues]         = useState(DEFAULT_VALS);
    const [cycleBack, setCycleBack]           = useState(2);
    const [showIntuition, setShowIntuition]   = useState(true);
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
        const len = Math.floor(Math.random() * 3) + 5; // 5-7 nodes
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
            toast.success('Cycle added to list!');
        } else {
            setCycleBack(-1);
            toast.success('Cycle removed!');
        }
        reset();
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 2;
            case 'move': return 7;
            case 'meet': return 10;
            case 'done': return step.hasCycle ? 10 : 14;
            default:     return 0;
        }
    };

    const renderNodes = () => {
        if (!currentStep) return null;
        const nodeList = currentStep.nodes || [];
        const slow = currentStep.slow;
        const fast = currentStep.fast;
        const cb   = currentStep.cycleBack;

        const nodeRadius = 26;
        const spacing    = 95;
        const svgWidth   = Math.max(700, nodeList.length * spacing + 120);

        return (
            <svg className="floyd-svg" viewBox={`0 0 ${svgWidth} 260`}>
                <defs>
                    <marker id="arrow-floyd" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L8,3 z" fill="var(--text-muted)" />
                    </marker>
                    <marker id="arrow-cycle" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                        <path d="M0,0 L0,6 L8,3 z" fill="#c084fc" />
                    </marker>
                </defs>

                {/* Edges */}
                {nodeList.map((_, i) => {
                    if (i === nodeList.length - 1) {
                        if (cb !== -1) {
                            const fromX = i * spacing + 50 + nodeRadius;
                            const toX   = cb * spacing + 50;
                            const midX  = (fromX + toX) / 2;
                            return (
                                <path
                                    key="cycle-edge"
                                    d={`M ${fromX} 130 Q ${midX} 230 ${toX} 160`}
                                    fill="none"
                                    stroke="#c084fc"
                                    strokeWidth="2.5"
                                    strokeDasharray="5,4"
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
                            y1="130"
                            x2={(i + 1) * spacing + 50 - nodeRadius}
                            y2="130"
                            stroke="var(--surface-border)"
                            strokeWidth="2.5"
                            markerEnd="url(#arrow-floyd)"
                        />
                    );
                })}

                {/* NULL Indicator */}
                {cb === -1 && nodeList.length > 0 && (
                    <g transform={`translate(${nodeList.length * spacing + 20}, 130)`}>
                        <text dy=".35em" textAnchor="start" fill="var(--text-muted)" fontSize="13" fontWeight="800" fontFamily="Fira Code">
                            → NULL
                        </text>
                    </g>
                )}

                {/* Nodes */}
                {nodeList.map((node, i) => {
                    const isSlow = slow === i;
                    const isFast = fast === i;
                    const isMet  = currentStep.met && currentStep.meetNode === i;

                    let circleClass = 'node-circle';
                    if (isMet)        circleClass += ' state-met';
                    else if (isSlow || isFast) circleClass += ' state-active';

                    return (
                        <g key={`node-${i}`} transform={`translate(${i * spacing + 50}, 130)`}>
                            <circle r={nodeRadius} className={circleClass} />
                            <text dy=".35em" textAnchor="middle" className="node-text">
                                {node.value}
                            </text>

                            {/* Pointer Labels */}
                            {isSlow && (
                                <g transform="translate(0, -42)" className="pointer tortoise">
                                    <text textAnchor="middle" fontSize="22">🐢</text>
                                    <text y="14" textAnchor="middle" fontSize="9" fontWeight="800" fill="#38bdf8">SLOW</text>
                                </g>
                            )}
                            {isFast && (
                                <g transform={`translate(${isSlow ? 18 : 0}, -42)`} className="pointer hare">
                                    <text textAnchor="middle" fontSize="22">🐇</text>
                                    <text y="14" textAnchor="middle" fontSize="9" fontWeight="800" fill="#f87171">FAST</text>
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
            codeSnippetCategory="graphs"
            description={
                <div className="fl-desc-wrapper">
                    <span className="fl-badge">Two-Pointer Algorithm O(N)</span>
                    <span className="fl-desc-text">
                        {currentStep?.description || 'Press Play to watch Tortoise (1 step) and Hare (2 steps) traverse the linked list.'}
                    </span>
                </div>
            }
        >
            <div className="fl-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="fl-input-panel">
                    <div className="fl-btn-group">
                        <button className="fl-btn fl-btn-primary" onClick={toggleCycle}>
                            <FaProjectDiagram /> {cycleBack === -1 ? 'Add Cycle' : 'Remove Cycle'}
                        </button>
                        <button className="fl-btn fl-btn-secondary" onClick={handleRandomize}>
                            <FaRandom /> Random List
                        </button>
                        <button className="fl-btn fl-btn-outline" onClick={() => setShowIntuition(!showIntuition)}>
                            <FaInfoCircle /> {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                        </button>
                        <button className="fl-btn fl-btn-outline" onClick={reset}>
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="fl-legend">
                        <div className="fl-leg-item"><span className="fl-dot blue"></span> 🐢 Slow</div>
                        <div className="fl-leg-item"><span className="fl-dot red"></span> 🐇 Fast</div>
                        <div className="fl-leg-item"><span className="fl-dot green"></span> Meet Point</div>
                        <div className="fl-leg-item"><span className="fl-dot purple"></span> Cycle Link</div>
                    </div>
                </div>

                {/* Intuition Callout */}
                {showIntuition && (
                    <div className="fl-intuition-panel">
                        <h4>🏃 Two Runners Analogy</h4>
                        <p>
                            The <strong>Tortoise (Slow)</strong> advances 1 node per step, while the <strong>Hare (Fast)</strong> advances 2 nodes per step.
                        </p>
                        <ul>
                            <li>If no cycle exists, the Hare reaches <code>NULL</code> (end of list).</li>
                            <li>If a cycle exists, the Hare gets trapped inside the loop and eventually laps the Tortoise, meeting at the exact same node!</li>
                        </ul>
                    </div>
                )}

                {/* ── Main Canvas Area: SVG Linked List ────────────────── */}
                <div className="fl-canvas-wrapper">
                    {renderNodes()}
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="fl-controls-wrapper">
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
