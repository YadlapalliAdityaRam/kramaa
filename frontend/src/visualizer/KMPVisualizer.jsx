import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateKMPSteps } from '../algorithms/string/kmp';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRedo } from 'react-icons/fa';
import './KMPVisualizer.css';

const DEFAULT_TEXT    = 'AABAACAADAABAABA';
const DEFAULT_PATTERN = 'AABA';

const KMPVisualizer = () => {
    const [text, setText]                 = useState(DEFAULT_TEXT);
    const [pattern, setPattern]           = useState(DEFAULT_PATTERN);
    const [textInput, setTextInput]       = useState(DEFAULT_TEXT);
    const [patternInput, setPatternInput] = useState(DEFAULT_PATTERN);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateKMPSteps(text, pattern),
        [text, pattern]
    );

    const {
        currentStep, currentStepIndex, isPlaying,
        play, pause, reset, stepForward, stepBackward,
        setIndex, speed, setSpeed
    } = useGenericAnimation(steps);

    const handleApply = () => {
        const t = textInput.trim();
        const p = patternInput.trim();
        if (!t) { toast.error('Text cannot be empty.'); return; }
        if (!p) { toast.error('Pattern cannot be empty.'); return; }
        if (p.length > t.length) { toast.error('Pattern is longer than text.'); return; }
        if (t.length > 30) { toast.error('Text max length is 30 characters.'); return; }
        if (p.length > 10) { toast.error('Pattern max length is 10 characters.'); return; }
        setText(t);
        setPattern(p);
        reset();
        toast.success('KMP search updated!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info':       return 20;
            case 'align':      return 25;
            case 'compare':    return 26;
            case 'match':      return 26;
            case 'mismatch':   return 34;
            case 'found':      return 31;
            case 'shift-calc': return 35;
            case 'complete':   return 40;
            default:           return 0;
        }
    };

    const codeSnippet = algorithmCodes.kmp?.[activeLanguage] || '';
    const stepData    = currentStep || {};
    const lps         = stepData.lps || [];
    const shift       = stepData.shiftIndex || 0;

    return (
        <DualView
            algorithmName="KMP Algorithm (Knuth-Morris-Pratt Pattern Matching)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="strings"
            description={
                <div className="kmp-desc-wrapper">
                    <span className="kmp-badge">LPS Table Skipping O(N + M)</span>
                    <span className="kmp-desc-text">
                        {currentStep?.description || 'Press Play to observe string matching with zero redundant character re-checks!'}
                    </span>
                </div>
            }
        >
            <div className="kmp-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="kmp-input-panel">
                    <div className="kmp-input-group">
                        <label className="kmp-input-label">Text:</label>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            className="kmp-text-input"
                        />
                    </div>

                    <div className="kmp-input-group">
                        <label className="kmp-input-label">Pattern:</label>
                        <input
                            type="text"
                            value={patternInput}
                            onChange={(e) => setPatternInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            className="kmp-pattern-input"
                        />
                        <button onClick={handleApply} className="kmp-btn kmp-btn-primary">
                            <FaCheck /> Search
                        </button>
                    </div>

                    <div className="kmp-btn-group">
                        <button onClick={() => { setText(DEFAULT_TEXT); setPattern(DEFAULT_PATTERN); setTextInput(DEFAULT_TEXT); setPatternInput(DEFAULT_PATTERN); reset(); }} className="kmp-btn kmp-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="kmp-legend">
                        <div className="kmp-leg-item"><span className="kmp-dot yellow"></span> Comparing</div>
                        <div className="kmp-leg-item"><span className="kmp-dot green"></span> Match</div>
                        <div className="kmp-leg-item"><span className="kmp-dot red"></span> Mismatch</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Text Cells, Pattern Window & LPS Table ── */}
                <div className="kmp-canvas-wrapper">
                    
                    {/* LPS Array Table Card */}
                    <div className="kmp-lps-card">
                        <div className="kmp-card-title">LPS Array (Longest Prefix Suffix)</div>
                        <div className="kmp-lps-row">
                            {pattern.split('').map((ch, idx) => (
                                <div key={idx} className="lps-cell">
                                    <span className="lps-ch">{ch}</span>
                                    <span className="lps-val">{lps[idx] !== undefined ? lps[idx] : 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Text Alignment Row */}
                    <div className="kmp-text-card">
                        <div className="kmp-card-title">Text String Alignment</div>
                        <div className="kmp-text-grid">
                            {text.split('').map((ch, idx) => {
                                const isCurrent = stepData.textIndex === idx;
                                const isMatch   = isCurrent && stepData.type === 'match';
                                const isMis     = isCurrent && stepData.type === 'mismatch';
                                const isFound   = stepData.matches?.some(m => idx >= m && idx < m + pattern.length);

                                let state = 'default';
                                if (isMatch) state = 'match';
                                else if (isMis) state = 'mismatch';
                                else if (isCurrent) state = 'comparing';
                                else if (isFound) state = 'found';

                                return (
                                    <div key={idx} className="kmp-cell-wrapper">
                                        <div className={`kmp-cell state-${state}`}>
                                            <span className="kmp-val">{ch}</span>
                                        </div>
                                        <span className="kmp-idx">{idx}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pattern Slider Row */}
                        <div className="kmp-pattern-slider" style={{ transform: `translateX(${shift * 46}px)` }}>
                            {pattern.split('').map((ch, idx) => {
                                const isCurrent = stepData.patternIndex === idx;
                                let pState = 'default';
                                if (isCurrent) pState = stepData.type === 'match' ? 'match' : stepData.type === 'mismatch' ? 'mismatch' : 'comparing';

                                return (
                                    <div key={idx} className={`kmp-cell p-cell state-${pState}`}>
                                        <span className="kmp-val">{ch}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="kmp-controls-wrapper">
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

export default KMPVisualizer;
