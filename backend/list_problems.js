const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Problem = require('./models/Problem');

dotenv.config();

const listProblems = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const problems = await Problem.find({}, 'title slug');
        console.log('Available Problems:');
        problems.forEach(p => console.log(`- ${p.title} (Slug: ${p.slug})`));
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listProblems();
