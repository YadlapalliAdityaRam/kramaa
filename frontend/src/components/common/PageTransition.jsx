import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

const PageTransition = ({ children }) => {
    const location = useLocation();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevRoute = useRef(`${location.pathname}${location.search}`);

    useEffect(() => {
        const nextRoute = `${location.pathname}${location.search}`;
        if (prevRoute.current === nextRoute) return undefined;
        prevRoute.current = nextRoute;

        setIsTransitioning(true);
        const timer = setTimeout(() => setIsTransitioning(false), 180);
        return () => clearTimeout(timer);
    }, [location.pathname, location.search]);

    return (
        <div className={`page-transition-content ${isTransitioning ? 'page-fade-out' : 'page-fade-in'}`}>
            {children}
        </div>
    );
};

export default PageTransition;
