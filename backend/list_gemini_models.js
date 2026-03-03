const axios = require('axios');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await axios.get(url);
        console.log("Available Models:");
        response.data.models.forEach(m => console.log(`- ${m.name}`));
    } catch (error) {
        console.error("Error listing models:", error.response ? error.response.data : error.message);
    }
}

listModels();
