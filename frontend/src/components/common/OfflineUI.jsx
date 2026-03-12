import React from 'react';
import { motion } from 'framer-motion';
import { FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import './OfflineUI.css';

const OfflineUI = () => {
    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <motion.div 
            className="offline-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <div className="offline-content">
                <motion.div 
                    className="offline-icon-wrapper"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                >
                    <FiWifiOff className="offline-icon" />
                </motion.div>
                
                <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="offline-title"
                >
                    You are offline
                </motion.h1>
                
                <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="offline-text"
                >
                    Your internet connection seems slow or disconnected. <br />
                    Please check your network and try again.
                </motion.p>
                
                <motion.button 
                    className="offline-retry-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleRetry}
                >
                    <FiRefreshCw className="retry-icon" />
                    Retry
                </motion.button>
            </div>
            
            <div className="offline-background-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>
        </motion.div>
    );
};

export default OfflineUI;
