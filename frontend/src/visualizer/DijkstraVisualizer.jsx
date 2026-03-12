import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateDijkstraSteps } from "../algorithms/graphs/dijkstra";
import { algorithmCodes } from "../data/algorithmCodes";
import GraphInput from "../components/GraphInput/GraphInput";
import GraphCanvas from "./GraphCanvas";
import { defaultWeightedGraph } from "../algorithms/graphs/graphData";
import { toast } from "react-hot-toast";
import "./DijkstraVisualizer.css";

const DijkstraVisualizer = () => {
    const [graph, setGraph] = useState(defaultWeightedGraph);
    const [startNode, setStartNode] = useState(defaultWeightedGraph.nodes[0].id);
    const [steps, setSteps] = useState([]);
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    // Initialize animation hook
    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        setSpeed,
        speed
    ,
        setIndex
    } = useGenericAnimation(steps);

    useEffect(() => {
        if (!graph || graph.nodes.length === 0) return;
        
        let validStartNode = startNode;
        if (!graph.nodes.find(n => n.id === validStartNode)) {
            validStartNode = graph.nodes[0].id;
            setStartNode(validStartNode);
        }

        const generatedSteps = generateDijkstraSteps(graph.nodes, graph.edges, validStartNode);
        setSteps(generatedSteps);
    }, [graph, startNode]);

    // Force animation hook to reset whenever steps array structure changes significantly
    useEffect(() => {
        reset();
    }, [steps]);

    const handleGraphUpdate = (nodes, edges) => {
        if (nodes.length < 2) {
            toast.error("Graph must have at least 2 nodes");
            return;
        }
        setGraph({ nodes, edges, type: 'weighted' });
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'initialization': return 3;
            case 'select-node': return 10;
            case 'relax-neighbor': return 18;
            case 'relax-success': return 21;
            case 'node-visited': return 26;
            case 'final': return 29;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.dijkstra?.[activeLanguage] || "";
    const distances = currentStep?.distances || {};
    const pq = currentStep?.pq || [];
    const stats = currentStep?.stats || { processedNodes: 0, updates: 0 };
    
    // We use Set on final Shortest Path Tree mapping for easy O(1) checking
    const sptEdgeIds = new Set(currentStep?.shortestPathTree || []);
    const visitedSet = new Set(currentStep?.visited || []);

    return (
        <DualView
            algorithmName="Dijkstra's Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="graphs"
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">Graphs</span>
                    <span className="description-text">
                        {currentStep?.description || "Press Play to start solving for Shortest Paths."}
                    </span>
                </div>
            }
        >
            <div className="dijk-layout">
                {/* 1. Dashboard Row */}
                <div className="dijk-dashboard">
                    <div className="dijk-stats-card">
                        <div className="dijk-card-title">Execution Tracking</div>
                        <div className="dijk-stats-grid">
                            <div className="dijk-stat-item">
                                <span className="dijk-stat-label">Processed Nodes</span>
                                <span className="dijk-stat-value">{stats.processedNodes} / {graph.nodes.length}</span>
                            </div>
                            <div className="dijk-stat-item">
                                <span className="dijk-stat-label">Dist/Path Updates</span>
                                <span className="dijk-stat-value">{stats.updates}</span>
                            </div>
                            <div className="dijk-stat-item">
                                <span className="dijk-stat-label">Current Node</span>
                                <span className="dijk-stat-value" style={{ color: '#FBBF24' }}>
                                    {currentStep?.currentNodeId !== null && currentStep?.currentNodeId !== undefined 
                                        ? currentStep.currentNodeId 
                                        : 'None'}
                                </span>
                            </div>
                            <div className="dijk-stat-item">
                                <span className="dijk-stat-label">Step</span>
                                <span className="dijk-stat-value">{currentStepIndex + 1} / {isPlaying ? '?' : 'Done'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="dijk-pq-card">
                        <div className="dijk-card-title">Priority Queue (Unvisited Nodes)</div>
                        <div className="dijk-pq-list">
                            <AnimatePresence mode="popLayout">
                                {pq.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Empty / All Reachable Visited</span>}
                                {pq.map((item, idx) => (
                                    <motion.div
                                        key={item.node}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`dijk-pq-item ${idx === 0 ? 'dijk-pq-closest' : ''}`}
                                    >
                                        <div className="dijk-pq-node">{item.node}</div>
                                        <div className="dijk-pq-dist">{item.distance === Infinity ? '∞' : item.distance}</div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* 2. Main Visualization Row */}
                <div className="dijk-main-row">
                    {/* Graph Canvas */}
                    <div className="dijk-canvas-wrapper">
                        <div className="dijk-graph-container">
                             <GraphCanvas
                                nodes={graph.nodes}
                                edges={graph.edges}
                                nodeStates={(() => {
                                    const ns = {};
                                    // Source node always gets blue 'source' color
                                    ns[startNode] = 'source';
                                    // Visited nodes get green
                                    (currentStep?.visited || []).forEach(id => {
                                        if (id !== startNode) ns[id] = 'visited';
                                    });
                                    // Current processing node overrides to purple
                                    if (currentStep?.currentNodeId && currentStep.currentNodeId !== startNode) {
                                        ns[currentStep.currentNodeId] = 'current';
                                    }
                                    // On final step, highlight all reachable nodes as shortest-path (gold)
                                    if (currentStep?.type === 'final') {
                                        ns[startNode] = 'source';
                                        (currentStep?.visited || []).forEach(id => {
                                            if (id !== startNode) ns[id] = 'shortest-path';
                                        });
                                    }
                                    return ns;
                                })()}
                                edgeStates={(() => {
                                    const es = {};
                                    // Show shortest path tree edges as green during animation
                                    (currentStep?.shortestPathTree || []).forEach(eId => {
                                        const edge = graph.edges.find(e => e.id === eId);
                                        if (edge) {
                                            es[`${edge.from}-${edge.to}`] = 'selected';
                                            es[`${edge.to}-${edge.from}`] = 'selected';
                                        }
                                    });
                                    // Active edge being relaxed
                                    if (currentStep?.activeEdge) {
                                        const edge = graph.edges.find(e => e.id === currentStep.activeEdge);
                                        if (edge) {
                                            const state = currentStep.type === 'relax-success' ? 'relaxed' : 'considering';
                                            es[`${edge.from}-${edge.to}`] = state;
                                            es[`${edge.to}-${edge.from}`] = state;
                                        }
                                    }
                                    // On final step, show all SPT edges as gold
                                    if (currentStep?.type === 'final') {
                                        (currentStep?.shortestPathTree || []).forEach(eId => {
                                            const edge = graph.edges.find(e => e.id === eId);
                                            if (edge) {
                                                es[`${edge.from}-${edge.to}`] = 'shortest-edge';
                                                es[`${edge.to}-${edge.from}`] = 'shortest-edge';
                                            }
                                        });
                                    }
                                    return es;
                                })()}
                             />
                        </div>
                        
                        <div className="dijk-controls-box">
                            <AnimationControls
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
                                inputType="none" // Graph uses modal input
                            />
                        </div>
                    </div>

                    {/* Distance Table */}
                    <div className="dijk-distance-panel">
                        <div className="dijk-card-title">Shortest Distance Table</div>
                        <div className="dijk-table-container">
                            <table className="dijk-distance-table">
                                <thead>
                                    <tr>
                                        <th>Node</th>
                                        <th>Shortest Dist from {startNode}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {graph.nodes.map((node) => {
                                            const dist = distances[node.id];
                                            const isSource = node.id === startNode;
                                            const isCurrent = currentStep?.currentNodeId === node.id;
                                            const isVisited = visitedSet.has(node.id);
                                            
                                            // Check if this row just got successfully updated via relaxation
                                            const isUpdating = currentStep?.type === 'relax-success' 
                                                && currentStep?.activeEdge 
                                                && graph.edges.find(e => e.id === currentStep.activeEdge)?.to === node.id;

                                            let rowClass = "dijk-table-row";
                                            if (isCurrent) rowClass += " dijk-row-current";
                                            else if (isVisited) rowClass += " dijk-row-visited";
                                            else if (isSource && currentStepIndex === 0) rowClass += " dijk-row-source";

                                            return (
                                                <motion.tr 
                                                    key={node.id}
                                                    layout
                                                    className={rowClass}
                                                    initial={{ backgroundColor: 'transparent' }}
                                                    animate={{ 
                                                        backgroundColor: isUpdating ? 'rgba(52, 211, 153, 0.25)' : 'transparent',
                                                        scale: isUpdating ? 1.02 : 1
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <td className="dijk-td-node">
                                                        <span className="dijk-node-badge">{node.id}</span>
                                                    </td>
                                                    <td className="dijk-td-dist">
                                                        <motion.span
                                                            key={dist}
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            style={{
                                                                color: isUpdating ? '#34d399' : 'inherit',
                                                                fontWeight: isUpdating ? 'bold' : 'normal'
                                                            }}
                                                        >
                                                            {dist === Infinity ? '∞' : dist}
                                                        </motion.span>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 3. Inputs */}
                <div className="cs-inputs-panel">
                    <GraphInput 
                        onGraphUpdate={handleGraphUpdate}
                        isWeighted={true}
                        isDirected={true} 
                        nodes={graph.nodes}
                        edges={graph.edges}
                    />
                    
                    <div className="dijk-input-group" style={{ marginLeft: '16px' }}>
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>Source Node</label>
                        <select
                            value={startNode}
                            onChange={(e) => setStartNode(e.target.value)}
                            style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                color: '#38bdf8',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {graph.nodes.map(node => (
                                <option key={node.id} value={node.id}>{node.id}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 4. Educational Content */}
                <div className="cs-education-panel" style={{ border: 'none', background: 'transparent', padding: '10px 0' }}>
                    <div className="cs-edu-grid">
                        <div className="cs-edu-section">
                            <h3>How It Works</h3>
                            <p>
                                Dijkstra’s algorithm finds the shortest distance from a starting point to all other points
                                by always expanding the closest unvisited node.
                            </p>
                            
                            <h3 style={{ marginTop: '16px' }}>The Core Idea</h3>
                            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <li style={{ marginBottom: '3px' }}>Start with the source node at distance 0, others at ∞.</li>
                                <li style={{ marginBottom: '3px' }}>Select the unvisited node with the smallest known distance.</li>
                                <li style={{ marginBottom: '3px' }}>Check all outgoing edges (Relaxation). If a path to a neighbor is shorter than its current known distance, update it!</li>
                                <li style={{ marginBottom: '3px' }}>Once all neighbors are checked, mark the node as visited.</li>
                            </ul>
                            
                            <p style={{ marginTop: '12px', fontSize: '0.85rem' }}>
                                <i>Note: Dijkstra's algorithm relies on edge weights being non-negative.</i>
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time Complexity</span>
                                    <span style={{ color: '#34d399' }}>O((V + E) log V)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(V)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Optimal</span>
                                    <span style={{ color: '#34d399' }}>Yes (if weights ≥ 0)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </DualView>
    );
};

export default DijkstraVisualizer;
