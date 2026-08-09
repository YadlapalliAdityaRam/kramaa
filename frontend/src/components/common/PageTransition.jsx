import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const routeKey = `${location.pathname}${location.search}`;

    return (
        <div key={routeKey} className="page-transition-shell">
            {/* The shell fades while the nested content settles, so both animations can run together without sharing transform. */}
            <div className="page-transition-content">
                {children}
            </div>
        </div>
    );
};

export default PageTransition;
