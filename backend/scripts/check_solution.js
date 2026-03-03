const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const id = '6994618feff66415fa7d3d36';
        const Solution = require('../models/Solution');
        const refSolution = await Solution.findOne({ problemId: id, solutionType: 'REFERENCE' });
        console.log('Ref Solution Found:', !!refSolution);
        if (refSolution) console.log('Language:', refSolution.language);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

check();
