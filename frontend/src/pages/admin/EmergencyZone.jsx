import React, { useState } from 'react';
import { FaExclamationTriangle, FaLock, FaTools, FaShieldAlt } from 'react-icons/fa';

const EmergencyZone = () => {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [lockdown, setLockdown] = useState(false);

    return (
        <div style={{ padding: '0.5rem 0' }}>
            <div className="sa-card" style={{ border: '1px solid rgba(239, 68, 68, 0.45)', position: 'relative', overflow: 'hidden', padding: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ef4444', fontSize: '2rem',
                        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.25)'
                    }}>
                        <FaExclamationTriangle />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.85rem', fontWeight: '850', color: 'var(--sa-text)', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                            <FaShieldAlt style={{ color: '#ef4444' }} /> Emergency Control Zone
                        </h2>
                        <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.92rem', maxWidth: '560px', margin: '0 auto' }}>
                            Critical safeguards and cluster controls. Authorized super administrators only. Proceed with deliberate caution.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {/* Maintenance Mode Card */}
                    <div className="sa-stat-card" style={{ padding: '1.5rem', border: '1px solid var(--sa-border)', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                                <FaTools style={{ color: '#eab308', fontSize: '1.2rem' }} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '750', color: 'var(--sa-text)', margin: 0 }}>Maintenance Mode</h3>
                            </div>
                            <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
                                Disconnects regular users and presents a maintenance screen across the platform while keeping admin endpoints accessible.
                            </p>
                        </div>
                        <button
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className="sa-btn"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '0.88rem',
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                                background: maintenanceMode ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--sa-pill-inactive)',
                                color: maintenanceMode ? '#ffffff' : 'var(--sa-text)',
                                border: maintenanceMode ? '1px solid #ef4444' : '1px solid var(--sa-border)',
                                boxShadow: maintenanceMode ? '0 4px 16px rgba(239, 68, 68, 0.4)' : 'none'
                            }}
                        >
                            {maintenanceMode ? 'DISABLE MAINTENANCE MODE' : 'ENABLE MAINTENANCE MODE'}
                        </button>
                    </div>

                    {/* System Lockdown Card */}
                    <div className="sa-stat-card" style={{ padding: '1.5rem', border: '1px solid var(--sa-border)', borderRadius: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                                <FaLock style={{ color: '#ef4444', fontSize: '1.2rem' }} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '750', color: 'var(--sa-text)', margin: 0 }}>System Lockdown</h3>
                            </div>
                            <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.86rem', lineHeight: '1.5', margin: '0 0 1.5rem 0' }}>
                                Freezes all mutating database transactions across the platform. Enables read-only mode for safety during investigations.
                            </p>
                        </div>
                        <button
                            onClick={() => setLockdown(!lockdown)}
                            className="sa-btn"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                padding: '0.8rem 1rem',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '0.88rem',
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                                background: lockdown ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'var(--sa-pill-inactive)',
                                color: lockdown ? '#ffffff' : 'var(--sa-text)',
                                border: lockdown ? '1px solid #ef4444' : '1px solid var(--sa-border)',
                                boxShadow: lockdown ? '0 4px 16px rgba(239, 68, 68, 0.4)' : 'none'
                            }}
                        >
                            {lockdown ? 'LIFT LOCKDOWN' : 'INITIATE LOCKDOWN'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyZone;
