import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateEggDropSteps } from '../algorithms/dp/eggDrop';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaTable, FaBuilding, FaRedo } from 'react-icons/fa';
import './EggDropVisualizer.css';

const EggDropVisualizer = () => {
    const [config, setConfig]         = useState({ eggs: 2, floors: 10 });
    const [tempConfig, setTempConfig] = useState({ eggs: 2, floors: 10 });
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showDP, setShowDP]         = useState(false);

    const steps = useMemo(
        () => generateEggDropSteps(config.eggs, config.floors),
        [config]
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
        if (tempConfig.eggs < 1 || tempConfig.floors < 1) {
            toast.error("Please enter at least 1 egg and 1 floor.");
            return;
        }
        if (tempConfig.floors > 20) {
            toast.error("Max 20 floors allowed for clear visual layout.");
            return;
        }
        setConfig(tempConfig);
        reset();
        toast.success(`Simulation set with ${tempConfig.eggs} eggs and ${tempConfig.floors} floors!`);
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'intro':  return 1;
            case 'drop':   return 17;
            case 'result': return 18;
            case 'final':  return 23;
            default:       return 0;
        }
    };

    const renderBuilding = () => {
        const floors = [];
        for (let i = config.floors; i >= 1; i--) {
            let state = 'default';
            if (currentStep) {
                const { low, high, currentFloor, outcome } = currentStep;
                if (low !== undefined && high !== undefined && i >= low && i <= high) state = 'uncertain';
                if (i === currentFloor) {
                    if (outcome === 'pending') state = 'testing';
                    else if (outcome === 'broken') state = 'broken';
                    else if (outcome === 'survived') state = 'survived';
                }
            }

            floors.push(
                <div key={i} className={`egg-floor state-${state}`}>
                    <span className="floor-num">Floor {i}</span>
                    {state === 'testing' && <div className="egg-icon dropping">🥚 Drop</div>}
                    {state === 'broken' && <div className="egg-icon cracked">🍳 Broken</div>}
                    {state === 'survived' && <div className="egg-icon safe">🥚 Safe</div>}
                </div>
            );
        }
        return floors;
    };

    const renderDPTable = () => {
        if (!currentStep?.dpTable) return null;
        const table = currentStep.dpTable;

        return (
            <div className="egg-dp-card">
                <div className="egg-card-title">2D DP Matrix <code>dp[eggs][floors]</code></div>
                <div className="egg-dp-scroll">
                    <table className="egg-dp-table">
                        <thead>
                            <tr>
                                <th>Eggs \ Floors</th>
                                {table[0].map((_, j) => <th key={j}>{j}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {table.map((row, i) => (
                                <tr key={i}>
                                    <th>Egg {i}</th>
                                    {row.map((val, j) => (
                                        <td key={j} className={val === 0 ? 'zero' : ''}>{val}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const codeSnippet = algorithmCodes.eggDrop?.[activeLanguage] || '';
    const stepData    = currentStep || {};

    return (
        <DualView
            algorithmName="Egg Drop Problem (Min Drops Worst Case)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="dp"
            description={
                <div className="egg-desc-wrapper">
                    <span className="egg-badge">Min-Max Strategy O(Eggs × Floors²)</span>
                    <span className="egg-desc-text">
                        {currentStep?.description || "Press Play to observe binary/DP drops finding critical floor with minimum attempts."}
                    </span>
                </div>
            }
        >
            <div className="egg-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="egg-input-panel">
                    <div className="egg-input-group">
                        <label className="egg-input-label">Eggs:</label>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={tempConfig.eggs}
                            onChange={(e) => setTempConfig({ ...tempConfig, eggs: parseInt(e.target.value, 10) || 1 })}
                            className="egg-number-input"
                        />
                    </div>

                    <div className="egg-input-group">
                        <label className="egg-input-label">Floors:</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={tempConfig.floors}
                            onChange={(e) => setTempConfig({ ...tempConfig, floors: parseInt(e.target.value, 10) || 1 })}
                            className="egg-number-input"
                        />
                    </div>

                    <div className="egg-btn-group">
                        <button onClick={handleApply} className="egg-btn egg-btn-primary">
                            <FaCheck /> Start
                        </button>
                        <button onClick={() => setShowDP(!showDP)} className="egg-btn egg-btn-secondary">
                            <FaTable /> {showDP ? 'Hide DP Table' : 'Show DP Table'}
                        </button>
                        <button onClick={() => { setConfig({ eggs: 2, floors: 10 }); setTempConfig({ eggs: 2, floors: 10 }); reset(); }} className="egg-btn egg-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="egg-legend">
                        <div className="egg-leg-item"><span className="egg-dot yellow"></span> Testing Floor</div>
                        <div className="egg-leg-item"><span className="egg-dot red"></span> Egg Cracked</div>
                        <div className="egg-leg-item"><span className="egg-dot green"></span> Egg Survived</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Building Tower & Optional DP Table ─ */}
                <div className="egg-canvas-wrapper">
                    {showDP ? (
                        renderDPTable()
                    ) : (
                        <div className="egg-building-panel">
                            <div className="egg-card-title">
                                <FaBuilding /> Building Tower ({config.floors} Floors, {stepData.eggsLeft ?? config.eggs} Eggs Left)
                            </div>
                            <div className="egg-building-container">
                                {renderBuilding()}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="egg-controls-wrapper">
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

export default EggDropVisualizer;
