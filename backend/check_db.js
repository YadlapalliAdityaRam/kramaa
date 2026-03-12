const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Problem = require('./models/Problem');
const User = require('./models/User');

dotenv.config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');
        
        const problemCount = await Problem.countDocuments();
        console.log(`Problem count: ${problemCount}`);

        const users = await User.find().select('username email role accountStatus createdAt').lean();
        console.log('Total users:', users.length);
        users.forEach(u => {
            console.log(`User: ${u.username} | Email: ${u.email} | Role: ${u.role} | Status: ${u.accountStatus} | Created: ${u.createdAt}`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
