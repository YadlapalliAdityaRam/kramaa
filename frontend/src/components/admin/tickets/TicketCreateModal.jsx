import React, { useState } from 'react';
import api from "../../../utils/api";
import toast from 'react-hot-toast';
import { FaTimes, FaSpinner } from 'react-icons/fa';

const TicketCreateModal = ({ isOpen, onClose, type, targetId, targetModel, initialTitle }) => {
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) return;

        setLoading(true);
        try {
            await api.post('/tickets', {
                type,
                targetId,
                targetModel,
                title: initialTitle || `${type} Request`,
                description,
                priority,
                metadata: {} // Can be extended to include payload
            });
            toast.success('Ticket created successfully');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Request Review</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                        <div className="text-white bg-gray-800 px-3 py-2 rounded text-sm">{type}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full bg-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-800 text-white px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 h-32 resize-none"
                            placeholder="Describe your request..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading && <FaSpinner className="animate-spin" />}
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TicketCreateModal;
