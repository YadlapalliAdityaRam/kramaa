import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaFlag, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const REPORT_REASONS = [
    'Spam',
    'Harassment',
    'Inappropriate Content',
    'Plagiarism',
    'Incorrect Solution',
    'Cheating',
    'Other'
];

const ReportModal = ({ isOpen, onClose, contentId, contentType, reportedUserId }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    React.useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    if (!isOpen) return null;
    const isMobile = viewportWidth <= 768;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReason) {
            toast.error('Please select a reason for reporting.');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/reports', {
                contentId,
                contentType,
                reportedUserId,
                reason: selectedReason,
                description: description.trim()
            });
            toast.success('Report submitted successfully. Thank you for keeping the community safe.');
            onClose();
            // Reset state
            setSelectedReason('');
            setDescription('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
                    background: 'var(--report-modal-overlay-bg)', backdropFilter: 'blur(8px)',
                    padding: isMobile ? '0' : '16px'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            background: 'var(--report-modal-bg)', border: '1px solid var(--report-modal-border)',
                            borderRadius: isMobile ? '16px 16px 0 0' : '24px',
                            padding: isMobile ? '16px' : '32px',
                            width: isMobile ? '100%' : '90%',
                            maxWidth: isMobile ? '100%' : '500px',
                            maxHeight: isMobile ? '92dvh' : '88vh',
                            boxShadow: 'var(--report-modal-shadow)',
                            position: 'relative', overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background glow */}
                        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(239,68,68,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative' }}>
                            <h2 style={{ margin: 0, fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--report-modal-title)' }}>
                                <div style={{ background: 'var(--report-modal-flag-bg)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                                    <FaFlag style={{ color: '#ef4444' }} size={16} />
                                </div>
                                Report Content
                            </h2>
                            <button onClick={onClose} style={{
                                background: 'transparent', border: 'none', color: 'var(--report-modal-muted)', cursor: 'pointer',
                                padding: '8px', display: 'flex', borderRadius: '50%', transition: 'all 0.2s'
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--report-modal-close-hover-bg)'; e.currentTarget.style.color = 'var(--report-modal-title)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--report-modal-muted)'; }}
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <p style={{ color: 'var(--report-modal-muted)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
                            Help us maintain a safe community. What's wrong with this {contentType.toLowerCase()}?
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {REPORT_REASONS.map((reason) => (
                                    <label key={reason} style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                                        background: selectedReason === reason ? 'rgba(239,68,68,0.1)' : 'var(--report-modal-row-bg)',
                                        border: `1px solid ${selectedReason === reason ? 'rgba(239,68,68,0.4)' : 'var(--report-modal-border)'}`,
                                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                        color: selectedReason === reason ? '#f87171' : 'var(--report-modal-text)',
                                    }}
                                        onMouseEnter={(e) => {
                                            if (selectedReason !== reason) {
                                                e.currentTarget.style.background = 'var(--report-modal-row-hover-bg)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedReason !== reason) {
                                                e.currentTarget.style.background = 'var(--report-modal-row-bg)';
                                            }
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="reportReason"
                                            value={reason}
                                            checked={selectedReason === reason}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            style={{ margin: 0, accentColor: '#ef4444', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '0.95rem', fontWeight: selectedReason === reason ? 600 : 400 }}>{reason}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Optional Description */}
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--report-modal-text)', fontSize: '0.9rem', fontWeight: 500 }}>
                                    Additional details (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide more context to help us review quicker..."
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px',
                                        background: 'var(--report-modal-input-bg)', border: '1px solid var(--report-modal-border)',
                                        color: 'var(--report-modal-title)', fontSize: '0.95rem', minHeight: '100px',
                                        resize: 'vertical', fontFamily: 'inherit'
                                    }}
                                    maxLength={1000}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', fontSize: '0.75rem', color: 'var(--report-modal-muted)' }}>
                                    {description.length}/1000
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: '12px 24px', background: 'transparent', color: 'var(--report-modal-muted)',
                                        border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600,
                                        fontSize: '0.95rem', transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--report-modal-title)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--report-modal-muted)'}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: selectedReason ? 1.02 : 1 }}
                                    whileTap={{ scale: selectedReason && !submitting ? 0.98 : 1 }}
                                    type="submit"
                                    disabled={!selectedReason || submitting}
                                    style={{
                                        padding: isMobile ? '12px 20px' : '12px 32px',
                                        background: selectedReason ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'var(--report-modal-disabled-bg)',
                                        color: selectedReason ? 'white' : 'var(--report-modal-muted)',
                                        border: 'none', borderRadius: '12px', fontWeight: 700,
                                        cursor: (!selectedReason || submitting) ? 'not-allowed' : 'pointer',
                                        fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: selectedReason ? '0 4px 14px rgba(239,68,68,0.3)' : 'none',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    {submitting ? (
                                        <>
                                            <FaSpinner className="spin" /> Submitting...
                                        </>
                                    ) : (
                                        'Submit Report'
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReportModal;
