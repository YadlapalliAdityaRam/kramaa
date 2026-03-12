import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateBoyerMooreSteps } from '../algorithms/string/boyerMoore';
import { toast } from 'react-hot-toast';
import './BoyerMooreVisualizer.css';
import DualView from './DualView';
import { algorithmList } from '../data/algorithmsData';
import { buildAlgorithmOverview } from './algorithmOverview';
import { algorithmCodes } from '../data/algorithmCodes';

const DUMMY_TEXT = "ABAAABCD";
const DUMMY_PATTERN = "ABC";

const BoyerMooreVisualizer = () => {
    const [text, setText] = useState(DUMMY_TEXT);
    const [pattern, setPattern] = useState(DUMMY_PATTERN);
    const [speed, setSpeed] = useState(1.25);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const [inputText, setInputText] = useState(DUMMY_TEXT);
    const [inputPattern, setInputPattern] = useState(DUMMY_PATTERN);

    const steps = useMemo(() => generateBoyerMooreSteps(text, pattern), [text, pattern]);
    const totalSteps = steps.length;
    const currentStep = steps[currentStepIndex] || steps[0];

    const slug = 'algorithms/string/boyer-moore';
    const algorithmMeta = useMemo(() => algorithmList.find((item) => item.path === `/${slug}` || item.path.includes('boyer-moore')), [slug]);
    const overview = useMemo(() => algorithmMeta ? buildAlgorithmOverview(algorithmMeta) : null, [algorithmMeta]);

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
        const patVal = inputPattern.trim();
        if (!textVal || !patVal) {
            toast.error("Both text and pattern are required.");
            return;
        }
        if (textVal.length > 30) {
            toast.error("Text length should be at most 30 characters for visualization.");
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
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let randText = "";
        for (let i = 0; i < 20; i++) randText += chars.charAt(Math.floor(Math.random() * 4)); // Small alphabet for more matches

        const startIndex = Math.floor(Math.random() * (randText.length - 4));
        const length = Math.floor(Math.random() * 2) + 2; // Pattern length 2 to 4
        const randPat = randText.substring(startIndex, startIndex + length);

        setInputText(randText);
        setInputPattern(randPat);
        setText(randText);
        setPattern(randPat);
        handleReset();
        toast.success("Random string problem generated!");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'preprocessing': return 9;
            case 'align': return 14;
            case 'compare':
            case 'match': return 17;
            case 'mismatch': return 21;
            case 'found': return 22;
            case 'shift-calc': return snapshot.foundAt !== undefined ? 26 : 32;
            case 'complete': return 35;
            default: return 0;
        }
    };

    const renderTextRow = () => {
        return (
            <div className="bm-row bm-text-row">
                <div className="bm-row-label">Text</div>
                <div className="bm-boxes">
                    {text.split('').map((char, index) => {
                        let stateClass = '';
                        if (currentStep?.matches?.includes(index)) {
                            // If index is part of an officially recorded match start, ideally we could highlight the whole block.
                            // Currently, we'll just check if it's currently focused.
                        }

                        // Check if currently compared
                        if (currentStep?.textIndex === index) {
                            if (currentStep?.type === 'compare') stateClass = 'bm-comparing';
                            else if (currentStep?.type === 'match') stateClass = 'bm-matched';
                            else if (currentStep?.type === 'mismatch') stateClass = 'bm-mismatched';
                        }

                        // Fully found matches highlight
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
                    {/* Invisible spacer boxes to force alignment based on shiftIndex */}
                    {Array(shiftAmount).fill(0).map((_, i) => (
                        <div key={`spacer-${i}`} className="bm-box bm-spacer"></div>
                    ))}

                    {pattern.split('').map((char, index) => {
                        let stateClass = '';

                        if (currentStep?.patternIndex === index) {
                            if (currentStep?.type === 'compare') stateClass = 'bm-comparing';
                            else if (currentStep?.type === 'match') stateClass = 'bm-matched';
                            else if (currentStep?.type === 'mismatch' || currentStep?.type === 'shift-calc') stateClass = 'bm-mismatched';
                        }

                        // Fully matched highlight
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
        const table = currentStep?.badCharTable || {};
        const entries = Object.entries(table);

        return (
            <div className={`bm-bad-char-panel ${currentStep?.type === 'preprocessing' ? 'bm-preprocessing' : ''}`}>
                <h4>Bad Character Table</h4>
                <div className="bm-table-grid">
                    {entries.map(([char, index]) => {
                        return (
                            <div key={char} className="bm-table-pair">
                                <div className="bm-table-header">{char}</div>
                                <div className="bm-table-cell bm-table-value">{index}</div>
                            </div>
                        );
                    })}
                    {entries.length === 0 && (
                        <div className="bm-status-message" style={{ fontSize: '0.8rem' }}>Initializing table...</div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <span className="step-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px' }}>
                        Step {currentStepIndex + 1} / {totalSteps}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {currentStep?.description || 'Ready to start'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Comparisons: {currentStep?.comparisonsCount || 0}
                    </span>
                </div>
            }
        >
            <div className="visualizer-wrapper">
                <div className="bm-inputs">
                    <div className="bm-input-group">
                        <label>Text:</label>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualInput()}
                            maxLength={30}
                        />
                    </div>
                    <div className="bm-input-group">
                        <label>Pattern:</label>
                        <input
                            type="text"
                            value={inputPattern}
                            onChange={(e) => setInputPattern(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualInput()}
                            maxLength={10}
                        />
                    </div>
                    <button onClick={handleManualInput} className="btn-primary bm-btn">Start Matching</button>
                    <button onClick={generateRandomInput} className="btn-secondary bm-btn bm-rnd-btn">Random Pattern</button>
                </div>

                <div className="visualizer-canvas bm-canvas">
                    {renderTextRow()}
                    {renderPatternRow()}

                    <div className="bm-learning-bridge">
                        <div className="bm-status-panel">
                            <h4>Education Panel</h4>
                            <div className="bm-education-content">
                                <p><strong>How it works:</strong> Boyer-Moore compares the pattern to the text from <strong>right-to-left</strong>. When a mismatch occurs, it uses the <strong>Bad Character Rule</strong> to skip ahead.</p>
                                <div className="bm-stats-mini">
                                    <div className="bm-stat-item">
                                        <span className="label">Alignment Index:</span>
                                        <span className="value">{currentStep?.shiftIndex || 0}</span>
                                    </div>
                                    <div className="bm-stat-item">
                                        <span className="label">Comparisons:</span>
                                        <span className="value">{currentStep?.comparisonsCount || 0}</span>
                                    </div>
                                </div>
                                <div className="bm-complexity-info">
                                    <span>Time: Worst O(nm) | Avg O(n/m)</span>
                                </div>
                            </div>

                            {currentStep?.type === 'shift-calc' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bm-shift-formula"
                                >
                                    <div className="formula-title">Bad Character Shift:</div>
                                    <code>max(1, j - last_occurrence['{currentStep.targetBadChar || '?'}'])</code>
                                    <div className="formula-result">
                                        {currentStep.shiftAmount} positions to the right
                                    </div>
                                </motion.div>
                            )}
                        </div>
                        {renderBadCharTable()}
                    </div>
                </div>

                <div className="bm-controls-footer">
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
