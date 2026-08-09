import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateJobSequencingSteps } from '../algorithms/greedy/jobSequencing';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaRandom, FaRedo } from 'react-icons/fa';
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
    const [jobs, setJobs]         = useState(DEFAULT_JOBS);
    const [inputStr, setInputStr] = useState(DEFAULT_JOBS.map(j => `${j.deadline}:${j.profit}`).join(', '));
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
            if (pairs.length > 8) throw new Error('Maximum 8 jobs.');

            const newJobs = pairs.map((pair, idx) => {
                const parts = pair.split(':');
                if (parts.length !== 2) throw new Error(`Invalid format "${pair}". Use deadline:profit.`);
                const d = parseInt(parts[0].trim(), 10);
                const p = parseInt(parts[1].trim(), 10);
                if (isNaN(d) || isNaN(p) || d <= 0 || p < 0) throw new Error(`Deadline must be positive and profit non-negative.`);
                return { id: `J${idx + 1}`, deadline: d, profit: p };
            });

            setJobs(newJobs);
            reset();
            toast.success('Jobs updated!');
        } catch (err) {
            toast.error(err.message || 'Invalid input.');
        }
    };

    const handleRandomize = () => {
        const count = 6;
        const newJobs = Array.from({ length: count }, (_, i) => ({
            id: `J${i + 1}`,
            deadline: Math.floor(Math.random() * 4) + 1,
            profit: Math.floor(Math.random() * 90) + 10
        }));

        setJobs(newJobs);
        setInputStr(newJobs.map(j => `${j.deadline}:${j.profit}`).join(', '));
        reset();
        toast.success('Random jobs generated!');
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'init':        return 2;
            case 'sort':        return 2;
            case 'consider':    return 7;
            case 'search-slot': return 8;
            case 'placed':      return 10;
            case 'rejected':    return 7;
            case 'completed':   return 17;
            default:            return 0;
        }
    };

    const codeSnippet = algorithmCodes.jobSequencing?.[activeLanguage] || '';
    const stepData    = currentStep || {};
    const slots       = stepData.slots || [];

    return (
        <DualView
            algorithmName="Job Sequencing with Deadlines (Greedy)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            codeSnippetCategory="greedy"
            description={
                <div className="js-desc-wrapper">
                    <span className="js-badge">Greedy Profit Maximization O(N log N)</span>
                    <span className="js-desc-text">
                        {currentStep?.description || 'Press Play to sort jobs by profit and schedule them in latest available slots.'}
                    </span>
                </div>
            }
        >
            <div className="js-visualizer-wrapper">

                {/* ── Top Input Controls Panel ──────────────────────────── */}
                <div className="js-input-panel">
                    <div className="js-input-group">
                        <label className="js-input-label">Jobs (deadline:profit):</label>
                        <input
                            type="text"
                            value={inputStr}
                            onChange={(e) => setInputStr(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                            placeholder="2:100, 1:19, 2:27"
                            className="js-text-input"
                        />
                        <button onClick={handleApply} className="js-btn js-btn-primary">
                            <FaCheck /> Schedule
                        </button>
                    </div>

                    <div className="js-btn-group">
                        <button onClick={handleRandomize} className="js-btn js-btn-secondary">
                            <FaRandom /> Random
                        </button>
                        <button onClick={() => { setJobs(DEFAULT_JOBS); setInputStr(DEFAULT_JOBS.map(j => `${j.deadline}:${j.profit}`).join(', ')); reset(); }} className="js-btn js-btn-outline">
                            <FaRedo /> Reset
                        </button>
                    </div>

                    <div className="js-legend">
                        <div className="js-leg-item"><span className="js-dot yellow"></span> Evaluating</div>
                        <div className="js-leg-item"><span className="js-dot green"></span> Scheduled</div>
                        <div className="js-leg-item"><span className="js-dot red"></span> Rejected</div>
                    </div>
                </div>

                {/* ── Main Canvas Stage: Time Slots & Job Pool Grid ───────── */}
                <div className="js-canvas-wrapper">
                    
                    {/* Time Slots Row */}
                    <div className="js-card">
                        <div className="js-card-header">
                            <span>Time Slot Schedule</span>
                            <span className="js-total-profit">Total Profit: <strong>{stepData.totalProfit ?? 0}</strong></span>
                        </div>
                        <div className="js-slots-row">
                            {slots.map((job, idx) => (
                                <div key={idx} className={`js-slot-box ${job ? 'filled' : 'empty'}`}>
                                    <span className="slot-idx">Time Slot [{idx + 1}]</span>
                                    <span className="slot-job">{job ? `${job.id} (+$${job.profit})` : 'EMPTY'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Jobs Pool Grid */}
                    <div className="js-card">
                        <div className="js-card-header">
                            <span>Job Pool (Sorted by Profit)</span>
                        </div>
                        <div className="js-jobs-grid">
                            {(stepData.jobs || jobs).map((job, idx) => {
                                const isCurrent  = stepData.currentJob?.id === job.id;
                                const isPlaced   = slots.some(s => s && s.id === job.id);
                                const isRejected = stepData.type === 'rejected' && isCurrent;

                                let cardClass = 'default';
                                if (isCurrent) cardClass = 'considering';
                                if (isPlaced) cardClass = 'placed';
                                if (isRejected) cardClass = 'rejected';

                                return (
                                    <div key={job.id || idx} className={`js-job-chip ${cardClass}`}>
                                        <span className="job-id">{job.id}</span>
                                        <span className="job-meta">dl: {job.deadline} | ${job.profit}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* ── YouTube Video Player Controls ────────────────────── */}
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
