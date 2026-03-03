const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    count: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

TopicSchema.pre('save', function () {
    if (this.isModified('name')) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
});

module.exports = mongoose.model('Topic', TopicSchema);
