import React from 'react';
import { Outlet } from 'react-router-dom';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
    return (
        <div className="dashboard-container">
            <div className="dashboard-header text-center mb-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-gray-400 text-lg">Manage everything with ease and comfort.</p>
            </div>

            {/* Content Area */}
            <div className="fade-in min-h-[500px]">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminDashboard;
