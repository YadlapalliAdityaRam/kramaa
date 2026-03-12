import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateTopologicalSortSteps } from '../algorithms/graphs/topologicalSort';
import { algorithmCodes } from '../data/algorithmCodes';
import GraphInput from '../components/GraphInput/GraphInput';
import { toast } from 'react-hot-toast';
import { FaProjectDiagram, FaTable, FaPlay, FaSyncAlt, FaTrashAlt, FaArrowRight } from 'react-icons/fa';
import './TopologicalSortVisualizer.css';

const INITIAL_NODES = [
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 100, y: 300 },
    { id: 'C', x: 300, y: 100 },
    { id: 'D', x: 300, y: 300 },
    { id: 'E', x: 500, y: 100 },
    { id: 'F', x: 500, y: 300 }
];

const INITIAL_EDGES = [
    { id: 'e1', from: 'A', to: 'C', weight: 1 },
    { id: 'e2', from: 'B', to: 'C', weight: 1 },
    { id: 'e3', from: 'B', to: 'D', weight: 1 },
    { id: 'e4', from: 'C', to: 'E', weight: 1 },
    { id: 'e5', from: 'D', to: 'F', weight: 1 },
    { id: 'e6', from: 'E', to: 'F', weight: 1 }
];

const TopologicalSortVisualizer = () => {
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [edges, setEdges] = useState(INITIAL_EDGES);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const steps = useMemo(() => generateTopologicalSortSteps(nodes, edges), [nodes, edges]);

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
    }, [nodes, edges]);

    const handleGraphUpdate = (newGraph) => {
        setNodes(newGraph.nodes);
        setEdges(newGraph.edges);
        reset();
    };

    const handleClear = () => {
        setNodes([]);
        setEdges([]);
        toast.success("Graph cleared");
    };

    const handleRandom = () => {
        const randomNodes = INITIAL_NODES.map(n => ({ ...n, x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 }));
        // Create a DAG randomly
        const randomEdges = [];
        for (let i = 0; i < randomNodes.length; i++) {
            for (let j = i + 1; j < randomNodes.length; j++) {
                if (Math.random() > 0.7) {
                    randomEdges.push({
                        id: `re-${i}-${j}`,
                        from: randomNodes[i].id,
                        to: randomNodes[j].id,
                        weight: 1
                    });
                }
            }
        }
        setNodes(randomNodes);
        setEdges(randomEdges);
        toast.success("Random DAG generated");
    };

    const codeSnippet = algorithmCodes.topologicalSort?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 2;
            case 'find-zeros': return 13;
            case 'process': return 19;
            case 'check-neighbors': return 22;
            case 'update-indegree': return 24;
            default: return 0;
        }
    };

    // Prepare node states for GraphCanvas
    const nodeStates = useMemo(() => {
        const states = {};
        if (currentStep) {
            currentStep.processedNodes?.forEach(id => states[id] = 'visited');
            currentStep.queue?.forEach(id => states[id] = 'in-queue');
            currentStep.highlightNodes?.forEach(id => states[id] = 'current');
        }
        return states;
    }, [currentStep]);

    // Prepare edge states for GraphCanvas
    const edgeStates = useMemo(() => {
        const states = {};
        if (currentStep?.highlightEdges) {
            currentStep.highlightEdges.forEach(eId => states[eId] = 'considering');
        }
        return states;
    }, [currentStep]);

    return (
        <DualView
            algorithmName="Topological Sort (Kahn's Algorithm)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Topological sort orders tasks based on dependencies."}
        >
            <div className="topo-container">
                <div className="topo-header">
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className="card-title" style={{ border: 'none', padding: 0 }}>
                            <FaProjectDiagram /> DAG WORKSPACE
                        </div>
                    </div>
                    <div className="topo-controls">
                        <button className="topo-btn btn-primary" onClick={() => setIsConfigModalOpen(true)}>
                            <FaProjectDiagram /> Configure Graph
                        </button>
                        <button className="topo-btn btn-primary" onClick={play} disabled={isPlaying}>
                            <FaPlay /> Start Algorithm
                        </button>
                    </div>
                </div>

                <div className="topo-main-grid">
                    <div className="topo-graph-card">
                        <GraphCanvas
                            nodes={nodes}
                            edges={edges}
                            nodeStates={nodeStates}
                            edgeStates={edgeStates}
                            onGraphUpdate={handleGraphUpdate}
                            isDirected={true}
                        />
                        {nodes.length === 0 && (
                            <div className="topo-graph-placeholder">
                                <FaProjectDiagram size={48} />
                                <p>Click to add nodes | Drag between nodes to add dependencies</p>
                            </div>
                        )}
                    </div>

                    <div className="topo-table-card">
                        <div className="card-title">
                            <FaTable /> IN-DEGREE TRACKER
                        </div>
                        <div className="topo-table-content">
                            {nodes.map(node => {
                                const deg = currentStep?.inDegree?.[node.id] ?? 0;
                                const isProcessed = currentStep?.processedNodes?.includes(node.id);
                                const isReady = deg === 0 && !isProcessed;
                                return (
                                    <div key={node.id} className={`topo-row ${isReady ? 'ready' : ''} ${isProcessed ? 'processed' : ''}`}>
                                        <span className="row-node">Task {node.id}</span>
                                        <span className="row-deg">{isProcessed ? 'DONE' : `In-Deg: ${deg}`}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="topo-result-strip">
                    <div className="card-title" style={{ border: 'none', padding: 0, marginBottom: '8px' }}>
                        <FaArrowRight /> TOPOLOGICAL SEQUENCE
                    </div>
                    <div className="topo-sequence">
                        {(currentStep?.sortedOrder || []).map((nodeId, idx) => (
                            <React.Fragment key={nodeId}>
                                <div className="seq-item">{nodeId}</div>
                                {idx < (currentStep?.sortedOrder?.length - 1) && <span className="seq-arrow">→</span>}
                            </React.Fragment>
                        ))}
                        {currentStep?.sortedOrder?.length === 0 && <span style={{ color: '#475569', fontStyle: 'italic' }}>Waiting for tasks...</span>}
                    </div>
                </div>

                <div className="topo-controls-wrapper">
                    <AnimationControls inputType="none"
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

            {/* Configuration Modal */}
            {isConfigModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsConfigModalOpen(false)}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', minWidth: '450px', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><FaProjectDiagram style={{ color: '#38bdf8' }} /> Configure Graph</h3>
                            <button onClick={() => setIsConfigModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ marginBottom: '16px', padding: '10px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', fontSize: '0.85rem', color: '#38bdf8' }}>
                            💡 Note: Topological Sort requires a <b>Directed Acyclic Graph (DAG)</b>. Ensure your input does not contain cycles.
                        </div>

                        <GraphInput
                            nodes={nodes}
                            edges={edges}
                            onGraphUpdate={(newNodes, newEdges) => {
                                handleGraphUpdate({ nodes: newNodes, edges: newEdges });
                                setIsConfigModalOpen(false);
                            }}
                            requiresWeights={false}
                        />

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button className="topo-btn btn-secondary" style={{ flex: 1 }} onClick={handleRandom}>Generate Random DAG</button>
                            <button className="topo-btn btn-secondary" style={{ flex: 1, color: '#ef4444' }} onClick={() => { handleClear(); setIsConfigModalOpen(false); }}>Clear All</button>
                        </div>
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default TopologicalSortVisualizer;
