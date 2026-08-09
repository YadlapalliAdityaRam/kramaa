import React, { useState, useMemo } from 'react';
import DualView from './DualView';
import AnimationControls from '../components/animation-controls/AnimationControls';
import { generateRatInMazeSteps } from '../algorithms/backtracking/ratInMaze';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { FaCheck, FaEdit, FaRedo } from 'react-icons/fa';
import './RatInMazeVisualizer.css';

const RatInMazeVisualizer = () => {
    const [mazeSize, setMazeSize]               = useState(4);
    const [customMaze, setCustomMaze]           = useState(null);
    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [tempMaze, setTempMaze]               = useState(null);
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    const defaultMaze = useMemo(() => {
        const n = mazeSize;
        const m = Array.from({ length: n }, () => Array(n).fill(1));
        if (n >= 4) {
            m[1][1] = 0; m[2][2] = 0;
            if (n > 3) m[0][3] = 0;
        }
        m[0][0] = 1; m[n - 1][n - 1] = 1;
        return m;
    }, [mazeSize]);

    const activeMaze = useMemo(() => customMaze || defaultMaze, [customMaze, defaultMaze]);

    const steps = useMemo(() => {
        try {
            return generateRatInMazeSteps(activeMaze);
        } catch (e) {
            return [{
                type: 'info',
                r: 0,
                c: 0,
                grid: activeMaze.map((row) =>
                    row.map((cell) => ({ value: cell, isPath: false, isBacktrack: false }))
                ),
                description: '⚠️ Could not generate steps for this maze.',
                isInitial: true
            }];
        }
    }, [activeMaze]);

    const anim = useGenericAnimation(steps);

    const codeSnippet = algorithmCodes.ratInMaze?.[activeLanguage] || '';

    const getActiveLine = () => {
        if (!anim.currentStep) return 1;
        switch (anim.currentStep.type) {
            case 'try': return 10;
            case 'path': return 15;
            case 'backtrack': return 18;
            case 'solution': return 5;
            default: return 1;
        }
    };

    const currentStep = anim.currentStep;

    const handleCellToggle = (r, c) => {
        if (!tempMaze) return;
        const sz = tempMaze.length;
        if ((r === 0 && c === 0) || (r === sz - 1 && c === sz - 1)) return;
        const newMaze = tempMaze.map((row, ri) =>
            row.map((cell, ci) => (ri === r && ci === c ? (cell === 1 ? 0 : 1) : cell))
        );
        setTempMaze(newMaze);
    };

    const openEditor = () => {
        setTempMaze(JSON.parse(JSON.stringify(activeMaze)));
        setIsModalOpen(true);
    };

    const saveCustomMaze = () => {
        if (tempMaze) {
            setMazeSize(tempMaze.length);
            setCustomMaze(tempMaze);
        }
        setIsModalOpen(false);
        anim.reset();
        toast.success("Maze configuration saved!");
    };

    const renderGrid = () => {
        if (!steps || steps.length === 0) {
            return <div className="rat-maze-visualizer">No maze data</div>;
        }
        const grid = currentStep?.grid || steps[0]?.grid;
        if (!grid || grid.length === 0) {
            return <div className="rat-maze-visualizer">No maze data</div>;
        }

        const ratR = currentStep?.r ?? 0;
        const ratC = currentStep?.c ?? 0;
        const isCompleted = currentStep?.type === 'solution' || currentStep?.type === 'completed';

        return (
            <div className="rat-maze-stage">
                <div
                    className="rat-grid-board"
                    style={{
                        gridTemplateColumns: `repeat(${grid.length}, minmax(40px, 60px))`,
                        gridTemplateRows: `repeat(${grid.length}, minmax(40px, 60px))`
                    }}
                >
                    {grid.map((row, r) =>
                        row.map((cell, c) => {
                            const isRatHere = ratR === r && ratC === c;
                            const isStart   = r === 0 && c === 0;
                            const isEnd     = r === grid.length - 1 && c === grid.length - 1;
                            const isWall    = cell.value === 0;
                            const isPath    = cell.isPath;
                            const isBt      = cell.isBacktrack;

                            let stateClass = 'open';
                            if (isWall) stateClass = 'wall';
                            else if (isPath) stateClass = 'path';
                            else if (isBt)   stateClass = 'backtrack';

                            if (isStart) stateClass += ' start-node';
                            if (isEnd)   stateClass += ' end-node';

                            return (
                                <div key={`${r}-${c}`} className={`rat-cell ${stateClass}`}>
                                    {isRatHere && !isCompleted && <span className="rat-icon">🐁</span>}
                                    {isEnd && isCompleted && <span className="rat-icon">🧀</span>}
                                    {isStart && !isRatHere && <span className="cell-tag">S</span>}
                                    {isEnd && !isRatHere && !isCompleted && <span className="cell-tag">E</span>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    const editorSize = tempMaze ? tempMaze.length : mazeSize;

    return (
        <>
            <DualView
                algorithmName="Rat in a Maze (Backtracking)"
                code={codeSnippet}
                activeLine={getActiveLine()}
                activeLanguage={activeLanguage}
                onLanguageChange={setActiveLanguage}
                codeSnippetCategory="backtracking"
                description={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <span className="rim-step-badge">
                            Step {anim.currentStepIndex + 1} / {anim.totalSteps || 1}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'pre-line' }}>
                            {currentStep?.description || 'Ready to start'}
                        </span>
                    </div>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', height: '100%', justifyContent: 'flex-start' }}>
                    {renderGrid()}

                    {/* Controls */}
                    <div className="rim-controls-bar">
                        <AnimationControls
                            isPlaying={anim.isPlaying}
                            onPlay={anim.play}
                            onPause={anim.pause}
                            onNext={anim.stepForward}
                            onPrev={anim.stepBackward}
                            onReset={anim.reset}
                            speed={anim.speed}
                            onSpeedChange={anim.setSpeed}
                            currentStep={anim.currentStepIndex}
                            totalSteps={anim.totalSteps}
                            onScrub={anim.setIndex}
                            inputType="none"
                        />
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                            <button className="rim-btn rim-btn-primary" onClick={openEditor}>
                                <FaEdit /> Edit Maze Walls
                            </button>
                        </div>
                    </div>
                </div>
            </DualView>

            {/* Maze Editor Modal */}
            {isModalOpen && (
                <div className="rim-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="rim-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="rim-modal-title">Customize Maze Grid</h3>
                        <div className="custom-maze-editor">
                            <div className="editor-controls" style={{ marginBottom: '15px' }}>
                                <label style={{ marginRight: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Grid Size (3-8):</label>
                                <input
                                    type="number"
                                    min="3"
                                    max="8"
                                    value={editorSize}
                                    onChange={(e) => {
                                        const s = parseInt(e.target.value, 10);
                                        if (s >= 3 && s <= 8) {
                                            const newM = Array.from({ length: s }, () => Array(s).fill(1));
                                            newM[0][0] = 1; newM[s - 1][s - 1] = 1;
                                            setTempMaze(newM);
                                        }
                                    }}
                                    className="rim-input"
                                />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                Click cells to toggle walls. Start (0,0) and End (bottom-right) are fixed.
                            </p>
                            <div
                                className="maze-editor-grid"
                                style={{
                                    gridTemplateColumns: `repeat(${editorSize}, 35px)`,
                                    margin: '0 auto'
                                }}
                            >
                                {tempMaze && tempMaze.map((row, r) =>
                                    row.map((cell, c) => {
                                        const isStart = r === 0 && c === 0;
                                        const isEnd = r === editorSize - 1 && c === editorSize - 1;
                                        let cls = cell === 0 ? 'editor-cell-wall' : 'editor-cell-empty';
                                        if (isStart) cls += ' editor-cell-start';
                                        if (isEnd) cls += ' editor-cell-end';

                                        return (
                                            <div
                                                key={`edit-${r}-${c}`}
                                                className={`editor-cell ${cls}`}
                                                onClick={() => handleCellToggle(r, c)}
                                            />
                                        );
                                    })
                                )}
                            </div>
                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="rim-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button className="rim-btn rim-btn-primary" onClick={saveCustomMaze}><FaCheck /> Save & Run</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RatInMazeVisualizer;
