const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OpenAI = require('openai');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const testAI = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);

        const isOpenRouter = process.env.OPENAI_API_KEY?.startsWith('sk-or-v1');
        console.log('Is OpenRouter:', isOpenRouter);
        console.log('API Key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
            defaultHeaders: isOpenRouter ? {
                "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:3000",
                "X-Title": "Kramaa"
            } : undefined
        });

        console.log('Calling OpenAI...');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "Recall: Generate a simple JSON object { 'hello': 'world' }" }],
            model: isOpenRouter ? "openai/gpt-3.5-turbo" : "gpt-3.5-turbo", // Use cheaper model for test
            response_format: { type: "json_object" },
        });

        console.log('Response:', completion.choices[0].message.content);

    } catch (e) {
        console.error('AI Error:', e);
    } finally {
        await mongoose.disconnect();
    }
};

testAI();
