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
    onReset,
    speed,
    onSpeedChange,
    currentStep,
    totalSteps,
    onScrub,
    onManualInput,
    onGenerateRandom,
    onOpenGraphModal,
    inputType = 'array'
}) => {
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
            <div className="controls-group">
                <button onClick={onReset} title="Reset" className="control-btn icon-btn">
                    <FaRedo />
                </button>
                <button onClick={onStepBackward} disabled={currentStep === 0} title="Step Back" className="control-btn icon-btn">
                    <FaStepBackward />
                </button>
                <button onClick={isPlaying ? onPause : onPlay} className="control-btn play-btn" title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button onClick={onStepForward} disabled={currentStep === totalSteps - 1} title="Step Forward" className="control-btn icon-btn">
                    <FaStepForward />
                </button>
            </div>

            <div className="scrubber-container">
                <input
                    type="range"
                    min="0"
                    max={Math.max(0, totalSteps - 1)}
                    value={currentStep}
                    onChange={(e) => onScrub(parseInt(e.target.value, 10))}
                    className="scrubber-input"
                />
                <span className="step-counter">{currentStep + 1} / {totalSteps || 1}</span>
            </div>

            <div className="speed-control">
                <label>Speed: {speed}x</label>
                <input
                    type="range"
                    min="0.5"
                    max="4"
                    step="0.5"
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                />
            </div>

            <div style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                {inputType === 'graph' ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={onOpenGraphModal} className="control-btn play-btn">
                            Configure Custom Graph
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="e.g. 50, 10, 20 (max 10)"
                                value={manualInput}
                                onChange={(event) => setManualInput(event.target.value)}
                                style={{
                                    background: '#1e1e1e',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#f5f5f5',
                                    padding: '0 12px',
                                    borderRadius: '14px',
                                    flex: 1,
                                    height: '44px',
                                    fontSize: '0.92rem',
                                    fontWeight: '500'
                                }}
                            />
                            <button onClick={applyManualInput} className="control-btn">
                                Set
                            </button>
                            <button onClick={onGenerateRandom} title="Randomize Input" className="control-btn">
                                Random
                            </button>
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
