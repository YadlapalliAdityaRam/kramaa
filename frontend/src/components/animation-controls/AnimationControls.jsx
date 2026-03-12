import React, { useState } from 'react';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaRedo } from 'react-icons/fa';
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

    return (
        <div className="animation-controls">
            <div className="ac-top-row">
                {/* Control Buttons (Reset, Back, Play/Pause, Forward) */}
                <div className="controls-group">
                    <button onClick={onReset} title="Reset" className="control-btn icon-btn">
                        <FaRedo />
                    </button>
                    <button onClick={handleBackward} disabled={safeCurrentStep === 0} title="Step Back" className="control-btn icon-btn">
                        <FaStepBackward />
                    </button>
                    <button onClick={isPlaying ? onPause : onPlay} className="control-btn play-btn" title={isPlaying ? 'Pause' : 'Play'}>
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button onClick={handleForward} disabled={safeCurrentStep === Math.max(0, safeTotalSteps - 1)} title="Step Forward" className="control-btn icon-btn">
                        <FaStepForward />
                    </button>
                </div>

                {/* Speed Controls */}
                <div className="speed-control-group">
                    {[0.5, 1, 1.5, 2, 4].map(s => (
                        <button
                            key={s}
                            className={`speed-btn ${speed === s ? 'active' : ''}`}
                            onClick={() => onSpeedChange(s)}
                            title={`${s}x Speed`}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrubber and Step Tracker */}
            <div className="scrubber-container">
                <input
                    type="range"
                    min="0"
                    max={Math.max(0, safeTotalSteps - 1)}
                    value={safeCurrentStep}
                    onChange={(e) => onScrub && onScrub(parseInt(e.target.value, 10))}
                    className="scrubber-input"
                    title="Scrub through steps"
                />
                <div className="step-tracker-badge">
                    Step {safeCurrentStep + 1} / {safeTotalSteps || 1}
                </div>
            </div>

            {/* Input Configuration Box */}
            <div>
                {inputType === 'graph' ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={onOpenGraphModal} className="control-btn play-btn">
                            Configure Custom Graph
                        </button>
                    </div>
                ) : inputType === 'tree' ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={onOpenTreeModal} className="control-btn play-btn">
                            Configure Custom Tree
                        </button>
                    </div>
                ) : (inputType === 'string' || inputType === 'none') ? null : (
                    <>
                        <div className="ac-manual-input-box">
                            <input
                                type="text"
                                placeholder="Auto Array (e.g. 50, 10, 20 max 10)"
                                value={manualInput}
                                onChange={(event) => setManualInput(event.target.value)}
                                style={{
                                    background: 'rgba(0,0,0,0.15)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#f5f5f5',
                                    padding: '0 16px',
                                    borderRadius: '12px',
                                    flex: 1,
                                    height: '44px',
                                    fontSize: '0.92rem',
                                    fontWeight: '500',
                                    outline: 'none'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={applyManualInput} className="ac-action-btn primary">
                                    Set array
                                </button>
                                <button onClick={() => {
                                    const count = Math.floor(Math.random() * 6) + 5; // 5-10
                                    const arr = Array.from({ length: count }, () => Math.floor(Math.random() * 99) + 1);
                                    setManualInput(arr.join(', '));
                                    if (onManualInput) onManualInput(arr);
                                    else if (onGenerateRandom) onGenerateRandom();
                                }} title="Randomize" className="ac-action-btn">
                                    Randomize
                                </button>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#cfcfcf', marginTop: '6px', fontWeight: '500' }}>
                            Enter up to 10 numbers separated by commas or spaces.
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AnimationControls;
