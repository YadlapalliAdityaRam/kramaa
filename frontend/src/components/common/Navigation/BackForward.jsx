import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './BackForward.css';

const BackForward = () => {
    const navigate = useNavigate();

    return (
        <div className="back-forward-controls">
            <button
                className="nav-btn"
                onClick={() => navigate(-1)}
                title="Go Back"
                aria-label="Go Back"
            >
                <FaArrowLeft />
            </button>
            <button
                className="nav-btn"
                onClick={() => navigate(1)}
                title="Go Forward"
                aria-label="Go Forward"
            >
                <FaArrowRight />
            </button>
        </div>
    );
};

export default BackForward;
