import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCoinChangeSteps } from "../algorithms/dp/coinChange";
import { algorithmCodes } from "../data/algorithmCodes";
import { toast } from "react-hot-toast";
import { FaCoins, FaCheck, FaRandom, FaRedo } from "react-icons/fa";
import "./CoinChangeVisualizer.css";

const DEFAULT_COINS  = [1, 3, 4];
const DEFAULT_AMOUNT = 6;

const CoinChangeVisualizer = () => {
    const [amount, setAmount]             = useState(DEFAULT_AMOUNT);
    const [coins, setCoins]               = useState(DEFAULT_COINS);
    const [coinInput, setCoinInput]       = useState(DEFAULT_COINS.join(", "));
    const [amountInput, setAmountInput]   = useState(String(DEFAULT_AMOUNT));
    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateCoinChangeSteps(coins, amount), [coins, amount]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        speed,
        setSpeed,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { table, cellStates, description } = stepData;

    const handleApply = () => {
        const parsedCoins = coinInput.split(",")
            .map(c => parseInt(c.trim(), 10))
            .filter(c => !isNaN(c) && c > 0);
        const parsedAmount = parseInt(amountInput, 10);

        if (parsedCoins.length === 0) {
            toast.error("Enter at least one positive coin denomination.");
            return;
        }
        if (isNaN(parsedAmount) || parsedAmount < 1 || parsedAmount > 20) {
            toast.error("Target amount should be between 1 and 20.");
            return;
        }

        setCoins(parsedCoins);
        setAmount(parsedAmount);
        reset();
        toast.success("Updated Coin Change parameters!");
    };

    const handleRandom = () => {
        const randCoins = [1, 2, 5].filter(() => Math.random() > 0.2);
        if (randCoins.length === 0) randCoins.push(1);
        const randAmount = Math.floor(Math.random() * 8) + 5;

        setCoins(randCoins);
        setAmount(randAmount);
        setCoinInput(randCoins.join(", "));
        setAmountInput(String(randAmount));
        reset();
        toast.success("Randomized coins & amount!");
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        if (desc.includes("Using coin")) return 7;
        if (desc.includes("dp[") && desc.includes("=")) return 8;
        if (snapshot.type === 'dp-complete' || snapshot.type === 'complete') return 11;
        return 5;
    };

    const codeSnippet = algorithmCodes.coinChange?.[activeLanguage] || "";

    const amtMatch   = description?.match(/Amount (\d+)/);
    const coinMatch  = description?.match(/coin (\d+)/);
    const currentAmt = amtMatch ? parseInt(amtMatch[1], 10) : -1;
    const currentCoin= coinMatch ? parseInt(coinMatch[1], 10) : -1;

    return (
        <DualView
            algorithmName="Coin Change (Minimum Coins)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="dp"
            description={
                <div className="cc-desc-wrapper">
                    <span className="cc-badge">Dynamic Programming O(N × Target)</span>
                    <span className="cc-desc-text">
                        {description || "Press Play to observe computing minimum coins for target amount."}
                    </span>
                </div>
            }
        >
            <div className="cc-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="cc-input-panel">
                    <div className="cc-input-group">
                        <label className="cc-input-label">Coins:</label>
                        <input
                            type="text"
                            value={coinInput}
                            onChange={(e) => setCoinInput(e.target.value)}
                            placeholder="1, 3, 4"
                            className="cc-text-input"
                        />
                    </div>

                    <div className="cc-input-group">
                        <label className="cc-input-label">Target Amount:</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                            className="cc-number-input"
                        />
                    </div>

                    <div className="cc-btn-group">
                        <button onClick={handleApply} className="cc-btn cc-btn-primary">
                            <FaCheck /> Apply
                        </button>
                        <button onClick={handleRandom} className="cc-btn cc-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setCoins(DEFAULT_COINS); setAmount(DEFAULT_AMOUNT); setCoinInput(DEFAULT_COINS.join(", ")); setAmountInput(String(DEFAULT_AMOUNT)); reset(); }} className="cc-btn cc-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>
                </div>

                {/* ── Main Canvas Stage: DP Table & Coins Panel ──────────── */}
                <div className="cc-canvas-wrapper">
                    
                    {/* DP Table Array Row */}
                    <div className="cc-card">
                        <div className="cc-card-title">
                            <span>1D DP Array <code>dp[amount]</code> (Min Coins)</span>
                        </div>
                        <div className="cc-dp-row">
                            {table && table[0].map((val, i) => {
                                const state = cellStates?.[`0-${i}`] || 'default';
                                const isDependency = currentAmt !== -1 && currentCoin !== -1 && i === currentAmt - currentCoin;
                                const isInf = val === Infinity || val === 999999 || val === "∞";

                                return (
                                    <motion.div
                                        key={i}
                                        className={`cc-dp-cell ${state} ${isDependency ? 'dependency' : ''}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <span className="cell-idx">amt: {i}</span>
                                        <span className="cell-val">{isInf ? '∞' : val}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Information Grid: Denominations + Transition Formula */}
                    <div className="cc-info-grid">
                        <div className="cc-card">
                            <div className="cc-card-title">Available Coins</div>
                            <div className="coins-grid">
                                {coins.map(c => (
                                    <div key={c} className={`coin-chip ${c === currentCoin ? 'active' : ''}`}>
                                        <FaCoins /> {c}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="cc-card">
                            <div className="cc-card-title">DP Transition Formula</div>
                            <div className="cc-logic-step">
                                {description && description.includes("Using coin") ? (
                                    <code>
                                        dp[{currentAmt}] = min(dp[{currentAmt}], dp[{currentAmt} - {currentCoin}] + 1)
                                    </code>
                                ) : (
                                    <code>dp[i] = min(dp[i], dp[i - coin] + 1)</code>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="cc-controls-wrapper">
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

export default CoinChangeVisualizer;
