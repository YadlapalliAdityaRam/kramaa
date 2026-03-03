import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = 'Loading...' }) => {
    return (
        <div className="loading-screen">
            {/* Background orbs */}
            <div className="ls-orb ls-orb-1" />
            <div className="ls-orb ls-orb-2" />

            <div className="ls-content">
                {/* Animated rings */}
                <div className="ls-spinner">
                    <div className="ls-ring ls-ring-outer" />
                    <div className="ls-ring ls-ring-middle" />
                    <div className="ls-ring ls-ring-inner" />
                    {/* Krama logo / K letter */}
                    <div className="ls-logo">K</div>
                </div>

                {/* Progress dots */}
                <div className="ls-dots">
                    <span className="ls-dot" />
                    <span className="ls-dot" />
                    <span className="ls-dot" />
                </div>

                <p className="ls-message">{message}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
