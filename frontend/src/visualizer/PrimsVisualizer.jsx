import React, { useMemo, useState } from 'react';
import DualView from './DualView';
import GraphInput from '../components/GraphInput/GraphInput';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generatePrimsSteps } from '../algorithms/graphs/prims';
import { defaultWeightedGraph } from '../algorithms/graphs/graphData';
import { generateFallbackCode } from './algorithmFallbacks';
import { motion, AnimatePresence } from 'framer-motion';

import './PrimsVisualizer.css';

const PrimsVisualizer = () => {
    const [graphData, setGraphData] = useState(defaultWeightedGraph);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generatePrimsSteps(graphData), [graphData]);
    const anim = useGenericAnimation(steps);

    const codeSnippet = useMemo(() => generateFallbackCode({
        name: "Prim's Minimum Spanning Tree",
        categoryKey: "graphs",
        language: activeLanguage
    }), [activeLanguage]);

    const handleGraphUpdate = (newNodes, newEdges) => {
        setGraphData({ nodes: newNodes, edges: newEdges });
        anim.reset();
    };

    const getActiveLine = () => {
        if (!anim.currentStep) return 1;
        const desc = anim.currentStep.description || '';
        if (desc.includes('start')) return 2;
        if (desc.includes('Added all edges')) return 5;
        if (desc.includes('Selected')) return 6;
        if (desc.includes('Added all new outgoing')) return 8;
        if (desc.includes('Finished')) return 10;
        return 1;
    };

    const currentStep = anim.currentStep;
    const candidateEdges = currentStep?.candidateEdges || [];
    const activeEdge = currentStep?.activeEdge;
    const visitedNodes = currentStep?.visitedNodes || [];
    const mstEdgeList = currentStep?.mstEdges || [];

    // Build MST-only edge states: only show accepted edges
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
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>

                {/* ── Top: Full Graph + MST Construction side by side ── */}
                <GraphInput
                    nodes={graphData.nodes || []}
                    edges={graphData.edges || []}
                    onGraphUpdate={handleGraphUpdate}
                    requiresWeights={true}
                />

                <div className="prim-dual-graphs">
                    {/* Full Graph View */}
                    <div className="prim-graph-panel">
                        <div className="prim-graph-label">Original Graph</div>
                        <div className="prim-graph-canvas-wrap">
                            <GraphCanvas
                                nodes={graphData.nodes || []}
                                edges={graphData.edges || []}
                                nodeStates={currentStep?.nodeStates || {}}
                                edgeStates={currentStep?.edgeStates || {}}
                            />
                        </div>
                    </div>

                    {/* MST Construction View */}
                    <div className="prim-graph-panel prim-mst-panel">
                        <div className="prim-graph-label prim-mst-label">MST Construction</div>
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

                {/* ── Bottom: Priority Queue + Visited Nodes + MST Weight ── */}
                <div className="prim-info-row">

                    {/* Priority Queue / Candidate Edge Panel */}
                    <div className="prim-info-card prim-pq-card">
                        <h4 className="prim-card-title">🚥 Priority Queue (Candidate Edges)</h4>
                        <div className="prim-edge-list">
                            {candidateEdges.length === 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '4px' }}>
                                    Queue is empty
                                </div>
                            )}
                            <AnimatePresence initial={false}>
                                {candidateEdges.map((edge) => {
                                    const isTarget = activeEdge &&
                                        ((activeEdge.from === edge.from && activeEdge.to === edge.to) ||
                                            (activeEdge.from === edge.to && activeEdge.to === edge.from));

                                    return (
                                        <motion.div
                                            key={edge.originalId || `${edge.from}-${edge.to}`}
                                            className={`prim-edge-item ${isTarget ? 'pe-active' : ''}`}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <span className="pe-nodes">({edge.from},{edge.to})</span>
                                            <span className="pe-weight">w={edge.weight}</span>
                                            {isTarget && <span className="pe-badge">Current Edge</span>}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Visited Nodes */}
                    <div className="prim-info-card">
                        <h4 className="prim-card-title">📍 Visited Nodes</h4>
                        <div className="prim-nodes-wrap">
                            <AnimatePresence>
                                {visitedNodes.map((nId) => (
                                    <motion.div
                                        key={nId}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="prim-visited-node"
                                    >
                                        {nId}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* MST Weight */}
                    <div className="prim-info-card prim-weight-card">
                        <h4 className="prim-card-title">⚡ MST Weight</h4>
                        <div className="prim-total-weight">
                            {currentStep?.totalWeight || 0}
                        </div>
                        <div className="prim-edge-count">
                            {mstEdgeList.length} / {(graphData.nodes?.length || 1) - 1} edges
                        </div>
                    </div>

                    {/* Legend */}
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

                {/* ── Controls ── */}
                <div className="prim-controls-bar">
                    <AnimationControls
                        inputType="none"
                        isPlaying={anim.isPlaying}
                        onPlay={anim.play}
                        onPause={anim.pause}
                        onStepForward={anim.stepForward}
                        onStepBackward={anim.stepBackward}
                        onReset={anim.reset}
                        speed={anim.speed}
                        onSpeedChange={anim.setSpeed}
                        currentStep={anim.currentStepIndex}
                        totalSteps={anim.totalSteps}
                        onScrub={anim.setStep}
                    />
                </div>
            </div>
        </DualView>
    );
};

export default PrimsVisualizer;
