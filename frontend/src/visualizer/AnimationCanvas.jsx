import React from 'react';
import { motion } from 'framer-motion';
import './AnimationCanvas.css';

const POINTER_BADGE_STYLE = {
    minWidth: '22px',
    height: '22px',
    borderRadius: '999px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 800,
    color: '#0f172a',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.22)'
};

const buildInfoChipClassName = (modifier = '') => (
    `algorithm-info-chip${modifier ? ` algorithm-info-chip--${modifier}` : ''}`
);

const buildStatusMeta = ({
    isTwoPointers,
    isSlidingWindow,
    idx,
    discarded,
    foundPair,
    leftPointer,
    rightPointer,
    outgoingIndex,
    incomingIndex,
    highlightBestWindow,
    bestWindow,
    currentWindow
}) => {
    if (isTwoPointers) {
        if (discarded.includes(idx)) {
            return { label: 'Discard', className: 'array-status-badge--discarded' };
        }
        if (foundPair.includes(idx)) {
            return { label: 'Pair', className: 'array-status-badge--found' };
        }
        if (idx === leftPointer || idx === rightPointer) {
            return { label: 'Check', className: 'array-status-badge--active' };
        }
        return null;
    }

    if (isSlidingWindow) {
        if (outgoingIndex === idx) {
            return { label: 'Out', className: 'array-status-badge--outgoing' };
        }
        if (incomingIndex === idx) {
            return { label: 'In', className: 'array-status-badge--incoming' };
        }
        if (highlightBestWindow && bestWindow.includes(idx)) {
            return { label: 'Best', className: 'array-status-badge--best' };
        }
        if (currentWindow.includes(idx)) {
            return { label: 'Window', className: 'array-status-badge--window' };
        }
        if (bestWindow.includes(idx)) {
            return { label: 'Best', className: 'array-status-badge--best' };
        }
    }

    return null;
};

