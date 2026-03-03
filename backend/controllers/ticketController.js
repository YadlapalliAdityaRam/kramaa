const Ticket = require('../models/Ticket');
const TicketMessage = require('../models/TicketMessage');
const TicketDecision = require('../models/TicketDecision');
const Contest = require('../models/Contest');
const actionExecutor = require('../utils/actionExecutor');
const mongoose = require('mongoose');
const { emitContestPublished } = require('../services/contestAnnouncementService');

// Create a new Ticket
exports.createTicket = async (req, res) => {
    try {
        const { type, targetId, targetModel, title, description, priority, metadata } = req.body;

        const ticket = await Ticket.create({
            createdBy: req.user._id,
            type,
            targetId,
            targetModel,
            title,
            description,
            priority,
            metadata
        });

        // Auto-create first message from description? Or explicit message?
        // User requirement: "When Admin sends first message -> system creates ticket automatically"
        // But normally API creates ticket. Let's create an initial system message or user message.
        await TicketMessage.create({
            ticket: ticket._id,
            sender: req.user._id,
            message: description, // First message is the description
            type: 'USER'
        });

        res.status(201).json({ success: true, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all tickets (with filters)
exports.getTickets = async (req, res) => {
    try {
        const { status, type, priority } = req.query;
        const query = {};

        if (status) query.status = status;
        if (type) query.type = type;
        if (priority) query.priority = priority;

        // If simple Admin, maybe only show their tickets?
        // User Requirement: "Admin... Views ticket status". 
        // Usually Admins see all tickets or their own. Let's show all for "Moderation Team".
        // Or restrict to createdBy?
        // Let's assume Admins can see all relevant tickets or just theirs. 
        // For now, allow all, but maybe filter by createdBy if query param exists.

        const tickets = await Ticket.find(query)
            .populate('createdBy', 'username email')
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 });

        res.json({ success: true, tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single ticket details with messages
exports.getTicketDetails = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('createdBy', 'username email role')
            .populate('assignedTo', 'username email role');

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        const messages = await TicketMessage.find({ ticket: req.params.id })
            .populate('sender', 'username role')
            .sort({ createdAt: 1 });

        const decision = await TicketDecision.findOne({ ticket: req.params.id })
            .populate('decidedBy', 'username');

        res.json({ success: true, ticket, messages, decision });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Send a message (Chat)
exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const ticketId = req.params.id;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        if (ticket.status === 'CLOSED' || ticket.status === 'EXECUTED') {
            return res.status(400).json({ success: false, message: 'Cannot reply to closed ticket' });
        }

        const newMessage = await TicketMessage.create({
            ticket: ticketId,
            sender: req.user._id,
            message,
            type: 'USER'
        });

        // Workflow: "Ticket automatically moves to UNDER_REVIEW when SuperAdmin replies"
        if (req.user.role === 'SUPER_ADMIN' && ticket.status === 'OPEN') {
            ticket.status = 'UNDER_REVIEW';
            ticket.assignedTo = req.user._id;
            await ticket.save();

            // Initial System Message for status change
            await TicketMessage.create({
                ticket: ticketId,
                message: `Super Admin ${req.user.username} started reviewing this ticket.`,
                type: 'SYSTEM'
            });
        }

        // Socket.io emission (optional, if I add io later)
        const io = req.app.get('io');
        if (io) {
            io.emit(`ticket_${ticketId}`, newMessage);
        }

        res.json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Make Decision (Approve/Reject)
exports.makeDecision = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { decision, remark } = req.body; // 'APPROVED' / 'REJECTED'
        const ticketId = req.params.id;

        // Verify Super Admin
        if (req.user.role !== 'SUPER_ADMIN') {
            throw new Error('Only Super Admin can make decisions');
        }

        const ticket = await Ticket.findById(ticketId).session(session);
        if (!ticket) throw new Error('Ticket not found');

        if (['APPROVED', 'REJECTED', 'EXECUTED', 'CLOSED'].includes(ticket.status)) {
            throw new Error('Ticket is already resolved');
        }

        // Record Decision
        await TicketDecision.create([{
            ticket: ticketId,
            decision,
            decidedBy: req.user._id,
            remark
        }], { session });

        // Update Ticket Status
        ticket.status = decision;
        ticket.closedAt = new Date();

        // Add Chat Log
        await TicketMessage.create([{
            ticket: ticketId,
            sender: req.user._id,
            message: `Ticket ${decision}. Remark: ${remark || 'None'}`,
            type: 'DECISION'
        }], { session });

        // Execute Action if Approved
        let executionResult = null;
        if (decision === 'APPROVED') {
            if (actionExecutor[ticket.type]) {
                executionResult = await actionExecutor[ticket.type](ticket, session);
                ticket.status = 'EXECUTED';

                await TicketMessage.create([{
                    ticket: ticketId, // system message
                    message: `System Execution: ${executionResult}`,
                    type: 'SYSTEM'
                }], { session });
            } else {
                // No automated action execution defined
                await TicketMessage.create([{
                    ticket: ticketId,
                    message: `System: No automated action defined for type ${ticket.type}. Manual execution required.`,
                    type: 'SYSTEM'
                }], { session });
            }
        }

        await ticket.save({ session });
        await session.commitTransaction();
        session.endSession();

        if (decision === 'APPROVED' && ticket.type === 'ADD_CONTEST') {
            try {
                const publishedContest = await Contest.findById(ticket.targetId);
                if (publishedContest && publishedContest.isPublished && publishedContest.approvalStatus === 'APPROVED') {
                    const io = req.app.get('io');
                    emitContestPublished(io, publishedContest);
                }
            } catch (emitError) {
                console.error('Failed to emit contest_published from ticket workflow:', emitError.message);
            }
        }

        res.json({ success: true, message: `Ticket ${decision}` });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};
