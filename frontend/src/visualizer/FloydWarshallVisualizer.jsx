import React, { useState, useEffect, useMemo } from 'react';
import DualView from './DualView';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateFloydWarshallSteps, reconstructPath } from '../algorithms/graphs/floydWarshall';
import GraphInput from '../components/GraphInput/GraphInput';
import { algorithmCodes } from '../data/algorithmCodes';
import { FaProjectDiagram, FaRedo } from 'react-icons/fa';
import useGenericAnimation from '../hooks/useGenericAnimation';
import './FloydWarshallVisualizer.css';

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
    const [graph, setGraph]                 = useState(DEFAULT_GRAPH);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [startNodeId, setStartNodeId]     = useState(DEFAULT_GRAPH.nodes[0]?.id || 'A');
    const [endNodeId, setEndNodeId]         = useState(DEFAULT_GRAPH.nodes[1]?.id || 'B');
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

    const codeSnippet = algorithmCodes.floydWarshall?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 1;
        switch (step.type) {
            case 'iteration-start': return 6;
            case 'compare':         return 9;
            case 'compare-inf':     return 9;
            case 'update':          return 10;
            case 'complete':        return 15;
            default:                return 1;
        }
    };

    useEffect(() => {
        if (!currentStep?.isComplete || currentStep.negativeCycleDetected) {
            setReconstructedPath([]);
            return;
        }

        const path = reconstructPath(startNodeId, endNodeId, currentStep.finalNextMatrix, currentStep.finalNodeMap);
        setReconstructedPath(path || []);
    }, [startNodeId, endNodeId, currentStep]);

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

    const stepData   = currentStep || {};
    const distMatrix = stepData.distMatrix || [];
    const nodeMap    = stepData.nodeIndexMap || {};
    const nodesList  = Object.keys(nodeMap);

    return (
        <DualView
            algorithmName="Floyd-Warshall (All-Pairs Shortest Path)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="graphs"
            description={
                <div className="fw-desc-wrapper">
                    <span className="fw-badge">All-Pairs DP O(V³)</span>
                    <span className="fw-desc-text">
                        {stepData.description || "Press Play to compute all-pairs shortest distance matrix via intermediate nodes."}
                    </span>
                </div>
            }
        >
            <div className="fw-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="fw-input-panel">
                    <div className="fw-btn-group">
                        <button className="fw-btn fw-btn-config" onClick={() => setIsConfigModalOpen(true)}>
                            <FaProjectDiagram /> Configure Graph
                        </button>
                        <button className="fw-btn fw-btn-reset" onClick={anim.reset}>
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="fw-legend">
                        <div className="fw-leg-item"><span className="fw-dot purple"></span> Intermediate K</div>
                        <div className="fw-leg-item"><span className="fw-dot yellow"></span> Comparing Cell</div>
                        <div className="fw-leg-item"><span className="fw-dot green"></span> Updated Dist</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Graph & Distance Matrix ───────── */}
                <div className="fw-canvas-wrapper">
                    
                    {/* Graph Canvas */}
                    <div className="fw-graph-panel">
                        <div className="fw-card-title">Directed Weighted Graph</div>
                        <div className="fw-canvas-wrap">
                            <GraphCanvas
                                nodes={graph.nodes || []}
                                edges={graph.edges || []}
                                nodeStates={getNodeStateMap()}
                                edgeStates={getEdgeStateMap()}
                            />
                        </div>
                    </div>

                    {/* Distance Matrix Table */}
                    <div className="fw-matrix-panel">
                        <div className="fw-card-title">Distance Matrix <code>D[i][j]</code></div>
                        <div className="fw-matrix-scroll">
                            <table className="fw-matrix-table">
                                <thead>
                                    <tr>
                                        <th>From \ To</th>
                                        {nodesList.map(nodeId => <th key={nodeId}>{nodeId}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {nodesList.map((rowId, i) => (
                                        <tr key={rowId}>
                                            <th>{rowId}</th>
                                            {nodesList.map((colId, j) => {
                                                const val   = distMatrix[i]?.[j];
                                                const isInf = val === undefined || val === Infinity || val >= 999999;

                                                return (
                                                    <td key={colId} className={isInf ? 'inf' : ''}>
                                                        {isInf ? '∞' : val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="fw-controls-wrapper">
                    <AnimationControls
                        inputType="none"
                        onNext={anim.stepForward}
                        onPrev={anim.stepBackward}
                        onPlay={anim.play}
                        onPause={anim.pause}
                        onReset={anim.reset}
                        isPlaying={anim.isPlaying}
                        speed={anim.speed}
                        onSpeedChange={anim.setSpeed}
                        currentStep={anim.currentStepIndex}
                        totalSteps={steps.length}
                        onScrub={anim.setIndex}
                    />
                </div>

            </div>

            {/* Modal */}
            {isConfigModalOpen && (
                <div className="fw-modal-backdrop" onClick={() => setIsConfigModalOpen(false)}>
                    <div className="fw-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="fw-modal-header">
                            <h3><FaProjectDiagram style={{ color: '#c084fc' }} /> Configure Graph</h3>
                            <button className="fw-modal-close" onClick={() => setIsConfigModalOpen(false)}>✕</button>
                        </div>
                        <GraphInput
                            nodes={graph.nodes || []}
                            edges={graph.edges || []}
                            onGraphUpdate={(newNodes, newEdges) => {
                                setGraph({ nodes: newNodes, edges: newEdges, directed: true });
                                anim.reset();
                                setIsConfigModalOpen(false);
                            }}
                            requiresWeights={true}
                        />
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default FloydWarshallVisualizer;
