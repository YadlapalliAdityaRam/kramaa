import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import InputArrayDisplay from '../components/InputArrayDisplay';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateAVLTreeSteps } from '../algorithms/trees/avlTreeGenerator';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './AVLTreeVisualizer.css';

const DEFAULT_ELEMENTS = [10, 20, 30, 40, 50, 25];
const MAX_ELEMENTS = 25;
const EDGE_STATE_PRIORITY = ['rotating', 'unbalanced', 'inserted', 'balanced', 'updating', 'visiting'];
const EDGE_STATE_STYLES = {
    default: { stroke: 'rgba(148, 163, 184, 0.35)', width: 2, opacity: 0.45, dash: '0' },
    visiting: { stroke: '#22d3ee', width: 3, opacity: 0.95, dash: '6 5' },
    updating: { stroke: '#a78bfa', width: 3, opacity: 0.95, dash: '4 4' },
    balanced: { stroke: '#4ade80', width: 3, opacity: 0.95, dash: '0' },
    inserted: { stroke: '#facc15', width: 3, opacity: 0.95, dash: '0' },
    unbalanced: { stroke: '#f87171', width: 3.5, opacity: 1, dash: '10 5' },
    rotating: { stroke: '#60a5fa', width: 4, opacity: 1, dash: '12 6' }
};
const NODE_RADIUS = 20;
const LEVEL_SPACING = 78;
const MIN_NODE_WIDTH = 44;
const SIBLING_GAP = 20;
const TREE_TOP_OFFSET = 50;
const VIEWBOX_PADDING = 84;

const parseSequenceInput = (rawValue) => {
    const parsed = rawValue
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isFinite(value));

    return parsed;
};

const computeBalanceFromNode = (node) => {
    const leftHeight = node?.left?.height ?? 0;
    const rightHeight = node?.right?.height ?? 0;
    return leftHeight - rightHeight;
};

const collectNodeMetrics = (node, balances, nodeStates, rows = []) => {
    if (!node) return rows;
    collectNodeMetrics(node.left, balances, nodeStates, rows);
    rows.push({
        id: node.id,
        value: node.val,
        height: node.height ?? 1,
        balance: balances[node.id] ?? computeBalanceFromNode(node),
        status: nodeStates[node.id] || 'default'
    });
    collectNodeMetrics(node.right, balances, nodeStates, rows);
    return rows;
};

const formatStatus = (status) => {
    switch (status) {
        case 'inserted': return 'Inserted';
        case 'unbalanced': return 'Unbalanced';
        case 'rotating': return 'Rotating';
        case 'balanced': return 'Balanced';
        case 'updating': return 'Updating';
        case 'visiting': return 'Exploring';
        default: return 'Stable';
    }
};

const getEdgeState = (fromState, toState, isExplicitlyHighlighted) => {
    for (const state of EDGE_STATE_PRIORITY) {
        if (fromState === state || toState === state) {
            return state;
        }
    }
    return isExplicitlyHighlighted ? 'visiting' : 'default';
};

const getConnectorPoints = (fromX, fromY, toX, toY) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const offsetX = (dx / distance) * NODE_RADIUS;
    const offsetY = (dy / distance) * NODE_RADIUS;

    return {
        x1: fromX + offsetX,
        y1: fromY + offsetY,
        x2: toX - offsetX,
        y2: toY - offsetY
    };
};

