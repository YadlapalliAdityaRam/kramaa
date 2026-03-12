import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import TreeCanvas from "./TreeCanvas";
import InputArrayDisplay from "../components/InputArrayDisplay";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateTrieSteps } from "../algorithms/trees/trie";
import { algorithmCodes } from "../data/algorithmCodes";
import "./TrieVisualizer.css";

const TrieVisualizer = () => {
    const [words, setWords] = useState(["cat", "car", "cap", "bat"]);
    const [inputValue, setInputValue] = useState("");
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateTrieSteps(words), [words]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        speed,
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { treeData, nodeStates, description } = stepData;

    const handleAddWord = () => {
        const word = inputValue.trim().toLowerCase();
        if (word && !words.includes(word) && word.length < 8) {
            setWords([...words, word].slice(-8)); // Keep last 8 words
            setInputValue("");
            reset();
        }
    };

    const handleRandomize = () => {
        const dict = ["code", "cool", "algo", "app", "apply", "bird", "blue", "data", "map"];
        const shuffled = [...dict].sort(() => 0.5 - Math.random());
        setWords(shuffled.slice(0, 4));
        reset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        switch (true) {
            case desc.includes("Inserting"): return 64;
            case desc.includes("existing"): return 81;
            case desc.includes("Create new"): return 98;
            case desc.includes("end-of-word"): return 116;
            case desc.includes("Search for"): return 145;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.trie?.[activeLanguage] || "";

    // Parse current path from description for UI display
    const currentPath = description?.match(/Path: ([a-z]+)/i)?.[1] || "";

    return (
        <DualView
            algorithmName="Trie (Prefix Tree)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Enter a word and press Play to see how it's stored."}
        >
            <div className="trie-container">
                <div className="legend-trie">
                    <div className="color-indicator"><div className="dot visiting"></div> Visiting</div>
                    <div className="color-indicator"><div className="dot inserted" style={{ background: '#3b82f6' }}></div> New Char</div>
                    <div className="color-indicator"><div className="dot end-word"></div> Word End</div>
                </div>

                {stepData?.arraySnapshot && (
                    <InputArrayDisplay
                        arraySnapshot={stepData.arraySnapshot}
                        activeArrayIndex={stepData.activeArrayIndex}
                    />
                )}

                <div className="trie-layout">
                    <div className="tree-canvas-wrapper">
                        <TreeCanvas
                            treeData={treeData}
                            nodeStates={nodeStates || {}}
                        />
                    </div>

                    <div className="trie-stats-panel">
                        <div className="info-card">
                            <div className="info-label">Active Path</div>
                            <div className="path-display">
                                {currentPath.split('').map((char, i) => (
                                    <motion.span
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="path-char"
                                    >
                                        {char.toUpperCase()}
                                    </motion.span>
                                ))}
                                {currentPath === "" && <span style={{ opacity: 0.3, fontSize: '0.9rem' }}>Waiting...</span>}
                            </div>
                        </div>

                        <div className="info-card">
                            <div className="info-label">Words in Trie</div>
                            <div className="word-list">
                                {words.map(w => (
                                    <span key={w} className="word-tag">{w}</span>
                                ))}
                            </div>
                        </div>

                        <div className="info-card" style={{ flex: 1 }}>
                            <div className="info-label">Concept</div>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                A Trie shares common prefixes (like 'ca' in 'cat' and 'car') to save space.
                                Search time depends only on word length, not the number of words stored!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="trie-controls">
                    <div className="animation-wrapper" style={{ flex: 1 }}>
                        <AnimationControls inputType="none"
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

                    <div className="input-actions" style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="word-input"
                            placeholder="Add word (e.g. 'code')"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddWord()}
                        />
                        <button className="btn-trie" onClick={handleAddWord}>Add Word</button>
                        <button className="btn-trie" style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }} onClick={handleRandomize}>Random</button>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default TrieVisualizer;
