const CONCEPTS = [
    ['Programming Basics', 'beginner', [], 'Variables, conditions, loops, functions, and how programs process input.'],
    ['Arrays', 'beginner', ['Programming Basics'], 'An array stores values in order so you can access an item by its index.'],
    ['Strings', 'beginner', ['Arrays'], 'Strings are sequences of characters; many array techniques apply to them.'],
    ['Hashing', 'beginner', ['Arrays'], 'Hash tables store a key and its value so lookup is usually O(1).'],
    ['Searching', 'beginner', ['Arrays'], 'Searching finds a target by checking candidates, often with linear or binary search.'],
    ['Sorting', 'beginner', ['Arrays'], 'Sorting arranges values and can expose useful order-based patterns.'],
    ['Linked Lists', 'beginner', ['Programming Basics'], 'A linked list connects nodes with pointers instead of contiguous indexes.'],
    ['Stack', 'beginner', ['Arrays'], 'A stack is last-in, first-out: the most recently added item comes out first.'],
    ['Queue', 'beginner', ['Arrays'], 'A queue is first-in, first-out: the earliest item comes out first.'],
    ['Recursion', 'intermediate', ['Programming Basics'], 'Recursion solves a problem by solving smaller versions of itself.'],
    ['Backtracking', 'intermediate', ['Recursion'], 'Backtracking explores choices and undoes a choice when it cannot work.'],
    ['Trees', 'intermediate', ['Recursion'], 'Trees represent hierarchical data; recursive traversal visits their nodes.'],
    ['Heaps', 'intermediate', ['Arrays'], 'A heap keeps the smallest or largest item readily available.'],
    ['Graphs', 'intermediate', ['Arrays', 'Queue'], 'Graphs model relationships using vertices and edges.'],
    ['Greedy Algorithms', 'intermediate', ['Sorting'], 'Greedy methods make the best local choice and rely on a proof it stays optimal.'],
    ['Dynamic Programming', 'intermediate', ['Arrays', 'Recursion'], 'DP stores answers to overlapping subproblems to avoid repeated work.'],
    ['Bit Manipulation', 'intermediate', ['Programming Basics'], 'Bit operations work directly with binary representations of numbers.'],
    ['Basic DSA Mathematics', 'beginner', ['Programming Basics'], 'Useful number theory, counting, modular arithmetic, and bounds.'],
    ['Time Complexity', 'beginner', ['Programming Basics'], 'Time complexity describes how running time grows with input size.'],
    ['Space Complexity', 'beginner', ['Programming Basics'], 'Space complexity describes extra memory used as input grows.'],
    ['Big-O', 'beginner', ['Time Complexity'], 'Big-O gives an upper-growth description such as O(n) or O(log n).']
].map(([name, level, prerequisites, explanation]) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), level, prerequisites, explanation, examples: [], miniLesson: [], practiceQuestion: `Write a small example using ${name}.`, commonMistakes: [], relatedProblems: [] }));

const normalize = (value) => String(value || '').trim().toLowerCase();
const findConcept = (name) => CONCEPTS.find((c) => normalize(c.name) === normalize(name) || c.slug === normalize(name));

module.exports = { CONCEPTS, findConcept, normalize };
