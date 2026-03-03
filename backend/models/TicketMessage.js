const mongoose = require('mongoose');

const TicketMessageSchema = new mongoose.Schema({
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Null for system messages? Or use specific ID. Better to make it optional for system.
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['USER', 'SYSTEM', 'DECISION'],
        default: 'USER'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

TicketMessageSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('TicketMessage', TicketMessageSchema);
