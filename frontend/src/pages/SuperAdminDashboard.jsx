import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/SuperAdmin.css';

const SuperAdminDashboard = () => {
    const location = useLocation();
    const tabs = [
        { id: 'profile', label: 'Profile', color: 'violet' },
        { id: 'admins', label: 'Admin Management', color: 'violet' },
        { id: 'problems', label: 'Problem Master List', color: 'blue' },
        { id: 'contests', label: 'Contest Management', color: 'indigo' },
        { id: 'reports', label: 'Moderation Reports', color: 'orange' },
        { id: 'audit', label: 'Audit Logs', color: 'amber' },
        { id: 'health', label: 'System Health', color: 'rose' },
        { id: 'emergency', label: 'Emergency Zone', color: 'red' }
    ];

    const getGradient = (color) => {
        const gradients = {
            violet: 'from-violet-600 to-purple-600',
            indigo: 'from-indigo-500 to-blue-600',
            blue: 'from-blue-500 to-cyan-500',
            amber: 'from-amber-400 to-orange-500',
            rose: 'from-rose-500 to-pink-600',
            red: 'from-red-600 to-orange-600'
        };
        return gradients[color] || gradients.violet;
    };

    return (
        <div className="sa-container">
            <div className="sa-header text-center mb-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
                    Super Admin Dashboard
                </h1>
                <p className="text-gray-400 text-lg">Manage system access, view logs, and monitor health.</p>
            </div>

            {/* Horizontal, Text-Only Navigation - One by one, Side by Side */}
            <div
                className="flex flex-nowrap items-center justify-start md:justify-center mb-12 w-full overflow-x-auto py-4 px-4 scrollbar-hide"
                style={{ display: 'flex', gap: '30px' }} // HARDCODED GAP to strictly enforce spacing
            >
                {tabs.map((tab) => {
                    return (
                        <NavLink
                            key={tab.id}
                            to={tab.id}
                            style={{ padding: '12px 25px' }} // HARDCODED PADDING
                            className="relative rounded-full text-sm font-bold tracking-wide whitespace-nowrap flex-shrink-0 transition-colors duration-300"
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className={`absolute inset-0 rounded-full bg-gradient-to-r ${getGradient(tab.color)} shadow-lg`}
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className={`relative z-10 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white transition-colors duration-200'}`}>
                                        {tab.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-underline"
                                            className="absolute bottom-2 left-6 right-6 h-0.5 bg-white/50 rounded-full z-20"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>

            {/* Content with Transition */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    <Outlet />
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SuperAdminDashboard;
