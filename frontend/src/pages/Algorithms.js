import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { algorithmList } from '../data/algorithmsData';
import './Algorithms.css';

const CATEGORY_ACCENTS = {
    Sorting: '#3b82f6',
    Searching: '#10b981',
    Graphs: '#f59e0b',
    Trees: '#ef4444',
    'Dynamic Programming': '#8b5cf6',
    Greedy: '#ec4899',
    String: '#14b8a6',
    Backtracking: '#6366f1',
    Math: '#f97316'
};

const DIFFICULTY_CLASS = {
    Beginner: 'algo-difficulty-beginner',
    Intermediate: 'algo-difficulty-intermediate',
    Advanced: 'algo-difficulty-advanced'
};

const getAccentColor = (category) => CATEGORY_ACCENTS[category] || '#64748b';

const Algorithms = () => {
    const [searchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');

    useEffect(() => {
        const query = searchParams.get('search') || '';
        setSearchTerm((prev) => (prev === query ? prev : query));
    }, [searchParams]);

    const categories = useMemo(() => {
        const unique = Array.from(new Set(algorithmList.map((algorithm) => algorithm.category)));
        return ['All', ...unique.sort((a, b) => a.localeCompare(b))];
    }, []);

    const difficulties = useMemo(() => {
        const unique = Array.from(new Set(algorithmList.map((algorithm) => algorithm.difficulty)));
        const ordered = ['Beginner', 'Intermediate', 'Advanced'];
        return ['All', ...ordered.filter((difficulty) => unique.includes(difficulty))];
    }, []);

    const filteredAlgorithms = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return algorithmList
            .filter((algorithm) => {
                const categoryMatches = selectedCategory === 'All' || algorithm.category === selectedCategory;
                const difficultyMatches = selectedDifficulty === 'All' || algorithm.difficulty === selectedDifficulty;
                const searchMatches = normalizedSearch.length === 0
                    || algorithm.name.toLowerCase().includes(normalizedSearch)
                    || algorithm.description.toLowerCase().includes(normalizedSearch)
                    || algorithm.category.toLowerCase().includes(normalizedSearch);
                return categoryMatches && difficultyMatches && searchMatches;
            })
            .sort((left, right) => left.name.localeCompare(right.name));
    }, [searchTerm, selectedCategory, selectedDifficulty]);

    const stats = useMemo(() => ({
        totalAlgorithms: algorithmList.length,
        totalCategories: categories.length - 1,
        visibleAlgorithms: filteredAlgorithms.length
    }), [categories.length, filteredAlgorithms.length]);

    return (
        <div className="algo-page-container">
            <header className="algo-page-header">
                <span className="algo-header-tag">Algorithm Universe</span>
                <h1 className="algo-page-title">Algorithms Library</h1>
                <p className="algo-page-subtitle">
                    Expanded catalog with detailed complexity metadata and a strict input limit of 10 elements per problem.
                </p>
                <div className="algo-stats-grid">
                    <div className="algo-stat-card">
                        <span className="algo-stat-value">{stats.totalAlgorithms}</span>
                        <span className="algo-stat-label">Total Algorithms</span>
                    </div>
                    <div className="algo-stat-card">
                        <span className="algo-stat-value">{stats.totalCategories}</span>
                        <span className="algo-stat-label">Categories</span>
                    </div>
                    <div className="algo-stat-card">
                        <span className="algo-stat-value">10</span>
                        <span className="algo-stat-label">Input Limit</span>
                    </div>
                    <div className="algo-stat-card">
                        <span className="algo-stat-value">{stats.visibleAlgorithms}</span>
                        <span className="algo-stat-label">Filtered View</span>
                    </div>
                </div>
            </header>

            <section className="algo-toolbar glass-panel">
                <div className="algo-filter-grid">
                    <label className="algo-filter-group">
                        <span className="algo-filter-label">Category</span>
                        <select
                            value={selectedCategory}
                            onChange={(event) => setSelectedCategory(event.target.value)}
                            className="algo-filter-control"
                        >
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="algo-filter-group">
                        <span className="algo-filter-label">Difficulty</span>
                        <select
                            value={selectedDifficulty}
                            onChange={(event) => setSelectedDifficulty(event.target.value)}
                            className="algo-filter-control"
                        >
                            {difficulties.map((difficulty) => (
                                <option key={difficulty} value={difficulty}>
                                    {difficulty}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="algo-filter-group algo-search-group">
                        <span className="algo-filter-label">Search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search algorithms, category, or description"
                            className="algo-filter-control"
                        />
                    </label>
                </div>
            </section>

            <motion.div layout className="algo-cards-grid">
                <AnimatePresence>
                    {filteredAlgorithms.map((algorithm) => {
                        const accentColor = getAccentColor(algorithm.category);
                        const difficultyClass = DIFFICULTY_CLASS[algorithm.difficulty] || 'algo-difficulty-intermediate';
                        return (
                            <motion.article
                                layout
                                key={algorithm.id}
                                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                transition={{ duration: 0.18 }}
                                className="algo-card-item"
                            >
                                <div className="algo-card-topline" style={{ backgroundColor: accentColor }} />
                                <div className="algo-card-content">
                                    <div className="algo-card-meta">
                                        <span
                                            className="algo-chip algo-category-chip"
                                            style={{
                                                borderColor: `${accentColor}66`,
                                                color: accentColor,
                                                background: `${accentColor}1A`
                                            }}
                                        >
                                            {algorithm.category}
                                        </span>
                                        <span className={`algo-chip ${difficultyClass}`}>{algorithm.difficulty}</span>
                                    </div>

                                    <h3 className="algo-card-title">{algorithm.name}</h3>
                                    <p className="algo-card-description">{algorithm.description}</p>

                                    <div className="algo-input-limit">
                                        Input Limit: {algorithm.inputLimit || 10} elements
                                    </div>

                                    <div className="algo-complexity-grid">
                                        <div className="algo-complexity-cell">
                                            <span className="algo-complexity-label">Best</span>
                                            <span className="algo-complexity-value">{algorithm.timeComplexity?.best || 'N/A'}</span>
                                        </div>
                                        <div className="algo-complexity-cell">
                                            <span className="algo-complexity-label">Average</span>
                                            <span className="algo-complexity-value">{algorithm.timeComplexity?.average || 'N/A'}</span>
                                        </div>
                                        <div className="algo-complexity-cell">
                                            <span className="algo-complexity-label">Worst</span>
                                            <span className="algo-complexity-value">{algorithm.timeComplexity?.worst || 'N/A'}</span>
                                        </div>
                                        <div className="algo-complexity-cell">
                                            <span className="algo-complexity-label">Space</span>
                                            <span className="algo-complexity-value">{algorithm.spaceComplexity || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <Link to={algorithm.path} className="algo-open-link">
                                        Open Visualizer
                                    </Link>
                                </div>
                            </motion.article>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {filteredAlgorithms.length === 0 && (
                <div className="algo-empty-state">
                    No algorithms match the current filter/search.
                </div>
            )}
        </div>
    );
};

export default Algorithms;
