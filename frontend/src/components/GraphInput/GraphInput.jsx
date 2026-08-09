import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaList, FaTh, FaMagic, FaTrashAlt, FaCheck, FaInfoCircle } from 'react-icons/fa';
import './GraphInput.css';

const GraphInput = ({ nodes = [], edges = [], onGraphUpdate, requiresWeights = true, requiresDirected = false }) => {
    const [inputType, setInputType] = useState('edgeList');

    // ===== Edge List (Textarea) State =====
    const initialText = (edges || []).map(e => `${e.from} ${e.to}${requiresWeights ? ` ${e.weight}` : ''}`).join('\n');
    const [edgeListText, setEdgeListText] = useState(initialText);

    const MAX_NODES = 6;

    // ===== Adjacency Matrix State =====
    const initNodeCount = Math.max(2, Math.min(MAX_NODES, (nodes || []).length || 5));
    const initMatrixNodes = Array.from({ length: MAX_NODES }, (_, i) => nodes[i]?.id || String.fromCharCode(65 + i));

    const buildInitialMatrix = () => {
        const matrix = Array.from({ length: MAX_NODES }, () => Array(MAX_NODES).fill(0));
        (edges || []).forEach(e => {
            const fromIdx = initMatrixNodes.findIndex(id => id === e.from);
            const toIdx = initMatrixNodes.findIndex(id => id === e.to);
            if (fromIdx >= 0 && fromIdx < MAX_NODES && toIdx >= 0 && toIdx < MAX_NODES) {
                matrix[fromIdx][toIdx] = e.weight ?? 1;
                if (!requiresDirected) {
                    matrix[toIdx][fromIdx] = e.weight ?? 1;
                }
            }
        });
        return matrix;
    };

    const [nodeCount, setNodeCount] = useState(initNodeCount);
    const [matrixNodes, setMatrixNodes] = useState(initMatrixNodes);
    const [matrixData, setMatrixData] = useState(buildInitialMatrix());

    // Helper: generate circle layout positions for N nodes
    const generateCircleLayout = (nodeIds) => {
        const count = nodeIds.length;
        const cx = 300, cy = 200;
        const radius = Math.min(220, Math.max(90, count * 32));
        return nodeIds.map((id, i) => {
            const angle = (2 * Math.PI * i) / Math.max(1, count) - Math.PI / 2;
            return {
                id,
                x: Math.round(cx + radius * Math.cos(angle)),
                y: Math.round(cy + radius * Math.sin(angle))
            };
        });
    };

    // Unified dispatch handler supporting both callback signatures
    const dispatchGraphUpdate = (newNodes, newEdges) => {
        if (typeof onGraphUpdate === 'function') {
            // First call with object payload
            onGraphUpdate({ nodes: newNodes, edges: newEdges, directed: requiresDirected });
            // Second call with array params for positional listeners
            onGraphUpdate(newNodes, newEdges);
        }
    };

    // ===== Edge List Parsing Logic =====
    const handleUpdateFromText = () => {
        const lines = edgeListText.split('\n').filter(line => line.trim() !== '');
        const parsedEdges = [];
        const nodeSet = new Set();

        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 2) continue;

            const from = parts[0].toUpperCase();
            const to = parts[1].toUpperCase();
            const weight = requiresWeights ? (parseInt(parts[2], 10) || 1) : 1;

            nodeSet.add(from);
            nodeSet.add(to);

            parsedEdges.push({ from, to, weight });
        }

        if (parsedEdges.length === 0 && lines.length > 0) {
            toast.error("Invalid input format. Use 'NodeA NodeB [Weight]'");
            return;
        }

        if (nodeSet.size > 6) {
            toast.error("Maximum 6 nodes allowed in graph input!");
            return;
        }

        const finalEdges = [];
        const edgeMap = new Map();

        for (const e of parsedEdges) {
            if (requiresDirected) {
                finalEdges.push({
                    id: `e-${e.from}-${e.to}-${Date.now()}-${Math.random()}`,
                    from: e.from,
                    to: e.to,
                    weight: e.weight
                });
            } else {
                const key = [e.from, e.to].sort().join('-');
                if (edgeMap.has(key)) {
                    const existingWeight = edgeMap.get(key);
                    if (existingWeight !== e.weight) {
                        toast.error(`Conflicting weights for edge ${e.from}↔${e.to}. Using ${existingWeight}.`);
                    }
                } else {
                    edgeMap.set(key, e.weight);
                    finalEdges.push({
                        id: `e-${e.from}-${e.to}-${Date.now()}-${Math.random()}`,
                        from: e.from,
                        to: e.to,
                        weight: e.weight
                    });
                }
            }
        }

        const newNodes = generateCircleLayout(Array.from(nodeSet));

        dispatchGraphUpdate(newNodes, finalEdges);
        toast.success(`Updated graph: ${newNodes.length} nodes, ${finalEdges.length} edges`);
    };

    const loadExampleEdgeList = (type = 'default') => {
        let example = "";
        switch (type) {
            case 'weighted':
                example = "A B 5\nA C 3\nB D 2\nC D 4\nD E 6";
                break;
            case 'unweighted':
                example = "A B\nA C\nB D\nC D\nD E";
                break;
            case 'dag':
                example = "1 2\n1 3\n2 4\n3 4\n4 5";
                break;
            case 'cycle':
                example = "A B\nB C\nC D\nD A";
                break;
            default:
                example = requiresWeights
                    ? "A B 5\nA C 3\nB D 2\nC D 4\nD E 6"
                    : "A B\nA C\nB D\nC D\nD E";
        }
        setEdgeListText(example);
        toast.success(`${type.toUpperCase()} example loaded`);
    };

    // ===== Matrix Resize Logic =====
    const handleResizeMatrix = (newCount) => {
        const count = Math.min(Math.max(parseInt(newCount, 10) || 2, 2), 6);
        setNodeCount(count);

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const newMatrixNodes = Array.from({ length: count }, (_, i) => {
            return matrixNodes[i] || alphabet[i] || `N${i}`;
        });
        setMatrixNodes(newMatrixNodes);

        const newMatrixData = Array.from({ length: count }, (_, i) => {
            return Array.from({ length: count }, (_, j) => {
                return (matrixData[i] && matrixData[i][j]) || 0;
            });
        });
        setMatrixData(newMatrixData);
    };

    const handleMatrixChange = (i, j, value) => {
        const val = parseInt(value, 10) || 0;
        const clampedVal = val < 0 ? 0 : val;
        const newData = matrixData.map(row => [...row]);
        newData[i][j] = clampedVal;
        if (!requiresDirected) {
            newData[j][i] = clampedVal;
        }
        setMatrixData(newData);
    };

    const handleNodeLabelChange = (index, value) => {
        const newNodes = [...matrixNodes];
        newNodes[index] = value.toUpperCase().slice(0, 2);
        setMatrixNodes(newNodes);
    };

    const handleApplyMatrix = () => {
        const rawNodeNames = matrixNodes.slice(0, nodeCount);
        // Ensure unique node names
        const seenNames = new Set();
        const nodeNames = rawNodeNames.map((name, i) => {
            let uniqueName = name || String.fromCharCode(65 + i);
            let suffix = 1;
            while (seenNames.has(uniqueName)) {
                uniqueName = `${name}${suffix++}`;
            }
            seenNames.add(uniqueName);
            return uniqueName;
        });

        const newNodes = generateCircleLayout(nodeNames);
        const newEdges = [];

        for (let i = 0; i < nodeCount; i++) {
            for (let j = 0; j < nodeCount; j++) {
                if (i === j) continue;
                const weight = matrixData[i][j];
                if (weight > 0) {
                    const from = nodeNames[i];
                    const to = nodeNames[j];
                    const exists = newEdges.find(e => {
                        if (e.from === from && e.to === to) return true;
                        if (!requiresDirected && e.from === to && e.to === from) return true;
                        return false;
                    });
                    if (!exists) {
                        newEdges.push({
                            id: `e-${from}-${to}-${Date.now()}-${i}-${j}`,
                            from,
                            to,
                            weight: requiresWeights ? weight : 1
                        });
                    }
                }
            }
        }

        dispatchGraphUpdate(newNodes, newEdges);
        toast.success(`Matrix applied! Created ${newNodes.length} nodes & ${newEdges.length} edges.`);
    };

    return (
        <div className="graph-input-section">
            <div className="input-tabs">
                <button
                    className={`tab-btn ${inputType === 'edgeList' ? 'active' : ''}`}
                    onClick={() => setInputType('edgeList')}
                >
                    <FaList /> Edge List
                </button>
                <button
                    className={`tab-btn ${inputType === 'matrix' ? 'active' : ''}`}
                    onClick={() => setInputType('matrix')}
                >
                    <FaTh /> Adjacency Matrix
                </button>
            </div>

            {inputType === 'edgeList' ? (
                <div className="edge-textarea-area">
                    <div className="input-header">
                        <span className="stat-label">Bulk Input (Format: <code>NodeA NodeB [Weight]</code>)</span>
                        <div className="btn-group">
                            <button className="btn-action mini" onClick={() => loadExampleEdgeList('weighted')}>
                                <FaMagic /> Weighted
                            </button>
                            <button className="btn-action mini" onClick={() => loadExampleEdgeList('unweighted')}>
                                Unweighted
                            </button>
                            <button className="btn-action mini" onClick={() => loadExampleEdgeList('dag')}>
                                DAG
                            </button>
                            <button className="btn-action mini danger" onClick={() => setEdgeListText('')}>
                                <FaTrashAlt /> Clear
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="edge-textarea"
                        placeholder={requiresWeights ? "A B 5\nA C 3\nB D 2..." : "A B\nA C\nB D..."}
                        value={edgeListText}
                        onChange={(e) => setEdgeListText(e.target.value)}
                    />
                    <button className="btn-add full-width" onClick={handleUpdateFromText}>
                        <FaCheck /> Apply Edge List
                    </button>

                    <div className="edge-list-preview">
                        <span className="stat-label">Current Graph Edges ({(edges || []).length})</span>
                        <div className="edge-pills-container">
                            {(edges || []).map((e, idx) => (
                                <div key={e.id || `${e.from}-${e.to}-${idx}`} className="edge-pill">
                                    {e.from} {requiresDirected ? '→' : '↔'} {e.to} {requiresWeights && `[${e.weight}]`}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="matrix-input-area">
                    <div className="matrix-controls">
                        <div className="node-count-selector">
                            <span className="stat-label">Number of Nodes (Max 6):</span>
                            <input
                                type="number"
                                min="2"
                                max="6"
                                value={nodeCount}
                                onChange={(e) => handleResizeMatrix(e.target.value)}
                                className="node-count-input"
                            />
                        </div>
                        <button className="btn-add" onClick={handleApplyMatrix}>
                            <FaCheck /> Construct Graph From Matrix
                        </button>
                    </div>

                    <div className="matrix-grid-container">
                        <table className="adj-matrix">
                            <thead>
                                <tr>
                                    <th className="row-header">Nodes</th>
                                    {matrixNodes.slice(0, nodeCount).map((node, j) => (
                                        <th key={`col-${j}`}>
                                            <input
                                                type="text"
                                                value={node}
                                                maxLength={2}
                                                onChange={(e) => handleNodeLabelChange(j, e.target.value)}
                                                title="Edit node label"
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {matrixData.slice(0, nodeCount).map((row, i) => (
                                    <tr key={`row-${i}`}>
                                        <th className="row-header">{matrixNodes[i]}</th>
                                        {row.slice(0, nodeCount).map((val, j) => (
                                            <td key={`cell-${i}-${j}`} className={i === j ? 'diagonal' : val > 0 ? 'active-cell' : ''}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={val === 0 ? '' : val}
                                                    placeholder="0"
                                                    onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                                                    disabled={i === j}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <span className="matrix-help">
                        <FaInfoCircle /> Set node count (2 to 6). Enter weight &gt; 0 to create an edge. Self-loops (diagonal) are disabled.
                    </span>
                </div>
            )}
        </div>
    );
};

export default GraphInput;
