import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { generateKosarajuSteps } from '../algorithms/graphs/kosaraju';
import useGenericAnimation from '../hooks/useGenericAnimation';
import AnimationControls from '../components/animation-controls/AnimationControls';
import DualView from './DualView';
import { algorithmCodes } from '../data/algorithmCodes';
import GraphInput from '../components/GraphInput/GraphInput';
import { FaProjectDiagram, FaTrashAlt, FaRandom, FaUndo } from 'react-icons/fa';
import './KosarajuVisualizer.css';

const INITIAL_NODES = [
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 250, y: 100 },
    { id: 'C', x: 250, y: 250 },
    { id: 'D', x: 400, y: 175 },
    { id: 'E', x: 550, y: 100 },
    { id: 'F', x: 550, y: 250 }
];

const INITIAL_EDGES = [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
    { from: 'B', to: 'D' },
    { from: 'D', to: 'E' },
    { from: 'E', to: 'F' },
    { from: 'F', to: 'D' }
];

const KosarajuVisualizer = () => {
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [edges, setEdges] = useState(INITIAL_EDGES);
    const [isEditing, setIsEditing] = useState(true);
    const [edgeStartNode, setEdgeStartNode] = useState(null);
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [history, setHistory] = useState([]);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [customInput, setCustomInput] = useState("");
    const canvasRef = useRef(null);

    const saveHistory = useCallback((currentNodes = nodes, currentEdges = edges) => {
        setHistory(prev => [...prev, { nodes: [...currentNodes], edges: [...currentEdges] }]);
    }, [nodes, edges]);

    const undo = () => {
        if (history.length > 0) {
            const previousState = history[history.length - 1];
            setNodes(previousState.nodes);
            setEdges(previousState.edges);
            setHistory(prev => prev.slice(0, -1));
        } else {
            toast.error("Nothing to undo!");
        }
    };

    const steps = useMemo(() => {
        if (isEditing) return [];
        return generateKosarajuSteps(nodes, edges);
    }, [nodes, edges, isEditing]);

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

    const handleNodeClick = (e, nodeId) => {
        if (!isEditing) return;
        e.stopPropagation();

        if (edgeStartNode) {
            if (edgeStartNode !== nodeId) {
                // Check if edge already exists
                if (!edges.find(edge => edge.from === edgeStartNode && edge.to === nodeId)) {
                    saveHistory();
                    setEdges([...edges, { from: edgeStartNode, to: nodeId }]);
                }
            }
            setEdgeStartNode(null);
        } else {
            setEdgeStartNode(nodeId);
        }
    };

    const handleCanvasClick = (e) => {
        if (!isEditing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newNodeId = String.fromCharCode(65 + nodes.length);
        if (nodes.length < 15) {
            saveHistory();
            setNodes([...nodes, { id: newNodeId, x, y }]);
        }
    };

    const deleteNode = (e, nodeId) => {
        e.stopPropagation();
        saveHistory();
        setNodes(nodes.filter(n => n.id !== nodeId));
        setEdges(edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId));
    };

    const startVisualization = () => {
        if (nodes.length === 0) {
            toast.error("Please add some nodes first!");
            return;
        }
        setIsEditing(false);
    };

    const resetEditor = () => {
        setIsEditing(true);
        reset();
    };

    const generateRandomGraph = () => {
        saveHistory();
        const nodeCount = 5 + Math.floor(Math.random() * 4); // 5 to 8 nodes
        const newNodes = [];
        const centerX = 350;
        const centerY = 200;
        const R = 150;

        for (let i = 0; i < nodeCount; i++) {
            const angle = (i * 2 * Math.PI) / nodeCount - Math.PI / 2;
            newNodes.push({
                id: String.fromCharCode(65 + i),
                x: centerX + R * Math.cos(angle),
                y: centerY + R * Math.sin(angle)
            });
        }

        const newEdges = [];
        const numSCCs = Math.random() > 0.5 ? 2 : 3;
        const sccSizes = Array(numSCCs).fill(1);
        let rem = nodeCount - numSCCs;
        while (rem > 0) {
            sccSizes[Math.floor(Math.random() * numSCCs)]++;
            rem--;
        }

        let currentIdx = 0;
        const sccStarts = [];
        for (let i = 0; i < numSCCs; i++) {
            sccStarts.push(currentIdx);
            const size = sccSizes[i];

            for (let j = 0; j < size; j++) {
                const from = currentIdx + j;
                const to = currentIdx + ((j + 1) % size);
                newEdges.push({ from: newNodes[from].id, to: newNodes[to].id });
            }

            if (size >= 3) {
                const u = currentIdx + Math.floor(Math.random() * size);
                const v = currentIdx + Math.floor(Math.random() * size);
                if (u !== v && Math.abs(u - v) !== 1 && Math.abs(u - v) !== size - 1) {
                    newEdges.push({ from: newNodes[u].id, to: newNodes[v].id });
                }
            }
            currentIdx += size;
        }

        for (let i = 0; i < numSCCs - 1; i++) {
            const fromSCC = sccStarts[i];
            const toSCC = sccStarts[i + 1];
            newEdges.push({
                from: newNodes[fromSCC + Math.floor(Math.random() * sccSizes[i])].id,
                to: newNodes[toSCC + Math.floor(Math.random() * sccSizes[i + 1])].id
            });
        }

        setNodes(newNodes);
        setEdges(newEdges.map((e, idx) => ({ ...e, id: `re-${idx}-${Date.now()}` })));
        toast.success("Arranged connected graph generated!");
    };

    const parseCustomInput = () => {
        if (!customInput.trim()) return;
        saveHistory();

        const edgeStrings = customInput.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 0);
        const parsedEdges = [];
        const uniqueNodeIds = new Set();

        edgeStrings.forEach(s => {
            const parts = s.split(/->|-| /).filter(p => p.trim());
            if (parts.length >= 2) {
                const u = parts[0].trim().toUpperCase().substring(0, 2);
                const v = parts[1].trim().toUpperCase().substring(0, 2);
                uniqueNodeIds.add(u);
                uniqueNodeIds.add(v);
                parsedEdges.push({ from: u, to: v });
            } else if (parts.length === 1) {
                uniqueNodeIds.add(parts[0].trim().toUpperCase().substring(0, 2));
            }
        });

        const newNodes = [];
        const centerX = 350;
        const centerY = 200;
        const R = 150;
        const nodeArr = Array.from(uniqueNodeIds);

        nodeArr.forEach((id, i) => {
            const angle = (i * 2 * Math.PI) / nodeArr.length - Math.PI / 2;
            newNodes.push({
                id: id,
                x: nodeArr.length === 1 ? centerX : centerX + R * Math.cos(angle),
                y: nodeArr.length === 1 ? centerY : centerY + R * Math.sin(angle)
            });
        });

        const finalEdges = parsedEdges.filter((v, i, a) => a.findIndex(t => (t.from === v.from && t.to === v.to)) === i);

        setNodes(newNodes);
        setEdges(finalEdges);
        setCustomInput("");
        toast.success("Graph built from custom input!");
    };

    const currentData = (currentStep && currentStep.nodes) ? currentStep : {
        nodes: nodes.map(n => ({ ...n, state: 'default' })),
        edges: edges.map(e => ({ ...e, state: 'default' })),
        stack: [],
        sccs: [],
        description: nodes.length > 0 ? "Click 'Start' to find Strongly Connected Components." : "Add nodes to the canvas to begin."
    };

    const codeSnippet = algorithmCodes.kosaraju?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return 1;
            case 'dfs1-visit': return 8;
            case 'dfs1-finish': return 12;
            case 'reverse': return 18;
            case 'pop-stack': return 33;
            case 'dfs2-visit': return 25;
            case 'scc-found': return 38;
            case 'complete': return 40;
            default: return 0;
        }
    };

    return (
        <DualView
            algorithmName="Kosaraju's Algorithm"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentData.description}
        >
            <div className="kosaraju-visualizer-container">
                <div className="kosaraju-layout">
                    <div className="graph-section">
                        <div
                            className="canvas-container"
                            ref={canvasRef}
                            onClick={handleCanvasClick}
                        >
                            <svg className="edges-svg" width="100%" height="100%">
                                <defs>
                                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                                    </marker>
                                    <marker id="arrowhead-reversed" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                        <polygon points="10 0, 10 7, 0 3.5" fill="#f97316" />
                                    </marker>
                                </defs>
                                {currentData.edges.map((edge, idx) => {
                                    const fromNode = nodes.find(n => n.id === edge.from);
                                    const toNode = nodes.find(n => n.id === edge.to);
                                    if (!fromNode || !toNode) return null;

                                    const isReversed = edge.state === 'reversed';

                                    return (
                                        <motion.line
                                            key={`${edge.from}-${edge.to}-${isReversed}`}
                                            x1={fromNode.x}
                                            y1={fromNode.y}
                                            x2={toNode.x}
                                            y2={toNode.y}
                                            className={`edge-line ${edge.state}`}
                                            strokeDasharray={isReversed ? "5,5" : "0"}
                                            markerEnd={`url(#${isReversed ? 'arrowhead-reversed' : 'arrowhead'})`}
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                        />
                                    );
                                })}
                            </svg>

                            {currentData.nodes.map((node) => (
                                <div
                                    key={node.id}
                                    className={`graph-node ${node.state} ${node.isCurrent ? 'current' : ''} ${node.isFinished ? 'finished' : ''}`}
                                    style={{
                                        left: node.x - 24,
                                        top: node.y - 24,
                                        '--scc-color': node.sccColor,
                                        '--scc-glow': `${node.sccColor}4D`
                                    }}
                                    onClick={(e) => handleNodeClick(e, node.id)}
                                >
                                    <span className="node-label">{node.id}</span>
                                    {isEditing && (
                                        <button
                                            className="delete-node-btn"
                                            onClick={(e) => deleteNode(e, node.id)}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isEditing && (
                            <div className="editor-controls-row" style={{ padding: '10px 20px', background: 'rgba(15, 23, 42, 0.4)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'center' }}>
                                <div className="info-banner" style={{ margin: 0 }}>
                                    💡 Click canvas to ADD node | Click node to ADD edge | <span style={{ color: '#38bdf8', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsConfigModalOpen(true)}>Advanced Input (Matrix / Bulk List)</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <div className="stack-container">
                            <h3 className="stack-title">
                                📚 Finishing Order (Stack)
                            </h3>
                            <div className="stack-view">
                                <AnimatePresence initial={false}>
                                    {currentData.stack.map((id, idx) => (
                                        <motion.div
                                            key={`${id}-${idx}`}
                                            initial={{ x: 50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -50, opacity: 0 }}
                                            className={`stack-item ${currentData.highlightPop === id ? 'pop-highlight' : ''}`}
                                        >
                                            {id}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {currentData.stack.length === 0 && (
                                    <div className="empty-state">Empty</div>
                                )}
                            </div>
                        </div>

                        <div className="scc-list-container">
                            <h3 className="scc-title">
                                💎 SCCs Found
                            </h3>
                            <div className="scc-items">
                                {currentData.sccs.map((scc, idx) => (
                                    <div
                                        key={idx}
                                        className="scc-tag"
                                        style={{ '--scc-color': currentData.nodes.find(n => n.id === scc[0])?.sccColor }}
                                    >
                                        <span>SCC {idx + 1}</span>
                                        <span className="scc-values">{'{'}{scc.join(',')}{'}'}</span>
                                    </div>
                                ))}
                                {currentData.sccs.length === 0 && (
                                    <div className="empty-state">None</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="controls-card">
                    <div className="main-actions">
                        {isEditing ? (
                            <>
                                <button className="action-btn primary" onClick={startVisualization}>
                                    ▶ Start Algorithm
                                </button>
                                <button className="action-btn" onClick={undo} disabled={history.length === 0}>
                                    ↩️ Undo
                                </button>
                                <button className="action-btn" onClick={generateRandomGraph}>
                                    🎲 Random Graph
                                </button>
                                <button className="action-btn" onClick={() => { saveHistory(); setNodes([]); setEdges([]); }}>
                                    🗑️ Clear
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="action-btn" onClick={resetEditor}>
                                    ✏️ Editor
                                </button>
                                <AnimationControls
                                    isPlaying={isPlaying}
                                    onPlay={play}
                                    onPause={pause}
                                    onReset={reset}
                                    onStepForward={stepForward}
                                    onStepBackward={stepBackward}
                                    currentStep={currentStepIndex}
                                    totalSteps={steps.length}
                                    speed={speed}
                                    onSpeedChange={setSpeed}
                                    onScrub={setIndex}
                                    inputType="none"
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Advanced Config Modal */}
            {isConfigModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsConfigModalOpen(false)}>
                    <div style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', minWidth: '450px', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}><FaProjectDiagram style={{ color: '#38bdf8' }} /> Advanced Graph Configuration</h3>
                            <button onClick={() => setIsConfigModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>

                        <GraphInput
                            nodes={nodes}
                            edges={edges}
                            onGraphUpdate={(newNodes, newEdges) => {
                                saveHistory();
                                setNodes(newNodes);
                                setEdges(newEdges);
                                setIsConfigModalOpen(false);
                            }}
                            requiresWeights={false}
                        />

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button className="action-btn" style={{ flex: 1 }} onClick={() => { setIsConfigModalOpen(false); generateRandomGraph(); }}>
                                <FaRandom /> Random Connected
                            </button>
                            <button className="action-btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} onClick={() => { saveHistory(); setNodes([]); setEdges([]); setIsConfigModalOpen(false); }}>
                                <FaTrashAlt /> Reset Grid
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DualView>
    );
};

export default KosarajuVisualizer;
