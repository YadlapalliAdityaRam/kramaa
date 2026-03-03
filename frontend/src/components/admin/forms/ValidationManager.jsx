import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { FaCode, FaList } from 'react-icons/fa';
import { formatTestCaseInput } from '../../../utils/testCaseDisplay';

const buildTestCaseInput = (paramValues, parameters) => {
    if (!parameters || parameters.length === 0) return paramValues['raw_input'] || '';
    const obj = {};
    parameters.forEach(p => {
        const strVal = paramValues[p.name] || '';
        try {
            const parsed = JSON.parse(strVal);
            // Protect strings from being accidentally parsed as numbers if they are strictly string types
            if ((p.type === 'string' || p.type === 'char') && typeof parsed !== 'string') {
                obj[p.name] = String(strVal);
            } else {
                obj[p.name] = parsed;
            }
        } catch {
            obj[p.name] = strVal;
        }
    });
    return JSON.stringify(obj);
};

const formatInputDisplay = (inputStr, parameters) => {
    return formatTestCaseInput(inputStr, parameters);
};

const splitManualTestCases = (cases = []) => ({
    sample: (cases || []).filter((tc) => !tc?.isHidden),
    hidden: (cases || []).filter((tc) => tc?.isHidden)
});

const ValidationManager = ({ problemId, validationStatus, onValidationUpdate, parameters, liveTestCases = null }) => {
    const [activeTab, setActiveTab] = useState('manual'); // manual, solutions
    const [solutions, setSolutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [manualTestCases, setManualTestCases] = useState({ sample: [], hidden: [] });
    const [newTestCase, setNewTestCase] = useState({ output: '', isHidden: false, paramValues: {} });

    // New Solution State
    const [newSol, setNewSol] = useState({
        type: 'REFERENCE', // REFERENCE, BRUTE_FORCE, WRONG
        language: 'cpp',
        code: ''
    });

    useEffect(() => {
        if (problemId) {
            fetchData();
        }
    }, [problemId]);

    useEffect(() => {
        if (!Array.isArray(liveTestCases)) return;
        setManualTestCases(splitManualTestCases(liveTestCases));
    }, [liveTestCases]);

    const fetchData = async () => {
        try {
            const res = await api.get(`/problems/${problemId}/validation-data`);
            setSolutions(res.data.solutions);
            setManualTestCases({
                sample: res.data.sampleTestCases || [],
                hidden: res.data.hiddenTestCases || []
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveSolution = async () => {
        try {
            setLoading(true);
            await api.post(`/problems/${problemId}/solutions`, {
                solutionType: newSol.type,
                language: newSol.language,
                sourceCode: newSol.code
            });
            toast.success('Solution saved');
            setNewSol({ ...newSol, code: '' }); // Reset code
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save solution');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTestCase = async () => {
        try {
            setLoading(true);
            const inputStr = buildTestCaseInput(newTestCase.paramValues || {}, parameters);
            const res = await api.post(`/problems/${problemId}/testcases`, {
                testCases: [{
                    input: inputStr,
                    output: newTestCase.output,
                    explanation: 'Manual Entry'
                }],
                type: newTestCase.isHidden ? 'hidden' : 'sample'
            });

            if (res.data.count > 0) {
                toast.success('Test case added');
                setNewTestCase({ output: '', isHidden: false, paramValues: {} });
                fetchData();
            } else {
                toast('Test case already exists or invalid', { icon: 'ℹ️' });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add test case');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden mt-8">
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 p-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'manual' ? 'bg-orange-500/10 text-orange-400 border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}`}
                >
                    <FaCode /> Manual
                </button>
                <button
                    onClick={() => setActiveTab('solutions')}
                    className={`flex-1 p-4 font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'solutions' ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                >
                    <FaList /> Solutions
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'manual' && (
                    <div className="space-y-6">
                        <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20 text-orange-200 text-sm mb-4">
                            <strong>Manual Entry:</strong> Add exact input/output pairs. These are critical for correctness.
                        </div>

                        {/* Add New Form */}
                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                            <h4 className="text-sm font-bold text-white mb-4">Add New Test Case</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    {parameters && parameters.length > 0 ? (
                                        parameters.map((p) => (
                                            <div className="mb-2" key={p.name}>
                                                <label className="block text-xs text-teal-400 font-mono mb-1">
                                                    Param: <span className="text-white">{p.name}</span> <span className="text-gray-500 text-[10px]">({p.type})</span>
                                                </label>
                                                <textarea
                                                    value={newTestCase.paramValues?.[p.name] || ''}
                                                    onChange={e => setNewTestCase({ ...newTestCase, paramValues: { ...newTestCase.paramValues, [p.name]: e.target.value } })}
                                                    className="w-full bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm text-gray-300 h-16"
                                                    placeholder={`Value for ${p.name}...`}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="mb-2">
                                            <label className="block text-xs text-gray-400 mb-1">Input</label>
                                            <textarea
                                                value={newTestCase.paramValues?.raw_input || ''}
                                                onChange={e => setNewTestCase({ ...newTestCase, paramValues: { ...newTestCase.paramValues, raw_input: e.target.value } })}
                                                className="w-full bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm text-gray-300 h-24"
                                                placeholder="Enter input..."
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-emerald-400 font-mono mb-1">Expected Output</label>
                                    <textarea
                                        value={newTestCase.output}
                                        onChange={e => setNewTestCase({ ...newTestCase, output: e.target.value })}
                                        className="w-full bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm text-gray-300 h-24"
                                        placeholder="Enter expected output..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newTestCase.isHidden}
                                        onChange={e => setNewTestCase({ ...newTestCase, isHidden: e.target.checked })}
                                        className="rounded bg-gray-700 border-gray-600"
                                    />
                                    Hidden Test Case (Judge Only)
                                </label>
                                <button
                                    onClick={handleAddTestCase}
                                    disabled={loading || !newTestCase.output || (parameters?.length > 0 ? !Object.keys(newTestCase.paramValues).length : !newTestCase.paramValues.raw_input)}
                                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add Test Case'}
                                </button>
                            </div>
                        </div>

                        {/* Existing Lists */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Sample Cases */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                    Sample Cases <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-full">{manualTestCases.sample.length}</span>
                                </h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {manualTestCases.sample.map((tc, i) => (
                                        <div key={i} className="p-3 bg-white/5 rounded border border-white/10 hover:border-white/20 transition-colors">
                                            <div className="text-xs text-gray-500 mb-1">Input:</div>
                                            <div className="font-mono text-xs text-gray-300 bg-black/30 p-1 rounded mb-2 whitespace-pre-wrap">{formatInputDisplay(tc.input, parameters)}</div>
                                            <div className="text-xs text-gray-500 mb-1">Output:</div>
                                            <div className="font-mono text-xs text-gray-300 bg-black/30 p-1 rounded truncate">{tc.output}</div>
                                        </div>
                                    ))}
                                    {manualTestCases.sample.length === 0 && <p className="text-gray-600 text-sm italic">No sample cases.</p>}
                                </div>
                            </div>

                            {/* Hidden Cases */}
                            <div>
                                <h4 className="text-sm font-bold text-purple-400 uppercase mb-3 flex items-center gap-2">
                                    Hidden Cases <span className="bg-gray-800 text-xs px-2 py-0.5 rounded-full">{manualTestCases.hidden.length}</span>
                                </h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                    {manualTestCases.hidden.map((tc, i) => (
                                        <div key={i} className="p-3 bg-white/5 rounded border border-white/10 hover:border-white/20 transition-colors relative group">
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Could add delete button here later */}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-1">Input:</div>
                                            <div className="font-mono text-xs text-gray-300 bg-black/30 p-1 rounded mb-2 whitespace-pre-wrap">{formatInputDisplay(tc.input, parameters)}</div>
                                            <div className="text-xs text-gray-500 mb-1">Output:</div>
                                            <div className="font-mono text-xs text-gray-300 bg-black/30 p-1 rounded truncate">{tc.output}</div>
                                        </div>
                                    ))}
                                    {manualTestCases.hidden.length === 0 && <p className="text-gray-600 text-sm italic">No hidden cases.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'solutions' && (
                    <div className="space-y-6">
                        <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20 text-purple-200 text-sm mb-4">
                            <strong>Solutions:</strong> Add a reference solution (required) and other solution types for testing.
                        </div>

                        {/* Add Solution */}
                        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                            <h4 className="text-sm font-bold text-white mb-4">Add Solution</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Type</label>
                                    <select
                                        value={newSol.type}
                                        onChange={e => setNewSol({ ...newSol, type: e.target.value })}
                                        className="w-full bg-black/50 border border-gray-700 rounded p-2 text-sm text-white"
                                    >
                                        <option value="REFERENCE">Reference (Correct)</option>
                                        <option value="BRUTE_FORCE">Brute Force (Slow)</option>
                                        <option value="WRONG">Wrong Logic (Fail)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Language</label>
                                    <select
                                        value={newSol.language}
                                        onChange={e => setNewSol({ ...newSol, language: e.target.value })}
                                        className="w-full bg-black/50 border border-gray-700 rounded p-2 text-sm text-white"
                                    >
                                        <option value="cpp">C++</option>
                                        <option value="python">Python</option>
                                        <option value="java">Java</option>
                                        <option value="javascript">JavaScript</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs text-gray-400 mb-1">Source Code</label>
                                <textarea
                                    value={newSol.code}
                                    onChange={e => setNewSol({ ...newSol, code: e.target.value })}
                                    className="w-full bg-black/50 border border-gray-700 rounded p-2 font-mono text-sm text-gray-300 h-48"
                                    placeholder="// Enter solution code..."
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveSolution}
                                    disabled={loading || !newSol.code}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Solution'}
                                </button>
                            </div>
                        </div>

                        {/* Existing Solutions */}
                        <div>
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 text-white">Existing Solutions</h4>
                            <div className="space-y-2">
                                {solutions.map((sol, i) => (
                                    <div key={i} className="p-3 bg-white/5 rounded border border-white/10 flex justify-between items-center">
                                        <div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded mr-2 ${sol.solutionType === 'REFERENCE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                                                {sol.solutionType}
                                            </span>
                                            <span className="text-gray-300 text-sm">{sol.language}</span>
                                        </div>
                                        <button className="text-gray-500 hover:text-white text-xs">View Code</button>
                                    </div>
                                ))}
                                {solutions.length === 0 && <p className="text-gray-600 text-sm italic">No solutions added.</p>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValidationManager;
