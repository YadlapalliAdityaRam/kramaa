import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { FaBuilding, FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';

const CompanyForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Product-Based',
        skills: [],
        process: [''],
        focusAreas: [],
        order: 0
    });

    // Temporary state for inputs
    const [skillInput, setSkillInput] = useState('');
    const [focusAreaName, setFocusAreaName] = useState('');
    const [focusAreaTopic, setFocusAreaTopic] = useState('');

    useEffect(() => {
        if (isEditMode) {
            fetchCompany();
        }
    }, [id]);

    const fetchCompany = async () => {
        try {
            setLoading(true);
            const res = await api.get('/companies');
            const company = res.data.companies.find(c => c._id === id);

            if (company) {
                setFormData({
                    name: company.name,
                    type: company.type,
                    skills: company.skills || [],
                    process: company.process.length > 0 ? company.process : [''],
                    focusAreas: company.focusAreas || [],
                    order: company.order || 0
                });
            } else {
                toast.error('Company not found');
                navigate('/admin');
            }
        } catch (error) {
            toast.error('Failed to load company details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Skills handling
    const handleAddSkill = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            if (skillInput.trim()) {
                if (!formData.skills.includes(skillInput.trim())) {
                    setFormData(prev => ({
                        ...prev,
                        skills: [...prev.skills, skillInput.trim()]
                    }));
                }
                setSkillInput('');
            }
        }
    };

    const removeSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    // Process handling
    const handleProcessChange = (index, value) => {
        const newProcess = [...formData.process];
        newProcess[index] = value;
        setFormData(prev => ({ ...prev, process: newProcess }));
    };

    const addProcessStep = () => {
        setFormData(prev => ({ ...prev, process: [...prev.process, ''] }));
    };

    const removeProcessStep = (index) => {
        const newProcess = formData.process.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, process: newProcess }));
    };

    // Focus Areas handling
    const addFocusArea = () => {
        if (focusAreaName.trim() && focusAreaTopic.trim()) {
            setFormData(prev => ({
                ...prev,
                focusAreas: [...prev.focusAreas, { name: focusAreaName.trim(), topic: focusAreaTopic.trim() }]
            }));
            setFocusAreaName('');
            setFocusAreaTopic('');
        }
    };

    const removeFocusArea = (index) => {
        setFormData(prev => ({
            ...prev,
            focusAreas: prev.focusAreas.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Filter out empty process steps
            const cleanedData = {
                ...formData,
                process: formData.process.filter(step => step.trim() !== '')
            };

            if (isEditMode) {
                await api.put(`/companies/${id}`, cleanedData);
                toast.success('Company updated successfully');
            } else {
                await api.post('/companies', cleanedData);
                toast.success('Company created successfully');
            }
            navigate('/admin');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to save company');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8 text-white">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header with 20px gap */}
                <div className="flex items-center" style={{ gap: '20px' }}>
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <FaBuilding className="text-green-400" />
                        {isEditMode ? 'Edit Company' : 'Add New Company'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-xl space-y-8">

                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-green-400 border-b border-white/10 pb-2">Basic Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '20px' }}>
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Company Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                                    placeholder="e.g. Google"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                                >
                                    <option value="Product-Based">Product-Based</option>
                                    <option value="Service-Based">Service-Based</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-400">Display Order</label>
                                <input
                                    type="number"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleChange}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-green-400 border-b border-white/10 pb-2">Skills Required</h2>

                        <div className="space-y-4">
                            <div className="flex" style={{ gap: '20px' }}>
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={handleAddSkill}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none"
                                    placeholder="Type a skill and press Enter (e.g. React, Java)"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSkill}
                                    className="px-6 py-3 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30 font-bold"
                                >
                                    Add Skill
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {formData.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full text-sm flex items-center gap-2">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white"><FaTrash size={10} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recruitment Process Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-green-400 border-b border-white/10 pb-2">Recruitment Process</h2>

                        <div className="space-y-4">
                            {formData.process.map((step, index) => (
                                <div key={index} className="flex items-center" style={{ gap: '20px' }}>
                                    <span className="text-gray-500 font-mono w-6">{index + 1}.</span>
                                    <input
                                        type="text"
                                        value={step}
                                        onChange={(e) => handleProcessChange(index, e.target.value)}
                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none"
                                        placeholder={`Step ${index + 1} description`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeProcessStep(index)}
                                        className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addProcessStep}
                                className="flex items-center gap-2 text-green-400 hover:text-green-300 font-bold text-sm"
                            >
                                <FaPlus /> Add Process Step
                            </button>
                        </div>
                    </div>

                    {/* Focus Areas Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-green-400 border-b border-white/10 pb-2">Focus Areas</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 items-end" style={{ gap: '20px' }}>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Area Name</label>
                                    <input
                                        type="text"
                                        value={focusAreaName}
                                        onChange={(e) => setFocusAreaName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none"
                                        placeholder="e.g. Arrays"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Topic Type</label>
                                    <input
                                        type="text"
                                        value={focusAreaTopic}
                                        onChange={(e) => setFocusAreaTopic(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-green-500 focus:outline-none"
                                        placeholder="e.g. Data Structures"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addFocusArea}
                                className="w-full py-3 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/30 font-bold transition-all"
                            >
                                Add Focus Area
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.focusAreas.map((area, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-black/30 rounded-lg border border-white/5">
                                        <div>
                                            <p className="font-bold text-white">{area.name}</p>
                                            <p className="text-xs text-gray-400">{area.topic}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFocusArea(index)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end pt-6 border-t border-white/10" style={{ gap: '20px' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
                        >
                            <FaSave /> {loading ? 'Saving...' : 'Save Company'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CompanyForm;