const AnimationCanvas = ({
    array,
    currentIndices = [],
    compareIndices = [],
    sortedIndices = [],
    algorithmName = '',
    currentStep = null
}) => {
    const current = Array.isArray(currentIndices) ? currentIndices : [currentIndices];
    const compare = Array.isArray(compareIndices) ? compareIndices : [compareIndices];
    const sorted = Array.isArray(sortedIndices) ? sortedIndices : [sortedIndices];
    const isTwoPointers = algorithmName === 'Two Pointers Technique';
    const isSlidingWindow = algorithmName === 'Sliding Window Technique';
    const isPointerTechnique = isTwoPointers || isSlidingWindow;

    const leftPointer = Number.isInteger(currentStep?.leftPointer) ? currentStep.leftPointer : -1;
    const rightPointer = Number.isInteger(currentStep?.rightPointer) ? currentStep.rightPointer : -1;
    const discarded = Array.isArray(currentStep?.discardedIndices) ? currentStep.discardedIndices : [];
    const foundPair = Array.isArray(currentStep?.foundPair) ? currentStep.foundPair : [];
    const windowLeft = Number.isInteger(currentStep?.windowLeft) ? currentStep.windowLeft : -1;
    const windowRight = Number.isInteger(currentStep?.windowRight) ? currentStep.windowRight : -1;
    const currentWindow = Array.isArray(currentStep?.currentWindowIndices) ? currentStep.currentWindowIndices : [];
    const bestWindow = Array.isArray(currentStep?.bestWindowIndices) ? currentStep.bestWindowIndices : [];
    const incomingIndex = Number.isInteger(currentStep?.incomingIndex) ? currentStep.incomingIndex : -1;
    const outgoingIndex = Number.isInteger(currentStep?.outgoingIndex) ? currentStep.outgoingIndex : -1;
    const highlightBestWindow = Boolean(currentStep?.highlightBestWindow);
    const maxValue = Math.max(...array, 1);

    return (
        <div className={`animation-canvas${isPointerTechnique ? ' animation-canvas--cards' : ''}`}>
            {isTwoPointers && (
                <div className="algorithm-info-strip">
                    <div className={buildInfoChipClassName()}>
                        Current Sum: {Number.isFinite(currentStep?.sum) ? `${currentStep?.leftValue} + ${currentStep?.rightValue} = ${currentStep?.sum}` : 'waiting'}
                    </div>
                    <div className={buildInfoChipClassName('target')}>
                        Target: {currentStep?.target ?? '-'}
                    </div>
                    {currentStep?.decision && (
                        <div className={buildInfoChipClassName('full')}>
                            {currentStep.decision}
                        </div>
                    )}
                </div>
            )}

            {isSlidingWindow && (
                <div className="algorithm-info-strip">
                    <div className={buildInfoChipClassName('blue')}>
                        Window: {windowLeft >= 0 && windowRight >= windowLeft ? `[${windowLeft}..${windowRight}]` : 'building'}
                    </div>
                    <div className={buildInfoChipClassName('yellow')}>
                        Sum: {Number.isFinite(currentStep?.windowSum) ? currentStep.windowSum : '-'}
                    </div>
                    <div className={buildInfoChipClassName('green')}>
                        Best Sum: {Number.isFinite(currentStep?.bestSum) ? currentStep.bestSum : 'waiting'}
                    </div>
                    <div className={buildInfoChipClassName('best')}>
                        Best Window: {Number.isInteger(currentStep?.bestLeft) && Number.isInteger(currentStep?.bestRight) && currentStep?.bestRight >= currentStep?.bestLeft
                            ? `[${currentStep?.bestLeft}..${currentStep?.bestRight}]`
                            : 'waiting'}
                    </div>
                    <div className={buildInfoChipClassName('target')}>
                        k = {currentStep?.k ?? '-'}
                    </div>
                    {currentStep?.decision && (
                        <div className={buildInfoChipClassName('full')}>
                            {currentStep.decision}
                        </div>
                    )}
                </div>
            )}

            <div className={`bars-container${isPointerTechnique ? ' bars-container--cards' : ''}`}>
                {array.map((value, idx) => {
                    let stateClass = '';
                    let backgroundColor = 'var(--bar-unsorted)';

                    if (isTwoPointers) {
                        if (discarded.includes(idx)) {
                            backgroundColor = '#64748b';
                            stateClass = 'array-bar--discarded';
                        } else if (foundPair.includes(idx)) {
                            backgroundColor = '#22c55e';
                        } else if (idx === leftPointer || idx === rightPointer) {
                            backgroundColor = '#facc15';
                        }
                    } else if (isSlidingWindow) {
                        if (outgoingIndex === idx) {
                            backgroundColor = '#ef4444';
                        } else if (incomingIndex === idx) {
                            backgroundColor = '#facc15';
                        } else if (highlightBestWindow && bestWindow.includes(idx)) {
                            backgroundColor = '#22c55e';
                        } else if (currentWindow.includes(idx)) {
                            backgroundColor = '#3b82f6';
                        } else if (bestWindow.includes(idx)) {
                            backgroundColor = '#22c55e';
                        }
                    } else if (sorted.includes(idx)) {
                        backgroundColor = 'var(--bar-sorted)';
                        stateClass = 'element-complete';
                    } else if (current.includes(idx)) {
                        backgroundColor = 'var(--bar-swapping)';
                        stateClass = 'element-active';
                    } else if (compare.includes(idx)) {
                        stateClass = 'element-active';
                        if (compare[0] === idx) {
                            backgroundColor = 'var(--bar-compare-1)';
                        } else if (compare[1] === idx) {
                            backgroundColor = 'var(--bar-compare-2)';
                        } else {
                            backgroundColor = 'var(--bar-compare-1)';
                        }
                    }

                    const height = `${(value / maxValue) * 100}%`;
                    const statusMeta = buildStatusMeta({
                        isTwoPointers,
                        isSlidingWindow,
                        idx,
                        discarded,
                        foundPair,
                        leftPointer,
                        rightPointer,
                        outgoingIndex,
                        incomingIndex,
                        highlightBestWindow,
                        bestWindow,
                        currentWindow
                    });
                    const pointerBadgeStyle = isPointerTechnique
                        ? {
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            transform: 'none',
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                        }
                        : {
                            position: 'absolute',
                            top: '-34px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center'
                        };

                    return (
                        <motion.div
                            key={idx}
                            layout
                            className={`array-bar ${stateClass}${isPointerTechnique ? ' array-bar--card' : ''}`}
                            style={isPointerTechnique ? { backgroundColor } : { height, backgroundColor }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            {isTwoPointers && (idx === leftPointer || idx === rightPointer) && (
                                <div style={pointerBadgeStyle}>
                                    {idx === leftPointer && (
                                        <span style={{ ...POINTER_BADGE_STYLE, background: '#60a5fa' }}>
                                            L
                                        </span>
                                    )}
                                    {idx === rightPointer && (
                                        <span style={{ ...POINTER_BADGE_STYLE, background: '#fb923c' }}>
                                            R
                                        </span>
                                    )}
                                </div>
                            )}

                            {isSlidingWindow && (idx === windowLeft || idx === windowRight) && windowRight >= windowLeft && (
                                <div style={pointerBadgeStyle}>
                                    {idx === windowLeft && (
                                        <span style={{ ...POINTER_BADGE_STYLE, background: '#60a5fa' }}>
                                            L
                                        </span>
                                    )}
                                    {idx === windowRight && (
                                        <span style={{ ...POINTER_BADGE_STYLE, background: '#fb923c' }}>
                                            R
                                        </span>
                                    )}
                                </div>
                            )}

                            <span className="bar-value">{value}</span>

                            {isPointerTechnique && (
                                <span className="array-index">idx {idx}</span>
                            )}

                            {isPointerTechnique && statusMeta && (
                                <span className={`array-status-badge ${statusMeta.className}`}>
                                    {statusMeta.label}
                                </span>
                            )}

                            {!isTwoPointers && !isSlidingWindow && (current.includes(idx) || compare.includes(idx)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bar-pointer"
                                >
                                    v
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnimationCanvas;
