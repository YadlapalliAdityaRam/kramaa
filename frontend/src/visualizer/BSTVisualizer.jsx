import React, { useState, useEffect, useCallback } from 'react';
import useGenericAnimation from '../hooks/useGenericAnimation';
import TreeCanvas from './TreeCanvas';
import InputArrayDisplay from '../components/InputArrayDisplay';
import { 
    generateBSTInsertSteps, 
    generateBSTSearchSteps, 
    generateBSTDeleteSteps,
    generateBinaryTreeTraversalSteps,
    defaultTreeValues 
} from '../algorithms/trees/binaryTree';
import './BSTVisualizer.css';

const BSTVisualizer = () => {
    const [values, setValues] = useState(defaultTreeValues);
    const [inputValue, setInputValue] = useState('');
    const [activeOperation, setActiveOperation] = useState('none');
    const [steps, setSteps] = useState([]);
    
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
    } = useGenericAnimation(steps);

    // Initial load
    useEffect(() => {
        handleTraversal('inorder');
    }, []);

    const handleInsert = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) return;
        
        setActiveOperation('insert');
        const newSteps = generateBSTInsertSteps(values, val);
        setSteps(newSteps);
        setInputValue('');
        play();
    };

    const handleSearch = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) return;
        
        setActiveOperation('search');
        const newSteps = generateBSTSearchSteps(values, val);
        setSteps(newSteps);
        setInputValue('');
        play();
    };

    const handleDelete = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) return;
        
        setActiveOperation('delete');
        const newSteps = generateBSTDeleteSteps(values, val);
        setSteps(newSteps);
        setInputValue('');
        play();
    };

    const handleTraversal = (type) => {
        setActiveOperation(type);
        const newSteps = generateBinaryTreeTraversalSteps(values, type);
        setSteps(newSteps);
        play();
    };

    const handleRandom = () => {
        const randomValues = Array.from({ length: 7 }, () => Math.floor(Math.random() * 90) + 10);
        setValues(randomValues);
        const newSteps = generateBinaryTreeTraversalSteps(randomValues, 'inorder');
        setSteps(newSteps);
        reset();
    };

    // Update the underlying values when an operation completes successfully
    useEffect(() => {
        if (currentStepIndex === steps.length - 1 && steps.length > 0) {
            if (activeOperation === 'insert' || activeOperation === 'delete') {
                 if (currentStep.arraySnapshot) {
                     setValues(currentStep.arraySnapshot);
                 }
            }
        }
    }, [currentStepIndex, steps.length, activeOperation]);

    return (
        <div className="bst-visualizer main-content">
            <div className="visualizer-header">
                <h1 className="gradient-text">Binary Search Tree</h1>
                <p>Interactive operations and traversals animations.</p>
            </div>

            <div className="visualizer-container">
                <div className="control-panel glass-panel">
                    <div className="input-group">
                        <input 
                            type="number" 
                            className="viz-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Value"
                            onKeyPress={(e) => e.key === 'Enter' && handleInsert()}
                        />
                        <div className="btn-grid">
                            <button className="control-btn insert-btn" onClick={handleInsert}>Insert</button>
                            <button className="control-btn search-btn" onClick={handleSearch}>Search</button>
                            <button className="control-btn delete-btn" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="traversal-group">
                        <p className="label">Traversals</p>
                        <div className="btn-grid">
                            <button className="control-btn" onClick={() => handleTraversal('inorder')}>Inorder</button>
                            <button className="control-btn" onClick={() => handleTraversal('preorder')}>Preorder</button>
                            <button className="control-btn" onClick={() => handleTraversal('postorder')}>Postorder</button>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="playback-controls">
                        <div className="step-controls">
                            <button className="icon-btn" onClick={stepBackward} disabled={isPlaying}>⏮</button>
                            <button className={`play-btn ${isPlaying ? 'active' : ''}`} onClick={isPlaying ? pause : play}>
                                {isPlaying ? '⏸' : '▶'}
                            </button>
                            <button className="icon-btn" onClick={stepForward} disabled={isPlaying}>⏭</button>
                            <button className="icon-btn" onClick={reset}>🔄</button>
                        </div>
                        <div className="speed-control">
                            <label>Speed: {speed}x</label>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="3" 
                                step="0.5" 
                                value={speed} 
                                onChange={(e) => setSpeed(parseFloat(e.target.value))} 
                            />
                        </div>
                        <button className="control-btn random-btn" onClick={handleRandom}>Random Tree</button>
                    </div>
                </div>

                <div className="display-panel">
                    <div className="canvas-wrapper glass-panel">
                        <TreeCanvas treeData={currentStep.treeData} nodeStates={currentStep.nodeStates} />
                        
                        <div className="array-overlay">
                            <InputArrayDisplay 
                                arraySnapshot={currentStep.arraySnapshot || values} 
                                activeArrayIndex={currentStep.activeArrayIndex} 
                            />
                        </div>
                    </div>

                    <div className="info-panel glass-panel">
                        <h3>Process Status</h3>
                        <p className="step-description">{currentStep.description || "Select an operation to begin."}</p>
                        
                        {currentStep.result && (
                            <div className="traversal-result">
                                <h4>Result Array</h4>
                                <div className="result-values">
                                    {currentStep.result.map((v, i) => (
                                        <span key={i} className="result-chip">{v}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="complexity-info">
                            <div className="badge">Avg: O(log n)</div>
                            <div className="badge">Worst: O(n)</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BSTVisualizer;
