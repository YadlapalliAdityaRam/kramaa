const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Problem = require('../models/Problem');

// Load env vars
dotenv.config({ path: './.env' });

const problems = [
    {
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nInput Format:\nLine 1: n (size of array)\nLine 2: n space-separated integers\nLine 3: target integer\n\nOutput Format:\nTwo space-separated indices',
        difficulty: 'Easy',
        topic: 'Arrays',
        tags: ['Array', 'Hash Table'],
        companies: ['Google', 'Amazon', 'Meta'],
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '0 1', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
            { input: 'nums = [3,2,4], target = 6', output: '1 2', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' }
        ],
        testCases: [
            { input: '4\n2 7 11 15\n9', output: '0 1', isHidden: false },
            { input: '3\n3 2 4\n6', output: '1 2', isHidden: false },
            { input: '4\n3 3 4 5\n6', output: '0 1', isHidden: true }
        ],
        starterCode: {
            javascript: `/**
 * @param {string} input
 * @return {string}
 */
function twoSum(input) {
    // Input Format:
    // Line 1: n (size)
    // Line 2: n space-separated integers
    // Line 3: target
    
    const lines = input.trim().split('\\n');
    const n = parseInt(lines[0]);
    const nums = lines[1].trim().split(/\s+/).map(Number);
    const target = parseInt(lines[2]);
    
    // Write your code here
    
    return ""; // Return space-separated indices: "i j"
}`,
            python: `def twoSum(input_data):
    # Input Format:
    # Line 1: n (size)
    # Line 2: n space-separated integers
    # Line 3: target
    
    lines = input_data.strip().split('\\n')
    n = int(lines[0])
    nums = list(map(int, lines[1].strip().split()))
    target = int(lines[2])
    
    # Write your code here
    
    return "" # Return space-separated indices: "i j"`,
            java: `import java.util.*;

class Solution {
    public String twoSum(String input) {
        // Input Format:
        // Line 1: n
        // Line 2: nums
        // Line 3: target
        
        String[] lines = input.trim().split("\\n");
        int n = Integer.parseInt(lines[0]);
        String[] numStrs = lines[1].trim().split("\\s+");
        int[] nums = new int[n];
        for(int i=0; i<n; i++) nums[i] = Integer.parseInt(numStrs[i]);
        int target = Integer.parseInt(lines[2]);
        
        // Write your code here
        
        return ""; // Return "i j"
    }
}`,
            cpp: `class Solution {
public:
    string twoSum(string input) {
        stringstream ss(input);
        int n, target;
        ss >> n;
        vector<int> nums(n);
        for(int i=0; i<n; i++) ss >> nums[i];
        ss >> target;
        
        // Write your code here
        
        return ""; // Return "i j"
    }
};`,
            c: `char* twoSum(char* input) {
    // Parse input...
    
    // Write logic...
    
    return ""; // Return "i j" (dynamically allocated or static buffer)
}`
        },
        functionName: 'twoSum',
        xpReward: 20,
        order: 1,
        hints: [
            "A brute force approach would be to iterate through the array with two nested loops.",
            "Can you do it in one pass using a hash map?"
        ]
    },
    {
        title: 'Reverse String',
        slug: 'reverse-string',
        description: 'Write a program that reverses a string.\n\nInput Format:\nLine 1: n (number of characters)\nLine 2: n space-separated characters\n\nOutput Format:\nThe reversed characters, space-separated',
        difficulty: 'Easy',
        topic: 'Strings',
        tags: ['Two Pointers', 'String'],
        companies: ['Apple', 'Microsoft'],
        constraints: '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
        examples: [
            { input: '5\nh e l l o', output: 'o l l e h', explanation: '' }
        ],
        testCases: [
            { input: '5\nh e l l o', output: 'o l l e h', isHidden: false },
            { input: '6\nH a n n a h', output: 'h a n n a H', isHidden: true }
        ],
        starterCode: {
            javascript: `/**
 * @param {string} input
 * @return {string}
 */
function reverseString(input) {
    const lines = input.trim().split('\\n');
    // const n = parseInt(lines[0]);
    // const s = lines[1].split(' ');
    
    return "";
}`,
            python: `def reverseString(input_data):
    lines = input_data.strip().split('\\n')
    # n = int(lines[0])
    # chars = lines[1].split()
    
    return ""`,
            java: `class Solution {
    public String reverseString(String input) {
        String[] lines = input.trim().split("\\n");
        
        return "";
    }
}`,
            cpp: `class Solution {
public:
    string reverseString(string input) {
        stringstream ss(input);
        int n;
        ss >> n;
        
        return "";
    }
};`,
            c: `char* reverseString(char* input) {
    return "";
}`
        },
        functionName: 'reverseString',
        xpReward: 15,
        order: 2,
        hints: [
            "Think about using two pointers, one at the start and one at the end."
        ]
    },
    {
        title: 'Valid Parentheses',
        slug: 'valid-parentheses',
        description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\n\nInput Format:\nLine 1: The string s\n\nOutput Format:\ntrue or false',
        difficulty: 'Easy',
        topic: 'Stack',
        tags: ['Stack', 'String'],
        companies: ['Facebook', 'Google', 'Amazon'],
        constraints: '1 <= s.length <= 10^4\ns consists of parentheses only "()[]{}"',
        examples: [
            { input: '()', output: 'true', explanation: '' },
            { input: '()[]{}', output: 'true', explanation: '' },
            { input: '(]', output: 'false', explanation: '' }
        ],
        testCases: [
            { input: '()', output: 'true', isHidden: false },
            { input: '()[]{}', output: 'true', isHidden: false },
            { input: '(]', output: 'false', isHidden: false },
            { input: '([)]', output: 'false', isHidden: true },
            { input: '{[]}', output: 'true', isHidden: true }
        ],
        starterCode: {
            javascript: `function isValid(input) {
    const s = input.trim();
    return ""; // "true" or "false"
}`,
            python: `def isValid(input_data):
    s = input_data.strip()
    return ""`,
            java: `class Solution {
    public String isValid(String input) {
        String s = input.trim();
        return "";
    }
}`,
            cpp: `class Solution {
public:
    string isValid(string input) {
        string s = input;
        // Trim if needed
        return "";
    }
};`,
            c: `char* isValid(char* input) {
    return "";
}`
        },
        functionName: 'isValid',
        xpReward: 30,
        order: 3,
        hints: [
            "Use a stack."
        ]
    },
    {
        title: 'Best Time to Buy and Sell Stock',
        slug: 'best-time-to-buy-and-sell-stock',
        description: 'Maximize profit by choosing a single day to buy and a different day in the future to sell.\n\nInput:\nLine 1: n\nLine 2: prices\n\nOutput:\nMax profit',
        difficulty: 'Easy',
        topic: 'Arrays',
        tags: ['Array', 'Dynamic Programming'],
        companies: [],
        constraints: '',
        examples: [],
        testCases: [
            { input: '6\n7 1 5 3 6 4', output: '5', isHidden: false }
        ],
        starterCode: {
            javascript: `function maxProfit(input) {
    const lines = input.trim().split('\\n');
    const prices = lines[1].split(' ').map(Number);
    return "";
}`,
            python: `def maxProfit(input_data):
    lines = input_data.strip().split('\\n')
    prices = list(map(int, lines[1].split()))
    return ""`,
            java: `class Solution {
    public String maxProfit(String input) {
        String[] lines = input.trim().split("\\n");
        return "";
    }
}`,
            cpp: `class Solution {
public:
    string maxProfit(string input) {
        return "";
    }
};`,
            c: `char* maxProfit(char* input) { 
    return ""; 
}`
        },
        functionName: 'maxProfit',
        xpReward: 35,
        order: 4,
        hints: []
    },
    {
        title: 'Climbing Stairs',
        slug: 'climbing-stairs',
        description: 'Count ways to climb n stairs taking 1 or 2 steps.\n\nInput:\nn\n\nOutput:\nways',
        difficulty: 'Easy',
        topic: 'DP',
        tags: [],
        companies: [],
        constraints: '',
        examples: [],
        testCases: [
            { input: '2', output: '2', isHidden: false },
            { input: '3', output: '3', isHidden: false }
        ],
        starterCode: {
            javascript: `function climbStairs(input) {
    const n = parseInt(input.trim());
    return "";
}`,
            python: `def climbStairs(input_data):
    n = int(input_data.strip())
    return ""`,
            java: `class Solution {
    public String climbStairs(String input) {
        int n = Integer.parseInt(input.trim());
        return "";
    }
}`,
            cpp: `class Solution {
public:
    string climbStairs(string input) {
        int n = stoi(input);
        return "";
    }
};`,
            c: `char* climbStairs(char* input) { 
    return ""; 
}`
        },
        functionName: 'climbStairs',
        xpReward: 30,
        order: 5,
        hints: []
    }
];

const User = require('../models/User');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const admin = await User.findOne({ role: 'ADMIN' }) || await User.findOne({});
        if (!admin) {
            console.error('No user found to assign as creator. Please seed users first.');
            process.exit(1);
        }

        const problemsWithUser = problems.map(p => {
            const sampleTestCases = p.testCases.filter(tc => !tc.isHidden);
            const hiddenTestCases = p.testCases.filter(tc => tc.isHidden);

            // Remove the original testCases array to avoid confusion (though mongoose drops it)
            const { testCases, ...problemData } = p;

            return {
                ...problemData,
                createdBy: admin._id,
                isPublished: true,
                sampleTestCases,
                hiddenTestCases
            };
        });

        await Problem.deleteMany({});
        await Problem.insertMany(problemsWithUser);
        console.log('Problems Seeded');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
