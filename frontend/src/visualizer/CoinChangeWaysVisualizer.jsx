import React, { useState, useEffect, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateCoinChangeWaysSteps } from '../algorithms/dp/coinChangeWays';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './CoinChangeWaysVisualizer.css';

const CoinChangeWaysVisualizer = () => {
    const [coinsStr, setCoinsStr] = useState("1, 2, 5");
    const [targetStr, setTargetStr] = useState("5");
    const [coins, setCoins] = useState([1, 2, 5]);
    const [amount, setAmount] = useState(5);
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateCoinChangeWaysSteps(coins, amount), [coins, amount]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        speed,
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const handleApply = () => {
        try {
            const parsedCoins = coinsStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
            const parsedTarget = parseInt(targetStr);

            if (parsedCoins.length === 0) throw new Error("Need at least one valid coin.");
            if (isNaN(parsedTarget) || parsedTarget <= 0) throw new Error("Target amount must be a positive integer.");
            if (parsedTarget > 30) {
                toast.error("Target amount is too large for visualization (max 30).");
                return;
            }
            if (parsedCoins.length > 8) {
                toast.error("Too many coins for visualization (max 8).");
                return;
            }

            setCoins([...new Set(parsedCoins)].sort((a, b) => a - b));
            setAmount(parsedTarget);
            reset();
            toast.success("Updated parameters!");
        } catch (error) {
            toast.error(error.message || "Invalid input format.");
        }
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'init': return 4;
            case 'checking': return 11;
            case 'updated': return 12;
            case 'complete': return 15;
            default: return 0;
        }
    };

    const isCellActive = (i, j) => currentStep?.activeRow === i && currentStep?.activeCol === j;
    const isCellDependency = (i, j) => {
        if (!currentStep?.dependencies) return null;
        const dep = currentStep.dependencies.find(d => d.r === i && d.c === j);
        return dep ? dep.label : null; // 'include' or 'exclude'
    };

    const getCellClass = (i, j) => {
        if (currentStep?.type === 'complete' && i === coins.length && j === amount) return 'cell-result';
        if (isCellActive(i, j)) {
            return currentStep.type === 'updated' ? 'cell-updated' : 'cell-active';
        }
        const depType = isCellDependency(i, j);
        if (depType === 'exclude') return 'cell-exclude';
        if (depType === 'include') return 'cell-include';
        return '';
    };

    const codeSnippet = algorithmCodes.coinChangeWays?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Coin Change 2 (Total Ways)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Select parameters and press Play."}
        >
            <div className="ccw-container">
                {/* Inputs */}
                <div className="ccw-input-bar">
                    <div className="ccw-inputs">
                        <div className="ccw-input-group">
                            <span className="ccw-label">Coins (comma separated):</span>
                            <input
                                type="text"
                                className="ccw-array-input"
                                value={coinsStr}
                                onChange={(e) => setCoinsStr(e.target.value)}
                                placeholder="1, 2, 5"
                            />
                        </div>
                        <div className="ccw-input-group">
                            <span className="ccw-label">Target Amount:</span>
                            <input
                                type="number"
                                className="ccw-target-input"
                                value={targetStr}
                                onChange={(e) => setTargetStr(e.target.value)}
                                placeholder="5"
                                min="1"
                                max="30"
                            />
                        </div>
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Generate Table</button>
                </div>

                {/* Main Visualization */}
                <div className="ccw-main-area">
                    {/* DP Table */}
                    <div className="ccw-table-container">
                        <table className="ccw-table">
                            <thead>
                                <tr>
                                    <th className="row-header">Coins \ Sum</th>
                                    {Array.from({ length: amount + 1 }).map((_, j) => (
                                        <th key={`col-${j}`}>{j}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentStep?.dp && currentStep.dp.map((row, i) => (
                                    <tr key={`row-${i}`}>
                                        <th className="row-header">
                                            {i === 0 ? "0 (Base)" : `[${coins.slice(0, i).join(',')}]`}
                                        </th>
                                        {row.map((val, j) => (
                                            <td key={`cell-${i}-${j}`}>
                                                <div className={`ccw-cell ${getCellClass(i, j)}`}>
                                                    {val}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Data Panel */}
                    <div className="ccw-side-panel">
                        <div className="ccw-info-card">
                            <div className="ccw-info-title">Logic Breakdown</div>
                            {currentStep?.type === 'checking' || currentStep?.type === 'updated' ? (
                                <div className="ccw-formula-box">
                                    <div className="ccw-formula-row">
                                        <span className="ccw-formula-label">Current Coin:</span>
                                        <span className="ccw-formula-value">{currentStep.coin}</span>
                                    </div>
                                    <div className="ccw-formula-row">
                                        <span className="ccw-formula-label">Target Sum:</span>
                                        <span className="ccw-formula-value">{currentStep.currentAmount}</span>
                                    </div>
                                    <div className="ccw-calc-result">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Exclude Coin {currentStep.coin} (Above)</span>
                                            <span className="ccw-formula-value ccw-f-blue">{currentStep.excludeWays} ways</span>
                                        </div>
                                        <span style={{ color: '#64748b' }}>+</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Include Coin {currentStep.coin} (Left)</span>
                                            <span className="ccw-formula-value ccw-f-pink">{currentStep.includeWays} ways</span>
                                        </div>
                                        <span style={{ color: '#64748b' }}>=</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Ways</span>
                                            <span className="ccw-formula-value ccw-f-green">{currentStep.type === 'updated' ? currentStep.cellValue : '?'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: '#64748b', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                                    {currentStep?.type === 'complete' ? "Algorithm Finished." : "Press Play to begin computation."}
                                </div>
                            )}

                            <div className="ccw-legend">
                                <div className="ccw-info-title" style={{ marginTop: '10px', marginBottom: '10px' }}>Legend</div>
                                <div className="ccw-legend-item"><div className="ccw-legend-color ccw-l-yellow"></div> Current Target Cell</div>
                                <div className="ccw-legend-item"><div className="ccw-legend-color ccw-l-blue"></div> Exclude Coin (Row Above)</div>
                                <div className="ccw-legend-item"><div className="ccw-legend-color ccw-l-pink"></div> Include Coin (Same Row, Left)</div>
                                <div className="ccw-legend-item"><div className="ccw-legend-color ccw-l-green"></div> Computed Cell</div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="ccw-controls-wrapper">
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

export default CoinChangeWaysVisualizer;
