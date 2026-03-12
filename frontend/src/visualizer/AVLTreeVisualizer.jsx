import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import InputArrayDisplay from '../components/InputArrayDisplay';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateAVLTreeSteps } from '../algorithms/trees/avlTreeGenerator';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './AVLTreeVisualizer.css';

const AVLTreeVisualizer = () => {
    const [elements, setElements] = useState([10, 20, 30, 40, 50, 25]);
    const [activeLanguage, setActiveLanguage] = useState("javascript");

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

    const currentStep = steps[currentStepIndex];
    const treeData = currentStep?.treeData || null;
    const nodeStates = currentStep?.nodeStates || {};
    const balances = currentStep?.balances || {};

    const handleManualInput = (inputVal) => {
        if (!Array.isArray(inputVal) || inputVal.length === 0) return;
        if (inputVal.length > 25) {
            toast.error('Maximum 25 elements allowed for tree visualization.');
            return;
        }
        setElements(inputVal);
        reset();
        toast.success('AVL Tree input updated!');
    };

    const handleGenerateRandom = () => {
        const count = Math.floor(Math.random() * 8) + 5;
        const arr = Array.from({ length: count }, () => Math.floor(Math.random() * 99) + 1);
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

    // Calculate dynamic node positions
    // Breadth-First traversal approach to calculate X and Y
    const getLayout = (rootNode) => {
        const nodes = [];
        const edges = [];
        if (!rootNode) return { nodes, edges };

        const levelSpacing = 70;
        const nodeRadius = 20;

        // Recursive sizing
        const calculateSizes = (n) => {
            if (!n) return 0;
            const lw = calculateSizes(n.left);
            const rw = calculateSizes(n.right);
            // leaf node width is 40
            n._width = Math.max(40, lw + rw + 20); 
            return n._width;
        };
        calculateSizes(rootNode);

        const positionNodes = (n, x, y) => {
            if (!n) return;
            
            nodes.push({ ...n, x, y });

            if (n.left) {
                const childX = x - n.left._width / 2;
                const childY = y + levelSpacing;
                edges.push({
                    id: `${n.id}-${n.left.id}`,
                    x1: x, y1: y + nodeRadius,
                    x2: childX, y2: childY - nodeRadius
                });
                positionNodes(n.left, childX, childY);
            }

            if (n.right) {
                const childX = x + n.right._width / 2;
                const childY = y + levelSpacing;
                edges.push({
                    id: `${n.id}-${n.right.id}`,
                    x1: x, y1: y + nodeRadius,
                    x2: childX, y2: childY - nodeRadius
                });
                positionNodes(n.right, childX, childY);
            }
        };

        // Start from center
        positionNodes(rootNode, 0, 50);

        return { nodes, edges };
    };

    const { nodes: renderNodes, edges: renderEdges } = useMemo(() => getLayout(treeData), [treeData]);

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
                        <svg className="avl-svg-canvas" viewBox="-300 0 600 500" preserveAspectRatio="xMidYMin meet">
                            {renderEdges.map(edge => (
                                <motion.line
                                    key={edge.id}
                                    x1={edge.x1} y1={edge.y1}
                                    x2={edge.x2} y2={edge.y2}
                                    className="avl-edge"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            ))}

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
                                            <circle r={20} cx={0} cy={0} className="avl-node-circle" />
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
                                <h3>Educational Insight</h3>
                                <p>
                                    AVL trees maintain balance by ensuring the height difference between left and right subtrees is at most <strong>1</strong> (The Balance Factor).
                                </p>
                                <p>This guarantees efficient operations.</p>
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
