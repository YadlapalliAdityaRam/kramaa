import React, { useMemo, useState } from 'react';
import DualView from './DualView';
import GraphInput from '../components/GraphInput/GraphInput';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateKruskalsSteps } from '../algorithms/graphs/kruskals';
import { defaultWeightedGraph } from '../algorithms/graphs/graphData';
import { algorithmCodes } from '../data/algorithmCodes';
import { motion, AnimatePresence } from 'framer-motion';

import './KruskalsVisualizer.css';

const KruskalsVisualizer = () => {
    const [graphData, setGraphData] = useState(defaultWeightedGraph);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateKruskalsSteps(graphData), [graphData]);
    const anim = useGenericAnimation(steps);

    const codeSnippet = algorithmCodes.kruskal?.[activeLanguage] || '';

    const getActiveLine = () => {
        if (!anim.currentStep) return 1;
        const desc = anim.currentStep.description || '';
        if (desc.includes('Sort all')) return 2;
        if (desc.includes('Picking')) return 12;
        if (desc.includes('No cycle')) return 15;
        if (desc.includes('Cycle')) return 13;
        if (desc.includes('Finished') || desc.includes('complete')) return 19;
        return 1;
    };

    const currentStep = anim.currentStep;
    const sortedEdges = currentStep?.sortedEdges || [];
    const activeIndex = currentStep?.currentEdgeIndex !== undefined ? currentStep.currentEdgeIndex : -1;
    const unionFindSets = currentStep?.unionFindSets || {};
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
        (graphData.nodes || []).forEach(n => { states[n.id] = 'default'; });
        mstEdgeList.forEach(e => {
            states[e.from] = 'mst-node';
            states[e.to] = 'mst-node';
        });
        return states;
    }, [graphData.nodes, mstEdgeList]);

    const getEdgeStatus = (edge, idx) => {
        const es = currentStep?.edgeStates || {};
        const key = `${edge.from}-${edge.to}`;
        if (es[key] === 'mst-edge') return 'edge-accepted';
        if (es[key] === 'rejected') return 'edge-rejected';
        if (idx === activeIndex) return 'edge-considering';
        return '';
    };

    return (
        <DualView
            algorithmName="Kruskal's MST Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine()}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="graphs"
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="kruskal-step-badge">
                        Step {anim.currentStepIndex + 1} / {anim.totalSteps || 1}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'pre-line' }}>
                        {currentStep?.description || 'Ready to start'}
                    </span>
                </div>
            }
        >
            <div className="kruskal-wrapper">

                <GraphInput
                    nodes={graphData.nodes || []}
                    edges={graphData.edges || []}
                    onGraphUpdate={(g, e) => {
                        const data = Array.isArray(g) ? { nodes: g, edges: e } : g;
                        setGraphData(data);
                        anim.reset();
                    }}
                    requiresWeights={true}
                    requiresDirected={false}
                />

                <div className="kruskal-dual-graphs">
                    <div className="kruskal-graph-panel">
                        <div className="kruskal-graph-label">Original Graph</div>
                        <div className="kruskal-graph-canvas-wrap">
                            <GraphCanvas
                                nodes={graphData.nodes || []}
                                edges={graphData.edges || []}
                                nodeStates={currentStep?.nodeStates || {}}
                                edgeStates={currentStep?.edgeStates || {}}
                            />
                        </div>
                    </div>

                    <div className="kruskal-graph-panel kruskal-mst-panel">
                        <div className="kruskal-graph-label kruskal-mst-label">MST Construction</div>
                        <div className="kruskal-graph-canvas-wrap">
                            <GraphCanvas
                                nodes={graphData.nodes || []}
                                edges={mstEdgeList}
                                nodeStates={mstNodeStates}
                                edgeStates={mstEdgeStates}
                            />
                        </div>
                    </div>
                </div>

                <div className="kruskal-info-row">
                    <div className="kruskal-info-card">
                        <h4 className="kruskal-card-title">📋 Sorted Edges</h4>
                        <div className="kruskal-edge-list">
                            {sortedEdges.map((edge, idx) => (
                                <motion.div
                                    key={edge.originalId || `${edge.from}-${edge.to}`}
                                    className={`kruskal-edge-item ${getEdgeStatus(edge, idx)}`}
                                    layout
                                    transition={{ duration: 0.2 }}
                                >
                                    <span className="ke-nodes">({edge.from},{edge.to})</span>
                                    <span className="ke-weight">w={edge.weight}</span>
                                    {getEdgeStatus(edge, idx) === 'edge-accepted' && <span className="ke-badge ke-badge-ok">✓</span>}
                                    {getEdgeStatus(edge, idx) === 'edge-rejected' && <span className="ke-badge ke-badge-no">✗</span>}
                                    {getEdgeStatus(edge, idx) === 'edge-considering' && <span className="ke-badge ke-badge-cur">→</span>}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="kruskal-info-card">
                        <h4 className="kruskal-card-title">🌲 Disjoint Sets</h4>
                        <div className="kruskal-sets-wrap">
                            <AnimatePresence>
                                {Object.entries(unionFindSets).map(([root, members]) => (
                                    <motion.div
                                        key={root}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="kruskal-set-group"
                                    >
                                        <div className="ks-root">{root}</div>
                                        <div className="ks-members">
                                            {members.map(m => (
                                                <span
                                                    key={m}
                                                    className={`ks-member ${currentStep?.nodeStates?.[m] === 'visiting' ? 'ks-member-active' : ''}`}
                                                >
                                                    {m}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="kruskal-info-card kruskal-weight-card">
                        <h4 className="kruskal-card-title">⚡ MST Weight</h4>
                        <div className="kruskal-total-weight">
                            {currentStep?.totalWeight || 0}
                        </div>
                        <div className="kruskal-edge-count">
                            {mstEdgeList.length} / {(graphData.nodes?.length || 1) - 1} edges
                        </div>
                    </div>

                    <div className="kruskal-info-card kruskal-legend-card">
                        <h4 className="kruskal-card-title">🎨 Legend</h4>
                        <div className="kruskal-legend-items">
                            <div className="kl-item"><span className="kl-dot kl-grey"></span> Not processed</div>
                            <div className="kl-item"><span className="kl-dot kl-blue"></span> Considering</div>
                            <div className="kl-item"><span className="kl-dot kl-green"></span> Accepted (MST)</div>
                            <div className="kl-item"><span className="kl-dot kl-red"></span> Rejected (cycle)</div>
                        </div>
                    </div>
                </div>

                <div className="kruskal-controls-bar">
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

export default KruskalsVisualizer;
