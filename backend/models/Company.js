const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Product-Based', 'Service-Based']
    },
    skills: [{
        type: String,
        trim: true
    }],
    process: [{
        type: String,
        trim: true
    }],
    focusAreas: [{
        name: {
            type: String,
            required: true
        },
        topic: {
            type: String,
            required: true
        }
    }],
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
