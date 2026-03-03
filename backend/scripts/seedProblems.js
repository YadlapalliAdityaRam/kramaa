const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Problem = require('../models/Problem');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const sampleProblems = [
    {
        title: "Two Sum",
        slug: "two-sum",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.",
        difficulty: "Easy",
        topic: "Arrays",
        tags: ["Array", "Hash Table"],
        companies: ["Google", "Amazon", "Facebook"],
        constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
        functionName: "twoSum",
        parameters: [
            { name: "nums", type: "integer[]" },
            { name: "target", type: "integer" }
        ],
        returnType: "integer[]",
        sampleTestCases: [
            { input: "[2,7,11,15]\n9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
            { input: "[3,2,4]\n6", output: "[1,2]", explanation: "nums[1] + nums[2] == 6." },
            { input: "[3,3]\n6", output: "[0,1]", explanation: "" }
        ],
        hiddenTestCases: [
            { input: "[1, 2, 3, 4, 5]\n9", output: "[3, 4]", isHidden: true },
            { input: "[10, 20, 30, 40, 50]\n90", output: "[3, 4]", isHidden: true }
        ],
        starterCode: {
            javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};",
            python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
            c: "/**\n * Note: The returned array must be malloced, assume caller calls free().\n */\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    \n}"
        },
        order: 1
    },
    {
        title: "Reverse Linked List",
        slug: "reverse-linked-list",
        description: "Given the `head` of a singly linked list, reverse the list, and return *the reversed list*.",
        difficulty: "Easy",
        topic: "Linked List",
        tags: ["Linked List", "Recursion"],
        companies: ["Amazon", "Microsoft"],
        constraints: "The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000",
        functionName: "reverseList",
        parameters: [
            { name: "head", type: "ListNode" }
        ],
        returnType: "ListNode",
        sampleTestCases: [
            { input: "[1,2,3,4,5]", output: "[5,4,3,2,1]", explanation: "" },
            { input: "[1,2]", output: "[2,1]", explanation: "" },
            { input: "[]", output: "[]", explanation: "" }
        ],
        hiddenTestCases: [
            { input: "[1]", output: "[1]", isHidden: true }
        ],
        starterCode: {
            javascript: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};",
            python: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ",
            java: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
            cpp: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
            c: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     struct ListNode *next;\n * };\n */\nstruct ListNode* reverseList(struct ListNode* head) {\n    \n}"
        },
        order: 2
    },
    {
        title: "Valid Parentheses",
        slug: "valid-parentheses",
        description: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
        difficulty: "Easy",
        topic: "Stack",
        tags: ["String", "Stack"],
        companies: ["Facebook", "Amazon", "Google"],
        constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
        functionName: "isValid",
        parameters: [
            { name: "s", type: "string" }
        ],
        returnType: "boolean",
        sampleTestCases: [
            { input: "\"()\"", output: "true", explanation: "" },
            { input: "\"()[]{}\"", output: "true", explanation: "" },
            { input: "\"(]\"", output: "false", explanation: "" }
        ],
        hiddenTestCases: [
            { input: "\"([)]\"", output: "false", isHidden: true },
            { input: "\"{[]}\"", output: "true", isHidden: true }
        ],
        starterCode: {
            javascript: "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};",
            python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        ",
            java: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
            c: "bool isValid(char* s) {\n    \n}"
        },
        order: 3
    },
    {
        title: "Maximum Subarray",
        slug: "maximum-subarray",
        description: "Given an integer array `nums`, find the subarray which has the largest sum and return *its sum*.",
        difficulty: "Medium",
        topic: "Dynamic Programming",
        tags: ["Array", "Divide and Conquer", "DP"],
        companies: ["LinkedIn", "Apple", "Microsoft"],
        constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
        functionName: "maxSubArray",
        parameters: [
            { name: "nums", type: "integer[]" }
        ],
        returnType: "integer",
        sampleTestCases: [
            { input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum 6." },
            { input: "[1]", output: "1", explanation: "" },
            { input: "[5,4,-1,7,8]", output: "23", explanation: "" }
        ],
        hiddenTestCases: [
            { input: "[-1]", output: "-1", isHidden: true },
            { input: "[-2, -1]", output: "-1", isHidden: true }
        ],
        starterCode: {
            javascript: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};",
            python: "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
            java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
            c: "int maxSubArray(int* nums, int numsSize) {\n    \n}"
        },
        order: 4
    },
    {
        title: "Climbing Stairs",
        slug: "climbing-stairs",
        description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
        difficulty: "Easy",
        topic: "Dynamic Programming",
        tags: ["Math", "DP", "Memoization"],
        companies: ["Uber", "Adobe"],
        constraints: "1 <= n <= 45",
        functionName: "climbStairs",
        parameters: [
            { name: "n", type: "integer" }
        ],
        returnType: "integer",
        sampleTestCases: [
            { input: "2", output: "2", explanation: "1. 1 step + 1 step\n2. 2 steps" },
            { input: "3", output: "3", explanation: "1. 1+1+1\n2. 1+2\n3. 2+1" }
        ],
        hiddenTestCases: [
            { input: "4", output: "5", isHidden: true },
            { input: "5", output: "8", isHidden: true }
        ],
        starterCode: {
            javascript: "/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};",
            python: "class Solution:\n    def climbStairs(self, n: int) -> int:\n        ",
            java: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
            cpp: "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
            c: "int climbStairs(int n) {\n    \n}"
        },
        order: 5
    }
];

const seedProblems = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Find an admin user
        const admin = await User.findOne({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } });
        if (!admin) {
            console.error('No Admin user found to assign problems to.');
            process.exit(1);
        }

        console.log(`Assigning problems to admin: ${admin.email}`);

        for (const problemData of sampleProblems) {
            // Upsert problem to ensure starter code is updated
            const problem = await Problem.findOneAndUpdate(
                { slug: problemData.slug },
                {
                    ...problemData,
                    createdBy: admin._id,
                    isPublished: true
                },
                { upsert: true, new: true }
            );
            console.log(`Upserted problem: ${problem.title}`);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedProblems();
