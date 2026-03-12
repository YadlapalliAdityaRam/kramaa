import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateFractionalKnapsackSteps } from '../algorithms/greedy/fractionalKnapsack';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
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
    const [items, setItems] = useState(DEFAULT_ITEMS);
    const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
    const [inputStr, setInputStr] = useState(
        DEFAULT_ITEMS.map(it => `${it.weight}:${it.value}`).join(', ')
    );
    const [capStr, setCapStr] = useState(String(DEFAULT_CAPACITY));
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateFractionalKnapsackSteps(items, capacity),
        [items, capacity]
    );

    const {
        currentStep, currentStepIndex, isPlaying,
        play, pause, reset, stepForward, stepBackward,
        setIndex, speed, setSpeed
    } = useGenericAnimation(steps);

    const handleApply = () => {
        try {
            const pairs = inputStr.split(',').map(s => s.trim()).filter(s => s !== '');
            if (pairs.length === 0) throw new Error('Need at least one item.');
            if (pairs.length > 10) throw new Error('Maximum 10 items.');

            const newItems = pairs.map((pair, idx) => {
                const parts = pair.split(':');
                if (parts.length !== 2) throw new Error(`Invalid format "${pair}". Use weight:value.`);
                const w = parseFloat(parts[0].trim());
                const v = parseFloat(parts[1].trim());
                if (isNaN(w) || isNaN(v)) throw new Error(`Non-numeric values in "${pair}".`);
                if (w <= 0 || v <= 0) throw new Error(`Weight and value must be positive in "${pair}".`);
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

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 2;
            case 'sort': return 4;
            case 'consider': return 8;
            case 'take-full': return 10;
            case 'take-fraction': return 13;
            case 'skip': return 8;
            case 'completed': return 17;
            default: return 0;
        }
    };

    // Compute max weight for bar scaling
    const maxWeight = useMemo(() => {
        if (!currentStep?.items) return 1;
        return Math.max(...currentStep.items.map(it => it.weight), 1);
    }, [currentStep]);

    const codeSnippet = algorithmCodes.fractionalKnapsack?.[activeLanguage] || algorithmCodes.knapsack?.[activeLanguage] || '';

    const fillPercent = currentStep ? ((capacity - currentStep.remainingCapacity) / capacity) * 100 : 0;

    return (
        <DualView
            algorithmName="Fractional Knapsack (Greedy)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Configure items and press Solve.'}
        >
            <div className="fk-container">
                {/* Input Bar */}
                <div className="fk-input-bar">
                    <div className="fk-inputs">
                        <div className="fk-input-group">
                            <span className="fk-label">Items (weight:value):</span>
                            <input
                                type="text"
                                className="fk-array-input"
                                value={inputStr}
                                onChange={(e) => setInputStr(e.target.value)}
                                placeholder="10:60, 20:100, 30:120"
                            />
                        </div>
                        <div className="fk-input-group fk-cap-group">
                            <span className="fk-label">Capacity:</span>
                            <input
                                type="text"
                                className="fk-cap-input"
                                value={capStr}
                                onChange={(e) => setCapStr(e.target.value)}
                                placeholder="50"
                            />
                        </div>
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Solve</button>
                </div>

                {/* Main Visualization */}
                <div className="fk-main-area">
                    {/* Left: Items bar chart */}
                    <div className="fk-items-panel">
                        <div className="fk-panel-title">Items (sorted by ratio)</div>
                        <div className="fk-items-list">
                            {currentStep?.items?.map((item, idx) => {
                                const barWidth = (item.weight / maxWeight) * 100;
                                const isActive = currentStep.currentIndex === idx;
                                return (
                                    <div key={item.originalIndex} className={`fk-item-row ${isActive ? 'fk-active' : ''}`}>
                                        <div className="fk-item-label">{item.label}</div>
                                        <div className="fk-item-bar-track">
                                            <div
                                                className={`fk-item-bar state-${item.state}`}
                                                style={{
                                                    width: `${barWidth}%`,
                                                    backgroundColor: item.state === 'pending' ? '#334155' : item.color,
                                                    opacity: item.state === 'skipped' ? 0.3 : 1
                                                }}
                                            >
                                                <span className="fk-bar-text">
                                                    w={item.weight} v=${item.value}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="fk-item-ratio">
                                            {item.ratio.toFixed(2)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="fk-legend">
                            <div className="fk-legend-item"><div className="fk-legend-dot" style={{ background: '#334155' }}></div>Pending</div>
                            <div className="fk-legend-item"><div className="fk-legend-dot" style={{ background: '#f59e0b' }}></div>Considering</div>
                            <div className="fk-legend-item"><div className="fk-legend-dot" style={{ background: '#10b981' }}></div>Taken (Full)</div>
                            <div className="fk-legend-item"><div className="fk-legend-dot" style={{ background: '#8b5cf6' }}></div>Partial</div>
                            <div className="fk-legend-item"><div className="fk-legend-dot fk-dot-skipped" style={{ background: '#64748b' }}></div>Skipped</div>
                        </div>
                    </div>

                    {/* Right: Knapsack gauge + result */}
                    <div className="fk-right-panel">
                        {/* Knapsack Gauge */}
                        <div className="fk-gauge-card">
                            <div className="fk-gauge-title">Knapsack ({capacity}kg)</div>
                            <div className="fk-gauge-container">
                                <div className="fk-gauge-track">
                                    {currentStep?.knapsackItems?.map((kItem, idx) => {
                                        const segHeight = (kItem.weightTaken / capacity) * 100;
                                        return (
                                            <div
                                                key={kItem.originalIndex}
                                                className="fk-gauge-segment"
                                                style={{
                                                    height: `${segHeight}%`,
                                                    backgroundColor: kItem.color,
                                                    opacity: kItem.fraction < 1 ? 0.7 : 1
                                                }}
                                                title={`${kItem.label}: ${kItem.weightTaken.toFixed(1)}kg`}
                                            >
                                                {segHeight > 8 && (
                                                    <span className="fk-seg-label">{kItem.label}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/* Empty space */}
                                    {currentStep && currentStep.remainingCapacity > 0 && (
                                        <div
                                            className="fk-gauge-empty"
                                            style={{ height: `${(currentStep.remainingCapacity / capacity) * 100}%` }}
                                        >
                                            <span className="fk-empty-label">{currentStep.remainingCapacity.toFixed(1)}kg free</span>
                                        </div>
                                    )}
                                </div>
                                <div className="fk-gauge-markers">
                                    <span>0</span>
                                    <span>{Math.round(capacity / 2)}</span>
                                    <span>{capacity}</span>
                                </div>
                            </div>
                            <div className="fk-gauge-stats">
                                <div className="fk-stat">
                                    <span className="fk-stat-label">Used</span>
                                    <span className="fk-stat-value">{currentStep ? (capacity - currentStep.remainingCapacity).toFixed(1) : 0}kg</span>
                                </div>
                                <div className="fk-stat">
                                    <span className="fk-stat-label">Value</span>
                                    <span className="fk-stat-value fk-stat-highlight">${currentStep?.totalValue?.toFixed(1) || '0'}</span>
                                </div>
                                <div className="fk-stat">
                                    <span className="fk-stat-label">Fill</span>
                                    <span className="fk-stat-value">{fillPercent.toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Result Table */}
                        {currentStep?.knapsackItems?.length > 0 && (
                            <div className="fk-result-card">
                                <div className="fk-result-title">Items Taken</div>
                                <table className="fk-result-table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Fraction</th>
                                            <th>Weight</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentStep.knapsackItems.map(kItem => (
                                            <tr key={kItem.originalIndex}>
                                                <td>
                                                    <span className="fk-dot-inline" style={{ background: kItem.color }}></span>
                                                    {kItem.label}
                                                </td>
                                                <td>{(kItem.fraction * 100).toFixed(0)}%</td>
                                                <td>{kItem.weightTaken.toFixed(1)}kg</td>
                                                <td>${kItem.valueTaken.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="2"><strong>Total</strong></td>
                                            <td><strong>{(capacity - currentStep.remainingCapacity).toFixed(1)}kg</strong></td>
                                            <td><strong>${currentStep.totalValue.toFixed(1)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Animation Controls */}
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
