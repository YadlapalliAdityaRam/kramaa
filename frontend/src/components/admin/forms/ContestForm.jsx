import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt, FaClock, FaList, FaSave, FaArrowLeft, FaPlus, FaTrash, FaTrophy, FaEye, FaInfoCircle, FaCrown, FaFire, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './ContestForm.css';
import TicketCreateModal from '../tickets/TicketCreateModal';

const ContestForm = ({ initialData, isEdit = false }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [showTicketModal, setShowTicketModal] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        duration: 60,
        registrationOpenDate: '',
        penaltyEnabled: false,
        penaltyMinutes: 10,
    });

    const [availableProblems, setAvailableProblems] = useState([]);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                // Use admin endpoint to get ALL problems (including from other admins)
                const res = await api.get('/problems/admin-list');
                setAvailableProblems(res.data.problems || []);
            } catch (err) {
                console.error("Failed to load problems");
            }
        };
        fetchProblems();

        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                startTime: initialData.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : '',
                duration: initialData.duration || 60,
                registrationOpenDate: initialData.registrationOpenDate ? new Date(initialData.registrationOpenDate).toISOString().slice(0, 16) : '',
                penaltyEnabled: initialData.wrongSubmissionPenalty?.enabled || false,
                penaltyMinutes: initialData.wrongSubmissionPenalty?.minutes || 10,
            });
            if (initialData.problems) {
                const problemsData = initialData.problems.map(p => ({
                    id: typeof p.problem === 'object' ? p.problem._id : p.problem,
                    points: p.points || 100,
                    order: p.order || 0
                }));
                setSelectedProblems(problemsData.sort((a, b) => a.order - b.order));
            }
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addProblem = (problemId) => {
        if (!selectedProblems.find(p => p.id === problemId)) {
            setSelectedProblems([...selectedProblems, {
                id: problemId,
                points: 100,
                order: selectedProblems.length
            }]);
        }
    };

    const removeProblem = (problemId) => {
        setSelectedProblems(selectedProblems.filter(p => p.id !== problemId));
    };

    const updatePoints = (problemId, points) => {
        setSelectedProblems(selectedProblems.map(p =>
            p.id === problemId ? { ...p, points: parseInt(points) || 0 } : p
        ));
    };

    const moveUp = (index) => {
        if (index === 0) return;
        const newList = [...selectedProblems];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        setSelectedProblems(newList.map((p, i) => ({ ...p, order: i })));
    };

    const moveDown = (index) => {
        if (index === selectedProblems.length - 1) return;
        const newList = [...selectedProblems];
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        setSelectedProblems(newList.map((p, i) => ({ ...p, order: i })));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedProblems.length === 0) {
            toast.error('Please select at least one problem');
            return;
        }

        setLoading(true);

        if (!formData.startTime) {
            toast.error('Please set a start time');
            setLoading(false);
            return;
        }

        // Calculate endTime from startTime and duration
        const startDate = new Date(formData.startTime);
        if (isNaN(startDate.getTime())) {
            toast.error('Invalid start time');
            setLoading(false);
            return;
        }
        const durationMin = parseInt(formData.duration) || 60;
        const endDate = new Date(startDate.getTime() + durationMin * 60000);

        const payload = {
            title: formData.title,
            description: formData.description,
            startTime: startDate,
            endTime: endDate,
            registrationOpenDate: formData.registrationOpenDate ? new Date(formData.registrationOpenDate) : undefined,
            wrongSubmissionPenalty: {
                enabled: formData.penaltyEnabled,
                minutes: parseInt(formData.penaltyMinutes) || 10
            },
            problems: selectedProblems.map(p => ({
                problem: p.id,
                points: p.points,
                order: p.order
            }))
        };

        try {
            if (isEdit) {
                await api.put(`/contests/${initialData._id}`, payload);
                toast.success('Contest updated successfully');
            } else {
                await api.post('/contests', payload);
                toast.success('Contest created successfully');
            }
            navigate('/admin');
        } catch (error) {
            console.error(error);
            const data = error.response?.data;
            // Show field-level validation errors if available
            if (data?.errors && Array.isArray(data.errors)) {
                const msgs = data.errors.map(e => e.message).join(', ');
                toast.error(msgs || data.message || 'Validation failed');
            } else {
                toast.error(data?.message || 'Failed to save contest');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredProblems = availableProblems.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedProblems.find(sp => sp.id === p._id)
    );

    const totalPoints = selectedProblems.reduce((sum, p) => sum + (p.points || 0), 0);
    const endTime = formData.startTime && formData.duration
        ? new Date(new Date(formData.startTime).getTime() + formData.duration * 60000).toLocaleString()
        : 'N/A';

    return (
        <div className="contest-form-wrapper">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="contest-form-container"
            >
                {/* Header */}
                <div className="contest-form-header">
                    <div className="header-top">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/admin')}
                            className="back-button"
                        >
                            <FaArrowLeft />
                        </motion.button>
                        <div className="header-content">
                            <div className="header-icon-wrapper">
                                <div className="header-icon">
                                    <FaCrown style={{ color: '#fb923c', fontSize: '1.5rem' }} />
                                </div>
                                <h1 className="header-title">
                                    {isEdit ? 'Edit Contest' : 'Create New Contest'}
                                </h1>
                            </div>
                            <p className="header-subtitle">Design an epic competitive programming challenge</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowPreview(!showPreview)}
                            className={`preview-toggle ${showPreview ? 'preview-toggle-active' : 'preview-toggle-inactive'}`}
                        >
                            <FaEye className={showPreview ? 'pulse' : ''} />
                            {showPreview ? 'Hide' : 'Show'} Preview
                        </motion.button>
                        {isEdit && !initialData?.isPublished && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowTicketModal(true)}
                                className="preview-toggle"
                                style={{ backgroundColor: '#9333ea', color: 'white', marginLeft: '1rem' }}
                            >
                                Request Publication
                            </motion.button>
                        )}
                    </div>

                    <TicketCreateModal
                        isOpen={showTicketModal}
                        onClose={() => setShowTicketModal(false)}
                        type="ADD_CONTEST"
                        targetId={initialData?._id}
                        targetModel="Contest"
                        initialTitle={`Publish Request: ${formData.title}`}
                    />
                </div>

                <form onSubmit={handleSubmit} className={`form-grid ${showPreview ? 'form-grid-with-preview' : ''}`}>
                    {/* Main Form */}
                    <div>
                        {/* Contest Details Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="form-card"
                        >
                            <div className="card-header">
                                <div className="card-icon-wrapper card-icon-teal">
                                    <FaInfoCircle style={{ color: '#14b8a6', fontSize: '1.25rem' }} />
                                </div>
                                <h3 className="card-title card-title-teal">Contest Details</h3>
                            </div>

                            <div>
                                <div className="form-group">
                                    <label className="form-label">
                                        <FaFire style={{ color: '#f97316' }} /> Contest Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Weekly Challenge #1"
                                        required
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <FaCalendarAlt style={{ color: '#fb923c' }} /> Start Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="startTime"
                                            value={formData.startTime}
                                            onChange={handleChange}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            <FaClock style={{ color: '#3b82f6' }} /> Duration (minutes) *
                                        </label>
                                        <input
                                            type="number"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            className="form-input"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        <FaCalendarAlt style={{ color: '#a855f7' }} /> Registration Opens
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="registrationOpenDate"
                                        value={formData.registrationOpenDate}
                                        onChange={handleChange}
                                        className="form-input"
                                        placeholder="Leave empty to open immediately"
                                    />
                                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>Leave empty for immediate registration</small>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="5"
                                        className="form-textarea"
                                        placeholder="Describe the contest rules, prizes, and other important details..."
                                    />
                                </div>

                                {/* Wrong Submission Penalty */}
                                <div style={{
                                    marginTop: '1.5rem', padding: '1rem 1.25rem',
                                    background: formData.penaltyEnabled ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${formData.penaltyEnabled ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '12px', transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaExclamationTriangle style={{ color: formData.penaltyEnabled ? '#ef4444' : '#6b7280', fontSize: '1.1rem' }} />
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: formData.penaltyEnabled ? '#fca5a5' : '#d1d5db' }}>
                                                    Wrong Submission Penalty
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                                                    Adds penalty time for each wrong submission (ICPC-style)
                                                </div>
                                            </div>
                                        </div>
                                        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.penaltyEnabled}
                                                onChange={(e) => setFormData({ ...formData, penaltyEnabled: e.target.checked })}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={{
                                                position: 'absolute', inset: 0, borderRadius: '12px', transition: 'all 0.3s',
                                                background: formData.penaltyEnabled ? '#ef4444' : 'rgba(255,255,255,0.15)',
                                            }}>
                                                <span style={{
                                                    position: 'absolute', content: '""', height: '18px', width: '18px',
                                                    left: formData.penaltyEnabled ? '23px' : '3px', bottom: '3px',
                                                    background: 'white', borderRadius: '50%', transition: 'all 0.3s',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                                }} />
                                            </span>
                                        </label>
                                    </div>
                                    {formData.penaltyEnabled && (
                                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label style={{ fontSize: '0.85rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>Penalty per wrong submission:</label>
                                            <input
                                                type="number"
                                                value={formData.penaltyMinutes}
                                                onChange={(e) => setFormData({ ...formData, penaltyMinutes: Math.max(1, Math.min(60, parseInt(e.target.value) || 1)) })}
                                                className="form-input"
                                                style={{ width: '80px', textAlign: 'center' }}
                                                min="1"
                                                max="60"
                                            />
                                            <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>minutes</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Problem Selection Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="form-card form-card-purple"
                            style={{ marginTop: '2rem' }}
                        >
                            <div className="card-header">
                                <div className="card-icon-wrapper card-icon-purple">
                                    <FaList style={{ color: '#a855f7', fontSize: '1.25rem' }} />
                                </div>
                                <h3 className="card-title card-title-purple">Problem Selection</h3>
                                <span className="card-badge">{selectedProblems.length} Selected</span>
                            </div>

                            {/* Search + Create New Problem */}
                            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                                <div className="search-box" style={{ flex: 1, marginBottom: 0 }}>
                                    <input
                                        type="text"
                                        placeholder="Search available problems..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                                <Link to="/admin/create-problem" target="_blank" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "600", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                                    <FaPlus size={11} /> New Problem
                                </Link>
                            </div>

                            {/* Available Problems */}
                            <div className="problem-list-container">
                                {filteredProblems.length > 0 ? (
                                    <div className="problem-list">
                                        {filteredProblems.map(problem => (
                                            <motion.div
                                                key={problem._id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => addProblem(problem._id)}
                                                className="problem-item"
                                            >
                                                <div className="problem-info">
                                                    <div className="problem-title">{problem.title}</div>
                                                    <div className="problem-meta">
                                                        <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
                                                            {problem.difficulty}
                                                        </span>
                                                        <span style={{ color: '#6b7280' }}>•</span>
                                                        <span className="problem-topic">{problem.topic}</span>
                                                    </div>
                                                </div>
                                                <motion.div
                                                    whileHover={{ rotate: 90 }}
                                                    className="problem-add-icon"
                                                >
                                                    <FaPlus style={{ color: '#a855f7' }} />
                                                </motion.div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        {availableProblems.length === 0 ? (
                                            <div className="text-gray-400">
                                                No problems found. <Link to="/admin/create-problem" className="text-blue-400 hover:underline">Create a problem</Link> first.
                                            </div>
                                        ) : searchTerm ? (
                                            '🔍 No problems match your search'
                                        ) : (
                                            '✅ All available problems selected'
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Problems */}
                            <div>
                                <div className="selected-problems-header">
                                    <FaStar style={{ color: '#facc15' }} />
                                    Selected Problems
                                </div>
                                {selectedProblems.length > 0 ? (
                                    <AnimatePresence>
                                        {selectedProblems.map((selectedProblem, index) => {
                                            const problemData = availableProblems.find(p => p._id === selectedProblem.id);
                                            if (!problemData) return null;

                                            return (
                                                <motion.div
                                                    key={selectedProblem.id}
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="selected-problem-item"
                                                >
                                                    <div className="selected-problem-content">
                                                        <div className="order-controls">
                                                            <motion.button
                                                                whileHover={{ scale: 1.2 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                type="button"
                                                                onClick={() => moveUp(index)}
                                                                disabled={index === 0}
                                                                className="order-button"
                                                            >
                                                                ▲
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.2 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                type="button"
                                                                onClick={() => moveDown(index)}
                                                                disabled={index === selectedProblems.length - 1}
                                                                className="order-button"
                                                            >
                                                                ▼
                                                            </motion.button>
                                                        </div>
                                                        <div className="problem-order-badge">
                                                            #{index + 1}
                                                        </div>
                                                        <div className="selected-problem-info">
                                                            <div className="selected-problem-title">{problemData.title}</div>
                                                            <div className="selected-problem-meta">
                                                                {problemData.difficulty} • {problemData.topic}
                                                            </div>
                                                        </div>
                                                        <div className="points-input-wrapper">
                                                            <FaTrophy style={{ color: '#facc15' }} />
                                                            <input
                                                                type="number"
                                                                value={selectedProblem.points}
                                                                onChange={(e) => updatePoints(selectedProblem.id, e.target.value)}
                                                                className="points-input"
                                                                min="0"
                                                            />
                                                            <span className="points-label">pts</span>
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, rotate: 10 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            type="button"
                                                            onClick={() => removeProblem(selectedProblem.id)}
                                                            className="remove-button"
                                                        >
                                                            <FaTrash />
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                ) : (
                                    <div className="empty-state" style={{ marginTop: 0 }}>
                                        <div className="empty-icon">📝</div>
                                        No problems selected yet. Click on problems above to add them.
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <div className="form-actions">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => navigate('/admin')}
                                className="btn btn-cancel"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={loading || selectedProblems.length === 0}
                                className="btn btn-primary"
                            >
                                {loading ? (
                                    <>
                                        <div className="loading-spinner"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FaSave /> {isEdit ? 'Update Contest' : 'Create Contest'}
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <AnimatePresence>
                        {showPreview && (
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 40 }}
                                className="preview-panel"
                            >
                                <div className="preview-card">
                                    <div className="card-header">
                                        <div className="card-icon-wrapper card-icon-blue">
                                            <FaEye style={{ color: '#3b82f6', animation: 'pulse 2s infinite' }} />
                                        </div>
                                        <h3 className="card-title card-title-blue">Live Preview</h3>
                                    </div>

                                    <div className="preview-content">
                                        <div className="preview-field">
                                            <div className="preview-label">Title</div>
                                            <div className="preview-value">
                                                {formData.title || 'Untitled Contest'}
                                            </div>
                                        </div>

                                        <div className="preview-grid">
                                            <div className="preview-stat">
                                                <div className="preview-stat-icon">
                                                    <FaCalendarAlt style={{ color: '#fb923c' }} />
                                                </div>
                                                <div className="preview-stat-label">Start</div>
                                                <div className="preview-stat-value">
                                                    {formData.startTime ? new Date(formData.startTime).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'Not set'}
                                                </div>
                                            </div>
                                            <div className="preview-stat preview-stat-blue">
                                                <div className="preview-stat-icon">
                                                    <FaClock style={{ color: '#3b82f6' }} />
                                                </div>
                                                <div className="preview-stat-label">Duration</div>
                                                <div className="preview-stat-value">{formData.duration} min</div>
                                            </div>
                                        </div>

                                        {formData.registrationOpenDate && (
                                            <div className="preview-field" style={{ marginTop: '12px' }}>
                                                <div className="preview-label">Registration Opens</div>
                                                <div className="preview-value" style={{ fontSize: '0.875rem' }}>
                                                    {new Date(formData.registrationOpenDate).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="preview-total-points">
                                            <div className="preview-total-points-header">
                                                <FaTrophy style={{ color: '#facc15', fontSize: '1.25rem' }} />
                                                <div className="preview-total-points-label">Total Points</div>
                                            </div>
                                            <div className="preview-total-points-value">
                                                {totalPoints.toLocaleString()}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="preview-problems-header">
                                                <div className="preview-problems-title">Problems</div>
                                                <div className="preview-problems-count">
                                                    {selectedProblems.length}
                                                </div>
                                            </div>
                                            {selectedProblems.length > 0 ? (
                                                <div className="preview-problems-list">
                                                    {selectedProblems.map((sp, idx) => {
                                                        const p = availableProblems.find(prob => prob._id === sp.id);
                                                        return p ? (
                                                            <motion.div
                                                                key={sp.id}
                                                                whileHover={{ scale: 1.02 }}
                                                                className="preview-problem-item"
                                                            >
                                                                <div className="preview-problem-left">
                                                                    <div className="preview-problem-order">#{idx + 1}</div>
                                                                    <div className="preview-problem-name">{p.title}</div>
                                                                </div>
                                                                <div className="preview-problem-points">
                                                                    <FaTrophy style={{ color: '#facc15', fontSize: '0.75rem' }} />
                                                                    <span className="preview-problem-points-value">{sp.points}</span>
                                                                </div>
                                                            </motion.div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="empty-state" style={{ padding: '2rem 1rem', fontSize: '0.875rem' }}>
                                                    No problems yet
                                                </div>
                                            )}
                                        </div>

                                        {formData.description && (
                                            <div className="preview-field">
                                                <div className="preview-label">Description</div>
                                                <div style={{ fontSize: '0.875rem', color: '#9ca3af', maxHeight: '128px', overflowY: 'auto' }}>
                                                    {formData.description}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    );
};

export default ContestForm;
