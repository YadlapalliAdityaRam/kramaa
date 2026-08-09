import React from 'react';
import { format } from 'date-fns';

const TicketList = ({ tickets, activeTicket, onSelectTicket }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--sa-card-bg)',
            borderRight: '1px solid var(--sa-border)',
            width: '320px',
            overflowY: 'auto'
        }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--sa-border)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--sa-text)', margin: '0 0 0.5rem 0' }}>Tickets</h2>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        className="sa-input"
                        style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {tickets.length === 0 ? (
                    <div className="sa-empty-text" style={{ padding: '1.5rem', textAlign: 'center' }}>No tickets found</div>
                ) : (
                    tickets.map(ticket => (
                        <div
                            key={ticket._id}
                            onClick={() => onSelectTicket(ticket._id)}
                            style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--sa-border)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: activeTicket === ticket._id ? 'var(--sa-pill-inactive)' : 'transparent',
                                borderLeft: activeTicket === ticket._id ? '4px solid var(--sa-accent)' : '4px solid transparent'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                <span className={`sa-badge ${ticket.priority === 'CRITICAL' ? 'sa-badge-red' :
                                    ticket.priority === 'HIGH' ? 'sa-badge-red' :
                                        ticket.priority === 'MEDIUM' ? 'sa-badge-purple' :
                                            'sa-badge-green'
                                    }`}>
                                    {ticket.priority}
                                </span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--sa-text-muted)' }}>
                                    {format(new Date(ticket.updatedAt || ticket.createdAt), 'MMM d, HH:mm')}
                                </span>
                            </div>

                            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--sa-text)', margin: '0 0 0.4rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {ticket.title}
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="sa-badge sa-badge-blue" style={{ fontSize: '0.7rem' }}>
                                    {ticket.status.replace('_', ' ')}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--sa-text-muted)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
