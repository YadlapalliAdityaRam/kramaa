import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaSave, FaArrowLeft, FaCode, FaFlask, FaBook, FaRandom } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './ProblemForm.css';
import TicketCreateModal from '../tickets/TicketCreateModal';
import ValidationManager from './ValidationManager';
import { generateTemplates } from '../../../utils/templateGenerator';

const uniqStrings = (values = []) => {
    const unique = new Set();
    values.forEach((value) => {
        const cleaned = String(value || '').trim();
        if (cleaned) unique.add(cleaned);
    });
    return [...unique];
};

const shuffleValues = (values = []) => {
    const shuffled = [...values];
    for (let idx = shuffled.length - 1; idx > 0; idx--) {
        const pick = Math.floor(Math.random() * (idx + 1));
        [shuffled[idx], shuffled[pick]] = [shuffled[pick], shuffled[idx]];
    }
    return shuffled;
};

const parseTestCaseInput = (inputValue, parameters) => {
    const vals = {};
    if (!parameters || parameters.length === 0) {
        vals.raw_input = typeof inputValue === 'string'
            ? inputValue
            : (inputValue == null ? '' : JSON.stringify(inputValue));
        return vals;
    }

    let parsed = inputValue;
    if (typeof inputValue === 'string') {
        try {
            parsed = JSON.parse(inputValue);
        } catch {
            parsed = inputValue;
        }
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        parameters.forEach((p) => {
            const val = parsed[p.name];
            if (val === undefined) {
                vals[p.name] = '';
            } else if (typeof val === 'string') {
                vals[p.name] = val;
            } else {
                vals[p.name] = JSON.stringify(val);
            }
        });
        return vals;
    }

    if (Array.isArray(parsed)) {
        if (parameters.length === 1) {
            const param = parameters[0];
            const expectsCollection = Boolean(param?.isArray || param?.is2D);
            let value = parsed;

            if (!expectsCollection && parsed.length === 1) {
                value = parsed[0];
            } else if (
                expectsCollection
                && parsed.length === 1
                && typeof parsed[0] === 'string'
            ) {
                const trimmed = parsed[0].trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    try {
                        const decoded = JSON.parse(trimmed);
                        if (Array.isArray(decoded)) {
                            value = decoded;
                        }
                    } catch {
                        // Keep legacy value when parse fails.
                    }
                }
            }

            vals[param.name] = typeof value === 'string' ? value : JSON.stringify(value);
            return vals;
        }

        parameters.forEach((p, i) => {
            const val = parsed[i];
            if (val === undefined) {
                vals[p.name] = '';
            } else if (typeof val === 'string') {
                vals[p.name] = val;
            } else {
                vals[p.name] = JSON.stringify(val);
            }
        });
        return vals;
    }

    if (parameters.length === 1) {
        vals[parameters[0].name] = parsed == null ? '' : String(parsed);
    }
    return vals;
};

const buildTestCaseInput = (paramValues, parameters) => {
    if (!parameters || parameters.length === 0) return paramValues.raw_input || '';

    const payload = {};
    parameters.forEach((p) => {
        const raw = paramValues[p.name];
        const rawString = typeof raw === 'string' ? raw : (raw == null ? '' : String(raw));

        if (p.type === 'string' || p.type === 'char') {
            payload[p.name] = rawString;
            return;
        }

        if (rawString.trim() === '') {
            payload[p.name] = '';
            return;
        }

        let parsed = rawString;
        try {
            parsed = JSON.parse(rawString);
        } catch {
            parsed = rawString;
        }

        if ((p.isArray || p.is2D) && typeof parsed === 'string') {
            const trimmed = parsed.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    parsed = JSON.parse(trimmed);
                } catch {
                    // Keep original string when parse fails.
                }
            }
        }

        payload[p.name] = parsed;
    });

    return payload;
};

const buildEditorialDraft = (problemData) => {
    const firstApproach = problemData?.editorial?.approaches?.[0] || null;
    return {
        title: firstApproach?.title || '',
        description: firstApproach?.description || '',
        timeComplexity: firstApproach?.timeComplexity || '',
        spaceComplexity: firstApproach?.spaceComplexity || '',
        code: firstApproach?.code || '',
        codeLanguage: firstApproach?.codeLanguage || 'javascript',
        publish: problemData?.editorialPublished !== false
    };
};

const isPublishedFromProblem = (problemData) => {
    if (!problemData || typeof problemData !== 'object') return false;
    if (problemData.isPublished === true) return true;
    return String(problemData.status || '').trim().toLowerCase() === 'published';
};

const parseReturnTypeSpec = (rawType = 'void') => {
    let baseType = String(rawType || 'void').trim().toLowerCase();
    let depth = 0;

    while (baseType.endsWith('[]')) {
        depth += 1;
        baseType = baseType.slice(0, -2).trim();
    }

    return { baseType, depth };
};

