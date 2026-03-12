import React, { useState, useEffect, useMemo } from 'react';
import DualView from './DualView';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateHuffmanCodingSteps } from '../algorithms/greedy/huffmanCoding';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import './HuffmanCodingVisualizer.css';

const HuffmanCodingVisualizer = () => {
    const [inputText, setInputText] = useState("BCAADDDCCACACAC");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    // We only re-generate steps when the user actually applies the input.
    const [appliedText, setAppliedText] = useState(inputText);

    const steps = useMemo(() => generateHuffmanCodingSteps(appliedText), [appliedText]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        speed,
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const handleApply = () => {
        if (!inputText.trim()) {
            toast.error("Input text cannot be empty.");
            return;
        }
        if (inputText.length > 30) {
            toast.error("Text is too long for clear visualization. Keep it under 30 characters.");
            return;
        }
        setAppliedText(inputText);
        reset();
        toast.success("Huffman tree generating...");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        if (snapshot.type === 'init') return 2;     // freq map
        if (snapshot.type === 'queue-init') return 4; // priority queue
        if (snapshot.type === 'extract-min') return 6; // pop 2
        if (snapshot.type === 'merge') return 8;    // create parent, push
        if (snapshot.type === 'complete') return 12;  // codes
        return 0;
    };

    const nodeStates = useMemo(() => {
        if (!currentStep || !currentStep.nodes) return {};
        const states = {};

        // Default all to 'default'
        currentStep.nodes.forEach(n => {
            states[n.id] = 'default';
        });

        // Highlight based on step
        if (currentStep.highlightedNodes) {
            currentStep.highlightedNodes.forEach(id => {
                if (currentStep.type === 'extract-min') states[id] = 'mst-node'; // green-ish
                if (currentStep.type === 'merge') states[id] = 'visiting'; // blue-ish
            });
        }

        return states;
    }, [currentStep]);

    const edgeStates = useMemo(() => {
        if (!currentStep || !currentStep.edges) return {};
        const states = {};

        currentStep.edges.forEach(e => {
            const key = `${e.from}-${e.to}`;
            states[key] = 'default';
        });

        if (currentStep.newEdgeIds) {
            currentStep.newEdgeIds.forEach(id => {
                states[id] = 'mst-edge'; // Highlight new edges in green
            });
        }

        return states;
    }, [currentStep]);

    const codeSnippet = algorithmCodes.huffmanCoding?.[activeLanguage] || "";

    const freqMap = currentStep?.freqMap || {};
    const queue = currentStep?.queue || [];
    const huffmanCodes = currentStep?.huffmanCodes || {};
    const compressionStats = currentStep?.compressionStats;

    return (
        <DualView
            algorithmName="Huffman Coding"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Select text and press Play."}
        >
            <div className="huffman-container">
                {/* Inputs */}
                <div className="huffman-input-bar">
                    <div className="huffman-inputs">
                        <div className="huffman-input-group">
                            <span className="huffman-label">Text String:</span>
                            <input
                                type="text"
                                className="huffman-text-input"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value.toUpperCase())}
                                placeholder="BCAADDDCCACACAC"
                            />
                        </div>
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Generate Tree</button>
                </div>

                {/* Main Visualization Area */}
                <div className="huffman-main-area">
                    {/* Left: Freq Map & Queue */}
                    <div className="huffman-left-panel">
                        <div>
                            <h4 className="huffman-card-title">Frequency Map</h4>
                            <table className="huffman-table">
                                <thead>
                                    <tr><th>Char</th><th>Count</th></tr>
                                </thead>
                                <tbody>
                                    {Object.entries(freqMap).map(([char, f]) => (
                                        <tr key={char}>
                                            <td className="hc-char">{char}</td>
                                            <td className="hc-freq">{f}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <h4 className="huffman-card-title">Priority Queue (Min Heap)</h4>
                            <div className="huffman-queue-container">
                                <AnimatePresence>
                                    {queue.map((node) => {
                                        let qClass = '';
                                        if (currentStep?.type === 'extract-min' && currentStep.highlightedNodes?.includes(node.id)) {
                                            qClass = 'q-extracting';
                                        } else if (currentStep?.type === 'merge' && currentStep.highlightedNodes?.includes(node.id)) {
                                            qClass = 'q-merged';
                                        }

                                        return (
                                            <motion.div
                                                key={node.id}
                                                className={`huffman-queue-item ${qClass}`}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <span className="hq-label">
                                                    {node.isLeaf ? `'${node.char}'` : `Node ${node.id.substring(1)}`}
                                                </span>
                                                <span className="hq-weight">{node.freq}</span>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Center: Graph Canvas */}
                    <div className="huffman-center-panel">
                        <div className="huffman-graph-label">Huffman Forest</div>
                        <div className="huffman-canvas-wrap">
                            <GraphCanvas
                                nodes={currentStep?.nodes || []}
                                edges={currentStep?.edges || []}
                                nodeStates={nodeStates}
                                edgeStates={edgeStates}
                                customLayoutOptions={{
                                    hierarchical: {
                                        enabled: true,
                                        direction: 'UD', // Up-Down (Bottom-Up conceptually built)
                                        sortMethod: 'directed',
                                        levelSeparation: 80,
                                        nodeSpacing: 100
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Right: Prefix Codes & Stats */}
                    <div className="huffman-right-panel">
                        <h4 className="huffman-card-title">Prefix Codes</h4>

                        <table className="huffman-table">
                            <thead>
                                <tr><th>Char</th><th>Huffman Code</th></tr>
                            </thead>
                            <tbody>
                                {Object.keys(huffmanCodes).length > 0 ? (
                                    Object.entries(huffmanCodes).map(([char, code]) => (
                                        <tr key={char}>
                                            <td className="hc-char">{char}</td>
                                            <td className="hc-code">{code}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="2" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                                            Waiting for tree completion...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {compressionStats && (
                            <motion.div
                                className="huffman-stats-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="hs-title">Compression Results</div>
                                <div style={{ marginBottom: '10px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Original (8-bit):</span>
                                    <div className="hs-value" style={{ color: '#fca5a5' }}>{compressionStats.originalStrLength} bits</div>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Huffman Encoded:</span>
                                    <div className="hs-value">{compressionStats.encodedStrLength} bits</div>
                                </div>
                                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#10b981' }}>
                                    Saved {(((compressionStats.originalStrLength - compressionStats.encodedStrLength) / compressionStats.originalStrLength) * 100).toFixed(1)}% space!
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="huffman-controls-wrapper">
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
        </DualView>
    );
};

export default HuffmanCodingVisualizer;
