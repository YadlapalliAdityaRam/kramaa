
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaBuilding, FaSearch, FaTimes, FaBriefcase, FaChartLine, FaRocket, FaFilter } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    // Modal Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'Product-Based',
        skills: [],
        process: [''],
        focusAreas: [],
        order: 0
    });

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies');
            setCompanies(res.data.companies || []);
        } catch (error) {
            toast.error('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this company?')) return;

        try {
            await api.delete(`/companies/${id}`);
            toast.success('Company deleted successfully');
            fetchCompanies();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete company');
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            // Filter out empty process steps
            const cleanedData = {
                ...formData,
                process: formData.process.filter(step => step.trim() !== '')
            };
            await api.post('/companies', cleanedData);
            toast.success('Company created successfully');
            setShowModal(false);
            fetchCompanies();
            // Reset form
            setFormData({
                name: '',
                type: 'Product-Based',
                skills: [],
                process: [''],
                focusAreas: [],
                order: 0
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create company');
        }
    };

    // Filter companies
    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'All' || c.type === filterType;
        return matchesSearch && matchesType;
    });

    // Stats - Simplified
    const stats = [
        { label: 'Total Companies', value: companies.length, icon: FaBuilding, color: 'orange' },
        { label: 'Recently Added', value: companies.length > 0 ? companies[companies.length - 1].name : 'N/A', icon: FaRocket, color: 'teal' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-bounce">🏢</div>
                    <p className="text-gray-400 text-lg">Loading companies...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: 'var(--sa-text)' }}>
                        <FaBuilding style={{ color: '#f97316' }} /> Company Management
                    </h2>
                    <p style={{ color: 'var(--sa-text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
                        Manage placement companies, hiring processes, and recruitment details.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {/* Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="sa-input"
                            style={{ cursor: 'pointer', minWidth: '140px', padding: '0.65rem 1rem' }}
                        >
                            <option value="All">All Types</option>
                            <option value="Product-Based">Product-Based</option>
                            <option value="Service-Based">Service-Based</option>
                        </select>
                    </div>

                    <div className="relative group flex-1 md:w-64">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--sa-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="sa-input"
                            style={{ paddingLeft: '2.4rem', width: '100%' }}
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="sa-btn sa-btn-primary"
                        style={{ padding: '0.65rem 1.25rem', gap: '0.5rem' }}
                    >
                        <FaPlus /> <span>Add Company</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="sa-stat-card"
                        style={{ padding: '1.25rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{stat.label}</p>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: '850', color: 'var(--sa-text)', margin: '0.4rem 0 0 0' }}>
                                    {stat.value}
                                </h3>
                            </div>
                            <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            {filteredCompanies.length === 0 ? (
                <div
                    className="sa-card"
                    style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--sa-border)' }}
                >
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--sa-pill-inactive)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: '#f97316', fontSize: '1.75rem' }}>
                        <FaBuilding />
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '750', color: 'var(--sa-text)', margin: '0 0 0.4rem 0' }}>
                        {searchTerm ? 'No companies found' : 'No Companies Added Yet'}
                    </h3>
                    <p style={{ color: 'var(--sa-text-muted)', maxWidth: '360px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                        {searchTerm ? 'Try adjusting your search terms.' : 'Start building your placement ecosystem by adding your first company.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="sa-btn sa-btn-primary"
                            style={{ padding: '0.7rem 1.5rem', margin: '0 auto' }}
                        >
                            <FaPlus /> Add Company
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredCompanies.map((company) => (
                            <div
                                key={company._id}
                                className="sa-card"
                                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', margin: 0 }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: '800', color: '#ffffff', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }}>
                                            {company.name.charAt(0)}
                                        </div>
                                        <span className={`sa-badge ${company.type === 'Product-Based' ? 'sa-badge-green' : 'sa-badge-purple'}`}>
                                            {company.type}
                                        </span>
                                    </div>

                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '750', color: 'var(--sa-text)', margin: '0 0 0.4rem 0' }}>{company.name}</h3>
                                    <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.86rem', margin: '0 0 1.2rem 0' }}>
                                        {company.process?.length || 0} rounds of interview process defined.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--sa-border)' }}>
                                    <button
                                        onClick={() => navigate(`/admin/companies/edit/${company._id}`)}
                                        className="sa-btn sa-btn-secondary"
                                        style={{ flex: 1, justifyContent: 'center', padding: '0.55rem 0.8rem', fontSize: '0.84rem' }}
                                    >
                                        <FaEdit /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(company._id)}
                                        className="sa-btn sa-btn-danger"
                                        style={{ flex: 1, justifyContent: 'center', padding: '0.55rem 0.8rem', fontSize: '0.84rem' }}
                                    >
                                        <FaTrash /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Company Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}>
                        <div
                            className="sa-card"
                            style={{ width: '100%', maxWidth: '520px', padding: '2rem', maxHeight: '85vh', overflowY: 'auto', border: '1px solid var(--sa-border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--sa-border)' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--sa-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <FaBuilding style={{ color: '#f97316' }} /> Add New Company
                                </h3>
                                <button onClick={() => setShowModal(false)} className="sa-btn sa-btn-secondary" style={{ padding: '0.4rem', minWidth: '32px', minHeight: '32px' }}>
                                    <FaTimes size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--sa-text-muted)', marginBottom: '0.35rem' }}>Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="sa-input"
                                        placeholder="e.g. Google"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--sa-text-muted)', marginBottom: '0.35rem' }}>Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="sa-input"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <option value="Product-Based">Product-Based</option>
                                        <option value="Service-Based">Service-Based</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--sa-text-muted)', marginBottom: '0.35rem' }}>Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                        className="sa-input"
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="sa-btn sa-btn-secondary"
                                        style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="sa-btn sa-btn-primary"
                                        style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                                    >
                                        Create Company
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CompanyManagement;
