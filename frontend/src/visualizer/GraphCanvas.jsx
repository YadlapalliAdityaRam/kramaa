import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './GraphCanvas.css';

const NODE_RADIUS = 24;
const FALLBACK_NODE_RADIUS = 24;

const toFiniteNumber = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const stateColors = {
    default: '#334155',
    visiting: '#06b6d4',
    visited: '#10b981',
    'in-queue': '#f59e0b',
    'in-stack': '#f59e0b',
    current: '#8b5cf6',
    'shortest-path': '#fbbf24',
    'mst-node': '#10b981',
    start: '#3b82f6',
    source: '#3b82f6',
    'negative-cycle-node': '#ef4444'
};

const edgeStateColors = {
    default: '#94a3b8',
    considering: '#64748b',
    selected: '#10b981',
    relaxed: '#10b981',
    'mst-edge': '#10b981',
    'shortest-edge': '#fbbf24',
    rejected: '#ef4444',
    'negative-cycle': '#ef4444'
};

const GraphCanvas = ({
    nodes,
    edges,
    nodeStates = {},
    edgeStates = {},
    virtualEdges = [],
    distanceTable = null,
    onGraphUpdate = null,   // If provided, enables interactive builder
    allowNegativeWeights = false,
    isDirected = true
}) => {
    const svgRef = useRef(null);
    const [selectedSourceNode, setSelectedSourceNode] = useState(null);
    const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });

    const normalizedNodes = Array.isArray(nodes)
        ? nodes.filter((node) => node && node.id !== undefined && node.id !== null)
        : [];
    const normalizedEdges = Array.isArray(edges) ? edges : [];
    const safeNodeRadius = toFiniteNumber(NODE_RADIUS, FALLBACK_NODE_RADIUS);

    // Auto-resize observer
    useEffect(() => {
        if (!svgRef.current) return;
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if (width > 0 && height > 0) {
                    setContainerSize({ width, height });
                }
            }
        });
        observer.observe(svgRef.current.parentElement);
        return () => observer.disconnect();
    }, []);

    const isInteractive = typeof onGraphUpdate === 'function';

    const getNextNodeId = () => {
        const usedIds = new Set(normalizedNodes.map(n => n.id));
        for (let i = 65; i <= 90; i++) {
            const letter = String.fromCharCode(i);
            if (!usedIds.has(letter)) return letter;
        }
        for (let i = 1; i < 100; i++) {
            const id = `N${i}`;
            if (!usedIds.has(id)) return id;
        }
        return `N${Date.now()}`;
    };

    const handleSvgClick = (e) => {
        if (!isInteractive) return;
        // If clicking on SVG directly (not a node), add a new node
        if (e.target.tagName === 'svg' || e.target.classList.contains('graph-canvas')) {
            if (selectedSourceNode) {
                setSelectedSourceNode(null); // Cancel edge creation
                return;
            }

            const rect = svgRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const newNode = {
                id: getNextNodeId(),
                x,
                y
            };

            onGraphUpdate({
                nodes: [...normalizedNodes, newNode],
                edges: normalizedEdges,
                directed: isDirected
            });
        }
    };

    const handleNodeClick = (e, nodeId) => {
        if (!isInteractive) return;
        e.stopPropagation();

        if (selectedSourceNode === null) {
            // Start edge creation
            setSelectedSourceNode(nodeId);
        } else {
            // Finish edge creation
            if (selectedSourceNode !== nodeId) {
                // Check if edge already exists
                const edgeExists = normalizedEdges.some(
                    e => e.from === selectedSourceNode && e.to === nodeId
                );

                if (!edgeExists) {
                    let weightStr = prompt(`Enter weight for edge ${selectedSourceNode} → ${nodeId}:`, "1");
                    if (weightStr !== null) {
                        let weight = parseInt(weightStr, 10);
                        if (isNaN(weight)) weight = 1;
                        if (!allowNegativeWeights && weight < 0) weight = Math.abs(weight);

                        const newEdge = {
                            id: `e-${Date.now()}`,
                            from: selectedSourceNode,
                            to: nodeId,
                            weight,
                            directed: isDirected
                        };

                        onGraphUpdate({
                            nodes: normalizedNodes,
                            edges: [...normalizedEdges, newEdge],
                            directed: isDirected
                        });
                    }
                }
            }
            setSelectedSourceNode(null); // Auto-deselect after completion or click-self
        }
    };

    const handleNodeContextMenu = (e, nodeId) => {
        if (!isInteractive) return;
        e.preventDefault();
        // Delete node and its edges
        const newNodes = normalizedNodes.filter(n => n.id !== nodeId);
        const newEdges = normalizedEdges.filter(e => e.from !== nodeId && e.to !== nodeId);

        onGraphUpdate({
            nodes: newNodes,
            edges: newEdges,
            directed: isDirected
        });
        if (selectedSourceNode === nodeId) setSelectedSourceNode(null);
    };

    const handleEdgeContextMenu = (e, edgeId) => {
        if (!isInteractive) return;
        e.preventDefault();
        e.stopPropagation();
        // Delete edge
        const newEdges = normalizedEdges.filter(edge => edge.id !== edgeId);
        onGraphUpdate({
            nodes: normalizedNodes,
            edges: newEdges,
            directed: isDirected
        });
    };

    // Use absolute positioning if coordinates exist, otherwise fallback to circle layout
    const nodePositions = {};
    const useCircleLayout = normalizedNodes.some(n => typeof n.x !== 'number' || typeof n.y !== 'number');

    if (useCircleLayout && normalizedNodes.length > 0) {
        const cx = containerSize.width / 2;
        const cy = containerSize.height / 2;
        const radius = Math.min(containerSize.width, containerSize.height) * 0.35;

        normalizedNodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / normalizedNodes.length - Math.PI / 2;
            nodePositions[node.id] = {
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            };
        });
    } else if (normalizedNodes.length > 0) {
        // Auto-fit: compute bounding box of all node coords, then scale to fit container
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        normalizedNodes.forEach(node => {
            const nx = node.x ?? 0;
            const ny = node.y ?? 0;
            minX = Math.min(minX, nx);
            maxX = Math.max(maxX, nx);
            minY = Math.min(minY, ny);
            maxY = Math.max(maxY, ny);
        });

        const padding = safeNodeRadius + 15;
        const rangeX = maxX - minX || 1;
        const rangeY = maxY - minY || 1;
        const availW = containerSize.width - padding * 2;
        const availH = containerSize.height - padding * 2;
        const scaleX = availW / rangeX;
        const scaleY = availH / rangeY;
        const scale = Math.min(scaleX, scaleY, 1.5); // cap to prevent over-zooming single/few nodes

        const scaledW = rangeX * scale;
        const scaledH = rangeY * scale;
        const offsetX = padding + (availW - scaledW) / 2;
        const offsetY = padding + (availH - scaledH) / 2;

        normalizedNodes.forEach(node => {
            nodePositions[node.id] = {
                x: offsetX + ((node.x ?? 0) - minX) * scale,
                y: offsetY + ((node.y ?? 0) - minY) * scale
            };
        });
    }

    if (normalizedNodes.length === 0 && !isInteractive) {
        return <div className="graph-canvas-empty">No graph data</div>;
    }

    return (
        <div
            className={`graph-canvas ${isInteractive ? 'graph-canvas-interactive' : ''}`}
            onClick={handleSvgClick}
        >
            {normalizedNodes.length === 0 && isInteractive && (
                <div className="graph-canvas-overlay-text">
                    Click anywhere to add a node
                </div>
            )}

            {isInteractive && selectedSourceNode && (
                <div className="graph-canvas-toast">
                    Select target node for edge (or click background to cancel)
                </div>
            )}

            <svg
                ref={svgRef}
                viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                className="graph-svg"
            >
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                    <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                    </marker>
                    <marker id="arrowhead-path" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
                    </marker>
                    <marker id="arrowhead-considering" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
                    </marker>
                </defs>

                {/* Physical Edges */}
                {normalizedEdges.map((edge, i) => {
                    const from = nodePositions[edge.from];
                    const to = nodePositions[edge.to];
                    if (!from || !to) return null;

                    const edgeKey = `${edge.from}-${edge.to}`;
                    const state = edgeStates[edgeKey] || 'default';
                    let color = edgeStateColors[state] || edgeStateColors.default;
                    const isActive = state !== 'default';

                    // Highlight exact matched edge overrides
                    if (edgeStates[edge.id]) {
                        color = edgeStateColors[edgeStates[edge.id]] || color;
                    }

                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const safeDist = dist > 0 ? dist : 1;
                    const offsetX = (dx / safeDist) * safeNodeRadius;
                    const offsetY = (dy / safeDist) * safeNodeRadius;

                    const midX = (from.x + to.x) / 2;
                    const midY = (from.y + to.y) / 2;
                    const weightText = String(edge.weight);
                    const labelWidth = Math.max(22, (weightText.length * 8) + 10);

                    return (
                        <g
                            key={`edge-${edge.id || i}`}
                            onContextMenu={(e) => handleEdgeContextMenu(e, edge.id)}
                            style={{ cursor: isInteractive ? 'pointer' : 'default' }}
                        >
                            <motion.line
                                x1={from.x + offsetX}
                                y1={from.y + offsetY}
                                x2={to.x - offsetX}
                                y2={to.y - offsetY}
                                stroke={color}
                                strokeWidth={isActive ? 3.4 : 2.2}
                                opacity={isActive ? 1 : 0.78}
                                markerEnd={isDirected ? (isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)') : undefined}
                                animate={{ stroke: color, strokeWidth: isActive ? 3.4 : 2.2 }}
                                transition={{ duration: 0.3 }}
                            />
                            {/* Hitbox for easier right-clicking an edge */}
                            {isInteractive && (
                                <line
                                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                    stroke="transparent" strokeWidth="15"
                                />
                            )}

                            {edge.weight !== undefined && (
                                <>
                                    <rect
                                        x={midX - (labelWidth / 2)}
                                        y={midY - 21}
                                        width={labelWidth}
                                        height="18"
                                        rx="9"
                                        className={`edge-weight-bg ${isActive ? 'edge-weight-bg-active' : ''}`}
                                    />
                                    <text
                                        x={midX}
                                        y={midY - 8}
                                        textAnchor="middle"
                                        fontSize="13"
                                        fontWeight="800"
                                        className={`edge-weight ${isActive ? 'edge-weight-active' : 'edge-weight-default'}`}
                                    >
                                        {edge.weight}
                                    </text>
                                </>
                            )}
                        </g>
                    );
                })}

                {/* Virtual Edges (Evaluation Paths) - Only render if nodes exist to avoid linger artifacts */}
                {normalizedNodes.length > 0 && virtualEdges.map((vedge, i) => {
                    const from = nodePositions[vedge.from];
                    const to = nodePositions[vedge.to];
                    if (!from || !to) return null;

                    const color = vedge.state === 'considering' ? '#f59e0b' : '#38bdf8';
                    const isConsidering = vedge.state === 'considering';

                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const safeDist = dist > 0 ? dist : 1;
                    const offsetX = (dx / safeDist) * safeNodeRadius;
                    const offsetY = (dy / safeDist) * safeNodeRadius;

                    const midX = (from.x + to.x) / 2;
                    const midY = (from.y + to.y) / 2;

                    // Normal vector to create a curve offset
                    const nx = -dy / safeDist;
                    const ny = dx / safeDist;

                    // Bend factor (curved out by 35px if intermediate, -45px if direct considering line)
                    const bend = isConsidering ? -45 : 35;
                    const cpX = midX + nx * bend;
                    const cpY = midY + ny * bend;

                    const labelWidth = Math.max(22, (vedge.label.length * 8) + 10);

                    return (
                        <g key={`v-edge-${vedge.id || i}`}>
                            <motion.path
                                d={`M ${from.x + offsetX} ${from.y + offsetY} Q ${cpX} ${cpY} ${to.x - offsetX} ${to.y - offsetY}`}
                                fill="none"
                                stroke={color}
                                strokeWidth="2.5"
                                strokeDasharray="6,4"
                                opacity="1"
                                markerEnd={isDirected ? `url(#arrowhead-${isConsidering ? 'considering' : 'path'})` : undefined}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3 }}
                            />
                            <rect
                                x={cpX - (labelWidth / 2)}
                                y={cpY - 14}
                                width={labelWidth}
                                height="28"
                                rx="14"
                                fill={color}
                                opacity="0.95"
                            />
                            <text
                                x={cpX}
                                y={cpY + 5}
                                textAnchor="middle"
                                fontSize="14"
                                fontWeight="800"
                                fill="#ffffff"
                            >
                                {vedge.label}
                            </text>
                        </g>
                    );
                })}

                {/* Nodes */}
                {normalizedNodes.map((node) => {
                    const pos = nodePositions[node.id];
                    if (!pos) return null;
                    const state = nodeStates[node.id] || 'default';
                    const color = stateColors[state] || stateColors.default;
                    const isActive = state !== 'default';

                    const isSelectedSource = selectedSourceNode === node.id;

                    return (
                        <g
                            key={`node-${node.id}`}
                            onClick={(e) => handleNodeClick(e, node.id)}
                            onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                            style={{ cursor: isInteractive ? 'pointer' : 'default' }}
                        >
                            {/* Focus/Select Ring */}
                            {isSelectedSource && (
                                <motion.circle
                                    cx={pos.x} cy={pos.y} r={safeNodeRadius + 6}
                                    fill="none" stroke="#22c55e" strokeWidth="3"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                />
                            )}

                            {/* Active Animation Ring */}
                            {isActive && !isSelectedSource && (
                                <motion.circle
                                    cx={pos.x} cy={pos.y} r={safeNodeRadius + 4}
                                    fill="none" stroke={color} strokeWidth="2" opacity={0.42}
                                />
                            )}
                            <motion.circle
                                cx={pos.x} cy={pos.y} r={safeNodeRadius}
                                fill={color}
                                stroke={isActive || isSelectedSource ? '#f8fafc' : '#cbd5e1'}
                                strokeWidth={isActive || isSelectedSource ? '2.6' : '2.2'}
                                animate={{ fill: color }}
                                transition={{ duration: 0.3 }}
                            />
                            <text
                                x={pos.x} y={pos.y + 5}
                                textAnchor="middle" fill="#f8fafc"
                                fontSize="15" fontWeight="800"
                            >
                                {node.label || node.id}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Distance Table Overlay */}
            {distanceTable && (
                <div className="distance-table">
                    <div className="dt-header">Distances</div>
                    <div className="dt-grid">
                        {Object.entries(distanceTable).map(([node, dist]) => (
                            <div key={node} className={`dt-cell ${dist === Infinity ? '' : 'dt-cell-active'}`}>
                                <span className="dt-node">{node}</span>
                                <span className="dt-dist">{dist === Infinity ? '∞' : dist}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GraphCanvas;
