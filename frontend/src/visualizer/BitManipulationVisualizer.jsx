import React, { useState, useMemo, useEffect } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateBitManipulationSteps } from '../algorithms/math/bitManipulation';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaMicrochip, FaRandom, FaHashtag, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import './BitManipulationVisualizer.css';

const BitManipulationVisualizer = () => {
    const [valA, setValA] = useState(5);
    const [valB, setValB] = useState(3);
    const [operation, setOperation] = useState('AND');
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(() => {
        try {
            return generateBitManipulationSteps(valA, valB, operation);
        } catch (e) {
            console.error(e);
            return [];
        }
    }, [valA, valB, operation]);

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
    }, [valA, valB, operation]);

    const handleRandom = () => {
        setValA(Math.floor(Math.random() * 200) + 1); // Random up to 8 bits
        if (operation === 'LSHIFT' || operation === 'RSHIFT') {
            setValB(Math.floor(Math.random() * 4) + 1); // Shift 1 to 4
        } else {
            setValB(Math.floor(Math.random() * 200) + 1);
        }
        toast.success("Random numbers generated!");
    };

    const handleResetDemo = () => {
        setValA(5);
        setValB(3);
        setOperation('AND');
        reset();
    };

    const handleOpChange = (op) => {
        setOperation(op);
        if (op === 'LSHIFT' || op === 'RSHIFT') {
            setValB(2); // Default meaningful shift
        }
    };

    const currentData = currentStep || {
        binA: '00000000',
        binB: '00000000',
        resultBin: '00000000',
        activeBit: -1,
        description: "Select an operation and enter values to observe bitwise manipulation."
    };

    const codeSnippet = algorithmCodes.bitManipulation?.[activeLanguage] || '';

    const getActiveLine = (step) => {
        if (!step) return 1;
        if (step.type === 'compare') {
            if (operation === 'AND') return 3;
            if (operation === 'XOR') return 23;
        }
        if (step.type === 'shift-end') {
            if (operation === 'LSHIFT') return 8;
            if (operation === 'RSHIFT') return 9;
        }
        return 1;
    };

    const isBinaryOp = operation === 'AND' || operation === 'OR' || operation === 'XOR';
    const isShiftOp  = operation === 'LSHIFT' || operation === 'RSHIFT';

    return (
        <DualView
            algorithmName="Bit Manipulation Basics"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={
                <div className="bit-desc-wrapper">
                    <span className="bit-badge">Bitwise Operations</span>
                    <span className="bit-desc-text">
                        {currentData.description}
                    </span>
                </div>
            }
        >
            <div className="bit-visualizer-wrapper">

                {/* ── Top Controls & Input Panel ────────────────────────── */}
                <div className="bit-input-panel">
                    {/* Operand A Input */}
                    <div className="bit-input-group">
                        <label className="bit-input-label">
                            <FaHashtag className="bit-icon" /> Value A:
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="255"
                            value={valA}
                            onChange={(e) => setValA(Math.min(255, Math.max(0, Number(e.target.value) || 0)))}
                            className="bit-number-input"
                        />
                    </div>

                    {/* Operation Selector Pills */}
                    <div className="op-selector">
                        {['AND', 'OR', 'XOR', 'NOT', 'LSHIFT', 'RSHIFT'].map((op) => (
                            <button
                                key={op}
                                className={`op-btn ${operation === op ? 'active' : ''}`}
                                onClick={() => handleOpChange(op)}
                            >
                                {op === 'LSHIFT' ? '<< (Left Shift)' : op === 'RSHIFT' ? '>> (Right Shift)' : op}
                            </button>
                        ))}
                    </div>

                    {/* Operand B / Shift Amount Input */}
                    {operation !== 'NOT' && (
                        <div className="bit-input-group">
                            <label className="bit-input-label">
                                {isShiftOp ? 'Shift By:' : 'Value B:'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max={isShiftOp ? "7" : "255"}
                                value={valB}
                                onChange={(e) => setValB(Math.min(isShiftOp ? 7 : 255, Math.max(0, Number(e.target.value) || 0)))}
                                className="bit-number-input"
                            />
                        </div>
                    )}

                    <div className="bit-btn-group">
                        <button className="bit-btn bit-btn-secondary" onClick={handleRandom}>
                            <FaRandom /> Random
                        </button>
                        <button className="bit-btn bit-btn-outline" onClick={handleResetDemo}>
                            <FaRedo /> Reset
                        </button>
                    </div>
                </div>

                {/* ── Main Bit Visualization Stage Card ─────────────────── */}
                <div className="bit-stage-card">
                    <div className="bit-grid">

                        {/* Operand A Row */}
                        <div className="bit-row">
                            <div className="row-label">A = {valA}</div>
                            <div className="binary-cells">
                                {currentData.binA.split('').map((bit, idx) => (
                                    <div
                                        key={`a-${idx}`}
                                        className={`bit-cell ${currentData.activeBit === idx && currentData.type !== 'shift-start' ? 'active-compare' : ''}`}
                                    >
                                        {bit}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operand B Row */}
                        {isBinaryOp && (
                            <div className="bit-row op-row">
                                <div className="row-label op-label">{operation} B = {valB}</div>
                                <div className="binary-cells">
                                    {currentData.binB?.split('').map((bit, idx) => (
                                        <div
                                            key={`b-${idx}`}
                                            className={`bit-cell ${currentData.activeBit === idx ? 'active-compare' : ''}`}
                                        >
                                            {bit}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="bit-divider"></div>

                        {/* Result Row */}
                        <div className="bit-row result-row">
                            <div className="row-label">
                                {currentData.type === 'complete' ? `Result = ${currentData.finalResult}` : 'Result'}
                            </div>
                            <div className="binary-cells">
                                {isShiftOp ? (
                                    <div className="shift-container">
                                        <motion.div
                                            className="shift-track"
                                            animate={{
                                                x: currentData.type === 'shift-end'
                                                    ? (currentData.shiftDir === 'left' ? -1 * currentData.shiftAmount * 44 : currentData.shiftAmount * 44)
                                                    : 0
                                            }}
                                            transition={{ duration: 0.7, ease: "easeInOut" }}
                                        >
                                            {currentData.resultBin.split('').map((bit, idx) => (
                                                <div
                                                    key={`res-${idx}`}
                                                    className={`bit-cell result ${(currentData.type === 'shift-end' && (currentData.shiftDir === 'left' ? idx >= 8 - currentData.shiftAmount : idx < currentData.shiftAmount)) ? 'shifted-fill' : ''}`}
                                                >
                                                    {bit}
                                                </div>
                                            ))}
                                        </motion.div>
                                    </div>
                                ) : (
                                    currentData.resultBin.split('').map((bit, idx) => {
                                        const isFilled = bit !== ' ';
                                        const isMatch = isFilled && (currentData.activeBit === idx) && (bit === '1');
                                        return (
                                            <div
                                                key={`res-${idx}`}
                                                className={`bit-cell ${isFilled ? 'result' : 'empty'} ${currentData.activeBit === idx ? 'active-write' : ''} ${isMatch ? 'match-highlight' : ''}`}
                                            >
                                                {bit}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Bit Position Index Row */}
                        <div className="bit-row index-row">
                            <div className="row-label">Bit Index</div>
                            <div className="binary-cells index-cells">
                                {[7, 6, 5, 4, 3, 2, 1, 0].map(idx => (
                                    <div key={`idx-${idx}`} className="index-cell">{idx}</div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Legend ───────────────────────────────────────────── */}
                <div className="bit-legend">
                    <div className="leg-item"><span className="box box-compare"></span> Comparing Bits</div>
                    <div className="leg-item"><span className="box box-write"></span> Writing Bit</div>
                    <div className="leg-item"><span className="box box-result"></span> Result Bit</div>
                    <div className="leg-item"><span className="box box-shift"></span> Shift Fill</div>
                </div>

                {/* ── Controls Bar ─────────────────────────────────────── */}
                <div className="bit-controls-wrapper">
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

export default BitManipulationVisualizer;