const tryParseJson = (value) => {
    try {
        return { ok: true, value: JSON.parse(value) };
    } catch {
        return { ok: false, value };
    }
};

const decodeNestedJson = (value) => {
    let current = value;
    for (let i = 0; i < 3; i += 1) {
        if (typeof current !== 'string') break;
        const trimmed = current.trim();
        if (!trimmed) break;
        const result = tryParseJson(trimmed);
        if (!result.ok || result.value === current) break;
        current = result.value;
    }
    return current;
};

const coerceScalarReturnValue = (rawValue, baseType) => {
    if (typeof rawValue !== 'string') return rawValue;

    const trimmed = rawValue.trim();
    if (!trimmed) return rawValue;

    if (baseType === 'string' || baseType === 'char') {
        const decoded = decodeNestedJson(trimmed);
        if (typeof decoded === 'string') return decoded;

        // Accept single-quoted manual entry like 'a' or 'hello'
        if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
            return trimmed.slice(1, -1);
        }
        return rawValue;
    }

    if (baseType === 'boolean' || baseType === 'bool') {
        if (trimmed.toLowerCase() === 'true') return true;
        if (trimmed.toLowerCase() === 'false') return false;
        return rawValue;
    }

    if (['int', 'long', 'short', 'byte'].includes(baseType)) {
        if (/^[+-]?\d+$/.test(trimmed)) {
            const parsed = Number(trimmed);
            if (Number.isSafeInteger(parsed)) return parsed;
        }
        return rawValue;
    }

    if (['float', 'double', 'number'].includes(baseType)) {
        if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
            const parsed = Number(trimmed);
            if (Number.isFinite(parsed)) return parsed;
        }
        return rawValue;
    }

    // Fallback for object-like return types (e.g. TreeNode/ListNode in JSON form)
    const parsed = tryParseJson(trimmed);
    return parsed.ok ? parsed.value : rawValue;
};

const parseOutputForReturnType = (rawOutput, returnType, validationType = 'exact') => {
    const spec = parseReturnTypeSpec(returnType);
    const normalizedValidationType = String(validationType || 'exact').trim().toLowerCase();

    if (normalizedValidationType === 'any-valid') {
        if (rawOutput == null) return null;
        if (typeof rawOutput === 'string' && rawOutput.trim() === '') return null;
        return rawOutput;
    }

    if (spec.baseType === 'void' && spec.depth === 0) {
        if (rawOutput == null) return null;
        if (typeof rawOutput === 'string' && rawOutput.trim() === '') return null;
        return rawOutput;
    }

    if (spec.depth > 0) {
        if (typeof rawOutput !== 'string') return rawOutput;
        const trimmed = rawOutput.trim();
        if (!trimmed) return rawOutput;
        return decodeNestedJson(trimmed);
    }

    return coerceScalarReturnValue(rawOutput, spec.baseType);
};

const formatOutputForEditor = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

