const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run() {
    // For text-only input, use the gemini-pro model
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello?");
        console.log("gemini-pro response:", result.response.text());
    } catch (e) {
        console.log("gemini-pro failed:", e.message);
    }
}

run();
