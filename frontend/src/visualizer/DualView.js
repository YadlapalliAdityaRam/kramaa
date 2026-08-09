import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CodeViewer from './CodeViewer';
import { FaExpand, FaCompress, FaBalanceScale } from 'react-icons/fa';
import './DualView.css';

/**
 * DualView Component — Full Version Wrapper
 * Encapsulates the complete algorithm experience: explanation, code viewer, complexity, 
 * language tabs, full animation canvas, and navigation buttons ("Compare" & "Full Screen").
 */
const DualView = ({ children, code, activeLine, algorithmName, description, activeLanguage, onLanguageChange }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const stageRef = useRef(null);
    const navigate = useNavigate();

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            if (stageRef.current?.requestFullscreen) {
                stageRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
                    console.error(`Error attempting to enable fullscreen: ${err.message}`);
                });
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => setIsFullscreen(false));
            }
        }
    };

    // Listen for escape key exiting fullscreen
    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <section className="visualizer-ui" aria-label={`${algorithmName} visualizer`}>
            {/* Full Version Stage Column (Canvas + Controls + Headers) */}
            <div className={`visualizer-stage-column ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={stageRef}>
                <section className="visualizer-stage">
                    <header className="visualizer-stage-header">
                        <div>
                            <p>Interactive visualizer (Full Version)</p>
                            <h1>{algorithmName}</h1>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Compare Navigation Button */}
                            <button 
                                className="fs-toggle-btn compare-nav-btn"
                                onClick={() => navigate('/compare')}
                                title="Compare algorithms side-by-side on the Comparison Page"
                            >
                                <FaBalanceScale />
                                <span className="fs-toggle-text">Compare</span>
                            </button>

                            {/* Fullscreen Toggle Button */}
                            <button 
                                className="fs-toggle-btn" 
                                onClick={toggleFullscreen}
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? <FaCompress /> : <FaExpand />}
                                <span className="fs-toggle-text">{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
                            </button>
                        </div>
                    </header>

                    {/* Description & Educational Step Summary */}
                    <div className="visualizer-step-summary" aria-live="polite">
                        {description || 'Adjust the input, then step through the algorithm at your own pace.'}
                    </div>

                    {/* Animation Stage Content */}
                    <div className="visualizer-canvas">{children}</div>
                </section>
            </div>

            {/* Full Version Reference Code Column */}
            <aside className="visualizer-code-column" aria-label="Reference code">
                <CodeViewer
                    code={code}
                    activeLine={activeLine}
                    activeLanguage={activeLanguage}
                    onLanguageChange={onLanguageChange}
                />
            </aside>
        </section>
    );
};

export default DualView;
