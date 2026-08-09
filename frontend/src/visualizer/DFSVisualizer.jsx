import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import GraphCanvas from "./GraphCanvas";
import GraphInput from "../components/GraphInput/GraphInput";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateDFSSteps } from "../algorithms/graphs/dfs";
import { algorithmCodes } from "../data/algorithmCodes";
import { defaultGraph } from "../algorithms/graphs/graphData";
import { FaNetworkWired, FaRedo, FaProjectDiagram } from "react-icons/fa";
import "./GraphTraversalVisualizer.css";

const DFSVisualizer = () => {
    const [graph, setGraph]                 = useState(defaultGraph);
    const [startNode, setStartNode]         = useState("A");
    const [activeLanguage, setActiveLanguage] = useState("javascript");
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    const steps = useMemo(() => generateDFSSteps(graph, startNode), [graph, startNode]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        speed,
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { nodeStates, edgeStates, stack, visited, description } = stepData;

    const handleGraphUpdate = (arg1, arg2) => {
        const newNodes = Array.isArray(arg1) ? arg1 : (arg1?.nodes || []);
        const newEdges = Array.isArray(arg1) ? (arg2 || []) : (arg1?.edges || []);
        setGraph({ nodes: newNodes, edges: newEdges });
        if (newNodes.length > 0 && !newNodes.find(n => n.id === startNode)) {
            setStartNode(newNodes[0].id);
        }
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (true) {
            case snapshot.type === 'graph' && snapshot.description.includes('Starting'):   return 18;
            case snapshot.type === 'graph' && snapshot.description.includes('Popped'):     return 28;
            case snapshot.type === 'graph' && snapshot.description.includes('Discovered'): return 65;
            case snapshot.type === 'graph-complete': return 95;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.dfs?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Depth-First Search (DFS)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={
                <div className="gt-desc-wrapper">
                    <span className="gt-badge" style={{ color: '#f472b6', borderColor: 'rgba(244,114,182,0.3)', background: 'rgba(244,114,182,0.12)' }}>
                        Depth Traversal
                    </span>
                    <span className="gt-desc-text">
                        {description || "Select a start node and press Play to explore graph paths as deep as possible using a LIFO Stack."}
                    </span>
                </div>
            }
        >
            <div className="gt-wrapper">

                {/* ── Top Input Panel ──────────────────────────────────────── */}
                <div className="gt-input-panel">
                    <div className="gt-input-group">
                        <label className="gt-input-label">
                            <FaNetworkWired className="gt-icon" style={{ color: '#f472b6' }} /> Start Node:
                        </label>
                        <select
                            className="gt-start-select"
                            value={startNode}
                            onChange={(e) => { setStartNode(e.target.value); reset(); }}
                        >
                            {(graph.nodes || []).map(n => (
                                <option key={n.id} value={n.id}>{n.id}</option>
                            ))}
                        </select>
                    </div>

                    <div className="gt-btn-group">
                        <button className="gt-btn gt-btn-config" onClick={() => setIsConfigModalOpen(true)}>
                            <FaProjectDiagram /> Configure Graph
                        </button>
                        <button className="gt-btn gt-btn-reset" onClick={reset}>
                            <FaRedo /> Reset State
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="gt-legend">
                        <div className="gt-leg-item"><span className="gt-dot unvisited"></span> Unvisited</div>
                        <div className="gt-leg-item"><span className="gt-dot" style={{ background: '#f472b6' }}></span> In Stack</div>
                        <div className="gt-leg-item"><span className="gt-dot current"></span> Current</div>
                        <div className="gt-leg-item"><span className="gt-dot visited"></span> Visited</div>
                    </div>
                </div>

                {/* ── Main Area: Graph + Stack (LIFO) side-by-side ────────── */}
                <div className="gt-main-area">

                    {/* Graph Canvas */}
                    <div className="gt-graph-panel">
                        <div className="gt-graph-label">Unweighted Graph</div>
                        <div className="gt-canvas-wrap">
                            <GraphCanvas
                                nodes={graph.nodes || []}
                                edges={graph.edges || []}
                                nodeStates={nodeStates || {}}
                                edgeStates={edgeStates || {}}
                            />
                        </div>
                    </div>

                    {/* Stack (LIFO) Data Structure Panel */}
                    <div className="gt-ds-panel">
                        {/* Stack Box */}
                        <div className="gt-ds-card">
                            <div className="gt-ds-title">
                                <span>📤 Stack (LIFO)</span>
                                <span className="gt-ds-count" style={{ background: '#f472b6', color: '#ffffff' }}>
                                    {stack?.length || 0}
                                </span>
                            </div>
                            <div className="stack-list">
                                <AnimatePresence mode="popLayout">
                                    {stack?.map((nodeId, idx) => (
                                        <motion.div
                                            key={`${nodeId}-${idx}`}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="stack-item"
                                        >
                                            {nodeId}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {(!stack || stack.length === 0) && (
                                    <div className="gt-empty-hint">Stack Empty</div>
                                )}
                            </div>
                        </div>

                        {/* Visited Nodes Box */}
                        <div className="gt-ds-card">
                            <div className="gt-ds-title">
                                <span>✓ Visited Order</span>
                                <span className="gt-ds-count green">{visited?.length || 0}</span>
                            </div>
                            <div className="visited-list">
                                {visited?.map(nodeId => (
                                    <div key={nodeId} className="visited-item">{nodeId}</div>
                                ))}
                                {(!visited || visited.length === 0) && (
                                    <div className="gt-empty-hint">None visited yet</div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="gt-controls-bar">
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

            {/* Configuration Modal */}
            {isConfigModalOpen && (
                <div className="gt-modal-backdrop" onClick={() => setIsConfigModalOpen(false)}>
                    <div className="gt-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="gt-modal-header">
                            <h3><FaProjectDiagram style={{ color: '#38bdf8' }} /> Configure Custom Graph</h3>
                            <button className="gt-modal-close" onClick={() => setIsConfigModalOpen(false)}>✕</button>
                        </div>
                        <GraphInput
                            nodes={graph.nodes || []}
                            edges={graph.edges || []}
                            onGraphUpdate={(newNodes, newEdges) => {
                                handleGraphUpdate(newNodes, newEdges);
                                setIsConfigModalOpen(false);
                            }}
                            requiresWeights={false}
                        />
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default DFSVisualizer;
