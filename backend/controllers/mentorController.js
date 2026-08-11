const Problem = require('../models/Problem');
const MentorProgress = require('../models/MentorProgress');
const { CONCEPTS, findConcept, normalize } = require('../services/mentorContent');

const problemPayload = (problem) => ({
    id: problem._id, title: problem.title, difficulty: problem.difficulty,
    concepts: [...new Set([...(problem.topics || []), ...(problem.tags || [])])].slice(0, 8),
    description: problem.description, constraints: problem.constraints, examples: problem.examples || [],
    hints: problem.hints || [], approach: problem.editorial?.approaches?.[0] || null
});

exports.getConcepts = (_req, res) => res.json({ success: true, concepts: CONCEPTS });
exports.getConcept = (req, res) => {
    const concept = findConcept(req.params.slug);
    if (!concept) return res.status(404).json({ success: false, message: 'Concept not found' });
    return res.json({ success: true, concept });
};

exports.respond = async (req, res) => {
    const { problemId, intent = 'understand', question = '', code = '', error = '', hintLevel = 0 } = req.body || {};
    const problem = problemId ? await Problem.findById(problemId).select('+editorial') : null;
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
    const data = problemPayload(problem);
    const level = Math.min(Number(hintLevel) || 0, Math.max((data.hints.length - 1), 0));
    let response;
    if (intent === 'hint' && data.hints.length) response = { source: 'stored', text: data.hints[level] || data.hints[data.hints.length - 1], hintLevel: level + 1 };
    else if (intent === 'approach' && data.approach) response = { source: 'stored', text: data.approach.description, complexity: { time: data.approach.timeComplexity, space: data.approach.spaceComplexity } };
    else if (intent === 'understand') response = { source: 'stored', text: `Let's break down ${data.title}.\n\n${data.description}`, concepts: data.concepts, examples: data.examples, constraints: data.constraints };
    else response = { source: 'template', text: `Start by identifying the input and output, then look for the pattern suggested by: ${data.concepts.join(', ') || 'the problem statement'}. Try a simple approach first and analyze its complexity.` };
    if (intent === 'hint') await MentorProgress.findOneAndUpdate({ user: req.user.id }, { $inc: { hintsUsed: 1 }, $addToSet: { practicedConcepts: { $each: data.concepts } } }, { upsert: true });
    return res.json({ success: true, response, problem: { id: data.id, title: data.title, concepts: data.concepts } });
};
