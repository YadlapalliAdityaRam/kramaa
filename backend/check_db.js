const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Problem = require('./models/Problem');

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        const count = await Problem.countDocuments();
        console.log(`Problem count: ${count}`);
        if (count > 0) {
            const problems = await Problem.find().select('title slug');
            console.log('Problems:', problems);
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
