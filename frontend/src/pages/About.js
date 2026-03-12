import React from 'react';

const About = () => {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(135deg, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>About Kramaa</h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
                The ultimate platform for mastering algorithms through interactive visualizations, real-time coding, and competitive challenges.
            </p>
            <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <p style={{ margin: 0, fontWeight: '600', color: 'var(--primary-teal)' }}>Created by Aditya Ram</p>
            </div>
        </div>
    );
};

export default About;
