import { useEffect, useState } from 'react';
import { FaArrowRight, FaSearch, FaTimes } from 'react-icons/fa';
import { algorithmList } from '../data/algorithmsData';
import MultiAlgoVisualizer from '../visualizer/MultiAlgoVisualizer';
import './Comparison.css';

const comparisonSlots = [0, 1, 2];

const AlgorithmSpecsComparison = () => {
    const [selectedAlgorithms, setSelectedAlgorithms] = useState(() => {
        const saved = sessionStorage.getItem('algo_comparison_selected');
        return saved ? JSON.parse(saved) : [null, null, null];
    });
    const [searchQueries, setSearchQueries] = useState(['', '', '']);
    const [activeSuggestion, setActiveSuggestion] = useState(null);
    const [isVisualizing, setIsVisualizing] = useState(() => sessionStorage.getItem('algo_comparison_visualizing') === 'true');

    useEffect(() => {
        sessionStorage.setItem('algo_comparison_selected', JSON.stringify(selectedAlgorithms));
    }, [selectedAlgorithms]);

    useEffect(() => {
        sessionStorage.setItem('algo_comparison_visualizing', JSON.stringify(isVisualizing));
    }, [isVisualizing]);

    const availableAlgorithms = (slot) => {
        const query = searchQueries[slot].trim().toLowerCase();
        const selectedIds = selectedAlgorithms.filter(Boolean).map((algorithm) => algorithm.id);

        return algorithmList
            .filter((algorithm) => !selectedIds.includes(algorithm.id) && algorithm.name.toLowerCase().includes(query))
            .slice(0, 7);
    };

    const selectAlgorithm = (slot, algorithm) => {
        setSelectedAlgorithms((previous) => previous.map((current, index) => (index === slot ? algorithm : current)));
        setSearchQueries((previous) => previous.map((current, index) => (index === slot ? '' : current)));
        setActiveSuggestion(null);
        setIsVisualizing(false);
    };

    const clearAlgorithm = (slot) => {
        setSelectedAlgorithms((previous) => previous.map((current, index) => (index === slot ? null : current)));
        setIsVisualizing(false);
    };

    const startVisualization = () => {
        setIsVisualizing(true);
        requestAnimationFrame(() => document.getElementById('visualization-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const selectedCount = selectedAlgorithms.filter(Boolean).length;

    return (
        <main className="comparison-page">
            <header className="comparison-intro">
                <div><p className="comparison-kicker">Side-by-side analysis</p><h1>Compare the trade-offs before you write the code.</h1></div>
                <p>Choose up to three lessons. Complexity, context, and use cases remain visible while you compare their behavior.</p>
            </header>

            <section className="comparison-selector-grid" aria-label="Choose algorithms to compare">
                {comparisonSlots.map((slot) => {
                    const algorithm = selectedAlgorithms[slot];
                    const suggestions = availableAlgorithms(slot);
                    return (
                        <article className="comparison-slot" key={slot}>
                            <div className="comparison-slot-label"><span>0{slot + 1}</span><span>{algorithm ? algorithm.difficulty : 'Open slot'}</span></div>
                            {algorithm ? (
                                <>
                                    <div className="comparison-slot-heading"><h2>{algorithm.name}</h2><button type="button" onClick={() => clearAlgorithm(slot)} aria-label={`Remove ${algorithm.name}`}><FaTimes aria-hidden="true" /></button></div>
                                    <p className="comparison-category">{algorithm.category}</p>
                                    <p className="comparison-description">{algorithm.description}</p>
                                    <dl className="comparison-complexity"><div><dt>Best</dt><dd>{algorithm.timeComplexity?.best || 'N/A'}</dd></div><div><dt>Average</dt><dd>{algorithm.timeComplexity?.average || 'N/A'}</dd></div><div><dt>Worst</dt><dd>{algorithm.timeComplexity?.worst || 'N/A'}</dd></div><div><dt>Space</dt><dd>{algorithm.spaceComplexity || 'N/A'}</dd></div></dl>
                                    <div className="comparison-use-cases"><p>Useful for</p><ul>{(algorithm.useCases || []).slice(0, 3).map((useCase) => <li key={useCase}>{useCase}</li>)}</ul></div>
                                </>
                            ) : (
                                <div className="comparison-search-wrap">
                                    <label htmlFor={`comparison-search-${slot}`}>Add an algorithm</label>
                                    <div className="comparison-search"><FaSearch aria-hidden="true" /><input id={`comparison-search-${slot}`} type="search" value={searchQueries[slot]} placeholder="Search algorithms" onFocus={() => setActiveSuggestion(slot)} onChange={(event) => { setSearchQueries((previous) => previous.map((current, index) => (index === slot ? event.target.value : current))); setActiveSuggestion(slot); }} /></div>
                                    {activeSuggestion === slot && (
                                        <div className="comparison-suggestions">
                                            {suggestions.length > 0 ? suggestions.map((candidate) => <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectAlgorithm(slot, candidate)} key={candidate.id}><span>{candidate.name}</span><small>{candidate.category} · {candidate.difficulty}</small></button>) : <p>No matching lessons.</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </article>
                    );
                })}
            </section>

            <section className="comparison-action">
                <p>{selectedCount === 0 ? 'Select an algorithm to begin comparing.' : `${selectedCount} algorithm${selectedCount === 1 ? '' : 's'} selected`}</p>
                <button type="button" className="comparison-button" onClick={startVisualization} disabled={!selectedCount || isVisualizing}>{isVisualizing ? 'Comparison running' : 'Visualize comparison'} <FaArrowRight aria-hidden="true" /></button>
            </section>

            {isVisualizing && <section className="comparison-visualization" id="visualization-section"><MultiAlgoVisualizer algorithms={selectedAlgorithms.filter(Boolean)} /></section>}
        </main>
    );
};

export default AlgorithmSpecsComparison;
