import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FaArrowLeft, FaMedal, FaCode } from 'react-icons/fa';

const AdminProblemStats = () => {
    const { adminId } = useParams();
    const navigate = useNavigate();
    const [problems, setProblems] = useState([]);
    const [publishedStats, setPublishedStats] = useState({
        totalProblems: 0,
        difficulty: { easy: 0, medium: 0, hard: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [adminName, setAdminName] = useState('Admin');

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [problemRes, statsRes] = await Promise.all([
                    api.get('/problems/admin/all'),
                    api.get(`/problems/stats?createdBy=${adminId}`)
                ]);

                const allProblems = Array.isArray(problemRes?.data?.problems)
                    ? problemRes.data.problems
                    : [];
                const isPublishedProblem = (problem) => {
                    const normalizedStatus = String(problem?.status || '').toLowerCase();
                    return Boolean(problem?.isPublished || normalizedStatus === 'published');
                };
                const adminProblems = allProblems.filter((p) => p.createdBy?._id === adminId && isPublishedProblem(p));
                setProblems(adminProblems);

                if (allProblems.length > 0) {
                    const adminAnyProblem = allProblems.find((p) => p.createdBy?._id === adminId);
                    if (adminAnyProblem?.createdBy?.username) {
                        setAdminName(adminAnyProblem.createdBy.username);
                    }
                }

                setPublishedStats(statsRes?.data?.stats || {
                    totalProblems: adminProblems.length,
                    difficulty: { easy: 0, medium: 0, hard: 0 }
                });
            } catch (err) {
                console.error("Failed to load admin stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [adminId]);

    return (
        <div className="p-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <FaArrowLeft /> Back to Master List
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {adminName[0]?.toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">{adminName}</h1>
                    <p className="text-gray-400 flex items-center gap-2">
                        <FaCode /> Problem Creator Profile
                    </p>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="glass-panel p-6 border-l-4 border-purple-500">
                    <h3 className="text-gray-400 text-sm uppercase">Total Contributions</h3>
                    <p className="text-4xl font-bold text-white mt-2">{publishedStats.totalProblems || 0}</p>
                </div>
                <div className="glass-panel p-6 border-l-4 border-green-500">
                    <h3 className="text-gray-400 text-sm uppercase">Easy Problems</h3>
                    <p className="text-4xl font-bold text-green-400 mt-2">{publishedStats?.difficulty?.easy || 0}</p>
                </div>
                <div className="glass-panel p-6 border-l-4 border-yellow-500">
                    <h3 className="text-gray-400 text-sm uppercase">Medium Problems</h3>
                    <p className="text-4xl font-bold text-yellow-400 mt-2">{publishedStats?.difficulty?.medium || 0}</p>
                </div>
                <div className="glass-panel p-6 border-l-4 border-red-500">
                    <h3 className="text-gray-400 text-sm uppercase">Hard Problems</h3>
                    <p className="text-4xl font-bold text-red-500 mt-2">{publishedStats?.difficulty?.hard || 0}</p>
                </div>
            </div>

            {/* Problem List */}
            <div className="glass-panel">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">Contributed Problems</h3>
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : problems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No problems found for this admin.</div>
                ) : (
                    <div className="grid gap-4">
                        {problems.map(problem => (
                            <div key={problem._id} className="p-4 bg-white/5 rounded-lg flex justify-between items-center hover:bg-white/10 transition-colors">
                                <div>
                                    <h4 className="text-lg font-semibold text-white">{problem.title}</h4>
                                    <span className="text-sm text-gray-500">Created: {new Date(problem.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className={`px-3 py-1 rounded text-sm font-bold ${problem.difficulty === 'Easy' ? 'text-green-400 bg-green-900/20' :
                                    problem.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-900/20' :
                                        'text-red-400 bg-red-900/20'
                                    }`}>
                                    {problem.difficulty}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProblemStats;
