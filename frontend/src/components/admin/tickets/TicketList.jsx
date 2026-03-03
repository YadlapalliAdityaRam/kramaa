import React from 'react';
import { format } from 'date-fns';

const TicketList = ({ tickets, activeTicket, onSelectTicket }) => {
    return (
        <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700 w-80 overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Tickets</h2>
                <div className="mt-2 relative">
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {tickets.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No tickets found</div>
                ) : (
                    tickets.map(ticket => (
                        <div
                            key={ticket._id}
                            onClick={() => onSelectTicket(ticket._id)}
                            className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${activeTicket === ticket._id ? 'bg-gray-800 border-l-4 border-l-purple-500' : 'border-l-4 border-l-transparent'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                                        ticket.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                                            ticket.priority === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-500' :
                                                'bg-green-500/20 text-green-500'
                                    }`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(ticket.updatedAt || ticket.createdAt), 'MMM d, HH:mm')}
                                </span>
                            </div>

                            <h3 className="text-sm font-semibold text-white mb-1 truncate">{ticket.title}</h3>
                            <div className="flex justify-between items-center">
                                <span className={`text-xs px-2 py-0.5 rounded border ${ticket.status === 'OPEN' ? 'border-blue-500 text-blue-500' :
                                        ticket.status === 'UNDER_REVIEW' ? 'border-yellow-500 text-yellow-500' :
                                            ticket.status === 'APPROVED' ? 'border-green-500 text-green-500' :
                                                ticket.status === 'REJECTED' ? 'border-red-500 text-red-500' :
                                                    ticket.status === 'EXECUTED' ? 'border-purple-500 text-purple-500' :
                                                        'border-gray-500 text-gray-500'
                                    }`}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-gray-500 truncate max-w-[80px]">
                                    {ticket.createdBy?.username}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TicketList;
