const mongoose = require('mongoose');

const TicketDecisionSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        unique: true // One decision per ticket (final decision)
    },
    decision: {
        type: String,
        enum: ['APPROVED', 'REJECTED'],
        required: true
    },
    decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    remark: {
        type: String,
        trim: true
    },
    decidedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('TicketDecision', TicketDecisionSchema);
