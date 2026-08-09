import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { FaPaperPlane, FaUserCircle, FaCheck, FaTimes, FaRobot } from 'react-icons/fa';
import api from '../../../utils/api';
import toast from 'react-hot-toast';

const TicketChat = ({ ticketId, currentUser }) => {
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [decision, setDecision] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/tickets/${ticketId}`);
            setTicket(res.data.ticket);
            setMessages(res.data.messages);
            setDecision(res.data.decision);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load ticket details");
        }
    };

    useEffect(() => {
        if (ticketId) {
            setLoading(true);
            fetchDetails();
            // Polling for demo (ideally use socket.io)
            const interval = setInterval(fetchDetails, 5000);
            return () => clearInterval(interval);
        }
    }, [ticketId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await api.post(`/tickets/${ticketId}/message`, { message: newMessage });
            setMessages([...messages, res.data.message]);
            setNewMessage('');
            fetchDetails(); // Refresh to get any status updates (e.g. UNDER_REVIEW)
        } catch (err) {
            toast.error("Failed to send message");
        }
    };

    const handleDecision = async (decisionType) => {
        const remark = prompt(`Enter remark for ${decisionType}:`);
        if (remark === null) return; // Cancelled

        try {
            await api.post(`/tickets/${ticketId}/decision`, { decision: decisionType, remark });
            toast.success(`Ticket ${decisionType}`);
            fetchDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || "Action failed");
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Loading chat...</div>;
    if (!ticket) return <div className="flex-1 flex items-center justify-center text-gray-500">Select a ticket to view details</div>;

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const canDecide = isSuperAdmin && ['OPEN', 'UNDER_REVIEW'].includes(ticket.status);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, background: 'var(--sa-bg)' }}>
            {/* Header */}
            <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--sa-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--sa-card-bg)', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--sa-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.2rem 0' }}>
                        {ticket.title}
                        <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--sa-text-muted)' }}>#{ticket._id.slice(-6)}</span>
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: 'var(--sa-text-muted)' }}>
                        Type: <span style={{ color: 'var(--sa-text)', background: 'var(--sa-pill-inactive)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: '600' }}>{ticket.type}</span> •
                        Created by: <span style={{ color: 'var(--sa-accent)', fontWeight: '600' }}>{ticket.createdBy?.username}</span> •
                        Target: <span style={{ color: 'var(--sa-text)' }}>{ticket.targetModel}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {canDecide && (
                        <>
                            <button
                                onClick={() => handleDecision('APPROVED')}
                                className="sa-btn"
                                style={{ background: '#16a34a', color: '#ffffff', padding: '0.5rem 1rem' }}
                            >
                                <FaCheck /> Approve
                            </button>
                            <button
                                onClick={() => handleDecision('REJECTED')}
                                className="sa-btn sa-btn-danger"
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                <FaTimes /> Reject
                            </button>
                        </>
                    )}
                    <span className={`sa-badge ${ticket.status === 'APPROVED' ? 'sa-badge-green' :
                            ticket.status === 'REJECTED' ? 'sa-badge-red' :
                                ticket.status === 'EXECUTED' ? 'sa-badge-purple' :
                                    'sa-badge-blue'
                        }`}>
                        {ticket.status}
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg) => {
                    const isMe = msg.sender?._id === currentUser.id;
                    const isSystem = msg.type === 'SYSTEM' || msg.type === 'DECISION';

                    if (isSystem) {
                        return (
                            <div key={msg._id} style={{ display: 'flex', justifyContent: 'center', margin: '0.8rem 0' }}>
                                <span style={{
                                    fontSize: '0.78rem', padding: '0.4rem 1rem', borderRadius: '999px',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: msg.message.includes('APPROVED') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: msg.message.includes('APPROVED') ? '#16a34a' : '#ef4444',
                                    border: '1px solid var(--sa-border)'
                                }}>
                                    {msg.type === 'SYSTEM' && <FaRobot />}
                                    {msg.message}
                                    <span style={{ opacity: 0.6, marginLeft: '6px' }}>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <div style={{
                                maxWidth: '75%', borderRadius: '16px', padding: '0.85rem 1.1rem',
                                background: isMe ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'var(--sa-card-bg)',
                                color: isMe ? '#ffffff' : 'var(--sa-text)',
                                border: isMe ? 'none' : '1px solid var(--sa-border)',
                                boxShadow: 'var(--sa-shadow)'
                            }}>
                                <div style={{ fontSize: '0.74rem', opacity: 0.8, marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                                    <strong>{msg.sender?.username || 'Unknown'}</strong>
                                    <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                </div>
                                <p style={{ fontSize: '0.88rem', margin: 0, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {['OPEN', 'UNDER_REVIEW'].includes(ticket.status) ? (
                <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--sa-border)', background: 'var(--sa-card-bg)', display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="sa-input"
                        style={{ flex: 1 }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="sa-btn sa-btn-primary"
                        style={{ padding: '0.75rem 1.2rem', borderRadius: '10px' }}
                    >
                        <FaPaperPlane />
                    </button>
                </form>
            ) : (
                <div className="sa-empty-text" style={{ padding: '1rem', borderTop: '1px solid var(--sa-border)', textAlign: 'center', fontSize: '0.85rem' }}>
                    This ticket is closed. Discussion locked.
                </div>
            )}
        </div>
    );
};

export default TicketChat;
