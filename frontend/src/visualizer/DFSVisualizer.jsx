import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import GraphCanvas from "./GraphCanvas";
import GraphInput from "../components/GraphInput/GraphInput";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateDFSSteps } from "../algorithms/graphs/dfs";
import { algorithmCodes } from "../data/algorithmCodes";
import { defaultGraph } from "../algorithms/graphs/graphData";
import "./GraphTraversalVisualizer.css";

const DFSVisualizer = () => {
    const [graph, setGraph] = useState(defaultGraph);
    const [startNode, setStartNode] = useState("A");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

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
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { nodeStates, edgeStates, stack, visited, description } = stepData;

    const handleReset = () => {
        reset();
    };

    const handleGraphUpdate = (newNodes, newEdges) => {
        setGraph({ nodes: newNodes, edges: newEdges });
        if (newNodes.length > 0 && !newNodes.find(n => n.id === startNode)) {
            setStartNode(newNodes[0].id);
        }
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (true) {
            case snapshot.type === 'graph' && snapshot.description.includes('Starting'): return 18;
            case snapshot.type === 'graph' && snapshot.description.includes('Popped'): return 28;
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
            description={description || "Select a start node and press Play to begin DFS traversal."}
        >
            <div className="traversal-container">
                <div className="legend">
                    <div className="legend-item"><div className="l-dot unvisited"></div> Unvisited</div>
                    <div className="legend-item"><div className="l-dot discovery" style={{ borderColor: '#f472b6', background: 'rgba(244, 114, 182, 0.1)' }}></div> In Stack</div>
                    <div className="legend-item"><div className="l-dot current"></div> Current</div>
                    <div className="legend-item"><div className="l-dot visited"></div> Visited</div>
                </div>

                <GraphInput
                    nodes={graph.nodes}
                    edges={graph.edges}
                    onGraphUpdate={handleGraphUpdate}
                    requiresWeights={false}
                />

                <div className="traversal-layout">
                    <div className="graph-section">
                        <GraphCanvas
                            nodes={graph.nodes}
                            edges={graph.edges}
                            nodeStates={nodeStates || {}}
                            edgeStates={edgeStates || {}}
                        />
                    </div>

                    <div className="data-structure-section">
                        <div className="ds-panel">
                            <div className="ds-title">
                                Stack (LIFO)
                                <span className="ds-count" style={{ background: '#f472b6' }}>{stack?.length || 0}</span>
                            </div>
                            <div className="stack-list">
                                <AnimatePresence>
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
                            </div>
                        </div>

                        <div className="ds-panel" style={{ flex: 0.6 }}>
                            <div className="ds-title">Visited Order</div>
                            <div className="visited-list">
                                {visited?.map(nodeId => (
                                    <div key={nodeId} className="visited-item">{nodeId}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="controls-area">
                    <div className="cs-controls-wrapper">
                        <AnimationControls
                            inputType="none"
                            onNext={stepForward}
                            onPrev={stepBackward}
                            onPlay={play}
                            onPause={pause}
                            onReset={handleReset}
                            isPlaying={isPlaying}
                            speed={speed}
                            onSpeedChange={setSpeed}
                        currentStep={currentStepIndex}
                        totalSteps={steps.length}
                        onScrub={setIndex}
                        />
                    </div>

                    <div className="input-bar">
                        <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Start Node:</span>
                            <select
                                className="start-input"
                                value={startNode}
                                onChange={(e) => { setStartNode(e.target.value); reset(); }}
                            >
                                {graph.nodes.map(n => <option key={n.id} value={n.id}>{n.id}</option>)}
                            </select>
                        </div>
                        <button className="btn-action" onClick={() => reset()}>Reset State</button>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default DFSVisualizer;
