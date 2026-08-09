import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateCoinChangeWaysSteps } from '../algorithms/dp/coinChangeWays';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRandom, FaRedo } from 'react-icons/fa';
import './CoinChangeWaysVisualizer.css';

const DEFAULT_COINS  = [1, 2, 5];
const DEFAULT_AMOUNT = 5;

const CoinChangeWaysVisualizer = () => {
    const [coinsStr, setCoinsStr]   = useState("1, 2, 5");
    const [targetStr, setTargetStr] = useState("5");
    const [coins, setCoins]         = useState(DEFAULT_COINS);
    const [amount, setAmount]       = useState(DEFAULT_AMOUNT);
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
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const handleApply = () => {
        try {
            const parsedCoins = coinsStr.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0);
            const parsedTarget = parseInt(targetStr, 10);

            if (parsedCoins.length === 0) throw new Error("Need at least one valid coin.");
            if (isNaN(parsedTarget) || parsedTarget <= 0) throw new Error("Target amount must be a positive integer.");
            if (parsedTarget > 15) {
                toast.error("Target amount is too large for visualization (max 15).");
                return;
            }
            if (parsedCoins.length > 6) {
                toast.error("Too many coins for visualization (max 6).");
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

    const handleRandom = () => {
        const randCoins = [1, 2, 5, 10].filter(() => Math.random() > 0.3);
        if (randCoins.length === 0) randCoins.push(1);
        const randAmount = Math.floor(Math.random() * 8) + 4;

        setCoins(randCoins);
        setAmount(randAmount);
        setCoinsStr(randCoins.join(", "));
        setTargetStr(String(randAmount));
        reset();
        toast.success("Randomized coins & target!");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        switch (snapshot.type) {
            case 'init':     return 3;
            case 'checking': return 11;
            case 'updated':  return 13;
            case 'complete': return 17;
            default:         return 0;
        }
    };

    const isCellActive = (i, j) => currentStep?.activeRow === i && currentStep?.activeCol === j;
    const isCellDependency = (i, j) => {
        if (!currentStep?.dependencies) return null;
        const dep = currentStep.dependencies.find(d => d.r === i && d.c === j);
        return dep ? dep.label : null;
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
    const dpMatrix    = currentStep?.dp || currentStep?.table;

    return (
        <DualView
            algorithmName="Coin Change 2 (Total Ways)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="dp"
            description={
                <div className="ccw-desc-wrapper">
                    <span className="ccw-badge">2D DP Combinations O(N × Target)</span>
                    <span className="ccw-desc-text">
                        {currentStep?.description || "Select parameters and press Play to observe computing total combinations."}
                    </span>
                </div>
            }
        >
            <div className="ccw-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="ccw-input-panel">
                    <div className="ccw-input-group">
                        <label className="ccw-input-label">Coins:</label>
                        <input
                            type="text"
                            value={coinsStr}
                            onChange={(e) => setCoinsStr(e.target.value)}
                            placeholder="1, 2, 5"
                            className="ccw-text-input"
                        />
                    </div>

                    <div className="ccw-input-group">
                        <label className="ccw-input-label">Target Amount:</label>
                        <input
                            type="number"
                            min="1"
                            max="15"
                            value={targetStr}
                            onChange={(e) => setTargetStr(e.target.value)}
                            className="ccw-number-input"
                        />
                    </div>

                    <div className="ccw-btn-group">
                        <button onClick={handleApply} className="ccw-btn ccw-btn-primary">
                            <FaCheck /> Apply
                        </button>
                        <button onClick={handleRandom} className="ccw-btn ccw-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setCoins(DEFAULT_COINS); setAmount(DEFAULT_AMOUNT); setCoinsStr(DEFAULT_COINS.join(", ")); setTargetStr(String(DEFAULT_AMOUNT)); reset(); }} className="ccw-btn ccw-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>
                </div>

                {/* ── Main Canvas Stage: 2D DP Table Grid ───────────────── */}
                <div className="ccw-canvas-wrapper">
                    <div className="ccw-table-card">
                        <div className="ccw-card-header">
                            <span>2D DP Table <code>dp[coinIndex][amount]</code></span>
                            <div className="ccw-legend-pills">
                                <span className="leg-pill exclude">Exclude: dp[i-1][sum]</span>
                                <span className="leg-pill include">Include: dp[i][sum - coin]</span>
                            </div>
                        </div>

                        <div className="ccw-table-scroll">
                            <table className="ccw-dp-table">
                                <thead>
                                    <tr>
                                        <th className="sticky-corner">Coin \ Sum</th>
                                        {Array.from({ length: amount + 1 }, (_, j) => (
                                            <th key={j} className={currentStep?.activeCol === j ? 'col-highlight' : ''}>
                                                {j}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Base row 0 */}
                                    <tr>
                                        <th className="row-header">ø (0)</th>
                                        {Array.from({ length: amount + 1 }, (_, j) => (
                                            <td key={j} className={getCellClass(0, j)}>
                                                {dpMatrix?.[0]?.[j] ?? (j === 0 ? 1 : 0)}
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Coin rows */}
                                    {coins.map((coin, i) => (
                                        <tr key={i + 1} className={currentStep?.activeRow === i + 1 ? 'row-active' : ''}>
                                            <th className="row-header">
                                                Coin {coin}
                                            </th>
                                            {Array.from({ length: amount + 1 }, (_, j) => (
                                                <td key={j} className={getCellClass(i + 1, j)}>
                                                    {dpMatrix?.[i + 1]?.[j] ?? 0}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
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
