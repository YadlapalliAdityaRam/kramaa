import React, { useState } from 'react';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaRedo, FaSlidersH, FaRandom, FaCheck } from 'react-icons/fa';
import { MdSkipPrevious, MdSkipNext, MdReplay, MdPlayArrow, MdPause } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import './AnimationControls.css';

const AnimationControls = ({
    isPlaying,
    onPlay,
    onPause,
    onStepForward,
    onStepBackward,
    onNext, // Alias for onStepForward
    onPrev, // Alias for onStepBackward
    onReset,
    speed,
    onSpeedChange,
    currentStep = 0,
    totalSteps = 0,
    onScrub,
    onManualInput,
    onGenerateRandom,
    onOpenGraphModal,
    onOpenTreeModal,
    inputType = 'array'
}) => {
    const handleForward = onStepForward || onNext;
    const handleBackward = onStepBackward || onPrev;
    const safeTotalSteps = Number.isFinite(totalSteps) ? totalSteps : 0;
    const safeCurrentStep = Number.isFinite(currentStep) ? currentStep : 0;

    const [manualInput, setManualInput] = useState('');
    const MAX_INPUT_ELEMENTS = 10;

    const applyManualInput = () => {
        const trimmed = manualInput.trim();
        if (!trimmed) {
            toast.error('Enter at least one number.');
            return;
        }

        const parsed = trimmed
            .split(/[\s,]+/)
            .filter(Boolean)
            .map((value) => Number.parseInt(value, 10))
            .filter((value) => Number.isFinite(value));

        if (parsed.length === 0) {
            toast.error('Only numeric values are allowed.');
            return;
        }

        if (parsed.length > MAX_INPUT_ELEMENTS) {
            toast.error(`Maximum ${MAX_INPUT_ELEMENTS} elements are allowed.`);
            return;
        }

        if (onManualInput) onManualInput(parsed);
        setManualInput(parsed.join(', '));
    };

    // Calculate scrubber percentage for YouTube-style progress fill
    const maxSteps = Math.max(1, safeTotalSteps - 1);
    const progressPercent = maxSteps > 0 ? (safeCurrentStep / maxSteps) * 100 : 0;

    return (
        <div className="yt-player-controls">
            {/* YouTube Progress Scrubber Bar */}
            <div className="yt-progress-container">
                <input
                    type="range"
                    min="0"
                    max={maxSteps}
                    value={safeCurrentStep}
                    onChange={(e) => onScrub && onScrub(parseInt(e.target.value, 10))}
                    className="yt-scrubber-input"
                    style={{
                        background: `linear-gradient(to right, #ff0000 0%, #ff0000 ${progressPercent}%, var(--surface-border) ${progressPercent}%, var(--surface-border) 100%)`
                    }}
                    title="Scrub step"
                />
            </div>

            {/* Bottom Bar: YouTube Player Control Buttons */}
            <div className="yt-controls-bar">
                {/* Left Controls: Reset, Prev, Play/Pause, Next, Timestamp */}
                <div className="yt-left-controls">
                    <button onClick={onReset} title="Replay / Reset to Original State" className="yt-btn yt-icon-btn with-text">
                        <MdReplay />
                        <span className="yt-btn-text">Original State</span>
                    </button>

                    <button
                        onClick={handleBackward}
                        disabled={safeCurrentStep === 0}
                        title="Previous Step"
                        className="yt-btn yt-icon-btn"
                    >
                        <MdSkipPrevious />
                    </button>

                    <button
                        onClick={isPlaying ? onPause : onPlay}
                        className={`yt-btn yt-play-btn ${isPlaying ? 'playing' : ''}`}
                        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                    >
                        {isPlaying ? <MdPause /> : <MdPlayArrow />}
                    </button>

                    <button
                        onClick={handleForward}
                        disabled={safeCurrentStep === Math.max(0, safeTotalSteps - 1)}
                        title="Next Step"
                        className="yt-btn yt-icon-btn"
                    >
                        <MdSkipNext />
                    </button>

                    {/* Step Timestamp Counter */}
                    <div className="yt-time-display">
                        <span className="yt-step-current">{safeCurrentStep + 1}</span>
                        <span className="yt-step-divider">/</span>
                        <span className="yt-step-total">{safeTotalSteps || 1}</span>
                    </div>
                </div>

                {/* Right Controls: Speed Selector */}
                <div className="yt-right-controls">
                    <div className="yt-speed-menu">
                        <span className="yt-speed-label"><FaSlidersH /></span>
                        {[0.5, 1, 1.5, 2, 4].map(s => (
                            <button
                                key={s}
                                className={`yt-speed-btn ${speed === s ? 'active' : ''}`}
                                onClick={() => onSpeedChange(s)}
                                title={`${s}x Speed`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Input Configuration Box */}
            <div className="yt-input-config">
                {inputType === 'graph' ? (
                    <div className="yt-modal-btn-wrapper">
                        <button onClick={onOpenGraphModal} className="yt-action-btn primary full">
                            Configure Custom Graph
                        </button>
                    </div>
                ) : inputType === 'tree' ? (
                    <div className="yt-modal-btn-wrapper">
                        <button onClick={onOpenTreeModal} className="yt-action-btn primary full">
                            Configure Custom Tree
                        </button>
                    </div>
                ) : (inputType === 'string' || inputType === 'none') ? null : (
                    <>
                        <div className="yt-manual-input-box">
                            <input
                                type="text"
                                placeholder="Custom Array (e.g. 50, 10, 20 max 10)"
                                value={manualInput}
                                onChange={(event) => setManualInput(event.target.value)}
                                className="yt-text-input"
                            />
                            <div className="yt-btn-row">
                                <button onClick={applyManualInput} className="yt-action-btn primary">
                                    <FaCheck /> Set Array
                                </button>
                                <button onClick={() => {
                                    const count = Math.floor(Math.random() * 6) + 5; // 5-10
                                    const arr = Array.from({ length: count }, () => Math.floor(Math.random() * 99) + 1);
                                    setManualInput(arr.join(', '));
                                    if (onManualInput) onManualInput(arr);
                                    else if (onGenerateRandom) onGenerateRandom();
                                }} title="Generate Random Array" className="yt-action-btn secondary">
                                    <FaRandom /> Randomize
                                </button>
                            </div>
                        </div>
                        <div className="yt-help-hint">
                            Enter up to 10 numbers separated by commas or spaces.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AnimationControls;
