const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Doubt = require('./models/Doubt');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads/doubts');

async function fixMissingImages() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const threads = await Doubt.find({ imageUrl: { $exists: true, $ne: null } }).select('_id title imageUrl');
    console.log(`Found ${threads.length} threads with imageUrl`);

    for (const thread of threads) {
        const rawUrl = String(thread.imageUrl || '');
        // Extract the filename from the URL (handle both /uploads/doubts/file.png and http://host/uploads/doubts/file.png)
        const filename = rawUrl.split('/').pop().split('?')[0];
        const filePath = path.join(UPLOADS_DIR, filename);
        const exists = fs.existsSync(filePath);
        console.log(`[${exists ? 'OK    ' : 'MISSING'}] "${thread.title}" -> ${filename}`);

        if (!exists) {
            await Doubt.updateOne({ _id: thread._id }, { $unset: { imageUrl: 1 } });
            console.log(`  -> Cleared imageUrl for thread "${thread.title}" (file not found on disk)`);
        }
    }

    await mongoose.disconnect();
    console.log('\nDone! All missing image references cleaned from DB.');
}

fixMissingImages().catch(err => {
    console.error(err);
    process.exit(1);
});
