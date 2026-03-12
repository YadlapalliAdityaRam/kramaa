import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import OfflineUI from './OfflineUI';

/**
 * NetworkStatusHandler wraps the application to monitor connectivity.
 * It detects both hard offline states and slow/unstable connections.
 */
const NetworkStatusHandler = ({ children }) => {
    const isOnline = useNetworkStatus();
    const [isUnstable, setIsUnstable] = useState(false);
    const [appLoaded, setAppLoaded] = useState(false);

    useEffect(() => {
        // Reset instability when online status changes
        if (!isOnline) {
            setIsUnstable(false);
        }
    }, [isOnline]);

    useEffect(() => {
        // Slow connection detection for initial load
        // If the app doesn't signal 'ready' within 5 seconds of being online, flag as unstable
        let timeoutId;
        
        if (isOnline && !appLoaded) {
            timeoutId = setTimeout(() => {
                setIsUnstable(true);
            }, 5000);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isOnline, appLoaded]);

    // Provide a way for children to signal they have loaded successfully
    // We can use a custom event or just trust the initial load timer for now
    useEffect(() => {
        const handleAppReady = () => setAppLoaded(true);
        window.addEventListener('app-ready', handleAppReady);
        return () => window.removeEventListener('app-ready', handleAppReady);
    }, []);

    const showOfflineUI = !isOnline || isUnstable;

    return (
        <>
            <AnimatePresence>
                {showOfflineUI && <OfflineUI key="offline-ui" />}
            </AnimatePresence>
            
            <div style={{ 
                visibility: showOfflineUI ? 'hidden' : 'visible', 
                height: showOfflineUI ? '0' : 'auto',
                overflow: showOfflineUI ? 'hidden' : 'visible'
            }}>
                {children}
            </div>
        </>
    );
};

export default NetworkStatusHandler;
