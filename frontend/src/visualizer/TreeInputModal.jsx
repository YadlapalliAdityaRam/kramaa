import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaTree, FaCode, FaEraser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { validateTreeEdgeList } from './treeInputUtils';
import './TreeInputModal.css';

const TreeInputModal = ({ isOpen, onClose, onGenerate }) => {
    const [edgeList, setEdgeList] = useState('');

    const handleGenerate = () => {
        const { error, treeData } = validateTreeEdgeList(edgeList);
        if (error) {
            toast.error(error);
            return;
        }

        onGenerate(treeData);
        onClose();
        toast.success("Tree constructed successfully!");
    };

    const applyExample = (type) => {
        let example = "";
        switch (type) {
            case 'binary':
                example = "1 2\n1 3\n2 4\n2 5\n3 6\n3 7";
                break;
            case 'nary':
                example = "Root A\nRoot B\nRoot C\nA D\nA E\nA F\nB G\nC H\nC I";
                break;
            case 'skewed':
                example = "10 20\n20 30\n30 40\n40 50";
                break;
            case 'bst':
                example = "50 30\n50 70\n30 20\n30 40\n70 60\n70 80";
                break;
            default:
                example = "1 2\n1 3\n2 4\n2 5";
        }
        setEdgeList(example);
        toast.success(`${type.toUpperCase()} example loaded!`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="tree-modal-overlay" onClick={onClose}>
                <motion.div
                    className="tree-modal-content"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="tree-modal-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaTree style={{ color: '#10b981' }} />
                            <h2>Configure Custom Tree</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}><FaTimes /></button>
                    </div>

                    <div className="tree-modal-body">
                        <div className="tree-input-panel">
                            <label className="tree-input-label">Bulk Edge Entry</label>
                            <p className="tree-input-help">Format: <code>Parent Child</code> (one pair per line)</p>

                            <textarea
                                value={edgeList}
                                onChange={(e) => setEdgeList(e.target.value)}
                                placeholder="Root Child1&#10;Root Child2&#10;Child1 Grandchild1..."
                                className="tree-textarea"
                            />

                            <div className="example-buttons">
                                <span className="stat-label" style={{ width: '100%', marginBottom: '4px', display: 'block' }}>Load Example:</span>
                                <button className="example-btn" onClick={() => applyExample('binary')}>Binary Tree</button>
                                <button className="example-btn" onClick={() => applyExample('nary')}>N-ary Tree</button>
                                <button className="example-btn" onClick={() => applyExample('skewed')}>Skewed Tree</button>
                                <button className="example-btn" onClick={() => applyExample('bst')}>BST Structure</button>
                            </div>
                        </div>
                    </div>

                    <div className="tree-modal-footer">
                        <button className="secondary-btn" onClick={() => setEdgeList('')}>
                            <FaEraser style={{ marginRight: '6px' }} /> Clear
                        </button>
                        <button className="primary-btn" onClick={handleGenerate}>
                            <FaCode style={{ marginRight: '8px' }} /> Build & Run
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default TreeInputModal;
