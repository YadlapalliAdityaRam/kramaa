import React from 'react';
import { motion } from 'framer-motion';
import './TreeCanvas.css';

const NODE_RADIUS = 22;
const FALLBACK_NODE_RADIUS = 22;
const LEVEL_HEIGHT = 70;
const MIN_H_SPACING = 55;

const toFiniteNumber = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const stateColors = {
    default: '#4a5568',
    current: '#8b5cf6',
    visiting: '#06b6d4',
    visited: '#10b981',
    comparing: '#f59e0b',
    'red-node': '#ef4444',
    'black-node': '#1f2937',
    inserted: '#3b82f6',
    rotated: '#ec4899'
};

// Calculate tree layout positions
const calculatePositions = (root, width) => {
    if (!root) return {};
    const positions = {};

    const assignPositions = (node, level, leftBound, rightBound) => {
        if (!node) return;
        const x = (leftBound + rightBound) / 2;
        const y = 40 + level * LEVEL_HEIGHT;
        positions[node.id] = { x, y };

        const mid = (leftBound + rightBound) / 2;
        if (node.left) assignPositions(node.left, level + 1, leftBound, mid);
        if (node.right) assignPositions(node.right, level + 1, mid, rightBound);
    };

    assignPositions(root, 0, 0, width);
    return positions;
};

const TreeCanvas = ({ treeData, nodeStates = {}, highlightEdges = [] }) => {
    if (!treeData) {
        return <div className="tree-canvas-empty">No tree data</div>;
    }

    const safeNodeRadius = toFiniteNumber(NODE_RADIUS, FALLBACK_NODE_RADIUS);
    const width = 600;
    const treeDepth = getDepth(treeData);
    const height = Math.max(250, 60 + treeDepth * LEVEL_HEIGHT + 40);
    const positions = calculatePositions(treeData, width);

    // Collect all nodes and edges
    const nodesArr = [];
    const edgesArr = [];

    const traverse = (node) => {
        if (!node) return;
        nodesArr.push(node);
        if (node.left) {
            edgesArr.push({ from: node.id, to: node.left.id });
            traverse(node.left);
        }
        if (node.right) {
            edgesArr.push({ from: node.id, to: node.right.id });
            traverse(node.right);
        }
    };
    traverse(treeData);

    const highlightSet = new Set(highlightEdges.map(e => `${e.from}-${e.to}`));

    return (
        <div className="tree-canvas">
            <svg viewBox={`0 0 ${width} ${height}`} className="tree-svg">
                <defs>
                    <filter id="tree-glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Edges */}
                {edgesArr.map((edge, i) => {
                    const from = positions[edge.from];
                    const to = positions[edge.to];
                    if (!from || !to) return null;
                    const isHighlighted = highlightSet.has(`${edge.from}-${edge.to}`);

                    return (
                        <motion.line
                            key={`edge-${i}`}
                            x1={from.x}
                            y1={from.y}
                            x2={to.x}
                            y2={to.y}
                            stroke={isHighlighted ? '#10b981' : '#374151'}
                            strokeWidth={isHighlighted ? 3 : 2}
                            opacity={isHighlighted ? 1 : 0.5}
                            animate={{
                                stroke: isHighlighted ? '#10b981' : '#374151',
                                strokeWidth: isHighlighted ? 3 : 2
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    );
                })}

                {/* Nodes */}
                {nodesArr.map((node) => {
                    const pos = positions[node.id];
                    if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;
                    const state = nodeStates[node.id] || 'default';
                    const color = node.color === 'red' ? stateColors['red-node'] :
                        node.color === 'black' ? stateColors['black-node'] :
                            stateColors[state] || stateColors.default;
                    const isActive = state !== 'default';

                    return (
                        <g key={`node-${node.id}`}>
                            {isActive && (
                                <motion.circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={safeNodeRadius + 5}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.2, 0.5, 0.2], r: [safeNodeRadius + 3, safeNodeRadius + 7, safeNodeRadius + 3] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                />
                            )}
                            <motion.circle
                                cx={pos.x}
                                cy={pos.y}
                                r={safeNodeRadius}
                                fill={color}
                                stroke={isActive ? color : '#4b5563'}
                                strokeWidth="2"
                                filter={isActive ? 'url(#tree-glow)' : 'none'}
                                animate={{ fill: color }}
                                transition={{ duration: 0.3 }}
                            />
                            <text
                                x={pos.x}
                                y={pos.y + 5}
                                textAnchor="middle"
                                fill="white"
                                fontSize="13"
                                fontWeight="700"
                            >
                                {node.value !== undefined ? node.value : node.id}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

function getDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
}

export default TreeCanvas;
