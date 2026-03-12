import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateRodCuttingSteps } from '../algorithms/dp/rodCutting';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaPlay, FaRandom, FaRulerHorizontal } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './RodCuttingVisualizer.css';

const RodCuttingVisualizer = () => {
    const [priceInput, setPriceInput] = useState('2, 5, 7, 8, 10, 17, 17, 20');
    const [prices, setPrices] = useState([2, 5, 7, 8, 10, 17, 17, 20]);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => generateRodCuttingSteps(prices), [prices]);

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

    useEffect(() => {
        reset();
    }, [prices]);

    const handleApply = () => {
        const parsed = priceInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (parsed.length === 0) {
            toast.error("Please enter valid prices.");
            return;
        }
        if (parsed.length > 12) {
            toast.error("Maximum 12 lengths allowed for clear visualization.");
            return;
        }
        setPrices(parsed);
        toast.success("Prices applied");
    };

    const handleRandomize = () => {
        const length = Math.floor(Math.random() * 5) + 5; // 5 to 9
        let lastParams = 0;
        const randomArr = Array.from({ length }, (_, i) => {
            const val = lastParams + Math.floor(Math.random() * 4) + 1; // gradually increasing
            lastParams = val;
            return val;
        });
        setPrices(randomArr);
        setPriceInput(randomArr.join(', '));
        toast.success("Prices randomized");
    };

    const codeSnippet = algorithmCodes.rodCutting?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'evaluating-length': return 13;
            case 'evaluating-cut': return 16;
            case 'new-best-cut': return 19;
            case 'length-computed': return 26;
            case 'completed': return 39;
            default: return 0;
        }
    };

    const maxLength = prices.length;
    const currentLen = currentStep?.currentLength || 0;
    const activeCut = currentStep?.cutChoice || 0;
    const remainder = currentStep?.remainder || 0;
    const dpTable = currentStep?.dpTable || new Array(maxLength + 1).fill(0);
    const pTable = currentStep?.prices || [0, ...prices];

    // Helper: Render the visual rod bar
    const renderRod = (size, type) => {
        if (size <= 0) return null;
        return (
            <div className={`rc-rod-segment ${type}`} style={{ width: `${(size / maxLength) * 100}%` }}>
                <span className="rc-rod-label">L={size}</span>
            </div>
        );
    };

    return (
        <DualView
            algorithmName="Rod Cutting"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Find maximum profit by evaluating smaller cut combinations."}
        >
            <div className="rc-container">
                <div className="rc-input-bar">
                    <div className="rc-input-group">
                        <label>Price List:</label>
                        <input
                            type="text"
                            className="rc-value-input"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="e.g. 2, 5, 7, 8"
                        />
                    </div>
                    <button className="rc-btn btn-primary" onClick={handleApply}>
                        <FaPlay style={{fontSize: '0.8rem'}} /> Apply
                    </button>
                    <button className="rc-btn btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                </div>

                <div className="rc-visual-workspace">
                    <div className="panel-label">
                        <FaRulerHorizontal /> Rod Visualizer
                    </div>

                    <div className="rc-rod-workspace">
                        {currentStep?.type === 'completed' && currentStep.optimalCuts ? (
                            <div className="rc-rod-display optimal-cut-view">
                                {currentStep.optimalCuts.map((cut, idx) => (
                                    <div key={idx} className="rc-rod-segment optimal" style={{ width: `${(cut / maxLength) * 100}%` }}>
                                        <div className="rc-rod-label">L={cut}</div>
                                        <div className="rc-rod-price">${pTable[cut]}</div>
                                    </div>
                                ))}
                            </div>
                        ) : currentLen > 0 ? (
                            <div className="rc-rod-displaying-eval">
                                <div className="rc-rod-title">Target Rod (L={currentLen})</div>
                                <div className="rc-rod-display active-rod">
                                    {activeCut > 0 ? (
                                        <>
                                            <div className="rc-rod-segment cut-piece" style={{ width: `${(activeCut / currentLen) * 100}%` }}>
                                                <div className="rc-rod-label">Cut={activeCut}</div>
                                                <div className="rc-rod-price">${pTable[activeCut]}</div>
                                            </div>
                                            {remainder > 0 && (
                                                <div className="rc-rod-segment remainder-piece" style={{ width: `${(remainder / currentLen) * 100}%` }}>
                                                    <div className="rc-rod-label">Rem={remainder}</div>
                                                    <div className="rc-rod-price">DP=${dpTable[remainder]}</div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="rc-rod-segment building-piece" style={{ width: '100%' }}>
                                            Preparing cuts...
                                        </div>
                                    )}
                                </div>
                                {activeCut > 0 && (
                                    <div className="rc-eval-equation">
                                        Profit = <span className="blue-txt">${pTable[activeCut]}</span> + <span className="purple-txt">${dpTable[remainder]}</span> = <strong>${currentStep.evalProfit}</strong>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rc-rod-placeholder">Click Play to begin cutting.</div>
                        )}
                    </div>

                    <div className="panel-label" style={{marginTop: '2rem'}}>
                        Dynamic Programming Table
                    </div>

                    <div className="rc-dp-table-container">
                        <table className="rc-dp-table">
                            <thead>
                                <tr>
                                    <th>Length (L)</th>
                                    {Array.from({ length: maxLength + 1 }, (_, i) => (
                                        <th key={i} className={currentLen === i ? 'active-col' : ''}>{i}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Price</td>
                                    {pTable.map((p, i) => (
                                        <td key={i} className={activeCut === i && currentStep?.type !== 'completed' ? 'active-price' : ''}>${p}</td>
                                    ))}
                                </tr>
                                <tr>
                                    <td>Max Profit (DP)</td>
                                    {dpTable.map((val, i) => {
                                        let cellClass = '';
                                        if (currentStep?.type === 'evaluating-length' && i === currentLen) cellClass = 'computing-cell';
                                        else if (currentStep?.type === 'evaluating-cut' && i === currentLen) cellClass = 'computing-cell';
                                        else if (currentStep?.type === 'new-best-cut' && i === currentLen) cellClass = 'best-profit-cell';
                                        else if (currentStep?.type === 'length-computed' && i === currentLen) cellClass = 'dp-updated-cell';
                                        else if (currentStep?.type !== 'completed' && i < currentLen) cellClass = 'dp-locked-cell';
                                        else if (currentStep?.type === 'completed') cellClass = 'dp-finished-cell';

                                        if (i === remainder && activeCut > 0 && currentStep?.type !== 'completed') cellClass += ' remainder-lookup';

                                        return (
                                            <td key={i} className={cellClass}>
                                                {i > currentLen && currentStep?.type !== 'completed' ? '-' : `$${val}`}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rc-footer">
                    <div className="rc-legend">
                        <div className="leg-item"><span className="dot yellow"></span> Target Length (L={currentLen})</div>
                        <div className="leg-item"><span className="dot blue"></span> Making Cut</div>
                        <div className="leg-item"><span className="dot purple"></span> Remainder lookup in DP</div>
                        <div className="leg-item"><span className="dot green"></span> Best Profit Update</div>
                    </div>
                </div>

                <div className="rc-controls-wrapper">
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

                {/* Education Panel */}
                <div className="cs-education-panel">
                    <div className="cs-edu-grid">
                        <div className="cs-edu-section">
                            <h3>How It Works</h3>
                            <p>
                                The Rod Cutting problem is a classic dynamic programming problem. Given a rod of length <i>n</i> and an array of prices that includes prices of all pieces of size smaller than <i>n</i>. Determine the maximum value obtainable by cutting up the rod and selling the pieces.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Dynamic Programming Approach</h3>
                            <p>
                                Instead of solving the same overlapping subproblems repeatedly (like a naive recursive solution), we use memoization or tabulation. 
                                We build a table `dp` where `dp[i]` stores the maximum profit for a rod of length `i`. To calculate `dp[i]`, we try cutting 
                                a piece of length `j` (from 1 to `i`), and add its price to `dp[i - j]`.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time Complexity</span>
                                    <span style={{ color: '#fbbf24' }}>O(n²)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#34d399' }}>O(n)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Method</span>
                                    <span style={{ color: '#6366f1' }}>Dynamic Programming</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Optimal Substructure</span>
                                    <span style={{ color: '#34d399' }}>Yes</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Overlapping Subproblems</span>
                                    <span style={{ color: '#34d399' }}>Yes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default RodCuttingVisualizer;
