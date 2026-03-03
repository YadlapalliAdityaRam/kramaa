const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Super Admin assigned
    },
    type: {
        type: String,
        enum: ['ADD_PROBLEM', 'EDIT_PROBLEM', 'DELETE_PROBLEM', 'ADD_CONTEST', 'EDIT_CONTEST', 'BAN_USER', 'RESTORE_USER', 'CHANGE_DIFFICULTY', 'UPDATE_TESTCASES'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId, // Generic ID reference
        required: true
    },
    targetModel: {
        type: String, // 'Problem', 'User' etc. for dynamic population
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXECUTED', 'CLOSED'],
        default: 'OPEN'
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // Stores payload for execution (e.g. update data)
        default: {}
    },
    closedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for efficient querying
TicketSchema.index({ status: 1, createdBy: 1 });
TicketSchema.index({ type: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
