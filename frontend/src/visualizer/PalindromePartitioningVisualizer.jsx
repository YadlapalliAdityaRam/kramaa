import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generatePalindromePartitioningSteps } from '../algorithms/backtracking/palindromePartitioning';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaBackspace, FaCheckCircle, FaSearch, FaHistory } from 'react-icons/fa';
import './PalindromePartitioningVisualizer.css';

const PalindromePartitioningVisualizer = () => {
    const [inputString, setInputString] = useState('aab');
    const [tempInput, setTempInput] = useState('aab');
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showIntuition, setShowIntuition] = useState(true);

    const steps = useMemo(
        () => generatePalindromePartitioningSteps(inputString),
        [inputString]
    );

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        setIndex,
        speed,
        setSpeed
    } = useGenericAnimation(steps);

    const handleApply = () => {
        if (!tempInput || tempInput.length === 0) {
            toast.error("Please enter a string.");
            return;
        }
        if (tempInput.length > 10) {
            toast.error("String too long for visualization (max 10 chars).");
            return;
        }
        setInputString(tempInput);
        reset();
        toast.success(`Partitioning "${tempInput}"...`);
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return 4;
            case 'check': return 25;
            case 'valid': return 33;
            case 'backtrack': return 41;
            case 'success': return 16;
            case 'completed': return 44;
            default: return 0;
        }
    };

    return (
        <DualView
            algorithmName="Palindrome Partitioning (Backtracking)"
            code={algorithmCodes.palindromePartitioning?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Find all possible combinations of palindrome partitions."}
        >
            <div className="pal-partition-container">
                <div className="pal-input-bar">
                    <div className="input-field-group">
                        <label>String:</label>
                        <input
                            type="text"
                            value={tempInput}
                            onChange={(e) => setTempInput(e.target.value)}
                        />
                    </div>
                    <button className="apply-btn" onClick={handleApply}>Start</button>
                    <button className="analogy-btn" onClick={() => setShowIntuition(!showIntuition)}>
                        {showIntuition ? 'Hide Intuition' : 'Show Intuition'}
                    </button>
                </div>

                {showIntuition && (
                    <div className="pal-intuition-panel">
                        <h4>🧩 The Word Splicing Analogy</h4>
                        <p>Imagine you have a long candy bar and you want to break it into pieces. Every piece must be a <strong>perfectly symmetrical shape (palindrome)</strong>.</p>
                        <ul className="edu-list">
                            <li><FaSearch /> <strong>Explore:</strong> Try cutting off the first letter, then first two, etc.</li>
                            <li><FaCheckCircle /> <strong>Keep:</strong> If the piece is a palindrome, put it in your box and keep going!</li>
                            <li><FaBackspace /> <strong>Backtrack:</strong> If you reach a dead end, take the last piece out and try a different cut.</li>
                        </ul>
                    </div>
                )}

                <div className="pal-visual-area">
                    <div className="main-display">
                        <div className="status-badge phase-indicator">
                            Status: <span className={`status-${currentStep?.type}`}>{currentStep?.type?.toUpperCase()}</span>
                        </div>

                        <div className="exploration-box">
                            <div className="remaining-string">
                                {currentStep?.remainingString.split('').map((char, i) => (
                                    <span key={i} className={`char-node ${currentStep?.currentSubstring.length > i ? 'active' : ''}`}>
                                        {char}
                                    </span>
                                ))}
                            </div>
                            <div className={`substring-highlight ${currentStep?.type}`}>
                                {currentStep?.currentSubstring}
                            </div>
                        </div>

                        <div className="current-path-view">
                            <h5>Current Path</h5>
                            <div className="path-tags">
                                {currentStep?.currentPartition.length === 0 && <span className="empty-msg">Exploring...</span>}
                                {currentStep?.currentPartition.map((part, i) => (
                                    <span key={i} className="path-tag animate-in">{part}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="history-column">
                        <h5>Valid Partitions Found</h5>
                        <div className="results-gallery">
                            {currentStep?.results.length === 0 && <span className="empty-msg">No results yet...</span>}
                            {currentStep?.results.map((res, i) => (
                                <div key={i} className="result-item pulsate-purple">
                                    {res.join(' | ')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pal-footer">
                    <div className="pal-complexity">
                        <div className="comp-item">
                            <span className="label">Time:</span>
                            <span className="val">O(N · 2ⁿ)</span>
                        </div>
                        <div className="comp-item">
                            <span className="label">Space:</span>
                            <span className="val">O(N)</span>
                        </div>
                    </div>
                    <div className="pal-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Checking</div>
                        <div className="leg-item"><span className="dot green"></span> Valid</div>
                        <div className="leg-item"><span className="dot red"></span> Invalid</div>
                        <div className="leg-item"><span className="dot blue"></span> Current Path</div>
                        <div className="leg-item"><span className="dot purple"></span> Found</div>
                    </div>
                </div>

                <div className="pal-controls-wrapper">
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

export default PalindromePartitioningVisualizer;
