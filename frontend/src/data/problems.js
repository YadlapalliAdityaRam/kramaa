export const problems = [
    {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        topic: 'Arrays',
        tags: ['Array', 'Hash Table'],
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
        description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
        examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
            { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
        ],
        templates: {
            javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your code here\n    \n};`,
            python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # Write your code here\n        pass`,
            java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};`
        },
        testCases: [
            { input: [[2, 7, 11, 15], 9], expected: [0, 1] }, // Logical check required (order doesn't matter)
            { input: [[3, 2, 4], 6], expected: [1, 2] },
            { input: [[3, 3], 6], expected: [0, 1] }
        ]
    },
    {
        id: 'reverse-string',
        title: 'Reverse String',
        difficulty: 'Easy',
        topic: 'Strings',
        tags: ['Two Pointers', 'String'],
        constraints: '1 <= s.length <= 10^5\ns[i] is a printable ascii character.',
        description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.`,
        examples: [
            { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
            { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' }
        ],
        templates: {
            javascript: `/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nvar reverseString = function(s) {\n    // Write your code here\n    \n};`,
            python: `class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        """\n        Do not return anything, modify s in-place instead.\n        """\n        pass`,
            java: `class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n        \n    }\n};`
        },
        testCases: [
            { input: [['h', 'e', 'l', 'l', 'o']], expected: ['o', 'l', 'l', 'e', 'h'] },
            { input: [['H', 'a', 'n', 'n', 'a', 'h']], expected: ['h', 'a', 'n', 'n', 'a', 'H'] }
        ]
    },
    {
        id: 'climbing-stairs',
        title: 'Climbing Stairs',
        difficulty: 'Easy',
        topic: 'DP',
        tags: ['Dynamic Programming', 'Math', 'Memoization'],
        constraints: '1 <= n <= 45',
        description: `You are climbing a staircase. It takes \`n\` steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?`,
        examples: [
            { input: 'n = 2', output: '2' },
            { input: 'n = 3', output: '3' }
        ],
        templates: {
            javascript: `/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    // Write your code here\n    \n};`,
            python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your code here\n        pass`,
            java: `class Solution {\n    public int climbStairs(int n) {\n        // Write your code here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your code here\n        \n    }\n};`
        },
        testCases: [
            { input: [2], expected: 2 },
            { input: [3], expected: 3 },
            { input: [5], expected: 8 }
        ]
    },
    {
        id: 'contains-duplicate',
        title: 'Contains Duplicate',
        difficulty: 'Easy',
        topic: 'Arrays',
        tags: ['Array', 'Hash Table', 'Sorting'],
        constraints: '1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9',
        description: `Given an integer array \`nums\`, return true if any value appears at least twice in the array, and return false if every element is distinct.`,
        examples: [
            { input: 'nums = [1,2,3,1]', output: 'true' },
            { input: 'nums = [1,2,3,4]', output: 'false' }
        ],
        templates: {
            javascript: `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    // Write your code here\n    \n};`,
            python: `class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        # Write your code here\n        pass`,
            java: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your code here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        // Write your code here\n        \n    }\n};`
        },
        testCases: [
            { input: [[1, 2, 3, 1]], expected: true },
            { input: [[1, 2, 3, 4]], expected: false },
            { input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true }
        ]
    },
    {
        id: 'fibonacci-number',
        title: 'Fibonacci Number',
        difficulty: 'Easy',
        topic: 'DP',
        tags: ['Math', 'Dynamic Programming', 'Recursion'],
        constraints: '0 <= n <= 30',
        description: `The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1.`,
        examples: [
            { input: 'n = 2', output: '1' },
            { input: 'n = 3', output: '2' }
        ],
        templates: {
            javascript: `/**\n * @param {number} n\n * @return {number}\n */\nvar fib = function(n) {\n    // Write your code here\n    \n};`,
            python: `class Solution:\n    def fib(self, n: int) -> int:\n        # Write your code here\n        pass`,
            java: `class Solution {\n    public int fib(int n) {\n        // Write your code here\n        \n    }\n}`,
            cpp: `class Solution {\npublic:\n    int fib(int n) {\n        // Write your code here\n        \n    }\n};`
        },
        testCases: [
            { input: [2], expected: 1 },
            { input: [3], expected: 2 },
            { input: [4], expected: 3 }
        ]
    }
];
