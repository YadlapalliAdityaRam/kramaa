import React, { useState, useEffect } from "react";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateDijkstraSteps } from "../algorithms/graphs/dijkstra";
import { algorithmCodes } from "../data/algorithmCodes";
import GraphInput from "../components/GraphInput/GraphInput";
import GraphCanvas from "./GraphCanvas";
import { defaultWeightedGraph } from "../algorithms/graphs/graphData";
import { toast } from "react-hot-toast";
import { FaNetworkWired, FaProjectDiagram, FaRedo } from "react-icons/fa";
import "./DijkstraVisualizer.css";

const DijkstraVisualizer = () => {
    const [graph, setGraph]                 = useState(defaultWeightedGraph);
    const [startNode, setStartNode]         = useState(defaultWeightedGraph.nodes[0].id);
    const [steps, setSteps]                 = useState([]);
    const [activeLanguage, setActiveLanguage] = useState("javascript");
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

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
        speed,
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

    const handleGraphUpdate = (arg1, arg2) => {
        const nodes = Array.isArray(arg1) ? arg1 : (arg1?.nodes || []);
        const edges = Array.isArray(arg1) ? (arg2 || []) : (arg1?.edges || []);
        if (nodes.length < 2) {
            toast.error("Graph must have at least 2 nodes.");
            return;
        }
        setGraph({ nodes, edges, type: 'weighted' });
        reset();
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'initialization': return 3;
            case 'select-node':    return 10;
            case 'relax-neighbor': return 18;
            case 'relax-success':  return 20;
            case 'node-visited':   return 16;
            case 'final':          return 23;
            default:               return 0;
        }
    };

    const codeSnippet = algorithmCodes.dijkstra?.[activeLanguage] || "";
    const stepData    = currentStep || {};
    const distances   = stepData.distances || {};
    const nodeStates  = stepData.nodeStates || {};
    const edgeStates  = stepData.edgeStates || {};

    return (
        <DualView
            algorithmName="Dijkstra's Shortest Path Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="graphs"
            description={
                <div className="dijk-desc-wrapper">
                    <span className="dijk-badge">Greedy Single-Source Shortest Path</span>
                    <span className="dijk-desc-text">
                        {stepData.description || "Select a start node and press Play to solve for single-source shortest paths."}
                    </span>
                </div>
            }
        >
            <div className="dijk-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="dijk-input-panel">
                    <div className="dijk-input-group">
                        <label className="dijk-input-label">
                            <FaNetworkWired className="dijk-icon" /> Start Node:
                        </label>
                        <select
                            className="dijk-start-select"
                            value={startNode}
                            onChange={(e) => { setStartNode(e.target.value); reset(); }}
                        >
                            {(graph.nodes || []).map(n => (
                                <option key={n.id} value={n.id}>{n.id}</option>
                            ))}
                        </select>
                    </div>

                    <div className="dijk-btn-group">
                        <button className="dijk-btn dijk-btn-config" onClick={() => setIsConfigModalOpen(true)}>
                            <FaProjectDiagram /> Configure Graph
                        </button>
                        <button className="dijk-btn dijk-btn-reset" onClick={reset}>
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="dijk-legend">
                        <div className="dijk-leg-item"><span className="dijk-dot blue"></span> Current Node</div>
                        <div className="dijk-leg-item"><span className="dijk-dot yellow"></span> Relaxing Edge</div>
                        <div className="dijk-leg-item"><span className="dijk-dot green"></span> Shortest Path</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Graph & Distance Table ────────── */}
                <div className="dijk-canvas-wrapper">
                    
                    {/* Graph Canvas */}
                    <div className="dijk-graph-panel">
                        <div className="dijk-card-title">Weighted Graph Canvas</div>
                        <div className="dijk-canvas-wrap">
                            <GraphCanvas
                                nodes={graph.nodes || []}
                                edges={graph.edges || []}
                                nodeStates={nodeStates}
                                edgeStates={edgeStates}
                            />
                        </div>
                    </div>

                    {/* Distance Table */}
                    <div className="dijk-dist-panel">
                        <div className="dijk-card-title">Shortest Distances</div>
                        <div className="dijk-dist-grid">
                            {(graph.nodes || []).map(node => {
                                const distVal = distances[node.id];
                                const isInf   = distVal === undefined || distVal === Infinity || distVal === "∞";

                                return (
                                    <div key={node.id} className="dijk-dist-card">
                                        <span className="node-lbl">Node {node.id}</span>
                                        <span className="dist-val">{isInf ? '∞' : distVal}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="dijk-controls-wrapper">
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

            {/* Modal */}
            {isConfigModalOpen && (
                <div className="dijk-modal-backdrop" onClick={() => setIsConfigModalOpen(false)}>
                    <div className="dijk-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="dijk-modal-header">
                            <h3><FaProjectDiagram style={{ color: '#38bdf8' }} /> Configure Weighted Graph</h3>
                            <button className="dijk-modal-close" onClick={() => setIsConfigModalOpen(false)}>✕</button>
                        </div>
                        <GraphInput
                            nodes={graph.nodes || []}
                            edges={graph.edges || []}
                            onGraphUpdate={(newNodes, newEdges) => {
                                handleGraphUpdate(newNodes, newEdges);
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

export default DijkstraVisualizer;
