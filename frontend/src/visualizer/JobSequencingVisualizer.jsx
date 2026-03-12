import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateJobSequencingSteps } from '../algorithms/greedy/jobSequencing';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './JobSequencingVisualizer.css';

const DEFAULT_JOBS = [
    { id: 'J1', deadline: 2, profit: 100 },
    { id: 'J2', deadline: 1, profit: 19 },
    { id: 'J3', deadline: 2, profit: 27 },
    { id: 'J4', deadline: 1, profit: 25 },
    { id: 'J5', deadline: 3, profit: 15 },
    { id: 'J6', deadline: 3, profit: 80 },
    { id: 'J7', deadline: 4, profit: 40 }
];

const JobSequencingVisualizer = () => {
    const [jobs, setJobs] = useState(DEFAULT_JOBS);
    const [inputStr, setInputStr] = useState(
        DEFAULT_JOBS.map(j => `${j.deadline}:${j.profit}`).join(', ')
    );
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateJobSequencingSteps(jobs),
        [jobs]
    );

    const {
        currentStep, currentStepIndex, isPlaying,
        play, pause, reset, stepForward, stepBackward,
        setIndex, speed, setSpeed
    } = useGenericAnimation(steps);

    const handleApply = () => {
        try {
            const pairs = inputStr.split(',').map(s => s.trim()).filter(s => s !== '');
            if (pairs.length === 0) throw new Error('Need at least one job.');
            if (pairs.length > 10) throw new Error('Maximum 10 jobs.');

            const newJobs = pairs.map((pair, idx) => {
                const parts = pair.split(':');
                if (parts.length !== 2) throw new Error(`Invalid format "${pair}". Use deadline:profit.`);
                const d = parseInt(parts[0].trim());
                const p = parseInt(parts[1].trim());
                if (isNaN(d) || isNaN(p)) throw new Error(`Non-numeric values in "${pair}".`);
                if (d <= 0) throw new Error(`Deadline must be positive in "${pair}".`);
                if (p < 0) throw new Error(`Profit cannot be negative in "${pair}".`);
                return { id: `J${idx + 1}`, deadline: d, profit: p };
            });

            setJobs(newJobs);
            reset();
            toast.success('Jobs updated!');
        } catch (err) {
            toast.error(err.message || 'Invalid input.');
        }
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init': return 2;
            case 'sort': return 3;
            case 'consider': return 6;
            case 'search-slot': return 8;
            case 'placed': return 10;
            case 'rejected': return 13;
            case 'completed': return 16;
            default: return 0;
        }
    };

    const codeSnippet = algorithmCodes.jobSequencing?.[activeLanguage] || '';

    return (
        <DualView
            algorithmName="Job Sequencing with Deadlines (Greedy)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Configure jobs and press Schedule.'}
        >
            <div className="js-container">
                {/* Input Bar */}
                <div className="js-input-bar">
                    <div className="js-inputs">
                        <div className="js-input-group">
                            <span className="js-label">Jobs (deadline:profit):</span>
                            <input
                                type="text"
                                className="js-array-input"
                                value={inputStr}
                                onChange={(e) => setInputStr(e.target.value)}
                                placeholder="2:100, 1:19, 2:27..."
                            />
                        </div>
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Schedule</button>
                </div>

                {/* Main Visualization */}
                <div className="js-main-area">
                    {/* Left: Job Cards */}
                    <div className="js-jobs-panel">
                        <div className="js-panel-title">Jobs (by profit ↓)</div>
                        <div className="js-jobs-list">
                            {currentStep?.jobs?.map((job, idx) => {
                                const isActive = currentStep.currentJobIndex === idx;
                                return (
                                    <div
                                        key={job.originalIndex}
                                        className={`js-job-card state-${job.state} ${isActive ? 'js-active' : ''}`}
                                    >
                                        <div className="js-job-color" style={{ backgroundColor: job.color }}></div>
                                        <div className="js-job-info">
                                            <div className="js-job-name">{job.label}</div>
                                            <div className="js-job-meta">
                                                <span>d={job.deadline}</span>
                                                <span className="js-job-profit">${job.profit}</span>
                                            </div>
                                        </div>
                                        <div className="js-job-status-badge">
                                            {job.state === 'scheduled' && '✅'}
                                            {job.state === 'rejected' && '❌'}
                                            {job.state === 'considering' && '🔍'}
                                            {job.state === 'pending' && '⏳'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Timeline Slots */}
                    <div className="js-timeline-panel">
                        <div className="js-panel-title">Time Slots</div>
                        <div className="js-slots-grid">
                            {currentStep?.slots?.map((slot, idx) => {
                                const isSearching = currentStep.currentSlot === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`js-slot ${slot ? 'js-slot-filled' : 'js-slot-empty'} ${isSearching ? 'js-slot-searching' : ''}`}
                                    >
                                        <div className="js-slot-header">T{idx + 1}</div>
                                        <div className="js-slot-body">
                                            {slot ? (
                                                <div className="js-slot-job" style={{ backgroundColor: slot.color }}>
                                                    <div className="js-slot-job-name">{slot.label}</div>
                                                    <div className="js-slot-job-profit">${slot.profit}</div>
                                                </div>
                                            ) : (
                                                <div className="js-slot-placeholder">
                                                    {isSearching ? '↓' : '—'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Stats */}
                        <div className="js-stats-row">
                            <div className="js-stat">
                                <span className="js-stat-label">Scheduled</span>
                                <span className="js-stat-value">
                                    {currentStep?.slots?.filter(s => s !== null).length || 0}/{currentStep?.maxDeadline || 0}
                                </span>
                            </div>
                            <div className="js-stat">
                                <span className="js-stat-label">Total Profit</span>
                                <span className="js-stat-value js-stat-highlight">${currentStep?.totalProfit || 0}</span>
                            </div>
                            <div className="js-stat">
                                <span className="js-stat-label">Rejected</span>
                                <span className="js-stat-value js-stat-rejected">
                                    {currentStep?.jobs?.filter(j => j.state === 'rejected').length || 0}
                                </span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="js-legend">
                            <div className="js-legend-item"><div className="js-legend-dot" style={{ background: '#334155' }}></div>Empty</div>
                            <div className="js-legend-item"><div className="js-legend-dot" style={{ background: '#f59e0b' }}></div>Searching</div>
                            <div className="js-legend-item"><div className="js-legend-dot" style={{ background: '#10b981' }}></div>Filled</div>
                        </div>
                    </div>
                </div>

                {/* Animation Controls */}
                <div className="js-controls-wrapper">
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

export default JobSequencingVisualizer;
