import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FaBuilding, FaChalkboardTeacher, FaCheckCircle, FaLayerGroup } from 'react-icons/fa';
import { motion } from 'framer-motion';

const CompanyDashboard = () => {
    const { companyName } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState('All');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/problems/company/${companyName}/stats`);
                setStats(res.data);
            } catch (err) {
                console.error("Failed to load company stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [companyName]);

    if (loading) return <div className="text-center py-20 text-gray-400">Loading Dashboard...</div>;
    if (!stats) return <div className="text-center py-20 text-red-400">Company not found or no data available.</div>;

    const { stats: difficulty, topics, totalProblems } = stats;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
            {/* Header Section */}
            <div className="glass-panel p-8 mb-8 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700">
                <div className="flex items-center gap-6 mb-6 md:mb-0">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl shadow-lg">
                        <FaBuilding className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{companyName}</h1>
                        <p className="text-gray-400 text-lg">Premium Preparation Zone</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="text-center px-6">
                        <span className="block text-3xl font-bold text-white">{totalProblems}</span>
                        <span className="text-sm text-gray-500 uppercase tracking-wider">Problems</span>
                    </div>
                    <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition hover:scale-105 flex items-center gap-2">
                        <FaChalkboardTeacher /> Start Mock Interview
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 border-l-4 border-green-500">
                    <h3 className="text-gray-400 uppercase text-sm font-semibold mb-2">Easy Problems</h3>
                    <div className="flex justify-between items-end">
                        <span className="text-4xl font-bold text-green-400">{difficulty.Easy}</span>
                        <div className="h-2 flex-grow mx-4 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${(difficulty.Easy / totalProblems) * 100}%` }}></div>
                        </div>
                        <span className="text-gray-500">{Math.round((difficulty.Easy / totalProblems) * 100)}%</span>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 border-l-4 border-yellow-500">
                    <h3 className="text-gray-400 uppercase text-sm font-semibold mb-2">Medium Problems</h3>
                    <div className="flex justify-between items-end">
                        <span className="text-4xl font-bold text-yellow-400">{difficulty.Medium}</span>
                        <div className="h-2 flex-grow mx-4 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500" style={{ width: `${(difficulty.Medium / totalProblems) * 100}%` }}></div>
                        </div>
                        <span className="text-gray-500">{Math.round((difficulty.Medium / totalProblems) * 100)}%</span>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 border-l-4 border-red-500">
                    <h3 className="text-gray-400 uppercase text-sm font-semibold mb-2">Hard Problems</h3>
                    <div className="flex justify-between items-end">
                        <span className="text-4xl font-bold text-red-500">{difficulty.Hard}</span>
                        <div className="h-2 flex-grow mx-4 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${(difficulty.Hard / totalProblems) * 100}%` }}></div>
                        </div>
                        <span className="text-gray-500">{Math.round((difficulty.Hard / totalProblems) * 100)}%</span>
                    </div>
                </motion.div>
            </div>

            {/* Preparation Path */}
            <div className="glass-panel p-8">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <FaLayerGroup className="text-purple-400" />
                    Preparation Roadmap
                </h2>

                <div className="relative border-l-2 border-gray-700 ml-4 md:ml-6 space-y-12">
                    {topics.map((topic, index) => (
                        <div key={topic.name} className="relative pl-8 md:pl-12">
                            {/* Timeline Node */}
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500 border-4 border-gray-900 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>

                            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-1 block">Step {index + 1}</span>
                                        <h3 className="text-xl font-bold text-white">{topic.name}</h3>
                                    </div>
                                    <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        {topic.count} Problems
                                    </span>
                                </div>

                                {/* Problem List Preview */}
                                <div className="space-y-3">
                                    {topic.problems.map(p => (
                                        <div
                                            key={p.slug}
                                            onClick={() => navigate(`/coding-platform/${p.slug}`)}
                                            className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FaCheckCircle className="text-gray-600 group-hover:text-green-500 transition-colors" />
                                                <span className="text-gray-300 group-hover:text-white font-medium">{p.title}</span>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${p.difficulty === 'Easy' ? 'text-green-400 bg-green-900/20' :
                                                    p.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-900/20' :
                                                        'text-red-400 bg-red-900/20'
                                                }`}>
                                                {p.difficulty}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CompanyDashboard;
