import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateKMPSteps } from '../algorithms/string/kmp';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './KMPVisualizer.css';

const DEFAULT_TEXT = 'AABAACAADAABAABA';
const DEFAULT_PATTERN = 'AABA';

const KMPVisualizer = () => {
    const [text, setText] = useState(DEFAULT_TEXT);
    const [pattern, setPattern] = useState(DEFAULT_PATTERN);
    const [textInput, setTextInput] = useState(DEFAULT_TEXT);
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
        if (t.length > 40) { toast.error('Text max length is 40 characters.'); return; }
        if (p.length > 12) { toast.error('Pattern max length is 12 characters.'); return; }
        setText(t);
        setPattern(p);
        reset();
        toast.success('Search updated!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'info': return step.lps?.length > 0 ? 8 : 2;
            case 'align': return 11;
            case 'compare': return 13;
            case 'match': return 14;
            case 'mismatch': return 17;
            case 'found': return 16;
            case 'shift-calc': return 19;
            case 'complete': return 22;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.kmp?.[activeLanguage] || '';

    // Determine character states for text rendering
    const getTextCharState = (idx) => {
        if (!currentStep) return 'default';
        const shift = currentStep.shiftIndex || 0;

        // Highlight found matches
        if (currentStep.matches?.some(m => idx >= m && idx < m + pattern.length)) {
            return 'found';
        }

        if (currentStep.type === 'compare' || currentStep.type === 'match' || currentStep.type === 'mismatch') {
            if (idx === currentStep.textIndex) {
                return currentStep.type === 'match' ? 'match' : currentStep.type === 'mismatch' ? 'mismatch' : 'comparing';
            }
            // Highlight already-matched portion in current alignment
            if (idx >= shift && idx < currentStep.textIndex && currentStep.patternIndex >= 0) {
                return 'matched-prefix';
            }
        }

        if (currentStep.type === 'found') {
            const fAt = currentStep.foundAt;
            if (fAt !== undefined && idx >= fAt && idx < fAt + pattern.length) return 'found';
        }

        // Within pattern alignment range
        if (idx >= shift && idx < shift + pattern.length) return 'in-range';

        return 'default';
    };

    const getPatternCharState = (idx) => {
        if (!currentStep) return 'default';
        if (currentStep.type === 'compare' || currentStep.type === 'match' || currentStep.type === 'mismatch') {
            if (idx === currentStep.patternIndex) {
                return currentStep.type === 'match' ? 'match' : currentStep.type === 'mismatch' ? 'mismatch' : 'comparing';
            }
            if (idx < currentStep.patternIndex) return 'matched-prefix';
        }
        if (currentStep.type === 'found') return 'found';
        return 'default';
    };

    return (
        <DualView
            algorithmName="KMP Algorithm (String Matching)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Enter text and pattern, then press Search.'}
        >
            <div className="kmp-container">
                {/* Input Bar */}
                <div className="kmp-input-bar">
                    <div className="kmp-inputs">
                        <div className="kmp-input-group">
                            <span className="kmp-label">Text:</span>
                            <input
                                type="text"
                                className="kmp-text-input"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value.toUpperCase())}
                                placeholder="AABAACAADAABAABA"
                            />
                        </div>
                        <div className="kmp-input-group kmp-pattern-group">
                            <span className="kmp-label">Pattern:</span>
                            <input
                                type="text"
                                className="kmp-pattern-input"
                                value={patternInput}
                                onChange={(e) => setPatternInput(e.target.value.toUpperCase())}
                                placeholder="AABA"
                            />
                        </div>
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Search</button>
                </div>

                {/* Main Visualization */}
                <div className="kmp-main-area">
                    {/* Text + Pattern Alignment */}
                    <div className="kmp-alignment-panel">
                        <div className="kmp-panel-title">Text & Pattern Alignment</div>

                        {/* Index row */}
                        <div className="kmp-char-row kmp-index-row">
                            {text.split('').map((_, idx) => (
                                <div key={`idx-${idx}`} className="kmp-cell kmp-index-cell">{idx}</div>
                            ))}
                        </div>

                        {/* Text row */}
                        <div className="kmp-char-row">
                            {text.split('').map((ch, idx) => (
                                <div key={`t-${idx}`} className={`kmp-cell kmp-text-cell state-${getTextCharState(idx)}`}>
                                    {ch}
                                </div>
                            ))}
                        </div>

                        {/* Pattern row (shifted) */}
                        <div className="kmp-char-row kmp-pattern-row">
                            {text.split('').map((_, idx) => {
                                const shift = currentStep?.shiftIndex || 0;
                                const pIdx = idx - shift;
                                if (pIdx >= 0 && pIdx < pattern.length) {
                                    return (
                                        <div key={`p-${idx}`} className={`kmp-cell kmp-pattern-cell state-${getPatternCharState(pIdx)}`}>
                                            {pattern[pIdx]}
                                        </div>
                                    );
                                }
                                return <div key={`p-${idx}`} className="kmp-cell kmp-empty-cell"></div>;
                            })}
                        </div>

                        {/* Match indicators */}
                        {currentStep?.matches?.length > 0 && (
                            <div className="kmp-matches-bar">
                                {currentStep.matches.map((m, i) => (
                                    <span key={i} className="kmp-match-badge">Match at {m}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: LPS Table + Stats */}
                    <div className="kmp-side-panel">
                        {/* LPS Table */}
                        <div className="kmp-lps-card">
                            <div className="kmp-panel-title">LPS (Failure Function)</div>
                            {currentStep?.lps?.length > 0 ? (
                                <div className="kmp-lps-table">
                                    <div className="kmp-lps-row kmp-lps-header">
                                        {pattern.split('').map((ch, i) => (
                                            <div key={`lps-ch-${i}`} className="kmp-lps-cell">{ch}</div>
                                        ))}
                                    </div>
                                    <div className="kmp-lps-row">
                                        {currentStep.lps.map((val, i) => (
                                            <div key={`lps-v-${i}`} className={`kmp-lps-cell kmp-lps-val ${val > 0 ? 'kmp-lps-nonzero' : ''}`}>
                                                {val}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="kmp-lps-empty">Computing...</div>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="kmp-stats-card">
                            <div className="kmp-panel-title">Search Stats</div>
                            <div className="kmp-stats-grid">
                                <div className="kmp-stat">
                                    <span className="kmp-stat-label">Shift</span>
                                    <span className="kmp-stat-value">{currentStep?.shiftIndex ?? 0}</span>
                                </div>
                                <div className="kmp-stat">
                                    <span className="kmp-stat-label">Matches</span>
                                    <span className="kmp-stat-value kmp-stat-green">{currentStep?.matches?.length || 0}</span>
                                </div>
                                <div className="kmp-stat">
                                    <span className="kmp-stat-label">Step</span>
                                    <span className="kmp-stat-value">{currentStepIndex + 1}/{steps.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="kmp-legend-card">
                            <div className="kmp-legend">
                                <div className="kmp-legend-item"><div className="kmp-legend-dot kmp-lg-match"></div>Match</div>
                                <div className="kmp-legend-item"><div className="kmp-legend-dot kmp-lg-mismatch"></div>Mismatch</div>
                                <div className="kmp-legend-item"><div className="kmp-legend-dot kmp-lg-found"></div>Found</div>
                                <div className="kmp-legend-item"><div className="kmp-legend-dot kmp-lg-prefix"></div>Matched prefix</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls */}
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
