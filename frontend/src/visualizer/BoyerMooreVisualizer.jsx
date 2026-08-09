import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateBoyerMooreSteps } from '../algorithms/string/boyerMoore';
import { toast } from 'react-hot-toast';
import DualView from './DualView';
import { algorithmCodes } from '../data/algorithmCodes';
import { FaSearch, FaRandom, FaRedo, FaFont, FaGlasses } from 'react-icons/fa';
import './BoyerMooreVisualizer.css';

const DEFAULT_TEXT    = "ABAAABCD";
const DEFAULT_PATTERN = "ABC";

const BoyerMooreVisualizer = () => {
    const [text, setText]               = useState(DEFAULT_TEXT);
    const [pattern, setPattern]         = useState(DEFAULT_PATTERN);
    const [speed, setSpeed]             = useState(1.25);
    const [isPlaying, setIsPlaying]     = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeLanguage, setActiveLanguage]     = useState('javascript');

    const [inputText, setInputText]       = useState(DEFAULT_TEXT);
    const [inputPattern, setInputPattern] = useState(DEFAULT_PATTERN);

    const steps = useMemo(() => generateBoyerMooreSteps(text, pattern), [text, pattern]);
    const totalSteps  = steps.length;
    const currentStep = steps[currentStepIndex] || steps[0];

    useEffect(() => {
        let timer;
        if (isPlaying && currentStepIndex < totalSteps - 1) {
            timer = setTimeout(() => {
                setCurrentStepIndex((prev) => prev + 1);
            }, 1000 / speed);
        } else if (currentStepIndex >= totalSteps - 1) {
            setIsPlaying(false);
        }
        return () => clearTimeout(timer);
    }, [isPlaying, currentStepIndex, speed, totalSteps]);

    const handlePlay = () => {
        if (currentStepIndex >= totalSteps - 1) setCurrentStepIndex(0);
        setIsPlaying(true);
    };

    const handlePause = () => setIsPlaying(false);
    
    const handleReset = () => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
    };

    const handleStepForward = () => {
        setIsPlaying(false);
        if (currentStepIndex < totalSteps - 1) setCurrentStepIndex((prev) => prev + 1);
    };

    const handleStepBackward = () => {
        setIsPlaying(false);
        if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
    };

    const handleManualInput = () => {
        const textVal = inputText.trim();
        const patVal  = inputPattern.trim();
        if (!textVal || !patVal) {
            toast.error("Both text and pattern are required.");
            return;
        }
        if (textVal.length > 30) {
            toast.error("Text length should be at most 30 characters.");
            return;
        }
        if (patVal.length > textVal.length) {
            toast.error("Pattern cannot be longer than the text.");
            return;
        }
        setText(textVal);
        setPattern(patVal);
        handleReset();
        toast.success("New string inputs loaded!");
    };

    const generateRandomInput = () => {
        const chars = "ABCD";
        let randText = "";
        for (let i = 0; i < 18; i++) randText += chars.charAt(Math.floor(Math.random() * chars.length));

        const startIndex = Math.floor(Math.random() * (randText.length - 4));
        const length = Math.floor(Math.random() * 2) + 2;
        const randPat = randText.substring(startIndex, startIndex + length);

        setInputText(randText);
        setInputPattern(randPat);
        setText(randText);
        setPattern(randPat);
        handleReset();
        toast.success("Random string pattern generated!");
    };

    const handleResetDemo = () => {
        setInputText(DEFAULT_TEXT);
        setInputPattern(DEFAULT_PATTERN);
        setText(DEFAULT_TEXT);
        setPattern(DEFAULT_PATTERN);
        handleReset();
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'preprocessing': return 9;
            case 'align':         return 14;
            case 'compare':
            case 'match':         return 17;
            case 'mismatch':      return 21;
            case 'found':         return 22;
            case 'shift-calc':    return snapshot.foundAt !== undefined ? 26 : 32;
            case 'complete':      return 35;
            default:              return 0;
        }
    };

    const renderTextRow = () => {
        return (
            <div className="bm-row bm-text-row">
                <div className="bm-row-label">Text</div>
                <div className="bm-boxes">
                    {text.split('').map((char, index) => {
                        let stateClass = '';

                        if (currentStep?.textIndex === index) {
                            if (currentStep?.type === 'compare')        stateClass = 'bm-comparing';
                            else if (currentStep?.type === 'match')    stateClass = 'bm-matched';
                            else if (currentStep?.type === 'mismatch') stateClass = 'bm-mismatched';
                        }

                        if (currentStep?.matches?.some(startIdx => index >= startIdx && index < startIdx + pattern.length)) {
                            stateClass = 'bm-fully-matched';
                        }

                        return (
                            <div key={`text-${index}`} className={`bm-box ${stateClass}`}>
                                {char}
                                <div className="bm-index">{index}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderPatternRow = () => {
        const shiftAmount = currentStep?.shiftIndex || 0;

        return (
            <div className="bm-row bm-pattern-row">
                <div className="bm-row-label">Pattern</div>
                <div className="bm-boxes bm-pattern-container">
                    {/* Spacer boxes to align pattern to shiftIndex */}
                    {Array(shiftAmount).fill(0).map((_, i) => (
                        <div key={`spacer-${i}`} className="bm-box bm-spacer"></div>
                    ))}

                    {pattern.split('').map((char, index) => {
                        let stateClass = '';

                        if (currentStep?.patternIndex === index) {
                            if (currentStep?.type === 'compare')                                stateClass = 'bm-comparing';
                            else if (currentStep?.type === 'match')                            stateClass = 'bm-matched';
                            else if (currentStep?.type === 'mismatch' || currentStep?.type === 'shift-calc') stateClass = 'bm-mismatched';
                        }

                        if (currentStep?.foundAt === shiftAmount) {
                            stateClass = 'bm-fully-matched';
                        }

                        return (
                            <motion.div
                                layout
                                key={`pat-${index}`}
                                className={`bm-box bm-pattern-box ${stateClass}`}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                {char}
                                <div className="bm-index">{index}</div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderBadCharTable = () => {
        const table   = currentStep?.badCharTable || {};
        const entries = Object.entries(table);

        return (
            <div className={`bm-bad-char-panel ${currentStep?.type === 'preprocessing' ? 'bm-preprocessing' : ''}`}>
                <h4>Bad Character Table</h4>
                <div className="bm-table-grid">
                    {entries.map(([char, index]) => (
                        <div key={char} className="bm-table-pair">
                            <div className="bm-table-header">{char}</div>
                            <div className="bm-table-cell bm-table-value">{index}</div>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <div className="bm-status-message">Initializing Bad Character Table...</div>
                    )}
                </div>
            </div>
        );
    };

    const codeSnippet = algorithmCodes['boyerMoore']?.[activeLanguage] || '';

    return (
        <DualView
            algorithmName="Boyer-Moore String Matching"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="string"
            description={
                <div className="bm-desc-wrapper">
                    <span className="bm-step-badge">
                        Step {currentStepIndex + 1} of {totalSteps}
                    </span>
                    <span className="bm-desc-text">
                        {currentStep?.description || 'Ready to start matching.'}
                    </span>
                    <span className="bm-stat-chip">
                        Comparisons: {currentStep?.comparisonsCount || 0}
                    </span>
                </div>
            }
        >
            <div className="bm-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="bm-input-panel">
                    <div className="bm-input-group">
                        <label className="bm-input-label">
                            <FaFont className="bm-icon" /> Text:
                        </label>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualInput()}
                            maxLength={30}
                            className="bm-text-input"
                        />
                    </div>

                    <div className="bm-input-group">
                        <label className="bm-input-label">
                            <FaGlasses className="bm-icon" /> Pattern:
                        </label>
                        <input
                            type="text"
                            value={inputPattern}
                            onChange={(e) => setInputPattern(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualInput()}
                            maxLength={10}
                            className="bm-pattern-input"
                        />
                    </div>

                    <div className="bm-btn-group">
                        <button onClick={handleManualInput} className="bm-btn bm-btn-primary">
                            <FaSearch /> Start Matching
                        </button>
                        <button onClick={generateRandomInput} className="bm-btn bm-btn-secondary">
                            <FaRandom /> Random Pattern
                        </button>
                        <button onClick={handleResetDemo} className="bm-btn bm-btn-outline">
                            <FaRedo /> Reset Demo
                        </button>
                    </div>
                </div>

                {/* ── Main String Match Visualization Canvas ───────────── */}
                <div className="bm-canvas-wrapper">
                    {renderTextRow()}
                    {renderPatternRow()}

                    <div className="bm-learning-bridge">
                        <div className="bm-status-panel">
                            <h4>Right-to-Left Matching Mechanics</h4>
                            <div className="bm-education-content">
                                <p>
                                    Boyer-Moore compares characters <strong>right-to-left</strong>. When a mismatch occurs, it looks up the mismatched character in the <strong>Bad Character Table</strong> to jump ahead multiple positions in <code>O(N/M)</code> average time.
                                </p>
                                <div className="bm-stats-mini">
                                    <div className="bm-stat-item">
                                        <span className="label">Alignment Index</span>
                                        <span className="value">{currentStep?.shiftIndex || 0}</span>
                                    </div>
                                    <div className="bm-stat-item">
                                        <span className="label">Comparisons</span>
                                        <span className="value">{currentStep?.comparisonsCount || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {currentStep?.type === 'shift-calc' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bm-shift-formula"
                                >
                                    <div className="formula-title">Bad Character Shift Rule:</div>
                                    <code>max(1, j - last_occurrence['{currentStep.targetBadChar || '?'}'])</code>
                                    <div className="formula-result">
                                        Shift pattern right by <strong>{currentStep.shiftAmount}</strong> position(s)
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {renderBadCharTable()}
                    </div>
                </div>

                {/* ── Scrubber & YouTube Video Player Controls ─────────── */}
                <div className="bm-controls-wrapper">
                    <AnimationControls
                        inputType="none"
                        isPlaying={isPlaying}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onStepForward={handleStepForward}
                        onStepBackward={handleStepBackward}
                        onReset={handleReset}
                        speed={speed}
                        onSpeedChange={setSpeed}
                        currentStep={currentStepIndex}
                        totalSteps={totalSteps}
                        onScrub={setCurrentStepIndex}
                    />
                </div>
            </div>
        </DualView>
    );
};

export default BoyerMooreVisualizer;
