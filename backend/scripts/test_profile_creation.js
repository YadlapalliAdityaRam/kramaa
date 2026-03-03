const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Profile = require('../models/Profile');

dotenv.config({ path: path.join(__dirname, '../.env') });

const runTest = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Find a random user
        const user = await User.findOne();
        if (!user) {
            console.log('No users found to test with.');
            process.exit(0);
        }
        console.log('Testing with User:', user.username, user._id);

        // Check if profile exists
        let profile = await Profile.findOne({ user: user._id });
        if (profile) {
            console.log('Profile already exists for this user.');
            console.log('Profile:', profile);
            // Optionally delete it to test creation?
            // await Profile.deleteOne({ _id: profile._id });
            // console.log('Profile deleted for testing creation.');
            // profile = null;
        }

        if (!profile) {
            console.log('Creating new profile...');
            profile = new Profile({ user: user._id });
            await profile.save();
            console.log('Profile created successfully:', profile);
        }

        console.log('Test Complete');
        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
};

runTest();
