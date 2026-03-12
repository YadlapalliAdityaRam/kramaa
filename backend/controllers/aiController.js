const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const codeExecutor = require('../services/codeExecutor');

// Initialize OpenAI
const isOpenRouter = process.env.OPENAI_API_KEY?.startsWith('sk-or-v1');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
    defaultHeaders: isOpenRouter ? {
        "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:3000",
        "X-Title": "Kramaa"
    } : undefined
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateTestCases = async (req, res) => {
    try {
        const { id: problemId } = req.params;
        const config = req.body;

        const problem = await Problem.findById(problemId);
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });

        const solutions = await Solution.find({ problemId });
        const refSolution = solutions.find(s => s.solutionType === 'REFERENCE');
        if (!refSolution) return res.status(400).json({ success: false, message: 'Reference solution required.' });

        const {
            numEdgeCases = 2,
            numRandomCases = 3,
            numHiddenCases = 2,
            numPerformanceCases = 1,
            includeMaxConstraints = true,
            includeMinConstraints = true
        } = config;

        // Construct Prompt
        const prompt = `
You are an expert competitive programming problem setter.
Your task is to generate strong/adversarial test cases for:

## PROBLEM
Title: ${problem.title}
Desc: ${problem.description}
Constraints: ${problem.constraints}
Input Format: ${problem.inputFormat || 'Inferred'}
Output Format: ${problem.outputFormat || 'Inferred'}
Time Limit (approx): ${problem.timeLimit < 1000 ? 'O(n) or O(n log n)' : 'Inferred'}

## CONFIGURATION
Total Cases Needed: ${config.numRandomCases + config.numEdgeCases + config.numHiddenCases + config.numPerformanceCases}
- Edge: ${config.numEdgeCases}
- Random: ${config.numRandomCases}
- Hidden: ${config.numHiddenCases}
- Performance: ${config.numPerformanceCases}
- Max Constraints: ${config.includeMaxConstraints}

## INSTRUCTIONS
Generate diverse cases: min/max boundaries, single elements, increasing/decreasing, adversarial patterns, integer overflow, etc.

## OUTPUT FORMAT
Return ONLY a valid JSON ARRAY. No markdown.
[{
  "type": "edge" | "random" | "performance" | "hidden",
  "input": "FULL INPUT STRING (multiline supported)",
  "explanation": "Brief description"
}]
`;

        let rawContent = '';
        let generatedCases = [];

        // STRATEGY: Cascading Fallback (Gemini Models -> OpenAI)
        const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-pro-latest"];
        let success = false;

        console.log('Starting AI generation sequence...');

        // 1. Try Gemini Models in order
        for (const modelName of GEMINI_MODELS) {
            try {
                console.log(`Attempting generation with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();

                // Cleanup Gemini markdown
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                rawContent = text;
                success = true;
                break; // Exit loop on success
            } catch (error) {
                console.warn(`${modelName} failed:`, error.message);
                if (error.message.includes('429')) {
                    console.log('Rate limit hit, switching to next model...');
                }
            }
        }

        // 2. Fallback to OpenAI if all Gemini models fail
        if (!success) {
            console.log('All Gemini models failed. Falling back to OpenAI...');
            try {
                const completion = await openai.chat.completions.create({
                    messages: [{ role: "system", content: prompt }],
                    model: isOpenRouter ? "openai/gpt-3.5-turbo" : "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                });
                rawContent = completion.choices[0].message.content;
            } catch (openaiError) {
                throw new Error(`Critical AI Failure: All Gemini models and OpenAI failed. Last error: ${openaiError.message}`);
            }
        }

        // Parse JSON with robust extraction
        try {
            // Find the JSON array in the content using regex
            const jsonMatch = rawContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
            const jsonString = jsonMatch ? jsonMatch[0] : rawContent;

            const parsed = JSON.parse(jsonString);

            if (Array.isArray(parsed)) generatedCases = parsed;
            else if (parsed.testCases) generatedCases = parsed.testCases;
            else if (parsed.cases) generatedCases = parsed.cases;
            else throw new Error('Parsed JSON is not an array');
        } catch (e) {
            console.error('JSON Parse Error:', e.message);
            console.error('Raw Content:', rawContent);
            return res.status(500).json({
                success: false,
                message: 'AI generated invalid JSON format.',
                debug: rawContent.substring(0, 500) // Send partial content for debugging
            });
        }

        // Validate Validation
        const results = [];
        for (const tc of generatedCases) {
            try {
                // Determine execution mode (Driver vs Script) dynamically per case if needed, 
                // but usually strictly following Ref Solution logic is enough.
                // We'll trust the validationWorker's robust logic, but here we do a quick check.

                const execResult = await codeExecutor.executeCode(
                    refSolution.sourceCode,
                    refSolution.language,
                    tc.input,
                    problem.timeLimit,
                    {
                        className: problem.className,
                        functionName: problem.functionName,
                        parameters: problem.parameters,
                        returnType: problem.returnType
                    } // Try driver mode first
                );

                // Simple fallback retry for this check (similar to worker)
                let finalOutput = execResult.stdout.trim();
                let status = execResult.status;
                let error = execResult.stderr;

                if (status !== 'accepted' && (error.includes('not found') || error.includes('NoSuchMethodError'))) {
                    const retry = await codeExecutor.executeCode(
                        refSolution.sourceCode,
                        refSolution.language,
                        tc.input,
                        problem.timeLimit,
                        { mode: 'script' }
                    );
                    finalOutput = retry.stdout.trim();
                    status = retry.status;
                    error = retry.stderr;
                }

                if (status === 'accepted') {
                    results.push({ ...tc, expectedOutput: finalOutput, status: 'PASS', isValid: true });
                } else {
                    results.push({ ...tc, status: 'FAIL', error: error || status, isValid: false });
                }
            } catch (err) {
                results.push({ ...tc, status: 'ERROR', error: err.message, isValid: false });
            }
        }

        res.json({ success: true, testCases: results });

    } catch (error) {
        console.error('AI Gen Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
