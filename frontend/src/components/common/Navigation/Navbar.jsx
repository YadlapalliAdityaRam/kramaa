import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../../redux/slices/authSlice';
import {
    FaSearch,
    FaSignOutAlt,
    FaChartLine,
    FaCoins,
    FaCog,
    FaUser,
    FaBars,
    FaTimes,
    FaCode
} from 'react-icons/fa';
import BackForward from './BackForward';
import NotificationBell from './NotificationBell';
import ThemeToggle from '../ThemeToggle';
import { algorithmList } from '../../../data/algorithmsData';
import './Navbar.css';
import './SearchSuggestions.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const drawerRef = useRef(null);
    const triggerRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const mobileMenuTriggerRef = useRef(null);
    const searchRef = useRef(null);
    const isMobile = viewportWidth <= 1024;

    // Smart scroll-aware navbar
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const isActive = (path) => {
        return location.pathname.startsWith(path) && path !== '/';
    };

    const getLinkStyle = (path) => ({
        color: isActive(path) ? 'var(--primary-orange)' : 'var(--text-primary)',
        fontWeight: isActive(path) ? '600' : '400'
    });

    const onLogout = () => {
        dispatch(logout());
        setIsProfileDrawerOpen(false);
    };

    const closeProfileDrawer = () => setIsProfileDrawerOpen(false);

    const navigateAndClose = (path) => {
        navigate(path);
        closeProfileDrawer();
    };

    const handleProfileToggle = () => {
        setIsProfileDrawerOpen(prev => !prev);
    };

    useEffect(() => {
        if (!isProfileDrawerOpen) return;

        const onOutsideClick = (event) => {
            const target = event.target;
            if (drawerRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            closeProfileDrawer();
        };

        const onEscape = (event) => {
            if (event.key === 'Escape') closeProfileDrawer();
        };

        document.addEventListener('mousedown', onOutsideClick);
        document.addEventListener('keydown', onEscape);

        return () => {
            document.removeEventListener('mousedown', onOutsideClick);
            document.removeEventListener('keydown', onEscape);
        };
    }, [isProfileDrawerOpen]);

    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const onOutsideClick = (event) => {
            const target = event.target;
            if (mobileMenuRef.current?.contains(target) || mobileMenuTriggerRef.current?.contains(target)) return;
            setIsMobileMenuOpen(false);
        };

        const onEscape = (event) => {
            if (event.key === 'Escape') setIsMobileMenuOpen(false);
        };

        document.addEventListener('mousedown', onOutsideClick);
        document.addEventListener('keydown', onEscape);

        return () => {
            document.removeEventListener('mousedown', onOutsideClick);
            document.removeEventListener('keydown', onEscape);
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        closeProfileDrawer();
        setIsMobileMenuOpen(false);
        setShowSuggestions(false);
        setSearchQuery('');
    }, [location.pathname]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const filtered = algorithmList
            .filter(algo => 
                algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                algo.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 8);
        
        setSuggestions(filtered);
        setShowSuggestions(true);
        setActiveIndex(-1);
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                e.preventDefault();
                navigate(suggestions[activeIndex].path);
                setShowSuggestions(false);
                setSearchQuery('');
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const quickActions = [
        { label: 'Progress', icon: <FaChartLine />, onClick: () => navigateAndClose('/profile?view=progress') },
        { label: 'Points', icon: <FaCoins />, onClick: () => navigateAndClose('/leaderboard') }
    ];

    const drawerMenuItems = [
        { label: 'My Profile', icon: <FaUser />, onClick: () => navigateAndClose('/profile') },
        { label: 'Settings', icon: <FaCog />, onClick: () => navigateAndClose('/profile') }
    ];

    const publicLinks = [
        { to: '/algorithms', label: 'Algorithms' },
        { to: '/compare', label: 'Compare' },
        { to: '/contests', label: 'Contests' },
        { to: '/community', label: 'Community' },
        { to: '/coding-platform', label: 'Practice' },
        { to: '/leaderboard', label: 'Leaderboard' }
    ];

    const adminLinks = [
        { to: '/admin/profile', label: 'Admin Profile' },
        { to: '/admin/problems', label: 'Problems' },
        { to: '/admin/contests', label: 'Contests' },
        { to: '/admin/submissions', label: 'Submissions' },
        { to: '/admin/companies', label: 'Companies' },
        { to: '/admin/tickets', label: 'Tickets' },
        { to: '/admin/daily-challenges', label: 'Daily Challenges' },
        { to: '/admin/social', label: 'Social Control' },
        { to: '/admin/reports', label: 'Reports' },
        { to: '/admin/audit-logs', label: 'Audit Logs' },
        { to: '/admin/users', label: 'User Management' }
    ];

    const superAdminLinks = [
        { to: '/super-admin/profile', label: 'Profile' },
        { to: '/super-admin/admins', label: 'Admin Management' },
        { to: '/super-admin/problems', label: 'Problem Master List' },
        { to: '/super-admin/contests', label: 'Contest Management' },
        { to: '/super-admin/daily-challenges', label: 'Daily Challenges' },
        { to: '/super-admin/social', label: 'Social Control' },
        { to: '/super-admin/reports', label: 'Moderation Reports' },
        { to: '/super-admin/audit', label: 'Audit Logs' },
        { to: '/super-admin/health', label: 'System Health' },
        { to: '/super-admin/emergency', label: 'Emergency Zone' },
        { to: '/super-admin/tickets', label: 'Tickets' }
    ];

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const query = searchQuery.trim();
        if (!query) {
            navigate('/algorithms');
            return;
        }
        navigate(`/algorithms?search=${encodeURIComponent(query)}`);
        setIsMobileMenuOpen(false);
    };

    const navClassName = [
        'navbar',
        isScrolled ? 'navbar-scrolled' : '',
        isMobile ? 'is-mobile' : '',
        isMobile && isAuthenticated ? 'is-mobile-auth' : '',
        isMobile && !isAuthenticated ? 'is-mobile-guest' : '',
        viewportWidth <= 480 ? 'is-compact' : ''
    ].filter(Boolean).join(' ');

    return (
        <>
            <nav className={navClassName}>
                <div className="nav-left">
                    <div className="nav-backforward">
                        <BackForward />
                    </div>
                    <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <img src="/assets/algoverse-logo.png" alt="AlgoVerse" style={{ height: '32px', width: 'auto' }} onError={(e) => { e.target.src = '/assets/krama-logo.png'; }} />
                        <span className="logo-wordmark" style={{ fontSize: '1.3rem', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AlgoVerse</span>
                    </Link>

                    <div className="search-wrapper" style={{ position: 'relative', width: isMobile ? '100%' : '300px' }} ref={searchRef}>
                        <form className="search-container" onSubmit={handleSearchSubmit}>
                            <FaSearch className="nav-search-icon" style={{ position: 'absolute', left: '14px', top: '13px', color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder={isMobile ? 'Search...' : 'Search algorithms...'}
                                className="search-input"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                                onKeyDown={handleKeyDown}
                                aria-label="Search algorithms"
                                autoComplete="off"
                            />
                        </form>
                        {showSuggestions && (
                            <div className="search-suggestions-dropdown">
                                {suggestions.length > 0 ? (
                                    suggestions.map((algo, index) => (
                                        <Link 
                                            key={algo.id} 
                                            to={algo.path} 
                                            className={`suggestion-item ${index === activeIndex ? 'active' : ''}`}
                                            onClick={() => {
                                                setShowSuggestions(false);
                                                setSearchQuery('');
                                            }}
                                        >
                                            <div className="suggestion-icon">
                                                <FaCode size={14} />
                                            </div>
                                            <div className="suggestion-info">
                                                <div className="suggestion-name">{algo.name}</div>
                                                <div className="suggestion-category">{algo.category}</div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="suggestion-empty">No results found</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="nav-right">
                    {/* Standard Links - Only for Regular Users or Guests */}
                    {!isMobile && !['ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                        <>
                            {publicLinks.map((link) => (
                                <Link key={link.to} to={link.to} className="nav-link" style={getLinkStyle(link.to)}>{link.label}</Link>
                            ))}
                        </>
                    )}

                    {/* Admin Links */}
                    {!isMobile && user?.role === 'SUPER_ADMIN' && (
                        <Link to="/super-admin/profile" className="nav-link" style={{ ...getLinkStyle('/super-admin'), color: '#ec4899' }}>
                            Super Admin
                        </Link>
                    )}
                    {!isMobile && user?.role === 'ADMIN' && (
                        <div className="admin-nav-group">
                            <Link to="/admin/profile" className={`admin-nav-btn ${isActive('/admin/profile') ? 'active' : ''}`}>
                                profile
                            </Link>
                            <Link to="/admin/problems" className={`admin-nav-btn ${isActive('/admin/problems') ? 'active' : ''}`}>
                                problems
                            </Link>
                            <Link to="/admin/contests" className={`admin-nav-btn ${isActive('/admin/contests') ? 'active' : ''}`}>
                                contest
                            </Link>
                            <Link to="/admin/submissions" className={`admin-nav-btn ${isActive('/admin/submissions') ? 'active' : ''}`}>
                                submissions
                            </Link>
                            <Link to="/admin/companies" className={`admin-nav-btn ${isActive('/admin/companies') ? 'active' : ''}`}>
                                companies
                            </Link>
                            <Link to="/admin/daily-challenges" className={`admin-nav-btn ${isActive('/admin/daily-challenges') ? 'active' : ''}`}>
                                daily
                            </Link>
                            <Link to="/admin/social" className={`admin-nav-btn ${isActive('/admin/social') ? 'active' : ''}`}>
                                social
                            </Link>
                            <Link to="/admin/reports" className={`admin-nav-btn ${isActive('/admin/reports') ? 'active' : ''}`}>
                                reports
                            </Link>
                            <Link to="/admin/audit-logs" className={`admin-nav-btn ${isActive('/admin/audit-logs') ? 'active' : ''}`}>
                                audit
                            </Link>
                            <Link to="/admin/users" className={`admin-nav-btn ${isActive('/admin/users') ? 'active' : ''}`}>
                                log users
                            </Link>
                        </div>
                    )}

                    {isMobile && (
                        <button
                            ref={mobileMenuTriggerRef}
                            type="button"
                            className="mobile-menu-toggle"
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            aria-label="Toggle navigation menu"
                        >
                            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    )}

                    <ThemeToggle />

                    {isAuthenticated ? (
                        <div className="nav-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <NotificationBell />
                            <button
                                ref={triggerRef}
                                onClick={handleProfileToggle}
                                className="nav-profile-avatar nav-profile-trigger"
                                title={user?.username}
                                type="button"
                            >
                                {user?.avatar && user.avatar !== 'default-avatar.png' ? (
                                    <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    <span>{user?.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="nav-guest-actions" style={{ display: 'flex', gap: '10px' }}>
                            {!isMobile && <Link to="/login" className="nav-link" style={{ color: 'var(--text-primary)' }}>Login</Link>}
                            {!isMobile && <Link to="/register" className="nav-link" style={{
                                background: 'var(--primary-orange)', color: 'black', padding: '6px 16px', borderRadius: '8px', fontWeight: 'bold'
                            }}>Sign Up</Link>}
                        </div>
                    )}
                </div>
            </nav>

            {isMobile && isMobileMenuOpen && (
                <>
                    <div className="mobile-nav-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
                    <aside ref={mobileMenuRef} className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label="Mobile navigation">
                        <div className="mobile-nav-section-title">Navigation</div>
                        {!['ADMIN', 'SUPER_ADMIN'].includes(user?.role) && (
                            <div className="mobile-nav-links">
                                {publicLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`mobile-nav-link ${isActive(link.to) ? 'active' : ''}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {user?.role === 'SUPER_ADMIN' && (
                            <div className="mobile-nav-links">
                                <div className="mobile-nav-subsection-title">Super Admin</div>
                                {superAdminLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`mobile-nav-link ${isActive(link.to) ? 'active' : ''}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {user?.role === 'ADMIN' && (
                            <div className="mobile-nav-links">
                                <div className="mobile-nav-subsection-title">Admin</div>
                                {adminLinks.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`mobile-nav-link ${isActive(link.to) ? 'active' : ''}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {!isAuthenticated && (
                            <div className="mobile-nav-auth">
                                <Link to="/login" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                                <Link to="/register" className="mobile-nav-link signup" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                            </div>
                        )}
                    </aside>
                </>
            )}

            {isAuthenticated && isProfileDrawerOpen && (
                <>
                    <aside ref={drawerRef} className="profile-drawer" role="dialog" aria-modal="true" aria-label="Profile menu">
                        <div className="profile-drawer-header">
                            <div className="profile-drawer-avatar">
                                {user?.avatar && user.avatar !== 'default-avatar.png' ? (
                                    <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                                ) : (
                                    <span>{user?.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="profile-drawer-userinfo">
                                <h3>{user?.fullName || user?.username}</h3>
                                <p className="profile-drawer-subtitle">Welcome to AlgoVerse!</p>
                            </div>
                        </div>

                        <div className="profile-quick-grid">
                            {quickActions.map((action) => (
                                <button key={action.label} type="button" className="profile-quick-card" onClick={action.onClick}>
                                    <span className="profile-quick-icon">{action.icon}</span>
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="profile-drawer-menu">
                            {drawerMenuItems.map((item) => (
                                <button key={item.label} type="button" className="profile-menu-item" onClick={item.onClick}>
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                            <button type="button" className="profile-menu-item profile-menu-signout" onClick={onLogout}>
                                <span><FaSignOutAlt /></span>
                                <span>Sign out</span>
                            </button>
                        </div>
                    </aside>
                </>
            )}
        </>
    );
};

export default Navbar;
