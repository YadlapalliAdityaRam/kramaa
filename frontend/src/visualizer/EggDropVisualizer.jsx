import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateEggDropSteps } from '../algorithms/dp/eggDrop';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './EggDropVisualizer.css';

const EggDropVisualizer = () => {
    const [config, setConfig] = useState({ eggs: 2, floors: 10 });
    const [tempConfig, setTempConfig] = useState({ eggs: 2, floors: 10 });
    const [activeLanguage, setActiveLanguage] = useState('javascript');
    const [showDP, setShowDP] = useState(false);

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
        setConfig(tempConfig);
        reset();
        toast.success(`Simulation restarted with ${tempConfig.eggs} eggs and ${tempConfig.floors} floors!`);
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        // Lines based on a standard DP implementation structure
        switch (step.type) {
            case 'intro': return 1;
            case 'drop': return 35;
            case 'result': return 38;
            case 'final': return 65;
            default: return 0;
        }
    };

    const renderBuilding = () => {
        const floors = [];
        for (let i = config.floors; i >= 1; i--) {
            let state = 'default';
            if (currentStep) {
                const { low, high, currentFloor, outcome } = currentStep;

                // Highlight the range being considered
                if (i >= low && i <= high) state = 'uncertain';

                // Specific floor being tested
                if (i === currentFloor) {
                    if (outcome === 'pending') state = 'testing';
                    else if (outcome === 'broken') state = 'broken';
                    else if (outcome === 'survived') state = 'survived';
                }

                // Persistent states for previously tested floors
                // (Note: For simplicity, we use the step-provided 'low' and 'high' to shade)
            }

            floors.push(
                <div key={i} className={`egg-floor state-${state}`}>
                    <span className="floor-num">{i}</span>
                    {state === 'testing' && <div className="egg-icon dropping">🥚</div>}
                    {state === 'broken' && <div className="egg-icon cracked">🍳</div>}
                    {state === 'survived' && <div className="egg-icon safe">🥚</div>}
                </div>
            );
        }
        return floors;
    };

    const renderDPTable = () => {
        if (!currentStep?.dpTable) return null;
        const table = currentStep.dpTable;

        return (
            <div className="egg-dp-scroll">
                <table className="egg-dp-table">
                    <thead>
                        <tr>
                            <th>E \ F</th>
                            {table[0].map((_, j) => <th key={j}>{j}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {table.map((row, i) => (
                            <tr key={i}>
                                <td><strong>{i}</strong></td>
                                {row.map((val, j) => (
                                    <td key={j} className={val === 0 ? 'zero' : ''}>{val}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Egg Drop Problem (Optimal Strategy)"
            code={algorithmCodes.eggDrop?.[activeLanguage] || ''}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Select floor to drop and minimize worst-case trials."}
        >
            <div className="egg-container">
                <div className="egg-controls-top">
                    <div className="input-group">
                        <label>Eggs:</label>
                        <input
                            type="number" min="1" max="5"
                            value={tempConfig.eggs}
                            onChange={(e) => setTempConfig({ ...tempConfig, eggs: parseInt(e.target.value) })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Floors:</label>
                        <input
                            type="number" min="1" max="20"
                            value={tempConfig.floors}
                            onChange={(e) => setTempConfig({ ...tempConfig, floors: parseInt(e.target.value) })}
                        />
                    </div>
                    <button className="apply-btn" onClick={handleApply}>Reset Simulation</button>
                    <button className="toggle-dp-btn" onClick={() => setShowDP(!showDP)}>
                        {showDP ? 'Show Building' : 'Show DP Table'}
                    </button>
                </div>

                <div className="egg-visual-center">
                    {showDP ? (
                        <div className="dp-view-container">
                            <h4>Dynamic Programming Table</h4>
                            <p className="subtext">dp[eggs][floors] = Minimum attempts in worst case</p>
                            {renderDPTable()}
                        </div>
                    ) : (
                        <div className="building-view">
                            <div className="building-stats">
                                <div className="stat-pill">Remaining Eggs: <strong>{currentStep?.eggsLeft ?? config.eggs}</strong></div>
                                <div className="stat-pill">Total Drops: <strong>{currentStep?.totalDrops ?? 0}</strong></div>
                            </div>
                            <div className="building-skyline">
                                {renderBuilding()}
                            </div>
                        </div>
                    )}
                </div>

                <div className="egg-educational-note">
                    <strong>💡 Intuition:</strong> We balance the risk. If the egg breaks, we search below with one less egg. If it survives, we search above with the same number of eggs.
                </div>

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
