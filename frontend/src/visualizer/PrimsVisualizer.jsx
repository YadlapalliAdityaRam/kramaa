import React, { useMemo, useState } from 'react';
import DualView from './DualView';
import GraphInput from '../components/GraphInput/GraphInput';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generatePrimsSteps } from '../algorithms/graphs/prims';
import { defaultWeightedGraph } from '../algorithms/graphs/graphData';
import { algorithmCodes } from '../data/algorithmCodes';

import './PrimsVisualizer.css';

const PrimsVisualizer = () => {
    const [graphData, setGraphData] = useState(defaultWeightedGraph);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generatePrimsSteps(graphData), [graphData]);
    const anim = useGenericAnimation(steps);

    const codeSnippet = algorithmCodes.prims?.[activeLanguage] || '';

    const handleGraphUpdate = (g, e) => {
        const data = Array.isArray(g) ? { nodes: g, edges: e } : g;
        setGraphData(data);
        anim.reset();
    };

    const getActiveLine = () => {
        if (!anim.currentStep) return 1;
        const desc = anim.currentStep.description || '';
        if (desc.includes('start')) return 5;
        if (desc.includes('Added all edges')) return 13;
        if (desc.includes('Selected')) return 11;
        if (desc.includes('Added all new outgoing')) return 13;
        if (desc.includes('Finished')) return 17;
        return 1;
    };

    const currentStep = anim.currentStep;
    const candidateEdges = currentStep?.candidateEdges || [];
    const activeEdge = currentStep?.activeEdge;
    const visitedNodes = currentStep?.visitedNodes || [];
    const mstEdgeList = currentStep?.mstEdges || [];

    const mstEdgeStates = useMemo(() => {
        const states = {};
        (graphData.edges || []).forEach(e => {
            states[`${e.from}-${e.to}`] = 'hidden';
            states[`${e.to}-${e.from}`] = 'hidden';
        });
        mstEdgeList.forEach(e => {
            states[`${e.from}-${e.to}`] = 'mst-edge';
            states[`${e.to}-${e.from}`] = 'mst-edge';
        });
        return states;
    }, [graphData.edges, mstEdgeList]);

    const mstNodeStates = useMemo(() => {
        const states = {};
        (graphData.nodes || []).forEach(n => { states[n.id] = 'hidden'; });
        visitedNodes.forEach(nId => {
            states[nId] = 'mst-node';
        });
        return states;
    }, [graphData.nodes, visitedNodes]);

    return (
        <DualView
            algorithmName="Prim's MST Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine()}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="graphs"
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="prim-step-badge">
                        Step {anim.currentStepIndex + 1} / {anim.totalSteps || 1}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'pre-line' }}>
                        {currentStep?.description || 'Ready to start'}
                    </span>
                </div>
            }
        >
            <div className="prim-wrapper">

                <GraphInput
                    nodes={graphData.nodes || []}
                    edges={graphData.edges || []}
                    onGraphUpdate={handleGraphUpdate}
                    requiresWeights={true}
                />

                <div className="prim-dual-graphs">
                    <div className="prim-graph-panel">
                        <div className="prim-graph-label">Original Graph (Priority Queue)</div>
                        <div className="prim-graph-canvas-wrap">
                            <GraphCanvas
                                nodes={graphData.nodes || []}
                                edges={graphData.edges || []}
                                nodeStates={currentStep?.nodeStates || {}}
                                edgeStates={currentStep?.edgeStates || {}}
                            />
                        </div>
                    </div>

                    <div className="prim-graph-panel prim-mst-panel">
                        <div className="prim-graph-label prim-mst-label">MST Spanning Tree</div>
                        <div className="prim-graph-canvas-wrap">
                            <GraphCanvas
                                nodes={graphData.nodes || []}
                                edges={mstEdgeList}
                                nodeStates={mstNodeStates}
                                edgeStates={mstEdgeStates}
                            />
                        </div>
                    </div>
                </div>

                <div className="prim-info-row">
                    <div className="prim-info-card">
                        <h4 className="prim-card-title">⏳ Candidate Edges (Priority Queue)</h4>
                        <div className="prim-pq-list">
                            {candidateEdges.map(edge => {
                                const isCurrent = activeEdge &&
                                    ((activeEdge.from === edge.from && activeEdge.to === edge.to) ||
                                     (activeEdge.from === edge.to && activeEdge.to === edge.from));
                                return (
                                    <div
                                        key={edge.originalId || `${edge.from}-${edge.to}`}
                                        className={`prim-pq-item ${isCurrent ? 'pq-current' : ''}`}
                                    >
                                        <span className="pq-edge">({edge.from},{edge.to})</span>
                                        <span className="pq-weight">w={edge.weight}</span>
                                    </div>
                                );
                            })}
                            {candidateEdges.length === 0 && (
                                <div className="prim-empty-pq">PQ Empty</div>
                            )}
                        </div>
                    </div>

                    <div className="prim-info-card prim-weight-card">
                        <h4 className="prim-card-title">⚡ MST Total Weight</h4>
                        <div className="prim-total-weight">
                            {currentStep?.totalWeight || 0}
                        </div>
                        <div className="prim-node-count">
                            {visitedNodes.length} / {graphData.nodes?.length || 1} nodes connected
                        </div>
                    </div>

                    <div className="prim-info-card prim-legend-card">
                        <h4 className="prim-card-title">🎨 Legend</h4>
                        <div className="prim-legend-items">
                            <div className="pl-item"><span className="pl-dot pl-grey"></span> Not processed</div>
                            <div className="pl-item"><span className="pl-dot pl-blue"></span> Priority Queue (Considering)</div>
                            <div className="pl-item"><span className="pl-dot pl-green"></span> Accepted (MST)</div>
                            <div className="pl-item"><span className="pl-dot pl-node"></span> Visited Node</div>
                        </div>
                    </div>
                </div>

                <div className="prim-controls-bar">
                    <AnimationControls
                        inputType="none"
                        isPlaying={anim.isPlaying}
                        onPlay={anim.play}
                        onPause={anim.pause}
                        onNext={anim.stepForward}
                        onPrev={anim.stepBackward}
                        onReset={anim.reset}
                        speed={anim.speed}
                        onSpeedChange={anim.setSpeed}
                        currentStep={anim.currentStepIndex}
                        totalSteps={anim.totalSteps}
                        onScrub={anim.setIndex}
                    />
                </div>
            </div>
        </DualView>
    );
};

export default PrimsVisualizer;
