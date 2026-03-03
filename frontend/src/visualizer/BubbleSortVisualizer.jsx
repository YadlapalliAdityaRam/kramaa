import React, { useState, useEffect } from 'react';
import AnimationCanvas from './AnimationCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useAnimation from '../hooks/useAnimation';
import { generateBubbleSortSteps } from '../algorithms/sorting/bubbleSort';
import { motion } from 'framer-motion';
import DualView from './DualView';
import { algorithmCodes } from '../data/algorithmCodes';

const BubbleSortVisualizer = () => {
    // Initial random array
    const [array, setArray] = useState([50, 30, 70, 20, 90, 10, 60, 40]);

    const {
        currentArray,
        currentStep,
        currentStepIndex,
        totalSteps,
        isPlaying,
        speed,
        setSpeed,
        play,
        pause,
        stepForward,
        stepBackward,
        reset,
        setStep
    } = useAnimation(generateBubbleSortSteps, array);

    const handleGenerateValues = () => {
        const newArr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 5);
        setArray(newArr);
    };

    const handleManualInput = (inputArray) => {
        setArray(inputArray);
    };

    // Map step types to code lines (Approximate for demo)
    const getActiveLine = (type) => {
        switch (type) {
            case 'compare': return 6; // if (arr[i] > arr[i + 1])
            case 'swap': return 9;    // let temp = arr[i]...
            case 'sorted': return 15; // n--
            default: return 0;
        }
    };

    return (
        <DualView
            algorithmName="Bubble Sort"
            code={algorithmCodes.bubbleSort.javascript}
            activeLine={getActiveLine(currentStep.type)}
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                        fontSize: '0.85rem',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)'
                    }}>
                        Step {currentStepIndex + 1}
                    </span>
                    {currentStep.type === 'compare' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem' }}>
                            <span style={{ color: 'var(--bar-comparing)', fontWeight: '700', fontSize: '1.5rem' }}>{currentArray[currentStep.indices[0]]}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>&gt;</span>
                            <span style={{ color: 'var(--bar-comparing)', fontWeight: '700', fontSize: '1.5rem' }}>{currentArray[currentStep.indices[1]]}</span>
                            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>?</span>

                            {/* Comparison Result Badge */}
                            {currentArray[currentStep.indices[0]] > currentArray[currentStep.indices[1]] ? (
                                <span style={{
                                    fontSize: '0.8rem',
                                    background: 'rgba(248, 113, 113, 0.2)',
                                    color: '#F87171',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    marginLeft: '8px'
                                }}>
                                    Will Swap
                                </span>
                            ) : (
                                <span style={{
                                    fontSize: '0.8rem',
                                    background: 'rgba(52, 211, 153, 0.2)', // Green background
                                    color: '#34D399',                       // Green text
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    marginLeft: '8px'
                                }}>
                                    No Swap
                                </span>
                            )}
                        </div>
                    ) : currentStep.type === 'swap' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem' }}>
                            <span style={{ color: 'var(--bar-pivot)', fontWeight: '700', fontSize: '1.5rem' }}>{currentArray[currentStep.indices[0]]}</span>
                            <span style={{ color: 'var(--text-primary)' }}>⇄</span>
                            <span style={{ color: 'var(--bar-pivot)', fontWeight: '700', fontSize: '1.5rem' }}>{currentArray[currentStep.indices[1]]}</span>
                            <span style={{
                                fontSize: '0.8rem',
                                background: 'rgba(167, 139, 250, 0.2)', // Purple bg
                                color: '#A78BFA',                       // Purple text
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                marginLeft: '8px'
                            }}>
                                Swapped!
                            </span>
                        </div>
                    ) : (
                        <span>{currentStep.description}</span>
                    )}
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Animation Canvas */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '20px' }}>
                    <AnimationCanvas
                        array={currentArray}
                        currentIndices={currentStep.type === 'swap' ? currentStep.indices : []}
                        compareIndices={currentStep.type === 'compare' ? currentStep.indices : []}
                        sortedIndices={currentStep.sortedIndices || []}
                    />
                </div>

                {/* Controls Area */}
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <AnimationControls
                        isPlaying={isPlaying}
                        onPlay={play}
                        onPause={pause}
                        onStepForward={stepForward}
                        onStepBackward={stepBackward}
                        onReset={reset}
                        speed={speed}
                        onSpeedChange={setSpeed}
                        currentStep={currentStepIndex}
                        totalSteps={totalSteps}
                        onScrub={setStep}
                        onManualInput={handleManualInput}
                        onGenerateRandom={handleGenerateValues}
                    />
                </div>
            </div>
        </DualView>
    );
};

export default BubbleSortVisualizer;
