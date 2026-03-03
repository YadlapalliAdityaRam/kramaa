const Topic = require('../models/Topic');

// Get all topics
exports.getAllTopics = async (req, res) => {
    try {
        const topics = await Topic.find().sort({ name: 1 });
        res.json({ success: true, topics });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Seed Topics (Internal Use)
exports.seedTopics = async (req, res) => {
    const defaultTopics = [
        "Arrays", "Strings", "Recursion", "Backtracking", "Linked List", "Stack", "Queue", "Deque",
        "Hashing", "Sorting", "Searching", "Binary Search", "Two Pointers", "Sliding Window",
        "Prefix Sum", "Subarrays", "Kadane’s Algorithm", "Bit Manipulation", "Mathematics", "Greedy",
        "Divide and Conquer", "Dynamic Programming", "Matrix", "Heap (Priority Queue)", "Binary Tree",
        "Binary Search Tree", "AVL Tree", "Segment Tree", "Fenwick Tree", "Trie", "Graph",
        "Depth First Search", "Breadth First Search", "Topological Sort", "Shortest Path",
        "Minimum Spanning Tree", "Disjoint Set", "Strongly Connected Components", "Network Flow",
        "Game Theory", "Combinatorics", "Number Theory", "Geometry", "Monotonic Stack",
        "Monotonic Queue", "Meet in the Middle", "String Matching", "Rolling Hash", "Suffix Array",
        "Suffix Tree", "Skip List", "Splay Tree"
    ];

    try {
        let created = 0;
        for (const name of defaultTopics) {
            const exists = await Topic.findOne({ name });
            if (!exists) {
                await Topic.create({ name });
                created++;
            }
        }
        res.json({ success: true, message: `Seeded ${created} new topics`, total: defaultTopics.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
