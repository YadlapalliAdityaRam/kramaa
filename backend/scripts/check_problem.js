const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Loading Problem model...');
try {
    const Problem = require('../models/Problem');
    console.log('Problem model loaded.');
} catch (e) {
    console.error('Failed to load Problem model:', e);
    process.exit(1);
}

const check = async () => {
    try {
        console.log('Connecting to DB...', process.env.MONGODB_URI ? 'URI Set' : 'URI Missing');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB Connected');

        console.log('OpenAI Key Present:', !!process.env.OPENAI_API_KEY);

        const id = '6994618feff66415fa7d3d36'; // The ID from user report
        if (mongoose.Types.ObjectId.isValid(id)) {
            // Note: user ID might be hex string, need to cast? findById does it auto.
            const problem = await mongoose.model('Problem').findById(id);
            console.log('Problem Found:', !!problem);
            if (problem) console.log('Title:', problem.title);
        } else {
            console.log('Invalid ID format');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

check();
