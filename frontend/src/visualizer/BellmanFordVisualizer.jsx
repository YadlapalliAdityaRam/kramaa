import React, { useMemo, useState, useCallback } from 'react';
import DualView from './DualView';
import GraphInput from '../components/GraphInput/GraphInput';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateBellmanFordSteps } from '../algorithms/graphs/bellmanFord';
import { defaultWeightedGraph } from '../algorithms/graphs/graphData';
import { generateFallbackCode } from './algorithmFallbacks';
import { motion, AnimatePresence } from 'framer-motion';
import { FaProjectDiagram, FaPlay, FaUndo } from 'react-icons/fa';

import './BellmanFordVisualizer.css';

const BellmanFordVisualizer = () => {
    const [graphData, setGraphData] = useState(defaultWeightedGraph);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [sourceNode, setSourceNode] = useState(() => defaultWeightedGraph.nodes[0]?.id || 'A');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const steps = useMemo(
        () => generateBellmanFordSteps(graphData, sourceNode),
        [graphData, sourceNode]
    );
    const anim = useGenericAnimation(steps);

    const codeSnippet = useMemo(() => generateFallbackCode({
        name: 'Bellman-Ford Algorithm',
        categoryKey: 'graphs',
        language: activeLanguage
    }), [activeLanguage]);

    const getActiveLine = () => {
        if (!anim.currentStep) return 1;
        const t = anim.currentStep.type || '';
        if (t === 'init') return 2;
        if (t === 'iteration-start') return 4;
        if (t.startsWith('relax')) return 6;
        if (t === 'early-exit') return 8;
        if (t.startsWith('neg-cycle')) return 10;
        if (t === 'complete') return 12;
        return 1;
    };

    const currentStep = anim.currentStep;
    const distTable = currentStep?.distanceTable || {};
    const prevTable = currentStep?.prevTable || {};
    const iteration = currentStep?.iteration || 0;
    const totalIterations = currentStep?.totalIterations || 1;
    const curEdge = currentStep?.currentEdge;
    const formula = currentStep?.formula || '';
    const isRelaxed = currentStep?.relaxed;
    const negativeCycle = currentStep?.negativeCycleDetected || false;
    const isComplete = currentStep?.type === 'complete';

    const handleSourceChange = useCallback((e) => {
        setSourceNode(e.target.value);
    }, []);

    const handleGraphUpdate = useCallback((g) => {
        setGraphData(g);
        setSourceNode(g.nodes[0]?.id || 'A');
        anim.reset();
    }, [anim]);

    return (
        <DualView
            algorithmName="Bellman-Ford Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine()}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {iteration > 0 && (
                        <span className="bf-iter-badge">
                            {iteration <= totalIterations
                                ? `Iteration ${iteration} / ${totalIterations}`
                                : 'Negative Cycle Check'}
                        </span>
                    )}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'pre-line' }}>
                        {currentStep?.description || 'Ready to start'}
                    </span>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>


                {/* ── Source Select + Run ── */}
                <div className="bf-source-row">
                    <span className="bf-source-label">Source:</span>
                    <select
                        className="bf-source-select"
                        value={sourceNode}
                        onChange={handleSourceChange}
                    >
                        {(graphData.nodes || []).map(n => (
                            <option key={n.id} value={n.id}>{n.label || n.id}</option>
                        ))}
                    </select>
                    <button className="bf-run-btn" onClick={() => setIsConfigModalOpen(true)} style={{ background: '#38bdf822', color: '#38bdf8', border: '1px solid #38bdf844', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaProjectDiagram /> Configure Graph
                    </button>
                    <button className="bf-run-btn" onClick={() => anim.reset()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaUndo /> Reset
                    </button>
                    <button className="bf-run-btn" onClick={anim.play} disabled={anim.isPlaying} style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaPlay /> Start
                    </button>
                </div>

                {/* ── Negative Cycle Alert ── */}
                <AnimatePresence>
                    {negativeCycle && (
                        <motion.div
                            className="bf-neg-cycle-alert"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <span className="bf-neg-cycle-icon">⚠️</span>
                            <div className="bf-neg-cycle-text">
                                Negative weight cycle detected!
                                <span>Shortest paths cannot be determined for affected nodes.</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Graph Canvas ── */}
                <div className="bf-graph-panel">
                    <div className="bf-graph-label">Directed Graph</div>
                    <div className="bf-graph-canvas-wrap">
                        <GraphCanvas
                            nodes={graphData.nodes || []}
                            edges={(graphData.edges || []).map(e => ({ ...e, directed: true }))}
                            nodeStates={currentStep?.nodeStates || {}}
                            edgeStates={currentStep?.edgeStates || {}}
                            distanceTable={distTable}
                        />
                    </div>
                </div>

                {/* ── Bottom Info Row ── */}
                <div className="bf-info-row">

                    {/* Formula Card */}
                    <div className="bf-info-card bf-formula-card">
                        <h4 className="bf-card-title">📐 Relaxation Formula</h4>
                        {curEdge ? (
                            <div className={`bf-formula-text ${isRelaxed ? 'bf-relaxed' : 'bf-no-update'}`}>
                                {formula}
                                <br />
                                {isRelaxed
                                    ? `✓ Updated dist[${curEdge.to}] = ${distTable[curEdge.to]}`
                                    : '✗ No update'}
                            </div>
                        ) : (
                            <div className="bf-formula-text">
                                dist[v] = min(dist[v], dist[u] + weight(u,v))
                            </div>
                        )}
                    </div>

                    {/* Shortest Path Table */}
                    <div className="bf-info-card bf-path-table-card">
                        <h4 className="bf-card-title">📊 Distance Table</h4>
                        <div style={{ overflowY: 'auto', maxHeight: 160, flex: 1 }}>
                            <table className="bf-path-table">
                                <thead>
                                    <tr>
                                        <th>Node</th>
                                        <th>Distance</th>
                                        <th>Prev</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(graphData.nodes || []).map(n => (
                                        <tr key={n.id} className={n.id === sourceNode ? 'bf-source-row-cell' : ''}>
                                            <td>{n.label || n.id}</td>
                                            <td className={distTable[n.id] === Infinity || distTable[n.id] === undefined
                                                ? 'bf-dist-inf' : 'bf-dist-val'}>
                                                {distTable[n.id] === Infinity || distTable[n.id] === undefined
                                                    ? '∞' : distTable[n.id]}
                                            </td>
                                            <td>{prevTable[n.id] || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="bf-info-card bf-legend-card">
                        <h4 className="bf-card-title">🎨 Legend</h4>
                        <div className="bf-legend-items">
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-source"></span> Source Node</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-relaxed"></span> Edge Relaxed (updated)</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-skip"></span> No Update</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-shortest"></span> Shortest Path</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-cycle"></span> Negative Cycle</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-default"></span> Default</div>
                        </div>
                    </div>
                </div>

                {/* ── Controls ── */}
                <div className="bf-controls-bar">
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

            {/* Configuration Modal */}
            {isConfigModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsConfigModalOpen(false)}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', minWidth: '450px', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><FaProjectDiagram style={{ color: '#38bdf8' }} /> Configure Graph</h3>
                            <button onClick={() => setIsConfigModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <GraphInput
                            nodes={graphData.nodes || []}
                            edges={graphData.edges || []}
                            onGraphUpdate={(newNodes, newEdges) => {
                                handleGraphUpdate({ nodes: newNodes, edges: newEdges });
                                setIsConfigModalOpen(false);
                            }}
                            requiresWeights={true}
                            requiresDirected={true}
                        />

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button className="bf-run-btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => { handleGraphUpdate({ nodes: [], edges: [], directed: true }); setIsConfigModalOpen(false); }}>Clear All</button>
                        </div>
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default BellmanFordVisualizer;
