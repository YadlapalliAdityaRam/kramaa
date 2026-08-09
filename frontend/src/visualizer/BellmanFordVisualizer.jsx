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
import { FaProjectDiagram, FaPlay, FaUndo, FaNetworkWired } from 'react-icons/fa';
import { MdOutlinePlayCircle } from 'react-icons/md';

import './BellmanFordVisualizer.css';

const BellmanFordVisualizer = () => {
    const [graphData, setGraphData]       = useState(defaultWeightedGraph);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [sourceNode, setSourceNode]     = useState(() => defaultWeightedGraph.nodes[0]?.id || 'A');
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
        if (t === 'init')              return 2;
        if (t === 'iteration-start')   return 4;
        if (t.startsWith('relax'))     return 6;
        if (t === 'early-exit')        return 8;
        if (t.startsWith('neg-cycle')) return 10;
        if (t === 'complete')          return 12;
        return 1;
    };

    const currentStep    = anim.currentStep;
    const distTable      = currentStep?.distanceTable || {};
    const prevTable      = currentStep?.prevTable || {};
    const iteration      = currentStep?.iteration || 0;
    const totalIterations= currentStep?.totalIterations || 1;
    const curEdge        = currentStep?.currentEdge;
    const formula        = currentStep?.formula || '';
    const isRelaxed      = currentStep?.relaxed;
    const negativeCycle  = currentStep?.negativeCycleDetected || false;

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
            <div className="bf-wrapper">

                {/* ── Input Panel ────────────────────────────────────────── */}
                <div className="bf-input-panel">
                    {/* Source node selector */}
                    <div className="bf-input-group">
                        <label className="bf-input-label">
                            <FaNetworkWired style={{ fontSize: '0.85rem' }} />
                            Source Node
                        </label>
                        <select
                            className="bf-source-select"
                            value={sourceNode}
                            onChange={handleSourceChange}
                        >
                            {(graphData.nodes || []).map(n => (
                                <option key={n.id} value={n.id}>{n.label || n.id}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action buttons */}
                    <div className="bf-btn-group">
                        <button className="bf-btn bf-btn-config" onClick={() => setIsConfigModalOpen(true)}>
                            <FaProjectDiagram /> Configure Graph
                        </button>
                        <button className="bf-btn bf-btn-reset" onClick={() => anim.reset()}>
                            <FaUndo /> Reset
                        </button>
                        <button className="bf-btn bf-btn-play" onClick={anim.play} disabled={anim.isPlaying}>
                            <MdOutlinePlayCircle style={{ fontSize: '1.05rem' }} /> Run
                        </button>
                    </div>
                </div>

                {/* ── Negative Cycle Alert ─────────────────────────────── */}
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

                {/* ── Main Area: Graph + Distance Table side-by-side ──── */}
                <div className="bf-main-area">

                    {/* Graph Canvas */}
                    <div className="bf-graph-panel">
                        <div className="bf-graph-label">Directed Graph</div>
                        <div className="bf-graph-canvas-wrap">
                            <GraphCanvas
                                nodes={graphData.nodes || []}
                                edges={(graphData.edges || []).map(e => ({ ...e, directed: true }))}
                                nodeStates={currentStep?.nodeStates || {}}
                                edgeStates={currentStep?.edgeStates || {}}
                            />
                        </div>
                    </div>

                    {/* Distance Table — standalone, NOT inside the canvas */}
                    <div className="bf-dist-panel">
                        <h4 className="bf-card-title">📊 Distance Table</h4>
                        <div className="bf-dist-scroll">
                            <table className="bf-path-table">
                                <thead>
                                    <tr>
                                        <th>Node</th>
                                        <th>Dist</th>
                                        <th>Prev</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(graphData.nodes || []).map(n => {
                                        const dist = distTable[n.id];
                                        const isSrc = n.id === sourceNode;
                                        const isInf = dist === Infinity || dist === undefined;
                                        return (
                                            <tr key={n.id} className={isSrc ? 'bf-row-source' : ''}>
                                                <td className="bf-td-node">
                                                    <span className="bf-node-chip" style={{ background: isSrc ? '#3b82f620' : undefined }}>
                                                        {n.label || n.id}
                                                    </span>
                                                </td>
                                                <td className={isInf ? 'bf-td-inf' : 'bf-td-dist'}>
                                                    {isInf ? '∞' : dist}
                                                </td>
                                                <td className="bf-td-prev">{prevTable[n.id] || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── Formula + Legend Row ─────────────────────────────── */}
                <div className="bf-info-row">

                    {/* Relaxation Formula */}
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

                    {/* Legend */}
                    <div className="bf-info-card bf-legend-card">
                        <h4 className="bf-card-title">🎨 Legend</h4>
                        <div className="bf-legend-items">
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-source"></span> Source</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-relaxed"></span> Relaxed</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-shortest"></span> Shortest Path</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-cycle"></span> Neg. Cycle</div>
                            <div className="bf-legend-item"><span className="bf-legend-dot bf-dot-skip"></span> No Update</div>
                        </div>
                    </div>
                </div>

                {/* ── Controls ─────────────────────────────────────────── */}
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
                <div className="bf-modal-backdrop" onClick={() => setIsConfigModalOpen(false)}>
                    <div className="bf-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="bf-modal-header">
                            <h3><FaProjectDiagram style={{ color: '#38bdf8' }} /> Configure Graph</h3>
                            <button className="bf-modal-close" onClick={() => setIsConfigModalOpen(false)}>✕</button>
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
                        <div className="bf-modal-footer">
                            <button
                                className="bf-btn bf-btn-danger"
                                onClick={() => { handleGraphUpdate({ nodes: [], edges: [], directed: true }); setIsConfigModalOpen(false); }}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default BellmanFordVisualizer;
