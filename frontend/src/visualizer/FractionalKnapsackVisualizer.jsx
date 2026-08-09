import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFractionalKnapsackSteps } from '../algorithms/greedy/fractionalKnapsack';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRandom, FaRedo } from 'react-icons/fa';
import './FractionalKnapsackVisualizer.css';

const DEFAULT_ITEMS = [
    { weight: 10, value: 60 },
    { weight: 20, value: 100 },
    { weight: 30, value: 120 },
    { weight: 15, value: 90 },
    { weight: 25, value: 75 }
];
const DEFAULT_CAPACITY = 50;

const FractionalKnapsackVisualizer = () => {
    const [items, setItems]               = useState(DEFAULT_ITEMS);
    const [capacity, setCapacity]         = useState(DEFAULT_CAPACITY);
    const [inputStr, setInputStr]         = useState(DEFAULT_ITEMS.map(it => `${it.weight}:${it.value}`).join(', '));
    const [capStr, setCapStr]             = useState(String(DEFAULT_CAPACITY));
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateFractionalKnapsackSteps(items, capacity),
        [items, capacity]
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
        try {
            const pairs = inputStr.split(',').map(s => s.trim()).filter(s => s !== '');
            if (pairs.length === 0) throw new Error('Need at least one item.');
            if (pairs.length > 8) throw new Error('Maximum 8 items.');

            const newItems = pairs.map((pair) => {
                const parts = pair.split(':');
                if (parts.length !== 2) throw new Error(`Invalid format "${pair}". Use weight:value.`);
                const w = parseFloat(parts[0].trim());
                const v = parseFloat(parts[1].trim());
                if (isNaN(w) || isNaN(v) || w <= 0 || v <= 0) throw new Error(`Weight and value must be positive numbers.`);
                return { weight: w, value: v };
            });

            const cap = parseFloat(capStr);
            if (isNaN(cap) || cap <= 0) throw new Error('Capacity must be a positive number.');

            setItems(newItems);
            setCapacity(cap);
            reset();
            toast.success('Knapsack updated!');
        } catch (err) {
            toast.error(err.message || 'Invalid input.');
        }
    };

    const handleRandomize = () => {
        const count = 5;
        const newItems = Array.from({ length: count }, () => ({
            weight: Math.floor(Math.random() * 25) + 5,
            value: Math.floor(Math.random() * 80) + 20
        }));
        const newCap = Math.floor(Math.random() * 40) + 30;

        setItems(newItems);
        setCapacity(newCap);
        setInputStr(newItems.map(it => `${it.weight}:${it.value}`).join(', '));
        setCapStr(String(newCap));
        reset();
        toast.success('Generated random items and capacity!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init':          return 2;
            case 'sort':          return 2;
            case 'consider':      return 6;
            case 'take-full':     return 8;
            case 'take-fraction': return 11;
            case 'skip':          return 7;
            case 'completed':     return 15;
            default:              return 0;
        }
    };

    const codeSnippet = algorithmCodes.fractionalKnapsack?.[activeLanguage] || '';
    const stepData    = currentStep || {};
    const fillPercent = currentStep ? Math.min(100, Math.max(0, ((capacity - currentStep.remainingCapacity) / capacity) * 100)) : 0;

    return (
        <DualView
            algorithmName="Fractional Knapsack (Greedy Value Density)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="greedy"
            description={
                <div className="fk-desc-wrapper">
                    <span className="fk-badge">Greedy Ratio Sorting O(N log N)</span>
                    <span className="fk-desc-text">
                        {currentStep?.description || 'Press Play to fill knapsack greedily by value/weight ratio.'}
                    </span>
                </div>
            }
        >
            <div className="fk-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="fk-input-panel">
                    <div className="fk-input-group">
                        <label className="fk-input-label">Items (w:v):</label>
                        <input
                            type="text"
                            value={inputStr}
                            onChange={(e) => setInputStr(e.target.value)}
                            placeholder="10:60, 20:100"
                            className="fk-text-input"
                        />
                    </div>

                    <div className="fk-input-group">
                        <label className="fk-input-label">Capacity:</label>
                        <input
                            type="number"
                            min="1"
                            value={capStr}
                            onChange={(e) => setCapStr(e.target.value)}
                            className="fk-number-input"
                        />
                    </div>

                    <div className="fk-btn-group">
                        <button onClick={handleApply} className="fk-btn fk-btn-primary">
                            <FaCheck /> Solve
                        </button>
                        <button onClick={handleRandomize} className="fk-btn fk-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setItems(DEFAULT_ITEMS); setCapacity(DEFAULT_CAPACITY); setInputStr(DEFAULT_ITEMS.map(it => `${it.weight}:${it.value}`).join(', ')); setCapStr(String(DEFAULT_CAPACITY)); reset(); }} className="fk-btn fk-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="fk-legend">
                        <div className="fk-leg-item"><span className="fk-dot yellow"></span> Considering</div>
                        <div className="fk-leg-item"><span className="fk-dot green"></span> Full Taken</div>
                        <div className="fk-leg-item"><span className="fk-dot blue"></span> Fraction Taken</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Sack Fill Meter & Items Grid ──────── */}
                <div className="fk-canvas-wrapper">
                    
                    {/* Capacity Fill Meter */}
                    <div className="fk-meter-card">
                        <div className="meter-header">
                            <span>Knapsack Capacity Fill</span>
                            <span className="meter-stats">
                                {stepData.totalValue !== undefined ? stepData.totalValue.toFixed(1) : 0} Value / {capacity - (stepData.remainingCapacity ?? capacity)} of {capacity} W
                            </span>
                        </div>
                        <div className="meter-track">
                            <div className="meter-bar" style={{ width: `${fillPercent}%` }}></div>
                        </div>
                    </div>

                    {/* Items Grid Cards */}
                    <div className="fk-items-grid">
                        {(stepData.items || items).map((item, idx) => {
                            const ratio = (item.value / item.weight).toFixed(2);
                            const takenAmt = stepData.takenMap?.[idx] || 0;
                            const isCurrent = stepData.currentItemIndex === idx;

                            let cardClass = 'default';
                            if (isCurrent) cardClass = 'considering';
                            if (takenAmt === 1) cardClass = 'full';
                            else if (takenAmt > 0) cardClass = 'fraction';

                            return (
                                <div key={idx} className={`fk-item-card ${cardClass}`}>
                                    <div className="item-header">Item {idx + 1}</div>
                                    <div className="item-details">
                                        <span>Weight: <strong>{item.weight}</strong></span>
                                        <span>Value: <strong>{item.value}</strong></span>
                                        <span className="ratio">Ratio: <strong>{ratio}</strong></span>
                                    </div>
                                    <div className="item-taken">
                                        Taken: <strong>{(takenAmt * 100).toFixed(0)}%</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
                <div className="fk-controls-wrapper">
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

export default FractionalKnapsackVisualizer;
