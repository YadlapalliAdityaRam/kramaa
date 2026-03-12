import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DualView from "./DualView";
import AnimationControls from "../components/animation-controls/AnimationControls";
import useGenericAnimation from "../hooks/useGenericAnimation";
import { generateCoinChangeSteps } from "../algorithms/dp/coinChange";
import { algorithmCodes } from "../data/algorithmCodes";
import "./CoinChangeVisualizer.css";

const CoinChangeVisualizer = () => {
    const [amount, setAmount] = useState(6);
    const [coins, setCoins] = useState([1, 3, 4]);
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
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const stepData = currentStep || {};
    const { table, cellStates, description, type } = stepData;

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        const desc = snapshot.description || "";
        switch (true) {
            case desc.includes("Using coin"): return 28;
            case desc.includes("dp[") && desc.includes("="): return 42;
            case snapshot.type === 'dp-complete': return 71;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.coinChange?.[activeLanguage] || "";

    // Extract current amount and coin from description for UI highlighting
    const amtMatch = description?.match(/Amount (\d+)/);
    const coinMatch = description?.match(/coin (\d+)/);
    const currentAmt = amtMatch ? parseInt(amtMatch[1]) : -1;
    const currentCoin = coinMatch ? parseInt(coinMatch[1]) : -1;

    return (
        <DualView
            algorithmName="Coin Change (DP)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={description || "Press Play to find the minimum coins needed."}
        >
            <div className="coin-change-container">
                <div className="dp-array-container">
                    {table && table[0].map((val, i) => {
                        const state = cellStates?.[`0-${i}`] || 'default';
                        // Check if this cell is a dependency (i - coin)
                        const isDependency = currentAmt !== -1 && currentCoin !== -1 && i === currentAmt - currentCoin;

                        return (
                            <motion.div
                                key={i}
                                className={`dp-cell ${state} ${isDependency ? 'dependency' : ''}`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <span className="cell-index">{i}</span>
                                <span className="cell-value">{val}</span>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="coins-info-panel">
                    <div className="coins-display">
                        <div className="info-label" style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>AVAILABLE COINS</div>
                        <div className="coins-grid">
                            {coins.map(c => (
                                <div key={c} className={`coin-chip ${c === currentCoin ? 'active' : ''}`}>
                                    {c}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="decision-box">
                        <div className="info-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>DECISION LOGIC</div>
                        <div className="logic-step">
                            {description && description.includes("Using coin") ? (
                                <>
                                    <span>Current Amount: {currentAmt}</span><br />
                                    <span>Try Coin: {currentCoin}</span><br />
                                    <span>min_coins = dp[{currentAmt} - {currentCoin}] + 1</span>
                                </>
                            ) : (
                                <span>Waiting for step...</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="controls-section">
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
