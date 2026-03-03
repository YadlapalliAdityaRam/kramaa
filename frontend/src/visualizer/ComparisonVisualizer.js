import React, { useState, useEffect } from 'react';
import AnimationCanvas from './AnimationCanvas';
import useAnimation from '../hooks/useAnimation';
import { generateBubbleSortSteps } from '../algorithms/sorting/bubbleSort';
import { generateSelectionSortSteps } from '../algorithms/sorting/selectionSort';

const ALGORITHMS = {
    'Bubble Sort': generateBubbleSortSteps,
    'Selection Sort': generateSelectionSortSteps
};

const ComparisonVisualizer = () => {
    const [algo1Name, setAlgo1Name] = useState('Bubble Sort');
    const [algo2Name, setAlgo2Name] = useState('Selection Sort');
    const [array, setArray] = useState([]);
    const [isMobile, setIsMobile] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth <= 900 : false
    ));

    useEffect(() => {
        generateNewArray();
    }, []);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const generateNewArray = () => {
        const newArr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 5);
        setArray(newArr);
    };

    const algo1 = useAnimation(ALGORITHMS[algo1Name], array);
    const algo2 = useAnimation(ALGORITHMS[algo2Name], array);

    const handlePlay = () => {
        algo1.play();
        algo2.play();
    };

    const handlePause = () => {
        algo1.pause();
        algo2.pause();
    };

    const cardPadding = isMobile ? '16px' : '24px';

    return (
        <div className="main-content" style={{ padding: isMobile ? '14px' : '24px' }}>
            <div
                className="glass-panel"
                style={{
                    padding: cardPadding,
                    marginBottom: '20px',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '14px'
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', color: 'var(--text-primary)' }}>Algorithm Race</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Compare efficiency and behavior side by side.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={handlePlay} className="control-btn play-btn" title="Play Both">Run</button>
                    <button onClick={handlePause} className="control-btn" title="Pause Both">Pause</button>
                    <button onClick={generateNewArray} className="control-btn" title="New Random Array">Random</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: cardPadding, borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
                        <select
                            value={algo1Name}
                            onChange={(e) => setAlgo1Name(e.target.value)}
                            style={{ background: 'var(--viz-input-bg, #1e1e1e)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.12)', padding: '8px 12px', borderRadius: '10px' }}
                        >
                            {Object.keys(ALGORITHMS).map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Steps: {algo1.currentStepIndex}</div>
                    </div>
                    <div style={{ height: isMobile ? '220px' : '300px' }}>
                        <AnimationCanvas
                            array={algo1.currentArray}
                            currentIndices={algo1.currentStep.indices || []}
                            compareIndices={algo1.currentStep.type === 'compare' ? algo1.currentStep.indices : []}
                            sortedIndices={algo1.currentStep.sortedIndices || []}
                        />
                    </div>
                    <p style={{ marginTop: '14px', minHeight: isMobile ? '30px' : '40px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {algo1.currentStep.description}
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: cardPadding, borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
                        <select
                            value={algo2Name}
                            onChange={(e) => setAlgo2Name(e.target.value)}
                            style={{ background: 'var(--viz-input-bg, #1e1e1e)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.12)', padding: '8px 12px', borderRadius: '10px' }}
                        >
                            {Object.keys(ALGORITHMS).map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Steps: {algo2.currentStepIndex}</div>
                    </div>
                    <div style={{ height: isMobile ? '220px' : '300px' }}>
                        <AnimationCanvas
                            array={algo2.currentArray}
                            currentIndices={algo2.currentStep.indices || []}
                            compareIndices={algo2.currentStep.type === 'compare' ? algo2.currentStep.indices : []}
                            sortedIndices={algo2.currentStep.sortedIndices || []}
                        />
                    </div>
                    <p style={{ marginTop: '14px', minHeight: isMobile ? '30px' : '40px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {algo2.currentStep.description}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ComparisonVisualizer;
