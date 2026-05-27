import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaRandom } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { generateJumpSearchSteps } from '../algorithms/searching/jumpSearch';
import { algorithmCodes } from '../data/algorithmCodes';
import './JumpSearchVisualizer.css';

const EXAMPLES = [
    { label: 'Example 1', array: [1, 3, 5, 7, 9, 11, 13, 15, 17], target: 11 },
    { label: 'Example 2', array: [2, 4, 6, 8, 10, 12, 14, 16, 18], target: 14 }
];

const buildBlocks = (length, jumpSize) => {
    const size = Math.max(1, jumpSize || 1);
    const blocks = [];

    for (let start = 0; start < length; start += size) {
        const end = Math.min(start + size - 1, length - 1);
        blocks.push({
            start,
            end,
            indices: Array.from({ length: end - start + 1 }, (_, offset) => start + offset)
        });
    }

    return blocks;
};

const createJumpFriendlyArray = () => {
    const length = Math.floor(Math.random() * 4) + 9;
    const start = Math.floor(Math.random() * 6) + 1;
    const gap = Math.floor(Math.random() * 4) + 2;
    return Array.from({ length }, (_, index) => start + index * gap);
};

const JumpSearchVisualizer = () => {
    const [inputVal, setInputVal] = useState('1, 3, 5, 7, 9, 11, 13, 15, 17');
    const [targetVal, setTargetVal] = useState('11');
    const [arrayData, setArrayData] = useState([1, 3, 5, 7, 9, 11, 13, 15, 17]);
    const [activeTarget, setActiveTarget] = useState(11);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const steps = useMemo(
        () => generateJumpSearchSteps(arrayData, activeTarget),
        [arrayData, activeTarget]
    );

    const {
        currentStep,
        currentStepIndex,
        isPlaying,
        play,
        pause,
        reset,
        stepForward,
        stepBackward,
        setIndex,
        speed,
        setSpeed
    } = useGenericAnimation(steps);

    useEffect(() => {
        reset();
    }, [arrayData, activeTarget, reset]);

    const handleApply = () => {
        const parsedArr = inputVal
            .split(',')
            .map((value) => parseInt(value.trim(), 10))
            .filter((value) => !Number.isNaN(value));
        const parsedTarget = parseInt(targetVal, 10);

        if (parsedArr.length === 0) {
            toast.error('Please enter valid numbers for the array.');
            return;
        }
        if (Number.isNaN(parsedTarget)) {
            toast.error('Please enter a valid target number.');
            return;
        }

        const sortedArr = [...parsedArr].sort((a, b) => a - b);
        setArrayData(sortedArr);
        setActiveTarget(parsedTarget);
        toast.success('Array and target applied. Array sorted for Jump Search.');
    };

    const handleRandomize = () => {
        const randomArr = createJumpFriendlyArray();
        const randomTarget = randomArr[Math.floor(Math.random() * randomArr.length)];

        setArrayData(randomArr);
        setActiveTarget(randomTarget);
        setInputVal(randomArr.join(', '));
        setTargetVal(String(randomTarget));
        toast.success('Generated a sorted demo array for Jump Search.');
    };

    const loadExample = (example) => {
        setArrayData(example.array);
        setActiveTarget(example.target);
        setInputVal(example.array.join(', '));
        setTargetVal(String(example.target));
        toast.success(`${example.label} loaded.`);
    };

    const getActiveLine = (step) => {
        if (!step) return 0;
        switch (step.type) {
            case 'setup':
                return 3;
            case 'jump-check':
                return 7;
            case 'jump-forward':
                return 8;
            case 'block-found':
                return 12;
            case 'linear-check':
                return 13;
            case 'found':
                return 13;
            case 'not-found':
                return 17;
            default:
                return 0;
        }
    };

    const codeSnippet = algorithmCodes.jumpSearch?.[activeLanguage] || '';
    const currentArray = currentStep?.arraySnapshot || arrayData;
    const jumpSize = Number.isFinite(currentStep?.jumpSize)
        ? currentStep.jumpSize
        : Math.max(1, Math.floor(Math.sqrt(currentArray.length || 1)));
    const blocks = currentStep?.blocks?.length
        ? currentStep.blocks
        : buildBlocks(currentArray.length, jumpSize);
    const activeBlock = currentStep?.activeBlock || blocks[0] || null;
    const checkedBoundaryIndices = currentStep?.checkedBoundaryIndices || [];
    const discardedSet = new Set(currentStep?.discardedIndices || []);
    const jumpIndex = Number.isInteger(currentStep?.jumpIndex) ? currentStep.jumpIndex : -1;
    const linearIndex = Number.isInteger(currentStep?.linearIndex) ? currentStep.linearIndex : -1;
    const foundIndex = Number.isInteger(currentStep?.foundIndex) ? currentStep.foundIndex : -1;
    const activeBlockIndex = Number.isInteger(currentStep?.activeBlockIndex) ? currentStep.activeBlockIndex : -1;
    const resolvedActiveBlockIndex = activeBlock
        ? (activeBlockIndex >= 0
            ? activeBlockIndex
            : blocks.findIndex((block) => block.start === activeBlock.start && block.end === activeBlock.end))
        : -1;
    const phase = currentStep?.phase || 'Ready';
    const comparison = currentStep?.comparison || 'Jump Search will compare block boundaries first.';
    const decision = currentStep?.decision || 'Press Search to start the animation.';
    const blockLabel = activeBlock
        ? `Block ${resolvedActiveBlockIndex + 1} [${activeBlock.start}..${activeBlock.end}]`
        : 'No active block';
    const checkedBoundaryValues = checkedBoundaryIndices.length
        ? checkedBoundaryIndices.map((index) => currentArray[index]).join(' -> ')
        : 'None yet';

    return (
        <DualView
            algorithmName="Jump Search"
            code={codeSnippet}
            activeLine={getActiveLine(currentStep)}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={currentStep?.description || 'Jump ahead by sqrt(n) blocks, then linearly scan the selected block.'}
        >
            <div className="jump-container">
                <div className="jump-input-bar">
                    <div className="jump-input-group">
                        <label>Sorted Array:</label>
                        <input
                            type="text"
                            className="jump-value-input"
                            value={inputVal}
                            onChange={(event) => setInputVal(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && handleApply()}
                            placeholder="1, 3, 5, 7..."
                        />
                    </div>
                    <div className="jump-input-group">
                        <label>Target:</label>
                        <input
                            type="number"
                            className="jump-value-input jump-target-input"
                            value={targetVal}
                            onChange={(event) => setTargetVal(event.target.value)}
                            onKeyDown={(event) => event.key === 'Enter' && handleApply()}
                        />
                    </div>
                    <button className="jump-btn jump-btn-primary" onClick={handleApply}>
                        <FaPlay /> Search
                    </button>
                    <button className="jump-btn jump-btn-secondary" onClick={handleRandomize}>
                        <FaRandom /> Random
                    </button>
                    <div className="jump-example-row">
                        {EXAMPLES.map((example) => (
                            <button
                                key={example.label}
                                className="jump-btn jump-btn-example"
                                onClick={() => loadExample(example)}
                            >
                                {example.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="jump-visual-workspace">
                    <div className="jump-top-hud">
                        <div className="jump-stat-grid">
                            <div className="jump-stat-card">
                                <span>Array Length</span>
                                <strong>{currentArray.length}</strong>
                            </div>
                            <div className="jump-stat-card">
                                <span>Jump Size</span>
                                <strong>{jumpSize}</strong>
                            </div>
                            <div className="jump-stat-card">
                                <span>Current Phase</span>
                                <strong>{phase}</strong>
                            </div>
                            <div className="jump-stat-card">
                                <span>Current Block</span>
                                <strong>{blockLabel}</strong>
                            </div>
                        </div>

                        <div className="jump-math-board">
                            <div className="jump-math-title">Jump Size Rule</div>
                            <div className="jump-math-equation">
                                jump = floor(sqrt({currentArray.length || 0})) = {jumpSize}
                            </div>
                            <div className="jump-math-breakdown">
                                <span>sqrt(n) = {Math.sqrt(currentArray.length || 0).toFixed(2)}</span>
                                <span>Blocks = {blocks.length}</span>
                                <span>Jump Search first checks each block boundary.</span>
                            </div>
                        </div>
                    </div>

                    <div className="jump-status-strip">
                        <div className="jump-status-card">
                            <span>Comparison</span>
                            <strong>{comparison}</strong>
                        </div>
                        <div className="jump-status-card">
                            <span>Decision</span>
                            <strong>{decision}</strong>
                        </div>
                        <div className="jump-status-card">
                            <span>Checked Boundaries</span>
                            <strong>{checkedBoundaryValues}</strong>
                        </div>
                        <div className="jump-status-card">
                            <span>Target</span>
                            <strong>{activeTarget}</strong>
                        </div>
                    </div>

                    <div className="jump-block-grid">
                        {blocks.map((block, blockIdx) => {
                            const isActiveBlock = activeBlock
                                && block.start === activeBlock.start
                                && block.end === activeBlock.end;
                            const isDiscardedBlock = block.indices.every((index) => discardedSet.has(index));
                            const isCheckedBlock = checkedBoundaryIndices.includes(block.end) && !isActiveBlock && !isDiscardedBlock;

                            let blockClass = 'jump-block-card future-block';
                            let blockTag = 'Upcoming';

                            if (isDiscardedBlock) {
                                blockClass = 'jump-block-card discarded-block';
                                blockTag = 'Discarded';
                            } else if (isActiveBlock) {
                                blockClass = 'jump-block-card active-block';
                                blockTag = phase.includes('Linear') ? 'Linear Scan Block' : 'Current Jump Block';
                            } else if (isCheckedBlock) {
                                blockClass = 'jump-block-card checked-block';
                                blockTag = 'Checked';
                            }

                            return (
                                <motion.div
                                    key={`block-${block.start}-${block.end}`}
                                    className={blockClass}
                                    animate={{
                                        y: isActiveBlock ? -6 : 0,
                                        scale: isActiveBlock ? 1.01 : 1
                                    }}
                                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                                >
                                    <div className="jump-block-header">
                                        <div>
                                            <span className="jump-block-title">Block {blockIdx + 1}</span>
                                            <strong>[{block.start}..{block.end}]</strong>
                                        </div>
                                        <span className="jump-block-chip">{blockTag}</span>
                                    </div>

                                    <div className="jump-block-items">
                                        {block.indices.map((idx) => {
                                            const isBoundary = idx === block.end;
                                            const isJumpPointer = idx === jumpIndex && foundIndex === -1 && linearIndex === -1;
                                            const isLinearPointer = idx === linearIndex && foundIndex === -1;
                                            const isFound = idx === foundIndex;
                                            const isDiscarded = discardedSet.has(idx) && !isFound;
                                            const isInsideActiveBlock = isActiveBlock && !isDiscardedBlock;
                                            const labels = [];

                                            let boxClass = 'jump-box default-box';
                                            if (isDiscarded) {
                                                boxClass = 'jump-box discarded-box';
                                            } else if (isFound) {
                                                boxClass = 'jump-box found-box';
                                                labels.push({ text: 'Found', className: 'found-lbl' });
                                            } else if (isLinearPointer) {
                                                boxClass = 'jump-box linear-box';
                                                labels.push({ text: 'Linear', className: 'linear-lbl' });
                                            } else if (isJumpPointer) {
                                                boxClass = 'jump-box jump-pointer-box';
                                                labels.push({ text: 'Jump', className: 'jump-lbl' });
                                            } else if (isBoundary) {
                                                boxClass = 'jump-box boundary-box';
                                            } else if (isInsideActiveBlock) {
                                                boxClass = 'jump-box active-range-box';
                                            }

                                            if (isBoundary) {
                                                labels.push({ text: 'Boundary', className: 'boundary-lbl' });
                                            }

                                            return (
                                                <div key={`cell-${idx}`} className="jump-item-wrapper">
                                                    {labels.length > 0 && (
                                                        <div className="jump-status-stack">
                                                            {labels.map((label) => (
                                                                <div
                                                                    key={`${idx}-${label.text}`}
                                                                    className={`jump-status-label ${label.className}`}
                                                                >
                                                                    {label.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <motion.div
                                                        className={boxClass}
                                                        animate={{
                                                            y: isJumpPointer || isLinearPointer || isFound ? -10 : 0,
                                                            scale: isFound ? 1.06 : 1
                                                        }}
                                                        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                                                    >
                                                        <span className="jump-val">{currentArray[idx]}</span>
                                                    </motion.div>
                                                    <div className="jump-idx">{idx}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="jump-block-footer">
                                        <span>Boundary Check</span>
                                        <strong>
                                            index {block.end}, value {currentArray[block.end]}
                                        </strong>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="jump-footer">
                    <div className="jump-legend">
                        <div className="leg-item"><span className="dot yellow" /> Jump Pointer</div>
                        <div className="leg-item"><span className="dot blue" /> Block Boundary / Active Block</div>
                        <div className="leg-item"><span className="dot orange" /> Linear Search Pointer</div>
                        <div className="leg-item"><span className="dot green" /> Found Element</div>
                        <div className="leg-item"><span className="dot gray" /> Discarded Elements</div>
                    </div>
                </div>

                <div className="jump-controls-wrapper">
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

                <div className="cs-education-panel">
                    <div className="cs-edu-grid">
                        <div className="cs-edu-section">
                            <h3>How It Works</h3>
                            <p>
                                Jump Search improves Linear Search on sorted arrays by skipping ahead in blocks instead of checking every element one by one. It uses the block boundary values to quickly decide which part of the array can be ignored.
                            </p>
                            <h3 style={{ marginTop: '16px' }}>Why the Block Scan Matters</h3>
                            <p>
                                The yellow jump pointer checks the last value of each block. As soon as a boundary becomes large enough, the algorithm knows the target must be inside that blue block, so it switches to the orange linear scan.
                            </p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time (Best)</span>
                                    <span style={{ color: '#34d399' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Average)</span>
                                    <span style={{ color: '#fbbf24' }}>O(sqrt(n))</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Time (Worst)</span>
                                    <span style={{ color: '#fbbf24' }}>O(sqrt(n))</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>O(1)</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Data Requirement</span>
                                    <span style={{ color: '#60a5fa' }}>Sorted Array</span>
                                </div>
                            </div>
                            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                                Jump Search is efficient because it skips whole blocks first, then performs a short linear search only where the target can still exist.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DualView>
    );
};

export default JumpSearchVisualizer;
