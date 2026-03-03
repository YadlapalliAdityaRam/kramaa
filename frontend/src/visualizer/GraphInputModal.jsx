import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './GraphInputModal.css';

const MAX_NODES = 12;
const MIN_NODES = 2;

const GraphInputModal = ({ isOpen, onClose, onGenerate, defaultDirected = false, defaultWeighted = false }) => {
    const [inputType, setInputType] = useState('matrix'); // 'matrix' | 'edgeList'
    const [nodeCount, setNodeCount] = useState(5);
    const [isDirected, setIsDirected] = useState(defaultDirected);
    const [isWeighted, setIsWeighted] = useState(defaultWeighted);

    // Matrix state: 2D array of strings to allow empty inputs while typing
    const [matrix, setMatrix] = useState([]);

    // Edge List state
    const [edgeList, setEdgeList] = useState('');

    // Pre-fill default matrix
    useEffect(() => {
        resetMatrix(5);
        setEdgeList("A-B:4\nA-C:2\nB-C:1\nB-D:5\nC-D:8\nC-E:10\nD-E:2\nD-F:6\nE-F:3");
    }, []);

    // Create a new empty matrix of size n x n
    const resetMatrix = (size) => {
        const newMatrix = Array(size).fill(null).map(() => Array(size).fill('0'));
        setMatrix(newMatrix);
        setNodeCount(size);
    };

    const handleNodeMapChange = (e) => {
        const val = parseInt(e.target.value);
        if (isNaN(val)) return;
        const boundedVal = Math.min(Math.max(val, MIN_NODES), MAX_NODES);

        if (boundedVal !== nodeCount) {
            // Resize matrix while preserving existing values where possible
            const newMatrix = Array(boundedVal).fill(null).map((_, i) =>
                Array(boundedVal).fill(null).map((_, j) => {
                    return (i < nodeCount && j < nodeCount) ? matrix[i][j] : '0';
                })
            );
            setMatrix(newMatrix);
            setNodeCount(boundedVal);
        }
    };

    const handleMatrixChange = (row, col, value) => {
        // Clean input: only allow numbers, minus sign, and decimals
        let cleaned = value.replace(/[^0-9.-]/g, '');

        const newMatrix = [...matrix];
        newMatrix[row] = [...newMatrix[row]];
        newMatrix[row][col] = cleaned;

        // Auto-symmetric logic for undirected graphs
        if (!isDirected && row !== col) {
            newMatrix[col] = [...(newMatrix[col] || matrix[col])];
            newMatrix[col][row] = cleaned;
        }

        setMatrix(newMatrix);
    };

    const generateFromMatrix = () => {
        const nodesMap = new Map();
        const edges = [];

        // Let's use letters A-Z for nodes
        const getLabel = (index) => String.fromCharCode(65 + index);

        for (let i = 0; i < nodeCount; i++) {
            nodesMap.set(getLabel(i), { id: getLabel(i), label: getLabel(i) });
        }

        for (let i = 0; i < nodeCount; i++) {
            for (let j = 0; j < nodeCount; j++) {
                // If undirected, we only process top half of matrix (i <= j) to avoid duplicate edges
                if (!isDirected && i > j) continue;

                const val = parseFloat(matrix[i][j]);
                if (!isNaN(val) && val !== 0) {
                    // It's an edge
                    const weight = isWeighted ? val : 1;
                    edges.push({
                        from: getLabel(i),
                        to: getLabel(j),
                        weight: weight
                    });
                }
            }
        }

        return { nodes: Array.from(nodesMap.values()), edges, directed: isDirected };
    };

    const generateFromEdgeList = () => {
        const edgesStr = edgeList.split('\n').map(s => s.trim()).filter(s => s);
        const nodesMap = new Map();
        const edges = [];

        for (const edgeStr of edgesStr) {
            const cleanEdge = edgeStr.replace(/\s+/g, '');
            const match = cleanEdge.match(/^([a-zA-Z0-9]+)-([a-zA-Z0-9]+)(?::([0-9.-]+))?$/);

            if (!match) {
                toast.error(`Invalid format around "${edgeStr}". Use "A-B" or "A - B : 5"`);
                return null;
            }

            const from = match[1];
            const to = match[2];
            const weight = isWeighted ? (match[3] ? parseFloat(match[3]) : 1) : 1;

            if (!nodesMap.has(from)) nodesMap.set(from, { id: from, label: from });
            if (!nodesMap.has(to)) nodesMap.set(to, { id: to, label: to });

            edges.push({ from, to, weight });
        }

        const nodes = Array.from(nodesMap.values());
        if (nodes.length === 0) return toast.error("Graph cannot be empty.") && null;
        if (nodes.length > MAX_NODES) return toast.error(`Maximum ${MAX_NODES} nodes allowed. You have ${nodes.length}.`) && null;
        if (edges.length > 30) return toast.error("Maximum 30 edges allowed.") && null;

        return { nodes, edges, directed: isDirected };
    };

    const handleGenerate = () => {
        let graphData = null;
        if (inputType === 'matrix') {
            graphData = generateFromMatrix();
        } else {
            graphData = generateFromEdgeList();
        }

        if (graphData) {
            onGenerate(graphData);
            onClose();
            toast.success("Graph constructed successfully!");
        }
    };

    const applyExample = () => {
        if (inputType === 'matrix') {
            setIsDirected(false);
            setIsWeighted(true);
            setNodeCount(4);
            setMatrix([
                ['0', '4', '2', '0'],
                ['4', '0', '1', '5'],
                ['2', '1', '0', '8'],
                ['0', '5', '8', '0']
            ]);
        } else {
            setEdgeList("A-B:4\nA-C:2\nB-C:1\nB-D:5\nC-D:8");
        }
        toast.success("Example loaded!");
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="graph-modal-overlay">
                <motion.div
                    className="graph-modal-content"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="graph-modal-header">
                        <h2>Configure Custom Graph</h2>
                        <button className="close-btn" onClick={onClose}><FaTimes /></button>
                    </div>

                    <div className="graph-modal-body">
                        {/* Left Panel: Controls */}
                        <div className="graph-modal-sidebar">
                            <div className="input-type-selector">
                                <button
                                    className={`segment-btn ${inputType === 'edgeList' ? 'active' : ''}`}
                                    onClick={() => setInputType('edgeList')}
                                >
                                    Edge List
                                </button>
                                <button
                                    className={`segment-btn ${inputType === 'matrix' ? 'active' : ''}`}
                                    onClick={() => setInputType('matrix')}
                                >
                                    Adjacency Matrix
                                </button>
                            </div>

                            <div className="graph-toggles">
                                <label className="toggle-label">
                                    <span>Directed Graph</span>
                                    <input type="checkbox" checked={isDirected} onChange={(e) => setIsDirected(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                                <label className="toggle-label">
                                    <span>Weighted Graph</span>
                                    <input type="checkbox" checked={isWeighted} onChange={(e) => setIsWeighted(e.target.checked)} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            {inputType === 'matrix' && (
                                <div className="node-count-control">
                                    <label>Number of Nodes (Max {MAX_NODES}):</label>
                                    <input
                                        type="number"
                                        min={MIN_NODES}
                                        max={MAX_NODES}
                                        value={nodeCount}
                                        onChange={handleNodeMapChange}
                                    />
                                </div>
                            )}

                            <div className="action-buttons">
                                <button className="btn-secondary" onClick={applyExample}>Load Example</button>
                                <button className="btn-secondary" onClick={() => {
                                    if (inputType === 'matrix') resetMatrix(nodeCount);
                                    else setEdgeList('');
                                }}>Clear All</button>
                            </div>

                            {!isDirected && inputType === 'matrix' && (
                                <p className="helper-text mt-auto text-sm text-cyan-400 opacity-80 flex items-center gap-2">
                                    <FaCheck /> Symmetrical mirror auto-enabled
                                </p>
                            )}
                        </div>

                        {/* Right Panel: Input Area */}
                        <div className="graph-modal-main">
                            {inputType === 'matrix' ? (
                                <div className="matrix-container">
                                    <div className="matrix-grid" style={{ gridTemplateColumns: `40px repeat(${nodeCount}, 1fr)` }}>
                                        {/* Top Header Row */}
                                        <div className="matrix-cell header-empty"></div>
                                        {Array.from({ length: nodeCount }).map((_, i) => (
                                            <div key={`col-${i}`} className="matrix-cell header-col">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                        ))}

                                        {/* Matrix Rows */}
                                        {matrix.map((row, i) => (
                                            <React.Fragment key={`row-${i}`}>
                                                {/* Left Header Col */}
                                                <div className="matrix-cell header-row">
                                                    {String.fromCharCode(65 + i)}
                                                </div>

                                                {/* Data Cells */}
                                                {row.map((val, j) => {
                                                    const isDiagonal = i === j;
                                                    const isSymmetricPair = (!isDirected && !isDiagonal);
                                                    return (
                                                        <input
                                                            key={`cell-${i}-${j}`}
                                                            className={`matrix-input ${isDiagonal ? 'diagonal' : ''} ${isSymmetricPair ? 'symmetric-capable' : ''} ${val !== '0' && val !== '' ? 'has-edge' : ''}`}
                                                            value={val}
                                                            onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                                                            disabled={isDiagonal}
                                                            title={isDiagonal ? "Diagonal elements represent self-loops (disabled for this visualizer)" : `Edge from ${String.fromCharCode(65 + i)} to ${String.fromCharCode(65 + j)}`}
                                                        />
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                    <p className="matrix-hint">
                                        0 = NO EDGE. 1 (or any number) = EDGE{isWeighted ? " WEIGHT" : " EXISTS"}
                                    </p>
                                </div>
                            ) : (
                                <div className="edgelist-container">
                                    <textarea
                                        className="edgelist-textarea"
                                        placeholder={`A-B:4\nA-C:2\nB-D:5\n...`}
                                        value={edgeList}
                                        onChange={(e) => setEdgeList(e.target.value)}
                                        spellCheck="false"
                                    />
                                    <p className="matrix-hint">
                                        Format: Node1-Node2:Weight (e.g. A-B:5). One edge per line.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="graph-modal-footer">
                        <button className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button className="btn-generate" onClick={handleGenerate}>
                            Generate Graph <FaCheck />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GraphInputModal;
