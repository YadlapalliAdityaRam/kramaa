import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaGraduationCap, FaShareAlt, FaLock, FaTimes, FaCamera } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: active ? '#60a5fa' : '#9ca3af', border: 'none', borderRadius: '8px',
            cursor: 'pointer', transition: 'all 0.2s', fontWeight: active ? '600' : 'normal',
            whiteSpace: 'nowrap',
            flexShrink: 0
        }}
    >
        {icon} {label}
    </button>
);

const InputGroup = ({ label, children }) => (
    <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', color: 'var(--text-primary, #d1d5db)', marginBottom: '6px', fontSize: '0.9rem' }}>{label}</label>
        {children}
    </div>
);

const Input = ({ ...props }) => (
    <input
        {...props}
        style={{
            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, white)', outline: 'none', fontSize: '0.95rem'
        }}
    />
);

const Select = ({ options, ...props }) => (
    <select
        {...props}
        style={{
            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary, white)', outline: 'none', fontSize: '0.95rem'
        }}
    >
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
);

const EditProfileModal = ({ isOpen, onClose, profileData, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('basic');
    const [loading, setLoading] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));
    const [formData, setFormData] = useState({
        // Basic
        fullName: '', title: '', bio: '', location: '', website: '', phoneNumber: '',
        // Education
        college: '', degree: '', branch: '', yearOfStudy: '', graduationYear: '',
        // Social
        github: '', linkedin: '', twitter: '', portfolio: '', leetcode: '', codeforces: '',
        // Privacy
        isPublic: true, showActivity: true, showSubmissions: true, showRating: true, showEmail: false
    });

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (profileData) {
            setFormData({
                fullName: profileData.user?.fullName || '',
                phoneNumber: profileData.user?.phoneNumber || '',
                title: profileData.title || '',
                bio: profileData.bio || '',
                website: profileData.website || '',
                // Location is distinct object now
                country: profileData.location?.country || '',
                state: profileData.location?.state || '',
                // Education Details
                college: profileData.educationDetails?.college || '',
                degree: profileData.educationDetails?.degree || '',
                branch: profileData.educationDetails?.branch || '',
                yearOfStudy: profileData.educationDetails?.yearOfStudy || '',
                graduationYear: profileData.educationDetails?.graduationYear || '',
                // Social
                github: profileData.social?.github || '',
                linkedin: profileData.social?.linkedin || '',
                twitter: profileData.social?.twitter || '',
                portfolio: profileData.social?.portfolio || '',
                leetcode: profileData.social?.leetcode || '',
                codeforces: profileData.social?.codeforces || '',
                // Privacy
                isPublic: profileData.preferences?.isPublic ?? true,
                showActivity: profileData.preferences?.showActivity ?? true,
                showSubmissions: profileData.preferences?.showSubmissions ?? true,
                showRating: profileData.preferences?.showRating ?? true,
                showEmail: profileData.preferences?.showEmail ?? false,
            });
        }
    }, [profileData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Construct payload matching backend expectation
        const payload = {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            title: formData.title,
            bio: formData.bio,
            website: formData.website,
            location: {
                country: formData.country,
                state: formData.state
            },
            educationDetails: {
                college: formData.college,
                degree: formData.degree,
                branch: formData.branch,
                yearOfStudy: formData.yearOfStudy,
                graduationYear: formData.graduationYear
            },
            social: {
                github: formData.github,
                linkedin: formData.linkedin,
                twitter: formData.twitter,
                portfolio: formData.portfolio,
                leetcode: formData.leetcode,
                codeforces: formData.codeforces
            },
            preferences: {
                isPublic: formData.isPublic,
                showActivity: formData.showActivity,
                showSubmissions: formData.showSubmissions,
                showRating: formData.showRating,
                showEmail: formData.showEmail
            }
        };

        try {
            const res = await api.put('/profiles/me', payload);
            toast.success("Profile updated successfully!");
            onUpdate(res.data);
            onClose();
        } catch (err) {
            toast.error("Failed to update profile");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;
    const isMobile = viewportWidth <= 768;
    const twoColumnGrid = isMobile ? '1fr' : '1fr 1fr';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)',
            padding: isMobile ? '0' : '16px'
        }} onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#111827', width: isMobile ? '100%' : '800px', maxWidth: isMobile ? '100%' : '95vw', height: isMobile ? '94dvh' : '85vh', borderRadius: isMobile ? '16px 16px 0 0' : '16px',
                    display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary, white)' }}>Edit Profile</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary, #9ca3af)', fontSize: '1.2rem', cursor: 'pointer' }}><FaTimes /></button>
                </div>

                {/* Content */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Sidebar Tabs */}
                    <div style={{ width: isMobile ? '100%' : '200px', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.1)' : 'none', padding: '16px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', overflowX: isMobile ? 'auto' : 'visible' }} className={isMobile ? 'custom-scrollbar' : undefined}>
                        <TabButton active={activeTab === 'basic'} onClick={() => setActiveTab('basic')} icon={<FaUser />} label="Basic Info" />
                        <TabButton active={activeTab === 'education'} onClick={() => setActiveTab('education')} icon={<FaGraduationCap />} label="Education" />
                        <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')} icon={<FaShareAlt />} label="Social Links" />
                        <TabButton active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')} icon={<FaLock />} label="Privacy" />
                    </div>

                    {/* Form Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
                        <form id="profile-form" onSubmit={handleSubmit}>
                            {activeTab === 'basic' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h3 style={{ margin: '0 0 16px', color: '#60a5fa' }}>Basic Information</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '16px' }}>
                                        <InputGroup label="Full Name">
                                            <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. John Doe" />
                                        </InputGroup>
                                        <InputGroup label="Display Title">
                                            <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Full Stack Developer" />
                                        </InputGroup>
                                    </div>
                                    <InputGroup label="Bio">
                                        <textarea
                                            name="bio" value={formData.bio} onChange={handleChange} rows={4}
                                            style={{
                                                width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px', padding: '12px', color: 'var(--text-primary, white)', outline: 'none', resize: 'vertical'
                                            }}
                                            placeholder="Tell us about yourself..."
                                        />
                                    </InputGroup>
                                    <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '16px' }}>
                                        <InputGroup label="Country">
                                            <Input name="country" value={formData.country} onChange={handleChange} placeholder="e.g. India" />
                                        </InputGroup>
                                        <InputGroup label="State/Region">
                                            <Input name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Karnataka" />
                                        </InputGroup>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '16px' }}>
                                        <InputGroup label="Phone Number">
                                            <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="+91 99999 99999" />
                                        </InputGroup>
                                        <InputGroup label="Website">
                                            <Input name="website" value={formData.website} onChange={handleChange} placeholder="https://yourportfolio.com" />
                                        </InputGroup>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'education' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h3 style={{ margin: '0 0 16px', color: '#60a5fa' }}>Education Details</h3>
                                    <InputGroup label="College / University">
                                        <Input name="college" value={formData.college} onChange={handleChange} placeholder="e.g. IIT Bombay" />
                                    </InputGroup>
                                    <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '16px' }}>
                                        <InputGroup label="Degree">
                                            <Input name="degree" value={formData.degree} onChange={handleChange} placeholder="e.g. B.Tech" />
                                        </InputGroup>
                                        <InputGroup label="Branch / Major">
                                            <Input name="branch" value={formData.branch} onChange={handleChange} placeholder="e.g. Computer Science" />
                                        </InputGroup>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '16px' }}>
                                        <InputGroup label="Year of Study">
                                            <Select name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} options={[
                                                { value: '', label: 'Select Year' },
                                                { value: '1st Year', label: '1st Year' },
                                                { value: '2nd Year', label: '2nd Year' },
                                                { value: '3rd Year', label: '3rd Year' },
                                                { value: '4th Year', label: '4th Year' },
                                                { value: 'Graduated', label: 'Graduated' }
                                            ]} />
                                        </InputGroup>
                                        <InputGroup label="Graduation Year">
                                            <Input name="graduationYear" value={formData.graduationYear} onChange={handleChange} placeholder="e.g. 2026" />
                                        </InputGroup>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <h3 style={{ margin: '0 0 16px', color: '#60a5fa' }}>Social Profiles</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: twoColumnGrid, gap: '16px' }}>
                                        <InputGroup label="GitHub URL">
                                            <Input name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/username" />
                                        </InputGroup>
                                        <InputGroup label="LinkedIn URL">
                                            <Input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                                        </InputGroup>
                                        <InputGroup label="Twitter / X URL">
                                            <Input name="twitter" value={formData.twitter} onChange={handleChange} placeholder="https://twitter.com/username" />
                                        </InputGroup>
                                        <InputGroup label="Portfolio URL">
                                            <Input name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://..." />
                                        </InputGroup>
                                        <InputGroup label="LeetCode URL">
                                            <Input name="leetcode" value={formData.leetcode} onChange={handleChange} placeholder="https://leetcode.com/username" />
                                        </InputGroup>
                                        <InputGroup label="CodeForces URL">
                                            <Input name="codeforces" value={formData.codeforces} onChange={handleChange} placeholder="https://codeforces.com/profile/username" />
                                        </InputGroup>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'privacy' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <h3 style={{ margin: '0 0 16px', color: '#60a5fa' }}>Privacy Settings</h3>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--text-primary, #e5e7eb)' }}>Profile Visibility</h4>
                                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>Allow others to view your profile page.</p>
                                        </div>
                                        <input type="checkbox" name="isPublic" checked={formData.isPublic} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--text-primary, #e5e7eb)' }}>Show Activity Calendar</h4>
                                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>Display your daily submission heatmap.</p>
                                        </div>
                                        <input type="checkbox" name="showActivity" checked={formData.showActivity} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--text-primary, #e5e7eb)' }}>Show Submissions</h4>
                                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>Let others see your problem solving stats.</p>
                                        </div>
                                        <input type="checkbox" name="showSubmissions" checked={formData.showSubmissions} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--text-primary, #e5e7eb)' }}>Show Email</h4>
                                            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #9ca3af)', fontSize: '0.85rem' }}>Display your email address on your public profile.</p>
                                        </div>
                                        <input type="checkbox" name="showEmail" checked={formData.showEmail} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: isMobile ? '14px 16px' : '20px 24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(0,0,0,0.2)', flexWrap: 'wrap' }}>
                    <button type="button" onClick={onClose} style={{ padding: '10px 24px', background: 'transparent', color: 'var(--text-primary, #d1d5db)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}>Cancel</button>
                    <button type="submit" form="profile-form" disabled={loading} style={{
                        padding: '10px 28px', background: 'var(--primary-teal)', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontSize: '1rem'
                    }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EditProfileModal;
