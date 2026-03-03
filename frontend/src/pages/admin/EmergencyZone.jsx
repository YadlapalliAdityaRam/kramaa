import React, { useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const EmergencyZone = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [lockdown, setLockdown] = useState(false);

    return (
        <div className="p-6 bg-red-900/10 border border-red-500/30 rounded-2xl animate-fade-in relative overflow-hidden">
            {/* Background Pulse Effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-red-500/5 animate-pulse pointer-events-none" />

            <div className="flex flex-col items-center justify-center text-center gap-6 mb-12 relative z-10">
                <div className="p-5 bg-red-500/20 rounded-full shadow-lg border border-red-500/30 animate-pulse-slow">
                    <FaExclamationTriangle className="text-5xl text-red-500" />
                </div>
                <div>
                    <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500 drop-shadow-sm">
                        Emergency Zone
                    </h2>
                    <p className="text-red-300/80 text-lg mt-2 max-w-2xl mx-auto">
                        Critical system controls. Authorized personnel only. Proceed with extreme caution.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {/* Maintenance Mode Card */}
                <div className="bg-gray-900/50 p-6 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-all">
                    <h3 className="text-xl font-bold text-white mb-2">Maintenance Mode</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Disconnects all non-admin users and shows a maintenance page.
                    </p>
                    <button
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${maintenanceMode
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                            }`}
                    >
                        {maintenanceMode ? 'DISABLE MAINTENANCE MODE' : 'ENABLE MAINTENANCE MODE'}
                    </button>
                </div>

                {/* System Lockdown Card */}
                <div className="bg-gray-900/50 p-6 rounded-xl border border-red-500/20 hover:border-red-500/50 transition-all">
                    <h3 className="text-xl font-bold text-white mb-2">System Lockdown</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Freezes all writes to the database. Read-only mode for everyone.
                    </p>
                    <button
                        onClick={() => setLockdown(!lockdown)}
                        className={`w-full py-3 px-4 rounded-lg font-bold transition-all ${lockdown
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                            }`}
                    >
                        {lockdown ? 'LIFT LOCKDOWN' : 'INITIATE LOCKDOWN'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmergencyZone;
