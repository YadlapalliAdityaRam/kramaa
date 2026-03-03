import React from 'react';
import './ActivityCanvas.css';

const stateColors = {
    default: 'rgba(255,255,255,0.1)',
    comparing: '#f59e0b',
    selected: '#10b981',
    rejected: '#ef4444'
};

const ActivityCanvas = ({ activities, actStates = {}, selected = [] }) => {
    if (!activities || activities.length === 0) {
        return <div className="activity-canvas-empty">No activity data</div>;
    }

    const maxEnd = Math.max(...activities.map(a => a.end));
    const timeWidth = 100 / maxEnd; // percentage per time unit

    return (
        <div className="activity-canvas">
            {/* Timeline header */}
            <div className="activity-timeline-header">
                {Array.from({ length: maxEnd + 1 }, (_, i) => (
                    <div
                        key={i}
                        className="timeline-tick"
                        style={{ left: `${i * timeWidth}%` }}
                    >
                        {i}
                    </div>
                ))}
            </div>

            {/* Activity bars */}
            <div className="activity-bars">
                {activities.map((act) => {
                    const state = actStates[act.id] || 'default';
                    const color = stateColors[state];
                    const isSelected = state === 'selected';
                    const isRejected = state === 'rejected';

                    return (
                        <div key={act.id} className={`activity-bar-row ${state}`}>
                            <span className="activity-label">A{act.id}</span>
                            <div className="activity-bar-track">
                                <div
                                    className={`activity-bar ${isSelected ? 'bar-selected' : ''} ${isRejected ? 'bar-rejected' : ''}`}
                                    style={{
                                        left: `${act.start * timeWidth}%`,
                                        width: `${(act.end - act.start) * timeWidth}%`,
                                        backgroundColor: color,
                                        borderColor: isSelected ? '#10b981' : isRejected ? '#ef4444' : 'transparent'
                                    }}
                                >
                                    <span className="bar-time">{act.start}–{act.end}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selected summary */}
            {selected.length > 0 && (
                <div className="activity-summary">
                    Selected: {selected.map(a => `A${a.id}`).join(', ')} ({selected.length} activities)
                </div>
            )}
        </div>
    );
};

export default ActivityCanvas;
