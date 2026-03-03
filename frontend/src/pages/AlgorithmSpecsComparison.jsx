import React, { useState } from 'react';
import { algorithmList } from '../data/algorithmsData';
import { FaSearch, FaTimes } from 'react-icons/fa';
import MultiAlgoVisualizer from '../visualizer/MultiAlgoVisualizer';

const AlgorithmSpecsComparison = () => {
    const [selectedAlgos, setSelectedAlgos] = useState(() => {
        const saved = sessionStorage.getItem('algo_comparison_selected');
        return saved ? JSON.parse(saved) : [null, null, null];
    });
    const [searchQueries, setSearchQueries] = useState(['', '', '']);
    const [showSuggestions, setShowSuggestions] = useState([false, false, false]);
    const [isVisualizing, setIsVisualizing] = useState(() => {
        const saved = sessionStorage.getItem('algo_comparison_visualizing');
        return saved ? JSON.parse(saved) : false;
    });
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    React.useEffect(() => {
        sessionStorage.setItem('algo_comparison_selected', JSON.stringify(selectedAlgos));
    }, [selectedAlgos]);

    React.useEffect(() => {
        sessionStorage.setItem('algo_comparison_visualizing', JSON.stringify(isVisualizing));
    }, [isVisualizing]);

    React.useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleSelect = (index, algo) => {
        const nextSelected = [...selectedAlgos];
        nextSelected[index] = algo;
        setSelectedAlgos(nextSelected);

        const nextQueries = [...searchQueries];
        nextQueries[index] = '';
        setSearchQueries(nextQueries);

        const nextShow = [...showSuggestions];
        nextShow[index] = false;
        setShowSuggestions(nextShow);
        setIsVisualizing(false);
    };

    const handleClear = (index) => {
        const nextSelected = [...selectedAlgos];
        nextSelected[index] = null;
        setSelectedAlgos(nextSelected);
        setIsVisualizing(false);
    };

    const getAvailableAlgorithms = (currentIndex) => {
        const query = searchQueries[currentIndex].toLowerCase();
        const otherSelectedIds = selectedAlgos
            .filter((algo, idx) => algo && idx !== currentIndex)
            .map((algo) => algo.id);

        return algorithmList.filter((algo) => (
            !otherSelectedIds.includes(algo.id)
            && algo.name.toLowerCase().includes(query)
        ));
    };

    const handleStartVisualization = () => {
        setIsVisualizing(true);
        setTimeout(() => {
            document.getElementById('visualization-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const selectedCount = selectedAlgos.filter(Boolean).length;
    const isMobile = viewportWidth <= 768;
    const isTablet = viewportWidth > 768 && viewportWidth <= 1100;
    const comparisonColumns = isMobile
        ? '1fr'
        : (isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))');

    return (
        <div className="main-content" style={{ padding: isMobile ? '14px' : '24px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '40px' }}>
                <h1 className="gradient-text" style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 800, marginBottom: '16px' }}>
                    Algorithm Comparison
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Compare Time Complexity, Space Complexity, and visualize them side by side.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: comparisonColumns, gap: '16px', marginBottom: '32px' }}>
                {[0, 1, 2].map((slotIndex) => (
                    <div
                        key={slotIndex}
                        className="glass-panel"
                        style={{
                            padding: isMobile ? '16px' : '24px',
                            borderRadius: '16px',
                            minHeight: isMobile ? 'auto' : '500px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {!selectedAlgos[slotIndex] ? (
                            <div style={{ position: 'relative' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--viz-card-bg, rgba(255,255,255,0.05))',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <FaSearch style={{ color: 'var(--text-secondary)', marginRight: '12px' }} />
                                    <input
                                        type="text"
                                        placeholder={`Select Algorithm ${slotIndex + 1}`}
                                        value={searchQueries[slotIndex]}
                                        onChange={(e) => {
                                            const nextQueries = [...searchQueries];
                                            nextQueries[slotIndex] = e.target.value;
                                            setSearchQueries(nextQueries);

                                            const nextShow = [...showSuggestions];
                                            nextShow[slotIndex] = true;
                                            setShowSuggestions(nextShow);
                                        }}
                                        onFocus={() => {
                                            const nextShow = [...showSuggestions];
                                            nextShow[slotIndex] = true;
                                            setShowSuggestions(nextShow);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-primary)',
                                            width: '100%',
                                            outline: 'none',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                                {showSuggestions[slotIndex] && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            background: 'var(--bg-card-dark)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px',
                                            marginTop: '8px',
                                            overflow: 'hidden',
                                            zIndex: 10,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {getAvailableAlgorithms(slotIndex).map((algo) => (
                                            <div
                                                key={algo.id}
                                                onClick={() => handleSelect(slotIndex, algo)}
                                                style={{
                                                    padding: '12px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                {algo.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '10px' }}>
                                <h3 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 700, margin: 0, color: 'var(--primary-orange)' }}>
                                    {selectedAlgos[slotIndex].name}
                                </h3>
                                <button onClick={() => handleClear(slotIndex)} style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                                    <FaTimes />
                                </button>
                            </div>
                        )}

                        {selectedAlgos[slotIndex] && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                                <div>
                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Description</h4>
                                    <p style={{ lineHeight: '1.6', fontSize: isMobile ? '0.92rem' : '1rem' }}>{selectedAlgos[slotIndex].description}</p>
                                </div>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                                        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Time Complexity</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                <span>Best</span>
                                                <span style={{ color: 'var(--complexity-constant)', fontWeight: 600 }}>{selectedAlgos[slotIndex].timeComplexity?.best || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                <span>Average</span>
                                                <span style={{ color: 'var(--complexity-linear)', fontWeight: 600 }}>{selectedAlgos[slotIndex].timeComplexity?.average || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                                <span>Worst</span>
                                                <span style={{ color: 'var(--complexity-quadratic)', fontWeight: 600 }}>{selectedAlgos[slotIndex].timeComplexity?.worst || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                                        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>Space Complexity</h4>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-teal)' }}>
                                            {selectedAlgos[slotIndex].spaceComplexity || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Best Used For</h4>
                                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                        {selectedAlgos[slotIndex].useCases?.map((useCase, i) => (
                                            <li key={i} style={{ marginBottom: '8px' }}>{useCase}</li>
                                        )) || <li>General purpose</li>}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {selectedCount > 0 && (
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '30px' }}>
                    <button
                        onClick={handleStartVisualization}
                        disabled={isVisualizing}
                        className="control-btn play-btn"
                        style={{
                            minWidth: isMobile ? '100%' : 'auto',
                            padding: isMobile ? '14px 18px' : '16px 48px',
                            fontSize: isMobile ? '1rem' : '1.2rem',
                            background: isVisualizing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--primary-orange), var(--primary-teal))',
                            transform: isVisualizing ? 'none' : 'scale(1)',
                            opacity: isVisualizing ? 0.5 : 1
                        }}
                    >
                        {isVisualizing ? 'Visualization Active Below' : 'Visualize Comparison'}
                    </button>
                </div>
            )}

            {isVisualizing && (
                <div id="visualization-section">
                    <MultiAlgoVisualizer algorithms={selectedAlgos.filter(Boolean)} />
                </div>
            )}
        </div>
    );
};

export default AlgorithmSpecsComparison;
