import React, { useState, useEffect, useMemo } from 'react';
import DualView from './DualView';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateFloydWarshallSteps, reconstructPath } from '../algorithms/graphs/floydWarshall';
import { buildAdjList } from '../algorithms/graphs/graphData';
import GraphInput from '../components/GraphInput/GraphInput';
import { FaProjectDiagram } from 'react-icons/fa';
import useGenericAnimation from '../hooks/useGenericAnimation';
import './FloydWarshallVisualizer.css';
import { generateFallbackCode } from './algorithmFallbacks';

const DEFAULT_GRAPH = {
    nodes: [
        { id: 'A', x: 200, y: 150 },
        { id: 'B', x: 400, y: 150 },
        { id: 'C', x: 200, y: 300 },
        { id: 'D', x: 400, y: 300 }
    ],
    edges: [
        { id: 'e1', from: 'A', to: 'B', weight: 4 },
        { id: 'e2', from: 'A', to: 'C', weight: 5 },
        { id: 'e3', from: 'B', to: 'C', weight: -2 },
        { id: 'e4', from: 'C', to: 'D', weight: 3 },
        { id: 'e5', from: 'D', to: 'A', weight: 1 }
    ],
    directed: true
};

const FloydWarshallVisualizer = () => {
    const [graph, setGraph] = useState(DEFAULT_GRAPH);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    // Path reconstruction state
    const [startNodeId, setStartNodeId] = useState(graph.nodes[0]?.id || '');
    const [endNodeId, setEndNodeId] = useState(graph.nodes[1]?.id || '');
    const [reconstructedPath, setReconstructedPath] = useState([]);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const steps = useMemo(() => {
        try {
            return generateFloydWarshallSteps(graph);
        } catch (e) {
            console.error(e);
            return [{
                type: 'error',
                description: 'Failed to build steps. Ensure the graph is valid.',
                distMatrix: [], nextMatrix: [], nodeIndexMap: {}, nodeStates: {}, edgeStates: {}
            }];
        }
    }, [graph]);

    const anim = useGenericAnimation(steps);
    const currentStep = anim.currentStep;

    const codeSnippet = useMemo(() => generateFallbackCode({
        name: 'Floyd-Warshall Algorithm',
        categoryKey: 'graphs',
        language: activeLanguage
    }), [activeLanguage]);

    const getActiveLine = () => {
        if (!currentStep) return 1;
        if (currentStep.type === 'iteration-start') return 3;
        if (currentStep.type === 'compare' || currentStep.type === 'compare-inf') return 5;
        if (currentStep.type === 'update') return 9;
        if (currentStep.type === 'neg-cycle') return 13;
        if (currentStep.type === 'complete') return 16;
        return 1;
    };

    // Calculate reconstructed path based on selections
    useEffect(() => {
        if (!currentStep?.isComplete || currentStep.negativeCycleDetected) {
            setReconstructedPath([]);
            return;
        }

        const path = reconstructPath(startNodeId, endNodeId, currentStep.finalNextMatrix, currentStep.finalNodeMap);
        setReconstructedPath(path || []);
    }, [startNodeId, endNodeId, currentStep]);

    // Graph highlights
    const getNodeStateMap = () => {
        if (currentStep?.isComplete && reconstructedPath.length > 0) {
            const m = {};
            reconstructedPath.forEach(id => m[id] = 'path');
            return m;
        }
        return currentStep?.nodeStates || {};
    };

    const getEdgeStateMap = () => {
        if (currentStep?.isComplete && reconstructedPath.length > 0) {
            const m = {};
            for (let i = 0; i < reconstructedPath.length - 1; i++) {
                const u = reconstructedPath[i];
                const v = reconstructedPath[i + 1];
                const e = graph.edges.find(edge => edge.from === u && edge.to === v);
                if (e) m[e.id] = 'path';
            }
            return m;
        }
        return currentStep?.edgeStates || {};
    };

    const handleGraphUpdate = (newGraph) => {
        setGraph(newGraph);
        if (anim && anim.reset) {
            anim.reset(); // Clear any lingering virtual paths or animation states
        }
        if (newGraph.nodes.length > 0) {
            if (!newGraph.nodes.find(n => n.id === startNodeId)) setStartNodeId(newGraph.nodes[0].id);
            if (!newGraph.nodes.find(n => n.id === endNodeId)) setEndNodeId(newGraph.nodes.length > 1 ? newGraph.nodes[1].id : newGraph.nodes[0].id);
        }
    };

    const undoLastAction = () => {
        // If there are edges, remove the last edge. If no edges but nodes, remove last node.
        if (graph.edges.length > 0) {
            handleGraphUpdate({
                ...graph,
                edges: graph.edges.slice(0, -1)
            });
        } else if (graph.nodes.length > 0) {
            handleGraphUpdate({
                ...graph,
                nodes: graph.nodes.slice(0, -1)
            });
        }
    };

    // Render matrix
    const renderMatrix = () => {
        if (!currentStep || !currentStep.distMatrix || currentStep.distMatrix.length === 0) return null;

        const n = currentStep.distMatrix.length;
        const iMap = currentStep.nodeIndexMap;

        return (
            <div className="fw-matrix-container">
                <table className="fw-matrix">
                    <thead>
                        <tr>
                            <th></th>
                            {Array.from({ length: n }).map((_, i) => (
                                <th key={`col-${i}`}>{iMap[i]}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentStep.distMatrix.map((row, i) => (
                            <tr key={`row-${i}`}>
                                <th>{iMap[i]}</th>
                                {row.map((val, j) => {
                                    // Determine cell status
                                    let statusName = '';
                                    if (currentStep.type === 'update' && currentStep.activeI === iMap[i] && currentStep.activeJ === iMap[j]) {
                                        statusName = 'updating';
                                    } else if (currentStep.activeK === iMap[i] || currentStep.activeK === iMap[j]) {
                                        statusName = 'k-row-col'; // Highlight the intermediate row/col gracefully
                                    } else if (currentStep.activeI === iMap[i] && currentStep.activeJ === iMap[j]) {
                                        statusName = 'evaluating';
                                    }

                                    if (currentStep.negativeCycleDetected && i === j && val < 0) {
                                        statusName = 'neg-cycle';
                                    }

                                    return (
                                        <td key={`cell-${i}-${j}`} className={`fw-cell ${statusName}`}>
                                            {val === Infinity ? '∞' : val}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Floyd-Warshall Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine()}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="step-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px' }}>
                        Step {anim.currentStepIndex + 1} / {anim.totalSteps || 1}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'pre-line' }}>
                        {currentStep?.description || 'Ready to start'}
                    </span>
                </div>
            }
        >
            <div className="fw-layout">
                <div className="fw-main">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong style={{ color: '#fff' }}>Interactive Graph Builder:</strong> Click canvas to add node. Click Node A then Node B to edge. Right click to delete.
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="fw-reset-btn"
                                onClick={() => setIsConfigModalOpen(true)}
                                style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <FaProjectDiagram /> Configure Graph
                            </button>
                            <button
                                className="fw-reset-btn"
                                onClick={undoLastAction}
                                disabled={graph.nodes.length === 0}
                                style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.3)', padding: '4px 12px', borderRadius: '4px', cursor: graph.nodes.length ? 'pointer' : 'not-allowed', fontSize: '0.8rem', opacity: graph.nodes.length ? 1 : 0.5 }}
                            >
                                Undo Last
                            </button>
                            <button
                                className="fw-reset-btn"
                                onClick={() => handleGraphUpdate({ nodes: [], edges: [], directed: true })}
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Clear Graph
                            </button>
                            <button
                                className="fw-reset-btn"
                                onClick={() => handleGraphUpdate(DEFAULT_GRAPH)}
                                style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Default Graph
                            </button>
                        </div>
                    </div>

                    <GraphCanvas
                        key={`fw-canvas-${graph.nodes.length}`}
                        nodes={graph.nodes}
                        edges={graph.edges}
                        virtualEdges={currentStep?.virtualEdges || []}
                        onGraphUpdate={handleGraphUpdate}
                        nodeStateMap={getNodeStateMap()}
                        edgeStateMap={getEdgeStateMap()}
                        isDirected={true}
                        allowNegativeWeights={true}
                        height={350}
                    />

                    {/* Educational / Formula Panel */}
                    <div className="fw-panel fw-formula-panel">
                        <h4>Matrix Updates</h4>
                        {currentStep?.formula ? (
                            <div className="fw-formula">
                                <code>{currentStep.formula}</code>
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                The algorithm checks if dist[i][j] can be improved by going through intermediate node k.
                            </p>
                        )}

                        {/* Legend */}
                        <div className="fw-legend">
                            <span className="legend-item"><span className="legend-box updating"></span> Updated</span>
                            <span className="legend-item"><span className="legend-box evaluating"></span> Evaluating</span>
                            <span className="legend-item"><span className="legend-box k-row-col"></span> K-Axis</span>
                        </div>
                    </div>
                </div>

                <div className="fw-sidebar">
                    <div className="fw-panel fw-matrix-panel">
                        <h4>Distance Matrix</h4>
                        {renderMatrix()}
                    </div>

                    {currentStep?.isComplete && !currentStep?.negativeCycleDetected && (
                        <div className="fw-panel fw-path-reconstruction">
                            <h4>Reconstruct Path</h4>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <select
                                    className="fw-select"
                                    value={startNodeId}
                                    onChange={e => setStartNodeId(e.target.value)}
                                >
                                    {graph.nodes.map(n => <option key={`start-${n.id}`} value={n.id}>{n.id}</option>)}
                                </select>
                                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>→</span>
                                <select
                                    className="fw-select"
                                    value={endNodeId}
                                    onChange={e => setEndNodeId(e.target.value)}
                                >
                                    {graph.nodes.map(n => <option key={`end-${n.id}`} value={n.id}>{n.id}</option>)}
                                </select>
                            </div>

                            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
                                {reconstructedPath.length > 0 ? (
                                    <>Path: <strong style={{ color: '#48bb78' }}>{reconstructedPath.join(' → ')}</strong></>
                                ) : (
                                    <span style={{ color: '#f56565' }}>No path exists from {startNodeId} to {endNodeId}.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AnimationControls
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
                inputType="none"
            />

            {/* Configuration Modal */}
            {isConfigModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsConfigModalOpen(false)}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', minWidth: '450px', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><FaProjectDiagram style={{ color: '#38bdf8' }} /> Configure Graph</h3>
                            <button onClick={() => setIsConfigModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <GraphInput
                            nodes={graph.nodes}
                            edges={graph.edges}
                            onGraphUpdate={(newNodes, newEdges) => {
                                handleGraphUpdate({ nodes: newNodes, edges: newEdges, directed: true });
                                setIsConfigModalOpen(false);
                            }}
                            requiresWeights={true}
                            requiresDirected={true}
                        />

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button className="fw-reset-btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => { handleGraphUpdate({ nodes: [], edges: [], directed: true }); setIsConfigModalOpen(false); }}>Clear All</button>
                        </div>
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default FloydWarshallVisualizer;
