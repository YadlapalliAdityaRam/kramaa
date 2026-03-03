import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const Companies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const fetchCompanies = async () => {
        try {
            const res = await api.get('/companies');
            setCompanies(res.data.companies || []);
        } catch (error) {
            toast.error('Failed to load companies');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const isMobile = viewportWidth <= 768;

    if (loading) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 12px' : '32px 24px', minHeight: '100dvh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
                    <p style={{ color: '#9ca3af' }}>Loading companies...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 12px' : '32px 24px', minHeight: '100dvh' }}>
            <h1 style={{ fontSize: isMobile ? '2rem' : '2.5rem', marginBottom: '16px', color: '#f3f4f6', fontWeight: '900' }}>Placement Guide</h1>
            <p style={{ color: '#9ca3af', marginBottom: isMobile ? '24px' : '40px', fontSize: isMobile ? '0.95rem' : '1.1rem' }}>Comprehensive details for top service and product-based companies.</p>

            <section style={{ marginBottom: '48px' }}>
                <h2 style={{
                    fontSize: '1.75rem',
                    marginBottom: '24px',
                    borderBottom: '2px solid #374151',
                    paddingBottom: '12px',
                    color: '#14b8a6',
                    fontWeight: '700'
                }}>Company Profiles</h2>

                {companies.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        border: '2px dashed #374151',
                        borderRadius: '16px',
                        background: 'rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏢</div>
                        <h3 style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>No Companies Available</h3>
                        <p style={{ color: '#6b7280' }}>Companies will appear here once added by administrators.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                        {companies.map((company, idx) => (
                            <div key={company._id || idx} style={{
                                background: 'linear-gradient(135deg, #1a1a1a, #151515)',
                                borderRadius: '12px',
                                padding: isMobile ? '16px' : '24px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'transform 0.3s, box-shadow 0.3s'
                            }}
                                onClick={() => window.location.href = `/company/${company.name}`}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(20, 184, 166, 0.3)';
                                    e.currentTarget.style.cursor = 'pointer';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                                }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: '700', color: '#f3f4f6' }}>{company.name}</h3>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '6px 12px',
                                        borderRadius: '999px',
                                        background: company.type === 'Product-Based'
                                            ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(124, 58, 237, 0.2))'
                                            : 'linear-gradient(90deg, rgba(34, 197, 94, 0.2), rgba(20, 184, 166, 0.2))',
                                        color: company.type === 'Product-Based' ? '#93c5fd' : '#6ee7b7',
                                        fontWeight: '700',
                                        border: company.type === 'Product-Based'
                                            ? '1px solid rgba(59, 130, 246, 0.3)'
                                            : '1px solid rgba(34, 197, 94, 0.3)'
                                    }}>
                                        {company.type}
                                    </span>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '10px', fontWeight: '700' }}>Required Skills</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {company.skills?.map((skill, i) => (
                                            <span key={i} style={{
                                                fontSize: '0.8rem',
                                                background: 'rgba(20, 184, 166, 0.15)',
                                                color: '#5eead4',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(20, 184, 166, 0.3)',
                                                fontWeight: '600'
                                            }}>{skill}</span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '10px', fontWeight: '700' }}>Recruitment Process</h4>
                                    <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#d1d5db', lineHeight: '1.6' }}>
                                        {company.process?.map((step, i) => (
                                            <li key={i} style={{ marginBottom: '6px' }}>{step}</li>
                                        ))}
                                    </ul>
                                </div>

                                {company.focusAreas && company.focusAreas.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '10px', fontWeight: '700' }}>Practice Focus Areas 🎯</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {company.focusAreas.map((area, j) => (
                                                <a
                                                    key={j}
                                                    href={`/coding-platform?topic=${area.topic}`}
                                                    style={{
                                                        textDecoration: 'none',
                                                        fontSize: '0.85rem',
                                                        background: 'linear-gradient(90deg, #14b8a6, #3b82f6)',
                                                        color: 'white',
                                                        padding: '8px 14px',
                                                        borderRadius: '8px',
                                                        fontWeight: '600',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.3s',
                                                        boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(20, 184, 166, 0.5)';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(20, 184, 166, 0.3)';
                                                    }}
                                                >
                                                    {area.name} ↗
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Companies;
