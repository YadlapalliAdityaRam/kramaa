import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-4 text-red-500">403 - Unauthorized</h1>
            <p className="mb-8 text-gray-300">You do not have permission to access this page.</p>
            <Link to="/" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition">
                Go to Home
            </Link>
        </div>
    );
};

export default Unauthorized;
