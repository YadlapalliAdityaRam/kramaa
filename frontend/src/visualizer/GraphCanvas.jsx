import React from 'react';
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
    start: '#3b82f6'
};

const edgeStateColors = {
    default: '#94a3b8',
    considering: '#f59e0b',
    selected: '#10b981',
    relaxed: '#06b6d4',
    'mst-edge': '#10b981',
    'shortest-edge': '#fbbf24'
};

const GraphCanvas = ({ nodes, edges, nodeStates = {}, edgeStates = {}, distanceTable = null }) => {
    const normalizedNodes = Array.isArray(nodes)
        ? nodes.filter((node) => node && node.id !== undefined && node.id !== null)
        : [];
    const normalizedEdges = Array.isArray(edges) ? edges : [];
    const safeNodeRadius = toFiniteNumber(NODE_RADIUS, FALLBACK_NODE_RADIUS);

    if (normalizedNodes.length === 0) {
        return <div className="graph-canvas-empty">No graph data</div>;
    }

    // Position nodes in a circle layout
    const width = 600;
    const height = 400;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.35;

    const nodePositions = {};
    normalizedNodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / normalizedNodes.length - Math.PI / 2;
        nodePositions[node.id] = {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    });

    return (
        <div className="graph-canvas">
            <svg viewBox={`0 0 ${width} ${height}`} className="graph-svg">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7"
                        refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                    <marker id="arrowhead-active" markerWidth="10" markerHeight="7"
                        refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                    </marker>
                </defs>

                {/* Edges */}
                {normalizedEdges.map((edge, i) => {
                    const from = nodePositions[edge.from];
                    const to = nodePositions[edge.to];
                    if (!from || !to) return null;
                    if (!Number.isFinite(from.x) || !Number.isFinite(from.y) || !Number.isFinite(to.x) || !Number.isFinite(to.y)) {
                        return null;
                    }

                    const edgeKey = `${edge.from}-${edge.to}`;
                    const state = edgeStates[edgeKey] || 'default';
                    const color = edgeStateColors[state] || edgeStateColors.default;
                    const isActive = state !== 'default';

                    // Shorten line to not overlap with node circles
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
                        <g key={`edge-${i}`}>
                            <motion.line
                                x1={from.x + offsetX}
                                y1={from.y + offsetY}
                                x2={to.x - offsetX}
                                y2={to.y - offsetY}
                                stroke={color}
                                strokeWidth={isActive ? 3.4 : 2.2}
                                opacity={isActive ? 1 : 0.78}
                                markerEnd={edge.directed ? (isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)') : undefined}
                                animate={{ stroke: color, strokeWidth: isActive ? 3.4 : 2.2 }}
                                transition={{ duration: 0.3 }}
                            />
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

                {/* Nodes */}
                {normalizedNodes.map((node) => {
                    const pos = nodePositions[node.id];
                    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;
                    const state = nodeStates[node.id] || 'default';
                    const color = stateColors[state] || stateColors.default;
                    const isActive = state !== 'default';

                    return (
                        <g key={`node-${node.id}`}>
                            {isActive && (
                                <motion.circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={safeNodeRadius + 4}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="2"
                                    opacity={0.42}
                                />
                            )}
                            <motion.circle
                                cx={pos.x}
                                cy={pos.y}
                                r={safeNodeRadius}
                                fill={color}
                                stroke={isActive ? '#f8fafc' : '#cbd5e1'}
                                strokeWidth={isActive ? '2.6' : '2.2'}
                                animate={{ fill: color }}
                                transition={{ duration: 0.3 }}
                            />
                            <text
                                x={pos.x}
                                y={pos.y + 5}
                                textAnchor="middle"
                                fill="#f8fafc"
                                fontSize="15"
                                fontWeight="800"
                            >
                                {node.label || node.id}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Distance Table */}
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
