import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import GraphCanvas from './GraphCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateHuffmanCodingSteps } from '../algorithms/greedy/huffmanCoding';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRedo } from 'react-icons/fa';
import './HuffmanCodingVisualizer.css';

const DEFAULT_TEXT = "BCAADDDCCACACAC";

const HuffmanCodingVisualizer = () => {
    const [inputText, setInputText]     = useState(DEFAULT_TEXT);
    const [appliedText, setAppliedText] = useState(DEFAULT_TEXT);
    const [activeLanguage, setActiveLanguage] = useState("javascript");

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
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const handleApply = () => {
        if (!inputText.trim()) {
            toast.error("Input text cannot be empty.");
            return;
        }
        if (inputText.length > 25) {
            toast.error("Keep text under 25 characters for clear tree layout.");
            return;
        }
        setAppliedText(inputText);
        reset();
        toast.success("Generating Huffman Tree!");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'init':        return 3;
            case 'queue-init':  return 6;
            case 'extract-min': return 12;
            case 'merge':        return 14;
            case 'complete':     return 22;
            default:             return 0;
        }
    };

    const nodeStates = useMemo(() => {
        if (!currentStep || !currentStep.nodes) return {};
        const states = {};
        currentStep.nodes.forEach(n => {
            states[n.id] = 'default';
        });
        if (currentStep.highlightedNodes) {
            currentStep.highlightedNodes.forEach(id => {
                if (currentStep.type === 'extract-min') states[id] = 'mst-node';
                if (currentStep.type === 'merge') states[id] = 'visiting';
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
                states[id] = 'mst-edge';
            });
        }
        return states;
    }, [currentStep]);

    const codeSnippet = algorithmCodes.huffmanCoding?.[activeLanguage] || "";
    const stepData    = currentStep || {};
    const huffmanCodes= stepData.huffmanCodes || {};
    const stats       = stepData.compressionStats;

    return (
        <DualView
            algorithmName="Huffman Coding (Greedy Lossless Compression)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="greedy"
            description={
                <div className="huf-desc-wrapper">
                    <span className="huf-badge">Optimal Prefix Codes O(N log N)</span>
                    <span className="huf-desc-text">
                        {currentStep?.description || "Press Play to build Huffman tree by merging lowest frequency nodes."}
                    </span>
                </div>
            }
        >
            <div className="huf-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="huf-input-panel">
                    <div className="huf-input-group">
                        <label className="huf-input-label">Text String:</label>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="BCAADDDCCACACAC"
                            className="huf-text-input"
                        />
                        <button onClick={handleApply} className="huf-btn huf-btn-primary">
                            <FaCheck /> Generate
                        </button>
                    </div>

                    <div className="huf-btn-group">
                        <button onClick={() => { setInputText(DEFAULT_TEXT); setAppliedText(DEFAULT_TEXT); reset(); }} className="huf-btn huf-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="huf-legend">
                        <div className="huf-leg-item"><span className="huf-dot green"></span> Smallest Freq Node</div>
                        <div className="huf-leg-item"><span className="huf-dot blue"></span> Merging Parent</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Tree Canvas & Codes Panel ───────── */}
                <div className="huf-canvas-wrapper">
                    
                    {/* Tree Canvas */}
                    <div className="huf-tree-panel">
                        <div className="huf-card-title">Huffman Tree Structure</div>
                        <div className="huf-canvas-box">
                            <GraphCanvas
                                nodes={stepData.nodes || []}
                                edges={stepData.edges || []}
                                nodeStates={nodeStates}
                                edgeStates={edgeStates}
                            />
                        </div>
                    </div>

                    {/* Codes & Compression Stats Panel */}
                    <div className="huf-stats-panel">
                        <div className="huf-card-title">Generated Prefix Codes</div>
                        <div className="huf-codes-grid">
                            {Object.entries(huffmanCodes).map(([char, code]) => (
                                <div key={char} className="huf-code-chip">
                                    <span className="char">'{char}'</span>
                                    <span className="code">{code}</span>
                                </div>
                            ))}
                        </div>

                        {stats && (
                            <div className="huf-compression-box">
                                <div>Original (ASCII): <strong>{stats.originalBits} bits</strong></div>
                                <div>Huffman Encoded: <strong>{stats.compressedBits} bits</strong></div>
                                <div className="savings">Savings: <strong>{stats.savings}%</strong></div>
                            </div>
                        )}
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="huf-controls-wrapper">
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
