import React, { useState, useEffect, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateActivitySelectionSteps } from '../algorithms/greedy/activitySelection';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import './ActivitySelectionVisualizer.css';

const ActivitySelectionVisualizer = () => {
    // Input format: start-end, start-end, ...
    const [activitiesStr, setActivitiesStr] = useState("1-3, 2-5, 4-7, 1-8, 5-9, 8-10, 9-11, 11-14, 13-16");
    const [initialActivities, setInitialActivities] = useState([
        { id: 1, start: 1, end: 3 },
        { id: 2, start: 2, end: 5 },
        { id: 3, start: 4, end: 7 },
        { id: 4, start: 1, end: 8 },
        { id: 5, start: 5, end: 9 },
        { id: 6, start: 8, end: 10 },
        { id: 7, start: 9, end: 11 },
        { id: 8, start: 11, end: 14 },
        { id: 9, start: 13, end: 16 }
    ]);

    const [activeLanguage, setActiveLanguage] = useState("javascript");

    const steps = useMemo(() => generateActivitySelectionSteps(initialActivities), [initialActivities]);

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        speed,
        setSpeed
    ,
        setIndex
    } = useGenericAnimation(steps);

    const handleApply = () => {
        try {
            const pairs = activitiesStr.split(',').map(s => s.trim()).filter(s => s !== "");
            if (pairs.length === 0) throw new Error("Need at least one activity.");
            if (pairs.length > 20) throw new Error("Maximum 20 activities supported for visualization.");

            const newActs = pairs.map((pair, idx) => {
                const parts = pair.split('-');
                if (parts.length !== 2) throw new Error(`Invalid format in "${pair}". Use start-end.`);
                const start = parseInt(parts[0].trim());
                const end = parseInt(parts[1].trim());
                if (isNaN(start) || isNaN(end)) throw new Error(`Non-numeric times in "${pair}".`);
                if (start >= end) throw new Error(`Start time must be less than end time in "${pair}".`);
                if (start < 0) throw new Error(`Negative times not allowed in "${pair}".`);
                return { id: idx + 1, start, end };
            });

            setInitialActivities(newActs);
            reset();
            toast.success("Timeline updated!");
        } catch (error) {
            toast.error(error.message || "Invalid input format.");
        }
    };

    const getActiveLine = (snapshot) => {
        if (!snapshot) return 0;
        // Map to exact lines in our source code snippet
        // Code lines roughly:
        // 2-3: sort
        // 4-5: setup selected, lastEnd
        // 7: for loop
        // 8: if start >= lastEnd
        // 9-10: push, update lastEnd
        if (snapshot.type === 'init') return 3; // sorting
        if (snapshot.type === 'activity' || snapshot.type === 'sorted') {
            if (snapshot.actStates && Object.values(snapshot.actStates).some(s => s === 'comparing')) {
                return 8; // if (start >= lastEnd)
            }
            if (snapshot.actStates && Object.values(snapshot.actStates).some(s => s === 'selected')) {
                return 10; // selected.push
            }
            return 3;
        }
        if (snapshot.type === 'activity-complete') return 14; // return
        return 0;
    };

    // Calculate max time for axis scaling
    const maxTime = useMemo(() => {
        let max = 0;
        initialActivities.forEach(act => {
            if (act.end > max) max = act.end;
        });
        // Add a padding chunk to max
        const tickInterval = Math.max(1, Math.ceil((max + 2) / 10));
        return Math.ceil((max + 2) / tickInterval) * tickInterval;
    }, [initialActivities]);

    const tickInterval = Math.max(1, Math.ceil(maxTime / 10));
    const ticks = Array.from({ length: Math.ceil(maxTime / tickInterval) + 1 }, (_, i) => i * tickInterval);

    // Get position data
    const getLeftPercent = (start) => `${(start / maxTime) * 100}%`;
    const getWidthPercent = (start, end) => `${((end - start) / maxTime) * 100}%`;

    // To handle smooth vertical sorting, we generate a deterministic vertical position (Y).
    const getYPosition = (act) => {
        if (!currentStep?.activities) return 0;
        // Before sorting (init), display by original ID
        if (currentStep.type === 'init') {
            const idx = currentStep.activities.findIndex(a => a.id === act.id);
            return idx * 50; // 50px vertical gap
        }
        // After sorting, display by sorted index
        const idx = currentStep.activities.findIndex(a => a.id === act.id);
        return idx * 50;
    };

    // Determine current boundary
    let currentBoundary = 0;
    if (currentStep && currentStep.type !== 'init' && currentStep.type !== 'sorted') {
        // Find latest selected item end time
        if (currentStep.selected && currentStep.selected.length > 0) {
            currentBoundary = currentStep.selected[currentStep.selected.length - 1].end;
        }
    }

    const codeSnippet = algorithmCodes.activitySelection?.[activeLanguage] || "";

    return (
        <DualView
            algorithmName="Activity Selection (Greedy)"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || "Select parameters and press Play."}
        >
            <div className="activity-container">
                {/* Inputs */}
                <div className="activity-input-bar">
                    <div className="activity-inputs">
                        <div className="activity-input-group">
                            <span className="activity-label">Activities (start-end):</span>
                            <input
                                type="text"
                                className="activity-array-input"
                                value={activitiesStr}
                                onChange={(e) => setActivitiesStr(e.target.value)}
                                placeholder="1-3, 2-5, 4-7..."
                            />
                        </div>
                    </div>
                    <button className="cs-btn cs-btn-primary" onClick={handleApply}>Update Timeline</button>
                </div>

                {/* Main Visualization */}
                <div className="activity-main-area">
                    {/* Timeline Canvas */}
                    <div className="activity-timeline-container">
                        {/* Time Axis */}
                        <div className="activity-axis">
                            {ticks.map(tick => (
                                <div key={`tick-${tick}`} className="activity-axis-tick" style={{ left: getLeftPercent(tick) }}>
                                    {tick}
                                </div>
                            ))}
                        </div>

                        {/* Current Boundary Line */}
                        {(currentBoundary > 0 || (currentStep && currentStep.actStates)) && (
                            <div className="activity-boundary-line" style={{ left: getLeftPercent(currentBoundary) }}>
                                <div className="activity-boundary-label">End: {currentBoundary}</div>
                            </div>
                        )}

                        <div className="activity-bars-scroll" style={{ minHeight: `${(currentStep?.activities?.length || 0) * 50 + 20}px` }}>
                            {currentStep?.activities && currentStep.activities.map(act => {
                                const state = currentStep.actStates ? currentStep.actStates[act.id] : 'default';

                                return (
                                    <div
                                        key={`act-${act.id}`}
                                        className="activity-bar-wrapper"
                                        style={{
                                            top: `${getYPosition(act)}px`,
                                            left: getLeftPercent(act.start),
                                            width: getWidthPercent(act.start, act.end)
                                        }}
                                    >
                                        <div className={`activity-bar state-${state}`} style={{ width: '100%' }}>
                                            Act {act.id}
                                            <div className="activity-times-tooltip">
                                                ID: {act.id} | [{act.start}, {act.end})
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Data Panel */}
                    <div className="activity-side-panel">
                        <div className="activity-info-card">
                            <div className="activity-info-title">Global Schedule</div>

                            <div className="activity-schedule-list">
                                {currentStep?.selected && currentStep.selected.length > 0 ? (
                                    currentStep.selected.map((act, i) => (
                                        <div key={`sched-${act.id}`} className="activity-schedule-item">
                                            <span className="activity-schedule-id">Act {act.id}</span>
                                            <span className="activity-schedule-time">{act.start} → {act.end}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px', textAlign: 'center' }}>
                                        No activities selected yet.
                                    </div>
                                )}
                            </div>

                            <div className="activity-legend">
                                <div className="activity-legend-item"><div className="activity-legend-color act-l-blue"></div> Pending / Default</div>
                                <div className="activity-legend-item"><div className="activity-legend-color act-l-yellow"></div> Checking</div>
                                <div className="activity-legend-item"><div className="activity-legend-color act-l-green"></div> Selected (Compatible)</div>
                                <div className="activity-legend-item"><div className="activity-legend-color act-l-red"></div> Rejected (Overlaps)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="activity-controls-wrapper">
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

export default ActivitySelectionVisualizer;