const ProblemForm = ({ initialData, isEdit = false }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [availableTopics, setAvailableTopics] = useState([]);
    const [availableCompanies, setAvailableCompanies] = useState([]);
    const [topicPool, setTopicPool] = useState([]);
    const [companyPool, setCompanyPool] = useState([]);

    // Core Fields
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        descriptionImage: '',
        difficulty: 'Easy',
        topic: '',
        topics: [],
        constraints: '',
        companies: [],
        functionName: '', // Required
        className: 'Solution',
        returnType: 'int',
        validationType: 'exact',
        validationKey: '',
        tolerance: 1e-6,
        parameters: [],
        isPublished: false,
        order: 0,
        timeLimit: 1000,
        memoryLimit: 256
    });

    const [editorialDraft, setEditorialDraft] = useState({
        title: '',
        description: '',
        timeComplexity: '',
        spaceComplexity: '',
        code: '',
        codeLanguage: 'javascript',
        publish: true
    });

    const [validationStatus, setValidationStatus] = useState('NOT_VALIDATED');

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [topicsRes, companiesRes] = await Promise.all([
                    api.get('/problems/topics'),
                    api.get('/companies')
                ]);

                const topicNames = uniqStrings((topicsRes?.data?.topics || []).map((topic) => topic?.name || topic));
                const companyNames = uniqStrings((companiesRes?.data?.companies || []).map((company) => company?.name || company));

                setAvailableTopics(topicNames);
                setAvailableCompanies(companyNames);
                setTopicPool(shuffleValues(topicNames));
                setCompanyPool(shuffleValues(companyNames));
            } catch (err) {
                console.error('Failed to load metadata for problem form', err);
            }
        };
        fetchMetadata();
    }, []);

    // Test Cases
    const [testCases, setTestCases] = useState([
        { input: '', output: '', isHidden: false, explanation: '', paramValues: {} }
    ]);

    // Starter Code
    const [starterCode, setStarterCode] = useState({
        javascript: '',
        python: '',
        java: '',
        cpp: '',
        c: ''
    });

    const [activeTab, setActiveTab] = useState('javascript');

    useEffect(() => {
        if (initialData) {
            const normalizedTopics = uniqStrings(initialData.topics || (initialData.topic ? [initialData.topic] : []));
            const normalizedCompanies = uniqStrings(Array.isArray(initialData.companies) ? initialData.companies : []);
            setFormData({
                title: initialData.title || '',
                slug: initialData.slug || '',
                description: initialData.description || '',
                descriptionImage: initialData.descriptionImage || '',
                difficulty: initialData.difficulty || 'Easy',
                topic: normalizedTopics[0] || '',
                topics: normalizedTopics,
                constraints: initialData.constraints || '',
                companies: normalizedCompanies,
                functionName: initialData.functionName || '',
                className: initialData.className || 'Solution',
                returnType: initialData.returnType || 'int',
                validationType: initialData.validationType || 'exact',
                validationKey: initialData.validationKey || '',
                tolerance: initialData.tolerance || 1e-6,
                parameters: initialData.parameters || [],
                isPublished: isPublishedFromProblem(initialData),
                order: initialData.order || 0,
                timeLimit: initialData.timeLimit || 1000,
                memoryLimit: initialData.memoryLimit || 256
            });
            setValidationStatus(initialData.validationStatus || 'NOT_VALIDATED');
            setEditorialDraft(buildEditorialDraft(initialData));

            if (initialData.sampleTestCases && initialData.sampleTestCases.length > 0) {
                const samples = initialData.sampleTestCases.map(tc => ({ ...tc, isHidden: false }));
                const hidden = initialData.hiddenTestCases ? initialData.hiddenTestCases.map(tc => ({ ...tc, isHidden: true })) : [];
                setTestCases([...samples, ...hidden].map(tc => ({
                    ...tc,
                    output: formatOutputForEditor(tc.output),
                    paramValues: parseTestCaseInput(tc.input, initialData.parameters || [])
                })));
            } else if (initialData.testCases) {
                setTestCases(initialData.testCases.map(tc => ({
                    ...tc,
                    output: formatOutputForEditor(tc.output),
                    paramValues: parseTestCaseInput(tc.input, initialData.parameters || [])
                })));
            }

            if (initialData.starterCode) {
                setStarterCode({
                    javascript: initialData.starterCode.javascript || '',
                    python: initialData.starterCode.python || '',
                    java: initialData.starterCode.java || '',
                    cpp: initialData.starterCode.cpp || '',
                    c: initialData.starterCode.c || ''
                });
            }
        } else {
            setEditorialDraft({
                title: '',
                description: '',
                timeComplexity: '',
                spaceComplexity: '',
                code: '',
                codeLanguage: 'javascript',
                publish: true
            });
        }
    }, [initialData]);

    // Auto-generate starter templates whenever the signature changes
    useEffect(() => {
        if (formData.functionName) {
            const templates = generateTemplates(
                formData.className,
                formData.functionName,
                formData.returnType,
                formData.parameters
            );
            setStarterCode(prev => ({
                ...prev,
                ...templates
            }));
        }
    }, [formData.className, formData.functionName, formData.returnType, formData.parameters]);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const addTopic = (topicName) => {
        setFormData((prev) => {
            if (!topicName || prev.topics.includes(topicName)) return prev;
            const nextTopics = [...prev.topics, topicName];
            return {
                ...prev,
                topics: nextTopics,
                topic: nextTopics[0] || ''
            };
        });
    };

    const removeTopic = (topicName) => {
        setFormData((prev) => {
            const nextTopics = prev.topics.filter((topic) => topic !== topicName);
            return {
                ...prev,
                topics: nextTopics,
                topic: nextTopics[0] || ''
            };
        });
    };

    const addCompany = (companyName) => {
        setFormData((prev) => {
            if (!companyName || prev.companies.includes(companyName)) return prev;
            return { ...prev, companies: [...prev.companies, companyName] };
        });
    };

    const removeCompany = (companyName) => {
        setFormData((prev) => ({
            ...prev,
            companies: prev.companies.filter((company) => company !== companyName)
        }));
    };

    // Parameter Handlers
    const addParameter = () => {
        setFormData(prev => ({
            ...prev,
            parameters: [...(prev.parameters || []), { name: '', type: 'int', isArray: false, is2D: false }]
        }));
    };

    const updateParameter = (index, field, value) => {
        setFormData(prev => {
            const newParams = [...(prev.parameters || [])];
            newParams[index][field] = value;
            return { ...prev, parameters: newParams };
        });
    };

    const removeParameter = (index) => {
        setFormData(prev => ({
            ...prev,
            parameters: (prev.parameters || []).filter((_, i) => i !== index)
        }));
    };

    // Test Case Handlers
    const handleTestCaseChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    const handleTestCaseParamChange = (index, paramName, value) => {
        const newTestCases = [...testCases];
        if (!newTestCases[index].paramValues) newTestCases[index].paramValues = {};
        newTestCases[index].paramValues[paramName] = value;
        setTestCases(newTestCases);
    };

    const addTestCase = () => {
        setTestCases([...testCases, { input: '', output: '', isHidden: false, explanation: '', paramValues: {} }]);
    };

    const removeTestCase = (index) => {
        const newTestCases = testCases.filter((_, i) => i !== index);
        setTestCases(newTestCases);
    };

    const handleGenerateTemplates = () => {
        if (!formData.functionName) {
            toast.error('Function Name is required to generate templates.');
            return;
        }
        const templates = generateTemplates(
            formData.className,
            formData.functionName,
            formData.returnType,
            formData.parameters
        );
        setStarterCode(prev => ({
            ...prev,
            ...templates
        }));
        toast.success('Starter templates auto-generated!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Separate Test Cases
        const formattedTestCases = testCases.map(tc => ({
            input: buildTestCaseInput(tc.paramValues || {}, formData.parameters),
            output: parseOutputForReturnType(tc.output, formData.returnType, formData.validationType),
            isHidden: tc.isHidden,
            explanation: tc.explanation
        }));

        const sampleTestCases = formattedTestCases.filter(tc => !tc.isHidden).map(({ isHidden, ...rest }) => rest);
        const hiddenTestCases = formattedTestCases.filter(tc => tc.isHidden).map(({ isHidden, ...rest }) => rest);

        const normalizedTopics = uniqStrings(formData.topics || []);
        const normalizedCompanies = uniqStrings(formData.companies || []);
        const normalizedEditorial = {
            title: String(editorialDraft.title || '').trim(),
            description: String(editorialDraft.description || '').trim(),
            timeComplexity: String(editorialDraft.timeComplexity || '').trim(),
            spaceComplexity: String(editorialDraft.spaceComplexity || '').trim(),
            code: String(editorialDraft.code || ''),
            codeLanguage: String(editorialDraft.codeLanguage || '').trim() || 'javascript',
            publish: editorialDraft.publish !== false
        };
        const hasAnyEditorialInput = Boolean(
            normalizedEditorial.title ||
            normalizedEditorial.description ||
            normalizedEditorial.timeComplexity ||
            normalizedEditorial.spaceComplexity ||
            normalizedEditorial.code
        );

        if (hasAnyEditorialInput && (!normalizedEditorial.title || !normalizedEditorial.description)) {
            toast.error('Editorial title and description are required when adding an editorial.');
            setLoading(false);
            return;
        }

        // Prepare Payload
        const payload = {
            ...formData,
            topic: normalizedTopics[0] || '',
            topics: normalizedTopics,
            tags: [],
            companies: normalizedCompanies,
            sampleTestCases,
            hiddenTestCases,
            starterCode,
            ...(hasAnyEditorialInput ? { editorialDraft: normalizedEditorial } : {})
        };

        if (isEdit) {
            const initialPublished = isPublishedFromProblem(initialData);
            if (formData.isPublished === initialPublished) {
                delete payload.isPublished;
            } else {
                // Keep status and legacy isPublished in sync when toggled from edit form.
                payload.status = formData.isPublished ? 'published' : 'approved';
            }
        }

        try {
            if (isEdit) {
                await api.put(`/problems/${initialData._id}`, payload);
                toast.success('Problem updated successfully');
                // Stay on page to allow validation
            } else {
                const res = await api.post('/problems', payload);
                toast.success('Problem created successfully');
                // Redirect to edit page to show validation
                navigate(`/admin/edit-problem/${res.data.problem._id}`);
            }
        } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || 'Failed to save problem';
            const firstIssue = Array.isArray(error.response?.data?.errors) ? error.response.data.errors[0] : null;
            if (firstIssue?.path && firstIssue?.message) {
                toast.error(`${message} (${firstIssue.path}: ${firstIssue.message})`);
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const availableTopicOptions = topicPool.filter((topic) => !formData.topics.includes(topic));
    const availableCompanyOptions = companyPool.filter((company) => !formData.companies.includes(company));
    const liveValidationTestCases = useMemo(() => (
        (testCases || []).map((tc) => ({
            ...tc,
            input: buildTestCaseInput(tc.paramValues || {}, formData.parameters || []),
            output: tc.output
        }))
    ), [testCases, formData.parameters]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
        >
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-teal-400 flex items-center gap-3">
                    <span className="p-3 bg-teal-500/20 rounded-lg">
                        <FaCode className="text-teal-400" />
                    </span>
                    {isEdit ? 'Edit Problem' : 'Create New Problem'}
                </h1>
                {isEdit && !formData.isPublished && (
                    <button
                        type="button"
                        onClick={() => setShowTicketModal(true)}
                        className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        Request Review
                    </button>
                )}
            </div>

            <TicketCreateModal
                isOpen={showTicketModal}
                onClose={() => setShowTicketModal(false)}
                type="ADD_PROBLEM"
                targetId={initialData?._id}
                targetModel="Problem"
                initialTitle={`Review Request: ${formData.title}`}
            />



            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-teal-400 border-l-4 border-teal-500 pl-3">Basic Information</h3>
                    <div className="form-grid form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. Two Sum"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Slug (Unique ID)</label>
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="form-input"
                                required
                                placeholder="e.g. two-sum"
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-blue-400 border-l-4 border-blue-500 pl-3 mt-8">Code Signature Configuration</h3>
                    <div className="form-grid form-grid-3">
                        <div className="form-group">
                            <label className="form-label">Class Name</label>
                            <input
                                type="text"
                                name="className"
                                value={formData.className}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. Solution"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Function Name</label>
                            <input
                                type="text"
                                name="functionName"
                                value={formData.functionName}
                                onChange={handleChange}
                                className="form-input"
                                required
                                placeholder="e.g. twoSum"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Return Type</label>
                            <select
                                name="returnType"
                                value={formData.returnType}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="int">int</option>
                                <option value="int[]">int[]</option>
                                <option value="int[][]">int[][]</option>
                                <option value="string">string</option>
                                <option value="string[]">string[]</option>
                                <option value="boolean">boolean</option>
                                <option value="double">double</option>
                                <option value="ListNode">ListNode</option>
                                <option value="TreeNode">TreeNode</option>
                                <option value="void">void</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Output Validation Type</label>
                            <select
                                name="validationType"
                                value={formData.validationType}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="exact">Exact Match (Default)</option>
                                <option value="unordered-array">Unordered Array Match</option>
                                <option value="float">Floating Point Tolerance</option>
                                <option value="any-valid">Any Valid Answer</option>
                            </select>
                        </div>
                        {formData.validationType === 'float' && (
                            <div className="form-group">
                                <label className="form-label">Tolerance</label>
                                <input
                                    type="number"
                                    name="tolerance"
                                    value={formData.tolerance}
                                    onChange={handleChange}
                                    className="form-input"
                                    step="0.000001"
                                    min="0"
                                    placeholder="1e-6"
                                />
                            </div>
                        )}
                        {formData.validationType === 'any-valid' && (
                            <div className="form-group">
                                <label className="form-label">Validation Key</label>
                                <input
                                    type="text"
                                    name="validationKey"
                                    value={formData.validationKey}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="e.g. longest-common-substring"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-md font-semibold text-gray-300">Parameters</h4>
                            <button type="button" onClick={addParameter} className="btn-secondary text-xs flex items-center gap-2 py-1 px-3">
                                <FaPlus /> Add Parameter
                            </button>
                        </div>
                        {(!formData.parameters || formData.parameters.length === 0) && (
                            <p className="text-sm text-gray-500 italic">No parameters defined. Add parameters to auto-generate function signatures.</p>
                        )}
                        <AnimatePresence>
                            {formData.parameters && formData.parameters.map((param, index) => (
                                <motion.div
                                    key={`param-${index}`}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-4 bg-gray-800/50 p-3 rounded border border-gray-700 relative group"
                                >
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={param.name}
                                            onChange={(e) => updateParameter(index, 'name', e.target.value)}
                                            placeholder="Param Name (e.g. nums)"
                                            className="form-input text-sm py-1"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <select
                                            value={param.type}
                                            onChange={(e) => updateParameter(index, 'type', e.target.value)}
                                            className="form-select text-sm py-1"
                                        >
                                            <option value="int">int</option>
                                            <option value="string">string</option>
                                            <option value="boolean">boolean</option>
                                            <option value="double">double</option>
                                            <option value="ListNode">ListNode</option>
                                            <option value="TreeNode">TreeNode</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 w-48">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={param.isArray}
                                                onChange={(e) => updateParameter(index, 'isArray', e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                                            />
                                            <span className="text-xs text-gray-300">Array</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={param.is2D}
                                                onChange={(e) => {
                                                    // Ensure isArray is true if is2D is enabled
                                                    const isChecked = e.target.checked;
                                                    if (isChecked) updateParameter(index, 'isArray', true);
                                                    updateParameter(index, 'is2D', isChecked);
                                                }}
                                                className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                                                disabled={!param.isArray}
                                            />
                                            <span className={`text-xs ${!param.isArray ? 'text-gray-600' : 'text-gray-300'}`}>2D</span>
                                        </label>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeParameter(index)}
                                        className="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Parameter"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <h3 className="text-lg font-semibold text-teal-400 border-l-4 border-teal-500 pl-3 mt-8">Configuration & Settings</h3>
                    <div className="form-grid form-grid-3">
                        <div className="form-group">
                            <label className="form-label">Difficulty</label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Topics</label>
                            <div className="selector-panel">
                                <div className="selector-panel-header">
                                    <span className="selector-panel-title">Topic Pool</span>
                                    <button
                                        type="button"
                                        className="selector-shuffle-btn"
                                        onClick={() => setTopicPool(shuffleValues(availableTopics))}
                                    >
                                        <FaRandom /> Shuffle
                                    </button>
                                </div>
                                <div className="selector-panel-grid">
                                    <div className="selector-column">
                                        <p className="selector-column-title">Available ({availableTopicOptions.length})</p>
                                        <div className="selector-chip-grid">
                                            {availableTopicOptions.length > 0 ? availableTopicOptions.map((topicName) => (
                                                <button
                                                    key={`topic-available-${topicName}`}
                                                    type="button"
                                                    className="selector-chip"
                                                    onClick={() => addTopic(topicName)}
                                                >
                                                    {topicName}
                                                </button>
                                            )) : (
                                                <span className="selector-empty">No topics left in waiting list</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="selector-column selected">
                                        <p className="selector-column-title">Selected ({formData.topics.length})</p>
                                        <div className="selector-chip-grid">
                                            {formData.topics.length > 0 ? formData.topics.map((topicName) => (
                                                <button
                                                    key={`topic-selected-${topicName}`}
                                                    type="button"
                                                    className="selector-chip selected"
                                                    onClick={() => removeTopic(topicName)}
                                                >
                                                    {topicName}
                                                </button>
                                            )) : (
                                                <span className="selector-empty">Select topics from the waiting list</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-group flex items-center pt-8">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isPublished"
                                    checked={formData.isPublished}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                                />
                                <div className="flex flex-col">
                                    <span className="text-gray-300 font-medium">Publish Problem</span>
                                    <span className="text-xs text-gray-500">Visible to users immediately</span>
                                </div>
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Order</label>
                            <input
                                type="number"
                                name="order"
                                value={formData.order}
                                onChange={handleChange}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Time Limit (ms)</label>
                            <input
                                type="number"
                                name="timeLimit"
                                value={formData.timeLimit}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="1000"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Memory Limit (MB)</label>
                            <input
                                type="number"
                                name="memoryLimit"
                                value={formData.memoryLimit}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="256"
                            />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-teal-400 border-l-4 border-teal-500 pl-3">Problem Details</h3>
                    <div className="form-group">
                        <label className="form-label">Description (Markdown Supported)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="6"
                            className="form-textarea code-editor"
                            required
                        ></textarea>
                    </div>

                    {/* Description Image */}
                    <div className="form-group">
                        <label className="form-label">Description Image URL (optional)</label>
                        <input
                            type="url"
                            name="descriptionImage"
                            value={formData.descriptionImage}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="https://example.com/diagram.png"
                        />
                        {formData.descriptionImage && (
                            <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '400px' }}>
                                <img
                                    src={formData.descriptionImage}
                                    alt="Description preview"
                                    style={{ width: '100%', display: 'block' }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Companies */}
                    <div className="form-group">
                        <label className="form-label">Companies</label>
                        <div className="selector-panel">
                            <div className="selector-panel-header">
                                <span className="selector-panel-title">Company Pool</span>
                                <button
                                    type="button"
                                    className="selector-shuffle-btn"
                                    onClick={() => setCompanyPool(shuffleValues(availableCompanies))}
                                >
                                    <FaRandom /> Shuffle
                                </button>
                            </div>
                            <div className="selector-panel-grid">
                                <div className="selector-column">
                                    <p className="selector-column-title">Available ({availableCompanyOptions.length})</p>
                                    <div className="selector-chip-grid">
                                        {availableCompanyOptions.length > 0 ? availableCompanyOptions.map((companyName) => (
                                            <button
                                                key={`company-available-${companyName}`}
                                                type="button"
                                                className="selector-chip company"
                                                onClick={() => addCompany(companyName)}
                                            >
                                                {companyName}
                                            </button>
                                        )) : (
                                            <span className="selector-empty">No companies left in waiting list</span>
                                        )}
                                    </div>
                                </div>
                                <div className="selector-column selected">
                                    <p className="selector-column-title">Selected ({formData.companies.length})</p>
                                    <div className="selector-chip-grid">
                                        {formData.companies.length > 0 ? formData.companies.map((companyName) => (
                                            <button
                                                key={`company-selected-${companyName}`}
                                                type="button"
                                                className="selector-chip selected company"
                                                onClick={() => removeCompany(companyName)}
                                            >
                                                {companyName}
                                            </button>
                                        )) : (
                                            <span className="selector-empty">Select companies from the waiting list</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Constraints</label>
                        <textarea
                            name="constraints"
                            value={formData.constraints}
                            onChange={handleChange}
                            rows="3"
                            className="form-textarea code-editor"
                        ></textarea>
                    </div>
                </div>


                {/* Editorial */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-emerald-400 border-l-4 border-emerald-500 pl-3 flex items-center gap-2">
                        <FaBook /> Editorial
                    </h3>
                    <div className="editorial-panel">
                        <div className="editorial-grid">
                            <div className="form-group">
                                <label className="form-label">Editorial Title</label>
                                <input
                                    type="text"
                                    value={editorialDraft.title}
                                    onChange={(e) => setEditorialDraft((prev) => ({ ...prev, title: e.target.value }))}
                                    className="form-input"
                                    placeholder="e.g. Prefix Sum + Hash Map"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Code Language</label>
                                <select
                                    value={editorialDraft.codeLanguage}
                                    onChange={(e) => setEditorialDraft((prev) => ({ ...prev, codeLanguage: e.target.value }))}
                                    className="form-select"
                                >
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                    <option value="c">C</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Time Complexity</label>
                                <input
                                    type="text"
                                    value={editorialDraft.timeComplexity}
                                    onChange={(e) => setEditorialDraft((prev) => ({ ...prev, timeComplexity: e.target.value }))}
                                    className="form-input"
                                    placeholder="e.g. O(n log n)"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Space Complexity</label>
                                <input
                                    type="text"
                                    value={editorialDraft.spaceComplexity}
                                    onChange={(e) => setEditorialDraft((prev) => ({ ...prev, spaceComplexity: e.target.value }))}
                                    className="form-input"
                                    placeholder="e.g. O(n)"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Editorial Explanation</label>
                            <textarea
                                value={editorialDraft.description}
                                onChange={(e) => setEditorialDraft((prev) => ({ ...prev, description: e.target.value }))}
                                rows="5"
                                className="form-textarea code-editor"
                                placeholder="Explain the intuition, steps, and corner cases..."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Editorial Code Snippet</label>
                            <textarea
                                value={editorialDraft.code}
                                onChange={(e) => setEditorialDraft((prev) => ({ ...prev, code: e.target.value }))}
                                rows="6"
                                className="form-textarea code-editor"
                                placeholder="Optional reference snippet for the editorial..."
                            />
                        </div>
                        <label className="editorial-toggle">
                            <input
                                type="checkbox"
                                checked={editorialDraft.publish}
                                onChange={(e) => setEditorialDraft((prev) => ({ ...prev, publish: e.target.checked }))}
                            />
                            Publish editorial with this problem
                        </label>
                    </div>
                </div>
                {/* Test Cases */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-teal-400 border-l-4 border-teal-500 pl-3 flex items-center gap-2">
                            <FaFlask /> Test Cases
                        </h3>
                        <button type="button" onClick={addTestCase} className="btn-secondary text-sm flex items-center gap-2">
                            <FaPlus /> Add Case
                        </button>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence>
                            {testCases.map((tc, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-black/20 p-4 rounded-lg border border-white/5 relative group"
                                >
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => removeTestCase(index)} className="text-red-400 hover:text-red-300 p-2">
                                            <FaTrash />
                                        </button>
                                    </div>

                                    <div className="mb-4">
                                        <div className="grid gap-3 sm:grid-cols-2 mb-2">
                                            {formData.parameters && formData.parameters.length > 0 ? (
                                                formData.parameters.map((p) => (
                                                    <div className="form-group" key={p.name}>
                                                        <label className="text-xs text-teal-400 font-mono tracking-wider mb-1 block">
                                                            Param: <span className="text-white">{p.name}</span> <span className="text-gray-500 text-[10px]">({p.type}{p.is2D ? '[][]' : p.isArray ? '[]' : ''})</span>
                                                        </label>
                                                        <textarea
                                                            value={tc.paramValues?.[p.name] || ''}
                                                            onChange={(e) => handleTestCaseParamChange(index, p.name, e.target.value)}
                                                            className="form-textarea code-editor text-sm"
                                                            rows="2"
                                                            placeholder={`Value for ${p.name}...`}
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="form-group">
                                                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Input</label>
                                                    <textarea
                                                        value={tc.paramValues?.raw_input || ''}
                                                        onChange={(e) => handleTestCaseParamChange(index, 'raw_input', e.target.value)}
                                                        className="form-textarea code-editor text-sm"
                                                        rows="2"
                                                    />
                                                </div>
                                            )}
                                            <div className="form-group">
                                                <label className="text-xs text-emerald-400 font-mono tracking-wider mb-1 block">OUTPUT <span className="text-gray-500 text-[10px]">({formData.returnType})</span></label>
                                                <textarea
                                                    value={tc.output}
                                                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                                    className="form-textarea code-editor text-sm"
                                                    rows="2"
                                                    placeholder={formData.validationType === 'any-valid'
                                                        ? 'Optional for any-valid validation'
                                                        : 'Expected output...'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={tc.isHidden}
                                            onChange={(e) => handleTestCaseChange(index, 'isHidden', e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                                            id={`hidden-${index}`}
                                        />
                                        <label htmlFor={`hidden-${index}`} className="text-sm text-gray-300 select-none cursor-pointer">Hidden Test Case (Private)</label>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Starter Code */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-purple-400 border-l-4 border-purple-500 pl-3 flex items-center gap-2">
                                <FaCode className="text-purple-400" /> Starter Code Templates
                            </h3>
                            <button
                                type="button"
                                onClick={handleGenerateTemplates}
                                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/50 rounded text-xs font-semibold transition-colors"
                            >
                                Auto-Generate
                            </button>
                        </div>
                        <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-bold">
                            {activeTab.toUpperCase()}
                        </span>
                    </div>

                    {/* Language Tabs */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="flex flex-wrap gap-1 p-2 bg-black/40 border-b border-white/10">
                            {[
                                { id: 'javascript', label: 'JavaScript', icon: '🟨', color: 'yellow' },
                                { id: 'python', label: 'Python', icon: '🐍', color: 'blue' },
                                { id: 'java', label: 'Java', icon: '☕', color: 'orange' },
                                { id: 'cpp', label: 'C++', icon: '⚙️', color: 'cyan' },
                                { id: 'c', label: 'C', icon: '🔧', color: 'gray' }
                            ].map(lang => (
                                <button
                                    key={lang.id}
                                    type="button"
                                    onClick={() => setActiveTab(lang.id)}
                                    className={`
                                        group relative px-6 py-3 rounded-lg text-sm font-bold 
                                        transition-all duration-300 flex items-center gap-2
                                        ${activeTab === lang.id
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50 scale-105'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105'
                                        }
                                    `}
                                >
                                    <span className="text-lg">{lang.icon}</span>
                                    <span>{lang.label}</span>
                                    {activeTab === lang.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Code Editor */}
                        <div className="relative">
                            {/* Editor Header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">
                                    starter_{activeTab}.{activeTab === 'python' ? 'py' : activeTab === 'javascript' ? 'js' : activeTab === 'cpp' ? 'cpp' : activeTab === 'java' ? 'java' : 'c'}
                                </span>
                            </div>

                            {/* Code Input */}
                            <div className="relative bg-[#1e1e1e]">
                                <textarea
                                    value={starterCode[activeTab]}
                                    onChange={(e) => setStarterCode({ ...starterCode, [activeTab]: e.target.value })}
                                    className="
                                        w-full bg-transparent text-gray-300 font-mono text-sm
                                        p-6 pl-16 border-none focus:ring-0 focus:outline-none 
                                        min-h-[350px] resize-y
                                        leading-relaxed
                                    "
                                    placeholder={`// Enter starter code template for ${activeTab}...\n// Example: function signature, imports, class structure, etc.`}
                                    spellCheck="false"
                                />
                                {/* Line Numbers Effect */}
                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#252525] border-r border-white/5 flex flex-col items-center pt-6 text-xs text-gray-600 font-mono select-none pointer-events-none">
                                    {Array.from({ length: 20 }, (_, i) => (
                                        <div key={i} className="leading-relaxed h-6">
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Editor Footer */}
                            <div className="flex items-center justify-between px-4 py-2 bg-[#252525] border-t border-white/5 text-xs text-gray-500">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Ready
                                </span>
                                <span className="font-mono">
                                    Lines: {starterCode[activeTab]?.split('\n').length || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validation Manager (Only for Edit Mode or once created) */}
                {isEdit ? (
                    <ValidationManager
                        problemId={initialData._id}
                        validationStatus={validationStatus}
                        onValidationUpdate={setValidationStatus}
                        parameters={formData.parameters}
                        liveTestCases={liveValidationTestCases}
                    />
                ) : (
                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 text-blue-200 text-center">
                        <p>Save the problem first to enable Validation features.</p>
                    </div>
                )}

                <div className="flex justify-end pt-6 border-t border-gray-700">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary px-8 py-3 text-lg shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all flex items-center gap-2"
                    >
                        {loading ? 'Saving...' : <><FaSave /> Save Problem</>}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default ProblemForm;
