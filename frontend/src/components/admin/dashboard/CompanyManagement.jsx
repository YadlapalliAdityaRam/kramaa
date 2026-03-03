
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
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 flex items-center gap-3">
                        Company Management
                    </h2>
                    <p className="text-gray-400 mt-2 text-lg">Manage placement companies and recruitment details</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {/* Filter Dropdown */}
                    <div className="relative">
                        <FaFilter className="absolute left-4 top-3.5 text-gray-500 z-10" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-8 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner cursor-pointer appearance-none"
                        >
                            <option value="All">All Types</option>
                            <option value="Product-Based">Product-Based</option>
                            <option value="Service-Based">Service-Based</option>
                        </select>
                    </div>

                    <div className="relative group flex-1 md:w-64">
                        <FaSearch className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-orange-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                    >
                        <FaPlus /> <span className="hidden sm:inline">Add Company</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats Overview - Grid adjusted for deeper columns if fewer items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl hover:border-gray-600 hover:bg-gray-800/60 transition-all group cursor-default"
                        whileHover={{ y: -5 }}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-3xl font-extrabold text-white mt-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-colors">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`p-4 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 group-hover:bg-${stat.color}-500/20 transition-all duration-300`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Area */}
            {filteredCompanies.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24 bg-gray-800/20 rounded-3xl border border-dashed border-gray-700 hover:border-gray-600 transition-colors"
                >
                    <div className="bg-gradient-to-br from-gray-800 to-gray-700 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <FaBuilding className="text-5xl text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                        {searchTerm ? 'No companies found' : 'No Companies Added Yet'}
                    </h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-8 text-lg">
                        {searchTerm ? 'Try adjusting your search terms' : 'Start building your placement ecosystem by adding your first company.'}
                    </p>
                    {!searchTerm && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowModal(true)}
                            className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors inline-flex items-center gap-2 shadow-lg shadow-white/10"
                        >
                            <FaPlus /> Add Company
                        </motion.button>
                    )}
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredCompanies.map((company) => (
                            <motion.div
                                key={company._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                                className="bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-700/50 p-6 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-orange-500/20">
                                            {company.name.charAt(0)}
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border tracking-wide uppercase ${company.type === 'Product-Based'
                                                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                            }`}>
                                            {company.type}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">{company.name}</h3>
                                    <p className="text-gray-400 mb-6 line-clamp-2">
                                        {company.process?.length || 0} rounds of interview process defined.
                                    </p>

                                    <div className="flex gap-3 mt-auto pt-4 border-t border-gray-700/50">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => navigate(`/admin/companies/edit/${company._id}`)}
                                            className="flex-1 py-2.5 bg-gray-700/50 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <FaEdit /> Edit
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleDelete(company._id)}
                                            className="flex-1 py-2.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 font-medium transition-colors text-sm flex items-center justify-center gap-2 border border-red-500/10"
                                        >
                                            <FaTrash /> Delete
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Company Modal - Fixed Structure */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 p-8 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-8 sticky top-0 bg-gray-900 z-10 pb-4 border-b border-gray-800">
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                                        <FaPlus />
                                    </div>
                                    Add New Company
                                </h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                                    <FaTimes size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCompany} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                                        placeholder="e.g. Google"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all appearance-none"
                                    >
                                        <option value="Product-Based">Product-Based</option>
                                        <option value="Service-Based">Service-Based</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                                    />
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3.5 bg-gray-800 text-white rounded-xl hover:bg-gray-700 font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 font-bold transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40"
                                    >
                                        Create Company
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CompanyManagement;
