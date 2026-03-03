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
        <div className="flex-1 flex flex-col h-full bg-gray-900/50">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {ticket.title}
                        <span className="text-xs font-normal text-gray-400">#{ticket._id.slice(-6)}</span>
                    </h2>
                    <div className="text-sm text-gray-400 mt-1">
                        Type: <span className="text-white bg-gray-700 px-2 py-0.5 rounded text-xs">{ticket.type}</span> •
                        Created by: {ticket.createdBy?.username} •
                        Target: {ticket.targetModel}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {canDecide && (
                        <>
                            <button
                                onClick={() => handleDecision('APPROVED')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                            >
                                <FaCheck /> Approve
                            </button>
                            <button
                                onClick={() => handleDecision('REJECTED')}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
                            >
                                <FaTimes /> Reject
                            </button>
                        </>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${ticket.status === 'APPROVED' ? 'border-green-500 text-green-500 bg-green-500/10' :
                            ticket.status === 'REJECTED' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                ticket.status === 'EXECUTED' ? 'border-purple-500 text-purple-500 bg-purple-500/10' :
                                    'border-blue-500 text-blue-500 bg-blue-500/10'
                        }`}>
                        {ticket.status}
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.sender?._id === currentUser.id;
                    const isSystem = msg.type === 'SYSTEM' || msg.type === 'DECISION';

                    if (isSystem) {
                        return (
                            <div key={msg._id} className="flex justify-center my-4">
                                <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-2 ${msg.type === 'DECISION' ?
                                        (msg.message.includes('APPROVED') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')
                                        : 'bg-gray-700 text-gray-300'
                                    }`}>
                                    {msg.type === 'SYSTEM' && <FaRobot />}
                                    {msg.message}
                                    <span className="opacity-50 ml-2">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'
                                }`}>
                                <div className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                                    <span>{msg.sender?.username || 'Unknown'}</span>
                                    <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {['OPEN', 'UNDER_REVIEW'].includes(ticket.status) ? (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 bg-gray-900 flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaPaperPlane />
                    </button>
                </form>
            ) : (
                <div className="p-4 border-t border-gray-700 bg-gray-900 text-center text-gray-500 text-sm">
                    This ticket is closed. Discussion locked.
                </div>
            )}
        </div>
    );
};

export default TicketChat;
