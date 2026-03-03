import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import TicketList from '../../components/admin/tickets/TicketList';
import TicketChat from '../../components/admin/tickets/TicketChat';
import api from '../../utils/api';
import { FaTicketAlt } from 'react-icons/fa';

const TicketDashboard = () => {
    const { user } = useSelector(state => state.auth);
    const [tickets, setTickets] = useState([]);
    const [activeTicketId, setActiveTicketId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/tickets');
            setTickets(res.data.tickets || []);
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000); // Poll for new tickets
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Sidebar Ticket List */}
            <TicketList
                tickets={tickets}
                activeTicket={activeTicketId}
                onSelectTicket={setActiveTicketId}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
                {activeTicketId ? (
                    <TicketChat
                        ticketId={activeTicketId}
                        currentUser={user}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-900">
                        <FaTicketAlt className="text-6xl mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold">Select a Ticket</h3>
                        <p className="max-w-md text-center mt-2 opacity-60">
                            Choose a ticket from the sidebar to view the discussion and manage the request.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketDashboard;