const AVLTreeVisualizer = () => {
    const [elements, setElements] = useState(DEFAULT_ELEMENTS);
    const [activeLanguage, setActiveLanguage] = useState("javascript");
    const [sequenceInput, setSequenceInput] = useState(DEFAULT_ELEMENTS.join(', '));
    const [insertValue, setInsertValue] = useState('');

    // Generate steps once elements array changes
    const steps = useMemo(() => generateAVLTreeSteps(elements), [elements]);

    const {
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        speed,
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    useEffect(() => {
        setSequenceInput(elements.join(', '));
    }, [elements]);

    const currentStep = steps[currentStepIndex] || steps[0] || null;
    const treeData = currentStep?.treeData || null;
    const nodeStates = currentStep?.nodeStates || {};
    const balances = currentStep?.balances || {};
    const highlightEdgeSet = useMemo(
        () => new Set((currentStep?.highlightEdges || []).map((edge) => `${edge.from}-${edge.to}`)),
        [currentStep?.highlightEdges]
    );
    const nodeMetrics = useMemo(
        () => collectNodeMetrics(treeData, balances, nodeStates, []),
        [treeData, balances, nodeStates]
    );
    const activeInsertValue = currentStep?.activeArrayIndex >= 0
        ? currentStep?.arraySnapshot?.[currentStep.activeArrayIndex]
        : null;
    const treeStats = useMemo(() => ({
        root: treeData?.val ?? '—',
        height: treeData?.height ?? 0,
        nodeCount: nodeMetrics.length,
        rotation: currentStep?.rotationType || 'None'
    }), [treeData, nodeMetrics.length, currentStep?.rotationType]);

    const handleManualInput = (inputVal) => {
        if (!Array.isArray(inputVal) || inputVal.length === 0) return;
        if (inputVal.length > 25) {
            toast.error('Maximum 25 elements allowed for tree visualization.');
            return;
        }
        if (new Set(inputVal).size !== inputVal.length) {
            toast.error('Duplicate values are not allowed in this AVL demo.');
            return;
        }
        setElements(inputVal);
        reset();
        toast.success('AVL Tree input updated!');
    };

    const applySequenceInput = () => {
        const parsed = parseSequenceInput(sequenceInput);
        if (parsed.length === 0) {
            toast.error('Enter at least one number.');
            return;
        }
        if (parsed.length > MAX_ELEMENTS) {
            toast.error(`Maximum ${MAX_ELEMENTS} elements allowed for AVL visualization.`);
            return;
        }
        if (new Set(parsed).size !== parsed.length) {
            toast.error('Duplicate values are not allowed in this AVL demo.');
            return;
        }
        setElements(parsed);
        reset();
        toast.success('Insertion order updated.');
    };

    const handleInsertNode = () => {
        const value = Number.parseInt(insertValue, 10);
        if (!Number.isFinite(value)) {
            toast.error('Enter a valid integer to insert.');
            return;
        }
        if (elements.includes(value)) {
            toast.error('That value already exists in the tree.');
            return;
        }
        if (elements.length >= MAX_ELEMENTS) {
            toast.error(`Maximum ${MAX_ELEMENTS} elements allowed for AVL visualization.`);
            return;
        }
        setElements((prev) => [...prev, value]);
        setInsertValue('');
        reset();
        toast.success(`Queued insert for ${value}.`);
    };

    const handleGenerateRandom = () => {
        const count = Math.floor(Math.random() * 8) + 5;
        const unique = new Set();
        while (unique.size < count) {
            unique.add(Math.floor(Math.random() * 99) + 1);
        }
        const arr = Array.from(unique);
        setElements(arr);
        reset();
    };

    const handlePredefined = (scenario) => {
        let input = [];
        switch (scenario) {
            case 'll': input = [30, 20, 10]; break;
            case 'rr': input = [10, 20, 30]; break;
            case 'lr': input = [30, 10, 20]; break;
            case 'rl': input = [10, 30, 20]; break;
        }
        setElements(input);
        reset();
    };

    const handleResetToDemo = () => {
        setElements(DEFAULT_ELEMENTS);
        setInsertValue('');
        reset();
    };

    // Calculate dynamic node positions
    // Breadth-First traversal approach to calculate X and Y
    const getLayout = (rootNode) => {
        const nodes = [];
        const edges = [];
        if (!rootNode) {
            return {
                nodes,
                edges,
                viewBox: `-${VIEWBOX_PADDING} 0 ${VIEWBOX_PADDING * 2} 220`
            };
        }

        let minX = 0;
        let maxX = 0;
        let maxY = TREE_TOP_OFFSET;

        // Recursive sizing
        const calculateSizes = (n) => {
            if (!n) return 0;
            const lw = calculateSizes(n.left);
            const rw = calculateSizes(n.right);
            const combinedWidth = lw + rw + (n.left && n.right ? SIBLING_GAP : 0);
            n._width = Math.max(MIN_NODE_WIDTH, combinedWidth);
            return n._width;
        };
        calculateSizes(rootNode);

        const positionNodes = (n, x, y) => {
            if (!n) return;
            
            nodes.push({ ...n, x, y });
            minX = Math.min(minX, x - NODE_RADIUS);
            maxX = Math.max(maxX, x + NODE_RADIUS);
            maxY = Math.max(maxY, y + NODE_RADIUS);

            if (n.left) {
                const childOffset = Math.max((n.left._width / 2) + (SIBLING_GAP / 2), MIN_NODE_WIDTH);
                const childX = x - childOffset;
                const childY = y + LEVEL_SPACING;
                edges.push({
                    id: `${n.id}-${n.left.id}`,
                    from: n.id,
                    to: n.left.id,
                    fromX: x,
                    fromY: y,
                    toX: childX,
                    toY: childY
                });
                positionNodes(n.left, childX, childY);
            }

            if (n.right) {
                const childOffset = Math.max((n.right._width / 2) + (SIBLING_GAP / 2), MIN_NODE_WIDTH);
                const childX = x + childOffset;
                const childY = y + LEVEL_SPACING;
                edges.push({
                    id: `${n.id}-${n.right.id}`,
                    from: n.id,
                    to: n.right.id,
                    fromX: x,
                    fromY: y,
                    toX: childX,
                    toY: childY
                });
                positionNodes(n.right, childX, childY);
            }
        };

        // Start from center
        positionNodes(rootNode, 0, TREE_TOP_OFFSET);

        const width = Math.max(maxX - minX + VIEWBOX_PADDING * 2, 620);
        const height = Math.max(maxY + VIEWBOX_PADDING, 320);

        return {
            nodes,
            edges,
            viewBox: `${minX - VIEWBOX_PADDING} 0 ${width} ${height}`
        };
    };

    const {
        nodes: renderNodes,
        edges: renderEdges,
        viewBox: treeViewBox
    } = useMemo(() => getLayout(treeData), [treeData]);

    const codeSnippet = algorithmCodes.avlTree?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="AVL Tree"
            code={codeSnippet}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Select parameters and press Play."}
            codeSnippetCategory="trees"
        >
            <div className="avl-container">
                <div className="avl-top-controls">
                    <div className="avl-input-row">
                        <label htmlFor="avl-sequence-input">Insertion Order</label>
                        <input
                            id="avl-sequence-input"
                            type="text"
                            value={sequenceInput}
                            onChange={(event) => setSequenceInput(event.target.value)}
                            placeholder="e.g. 30, 20, 10, 25, 40"
                        />
                        <button onClick={applySequenceInput}>Apply Sequence</button>
                        <button onClick={handleResetToDemo}>Reset Demo</button>
                    </div>
                    <div className="avl-input-row">
                        <label htmlFor="avl-insert-value">Insert Node</label>
                        <input
                            id="avl-insert-value"
                            type="number"
                            value={insertValue}
                            onChange={(event) => setInsertValue(event.target.value)}
                            placeholder="Value"
                            style={{ minWidth: '120px', maxWidth: '140px' }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') handleInsertNode();
                            }}
                        />
                        <button onClick={handleInsertNode}>Add Node</button>
                        <button onClick={handleGenerateRandom}>Random Values</button>
                    </div>
                    <div className="avl-scenario-row">
                        <span>Test Rotations:</span>
                        <button onClick={() => handlePredefined('ll')}>LL (30 20 10)</button>
                        <button onClick={() => handlePredefined('rr')}>RR (10 20 30)</button>
                        <button onClick={() => handlePredefined('lr')}>LR (30 10 20)</button>
                        <button onClick={() => handlePredefined('rl')}>RL (10 30 20)</button>
                    </div>
                </div>

                {/* Array Display */}
                {currentStep?.arraySnapshot && (
                    <InputArrayDisplay
                        array={currentStep.arraySnapshot}
                        activeIndex={currentStep.activeArrayIndex}
                        label="Input Array"
                    />
                )}

                <div className="avl-main-area">
                    {/* Rotation Type Badge */}
                    <AnimatePresence>
                        {currentStep?.rotationType && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                className="avl-rotation-badge"
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#ef4444',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                    zIndex: 10,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                            >
                                🔄 {currentStep.rotationType}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tree View */}
                    <div className="avl-canvas-wrapper" style={{ position: 'relative' }}>
                        <div className="avl-stats-grid">
                            <div className="avl-stat-card">
                                <span className="avl-stat-label">Root</span>
                                <strong>{treeStats.root}</strong>
                            </div>
                            <div className="avl-stat-card">
                                <span className="avl-stat-label">Tree Height</span>
                                <strong>{treeStats.height}</strong>
                            </div>
                            <div className="avl-stat-card">
                                <span className="avl-stat-label">Nodes</span>
                                <strong>{treeStats.nodeCount}</strong>
                            </div>
                            <div className="avl-stat-card">
                                <span className="avl-stat-label">Rotation</span>
                                <strong>{treeStats.rotation}</strong>
                            </div>
                        </div>
                        <svg className="avl-svg-canvas" viewBox={treeViewBox} preserveAspectRatio="xMidYMin meet">
                            {renderEdges.map(edge => {
                                const fromState = nodeStates[edge.from] || 'default';
                                const toState = nodeStates[edge.to] || 'default';
                                const edgeState = getEdgeState(fromState, toState, highlightEdgeSet.has(edge.id));
                                const edgeStyle = EDGE_STATE_STYLES[edgeState] || EDGE_STATE_STYLES.default;
                                const connector = getConnectorPoints(edge.fromX, edge.fromY, edge.toX, edge.toY);

                                return (
                                    <motion.line
                                        key={edge.id}
                                        x1={connector.x1}
                                        y1={connector.y1}
                                        x2={connector.x2}
                                        y2={connector.y2}
                                        className={`avl-edge state-${edgeState}`}
                                        stroke={edgeStyle.stroke}
                                        strokeWidth={edgeStyle.width}
                                        strokeDasharray={edgeStyle.dash}
                                        strokeLinecap="round"
                                        vectorEffect="non-scaling-stroke"
                                        initial={{
                                            pathLength: 0,
                                            opacity: 0,
                                            x1: connector.x1,
                                            y1: connector.y1,
                                            x2: connector.x2,
                                            y2: connector.y2
                                        }}
                                        animate={{
                                            x1: connector.x1,
                                            y1: connector.y1,
                                            x2: connector.x2,
                                            y2: connector.y2,
                                            pathLength: 1,
                                            opacity: edgeStyle.opacity,
                                            stroke: edgeStyle.stroke,
                                            strokeWidth: edgeStyle.width
                                        }}
                                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                                    />
                                );
                            })}

                            <AnimatePresence>
                                {renderNodes.map(node => {
                                    const state = nodeStates[node.id] || 'default';
                                    const bf = balances[node.id] !== undefined ? balances[node.id] : 0;
                                    
                                    return (
                                        <motion.g
                                            key={node.id}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1, x: node.x, y: node.y }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                            className={`avl-node-group state-${state}`}
                                        >
                                            <circle r={NODE_RADIUS} cx={0} cy={0} className="avl-node-circle" vectorEffect="non-scaling-stroke" />
                                            <text x={0} y={5} textAnchor="middle" className="avl-node-text">{node.val}</text>
                                            
                                            {/* Balance Factor Display Tooltip */}
                                            <motion.g
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="avl-bf-tooltip"
                                                transform={`translate(15, -15)`}
                                            >
                                                <rect x={0} y={-12} width={24} height={16} rx={4} className={`bf-bg ${Math.abs(bf) > 1 ? 'bf-danger' : 'bf-safe'}`} />
                                                <text x={12} y={0} textAnchor="middle" className="bf-text">{bf > 0 ? `+${bf}` : bf}</text>
                                            </motion.g>
                                        </motion.g>
                                    );
                                })}
                            </AnimatePresence>
                        </svg>
                    </div>

                    {/* Education Side Panel */}
                    <div className="avl-side-panel">
                        <div className="cs-education-panel" style={{ height: '100%' }}>
                            <div className="cs-edu-section">
                                <h3>Current Step</h3>
                                <div className="avl-step-summary">
                                    <div><span>Active Insert</span><strong>{activeInsertValue ?? '—'}</strong></div>
                                    <div><span>Step</span><strong>{currentStepIndex + 1} / {steps.length || 1}</strong></div>
                                </div>
                                <p>{currentStep?.description || 'Press Play to begin AVL insertion and balancing.'}</p>
                            </div>

                            <div className="cs-edu-section">
                                <h3>Educational Insight</h3>
                                <p>
                                    AVL trees maintain balance by ensuring the height difference between left and right subtrees is at most <strong>1</strong>.
                                </p>
                                <p>Balance Factor = <strong>height(left) - height(right)</strong>. If it becomes <strong>+2</strong> or <strong>-2</strong>, the tree rotates.</p>
                            </div>

                            <div className="cs-edu-section">
                                <h3>Color Legend</h3>
                                <div className="avl-legend">
                                    <div className="legend-item"><span className="legend-color inserted"></span> Inserted Node</div>
                                    <div className="legend-item"><span className="legend-color unbalanced"></span> Unbalanced Node</div>
                                    <div className="legend-item"><span className="legend-color rotating"></span> Nodes in Rotation</div>
                                    <div className="legend-item"><span className="legend-color balanced"></span> Balanced Nodes</div>
                                </div>
                            </div>

                            <div className="cs-edu-section">
                                <h3>Balance Factor Table</h3>
                                {nodeMetrics.length > 0 ? (
                                    <div className="avl-balance-table">
                                        <div className="avl-balance-head">
                                            <span>Node</span>
                                            <span>Height</span>
                                            <span>Balance</span>
                                            <span>Status</span>
                                        </div>
                                        {nodeMetrics.map((metric) => (
                                            <div key={metric.id} className="avl-balance-row">
                                                <span>{metric.value}</span>
                                                <span>{metric.height}</span>
                                                <span className={Math.abs(metric.balance) > 1 ? 'is-danger' : 'is-safe'}>
                                                    {metric.balance > 0 ? `+${metric.balance}` : metric.balance}
                                                </span>
                                                <span className={`avl-status-pill status-${metric.status}`}>{formatStatus(metric.status)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No nodes yet. Add values to start building the AVL tree.</p>
                                )}
                            </div>
                            
                            <div className="cs-edu-section">
                                <h3>Complexity</h3>
                                <div className="cs-complexity-bubble">
                                    <div className="cs-complexity-item"><span>Search</span><span style={{ color: '#34d399' }}>O(log n)</span></div>
                                    <div className="cs-complexity-item"><span>Insertion</span><span style={{ color: '#34d399' }}>O(log n)</span></div>
                                    <div className="cs-complexity-item"><span>Deletion</span><span style={{ color: '#34d399' }}>O(log n)</span></div>
                                </div>
                                <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                                    The AVL tree stays balanced, so operations remain fast even with many nodes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="avl-controls-wrapper">
                    <AnimationControls
                        inputType="array"
                        onManualInput={handleManualInput}
                        onGenerateRandom={handleGenerateRandom}
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
        </DualView>
    );
};

export default AVLTreeVisualizer;
