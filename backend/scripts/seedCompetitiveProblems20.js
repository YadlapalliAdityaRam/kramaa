const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Problem = require('../models/Problem');

dotenv.config({ path: path.join(__dirname, '../.env') });

const problems = [
    {
        title: 'Sum of Distinct Squares',
        slug: 'sum-of-distinct-squares',
        functionName: 'sumDistinctSquares',
        difficulty: 'Easy',
        topics: ['Arrays', 'Hashing', 'Mathematics'],
        companies: ['Google', 'Amazon'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Compute the sum of squares of all distinct values in the given array.',
        constraints: '1 <= n <= 1e5\n-1000 <= arr[i] <= 1000',
        sampleIn: '4\n1 2 2 3',
        sampleOut: '14',
        hiddenIn: '6\n4 3 2 4 3 1',
        hiddenOut: '30'
    },
    {
        title: 'Balanced Bracket Validator',
        slug: 'balanced-bracket-validator',
        functionName: 'validateBalancedBrackets',
        difficulty: 'Easy',
        topics: ['Strings', 'Recursion'],
        companies: ['Google', 'Microsoft', 'Adobe'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'For each bracket string, print YES if it is valid, otherwise NO.',
        constraints: '1 <= t <= 1000\n1 <= |s| <= 1e4',
        sampleIn: '2\n({[]})\n([)]',
        sampleOut: 'YES\nNO',
        hiddenIn: '1\n{()[]{()}}',
        hiddenOut: 'YES'
    },
    {
        title: 'Most Frequent Character',
        slug: 'most-frequent-character',
        functionName: 'mostFrequentCharacter',
        difficulty: 'Easy',
        topics: ['Strings', 'Hashing'],
        companies: ['Amazon', 'Meta', 'Apple'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Print the most frequent lowercase character; break ties alphabetically.',
        constraints: '1 <= t <= 500\n1 <= |s| <= 1e5',
        sampleIn: '2\nabacaba\nbbccdd',
        sampleOut: 'a\nb',
        hiddenIn: '1\nmmnnnoooppp',
        hiddenOut: 'n'
    },
    {
        title: 'Rotate Array by K Steps',
        slug: 'rotate-array-k-steps',
        functionName: 'rotateArrayByKSteps',
        difficulty: 'Easy',
        topics: ['Arrays', 'Two Pointers'],
        companies: ['Microsoft', 'Adobe', 'Salesforce'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Right rotate the array by k positions and print the rotated array.',
        constraints: '1 <= n <= 1e5\n0 <= k <= 1e9',
        sampleIn: '5 2\n1 2 3 4 5',
        sampleOut: '4 5 1 2 3',
        hiddenIn: '3 1000000000\n1 2 3',
        hiddenOut: '3 1 2'
    },
    {
        title: 'Anagram Group Counter',
        slug: 'anagram-group-counter',
        functionName: 'countAnagramGroups',
        difficulty: 'Easy',
        topics: ['Strings', 'Hashing', 'Sorting'],
        companies: ['Google', 'Meta', 'Apple'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Count distinct anagram groups among n lowercase words.',
        constraints: '1 <= n <= 1e4\n1 <= |word| <= 100',
        sampleIn: '6\neat\ntea\ntan\nate\nnat\nbat',
        sampleOut: '3',
        hiddenIn: '4\nlisten\nsilent\nhello\nworld',
        hiddenOut: '3'
    },
    {
        title: 'Running Average Tracker',
        slug: 'running-average-tracker',
        functionName: 'runningAverageTracker',
        difficulty: 'Easy',
        topics: ['Arrays', 'Prefix Sum'],
        companies: ['PayPal', 'Salesforce', 'Oracle'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Output floor running averages for each prefix of the array.',
        constraints: '1 <= n <= 1e5\n1 <= arr[i] <= 1e6',
        sampleIn: '4\n4 2 6 1',
        sampleOut: '4 3 4 3',
        hiddenIn: '5\n3 7 2 8 5',
        hiddenOut: '3 5 4 5 5'
    },
    {
        title: 'Longest Subarray With Sum At Most K',
        slug: 'longest-subarray-sum-at-most-k',
        functionName: 'longestSubarrayAtMostK',
        difficulty: 'Medium',
        topics: ['Sliding Window', 'Two Pointers', 'Prefix Sum'],
        companies: ['Google', 'Amazon', 'Microsoft'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Find longest contiguous subarray length with sum <= k (non-negative array).',
        constraints: '1 <= n <= 1e5\n0 <= arr[i] <= 1e4\n0 <= k <= 1e9',
        sampleIn: '5 7\n1 2 3 4 5',
        sampleOut: '3',
        hiddenIn: '6 8\n3 1 4 1 5 2',
        hiddenOut: '3'
    },
    {
        title: 'Minimum Days to Collect All Rewards',
        slug: 'minimum-days-collect-rewards',
        functionName: 'minimumDaysCollectRewards',
        difficulty: 'Medium',
        topics: ['Binary Search', 'Greedy'],
        companies: ['Amazon', 'Google', 'Uber'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Find the earliest day when all tasks become ready.',
        constraints: '1 <= n <= 1e5\n1 <= arr[i] <= 1e9',
        sampleIn: '5\n3 1 4 1 5',
        sampleOut: '5',
        hiddenIn: '5\n6 2 9 4 7',
        hiddenOut: '9'
    },
    {
        title: 'Task Scheduler with Cooldown',
        slug: 'task-scheduler-cooldown',
        functionName: 'taskSchedulerCooldown',
        difficulty: 'Medium',
        topics: ['Greedy', 'Heap', 'Arrays'],
        companies: ['Google', 'Microsoft', 'Meta'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Find minimum CPU intervals to finish tasks with cooldown between same labels.',
        constraints: '1 <= n <= 1e4\n0 <= cooldown <= 100',
        sampleIn: '6 2\nA A A B B B',
        sampleOut: '8',
        hiddenIn: '8 2\nA A B B C C D D',
        hiddenOut: '8'
    },
    {
        title: 'Shortest Path in Binary Maze',
        slug: 'shortest-path-binary-maze',
        functionName: 'shortestPathBinaryMaze',
        difficulty: 'Medium',
        topics: ['Graph', 'Breadth First Search', 'Shortest Path'],
        companies: ['Google', 'Amazon', 'Uber', 'Microsoft'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Find shortest 4-direction path from top-left to bottom-right in a binary grid.',
        constraints: '1 <= n,m <= 500\ngrid[0][0] = grid[n-1][m-1] = 0',
        sampleIn: '3 3\n0 0 1\n0 0 0\n1 0 0',
        sampleOut: '4',
        hiddenIn: '2 2\n0 1\n1 0',
        hiddenOut: '-1'
    },
    {
        title: 'Subarray Sum Equals K (Count)',
        slug: 'subarray-sum-equals-k',
        functionName: 'countSubarraySumEqualsK',
        difficulty: 'Medium',
        topics: ['Arrays', 'Prefix Sum', 'Hashing'],
        companies: ['Meta', 'Google', 'Amazon', 'Microsoft'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Count contiguous subarrays whose sum equals target k.',
        constraints: '1 <= n <= 2e4\n-1e3 <= arr[i] <= 1e3',
        sampleIn: '3 2\n1 1 1',
        sampleOut: '2',
        hiddenIn: '1 -5\n-5',
        hiddenOut: '1'
    },
    {
        title: 'Course Schedule Validator',
        slug: 'course-schedule-validator',
        functionName: 'validateCourseSchedule',
        difficulty: 'Medium',
        topics: ['Graph', 'Topological Sort', 'Depth First Search'],
        companies: ['Google', 'Microsoft', 'Amazon', 'Adobe'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Determine if all courses can be completed given prerequisite dependencies.',
        constraints: '1 <= n <= 1e5\n0 <= m <= 2e5',
        sampleIn: '4 3\n1 0\n2 1\n3 2',
        sampleOut: 'YES',
        hiddenIn: '2 2\n0 1\n1 0',
        hiddenOut: 'NO'
    },
    {
        title: 'Kth Largest Element in Stream',
        slug: 'kth-largest-in-stream',
        functionName: 'kthLargestStream',
        difficulty: 'Medium',
        topics: ['Heap', 'Sorting', 'Arrays'],
        companies: ['Amazon', 'Google', 'Apple', 'Meta'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'After each inserted score, output current kth largest score, else -1.',
        constraints: '1 <= n <= 1e5\n1 <= k <= n',
        sampleIn: '6 3\n4 5 8 2 7 1',
        sampleOut: '-1 -1 4 4 5 5',
        hiddenIn: '1 1\n42',
        hiddenOut: '42'
    },
    {
        title: 'Range Sum with Point Updates',
        slug: 'range-sum-point-updates',
        functionName: 'rangeSumPointUpdates',
        difficulty: 'Hard',
        topics: ['Segment Tree', 'Fenwick Tree'],
        companies: ['Google', 'Meta', 'NVIDIA', 'Amazon'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Support update and range-sum query operations efficiently.',
        constraints: '1 <= n,q <= 1e5\n-1e9 <= values <= 1e9',
        sampleIn: '5 3\n1 2 3 4 5\nQ 1 3\nU 2 10\nQ 1 3',
        sampleOut: '6\n14',
        hiddenIn: '3 3\n1 2 3\nU 2 -10\nQ 1 3\nQ 2 2',
        hiddenOut: '-6\n-10'
    },
    {
        title: 'Bitmask DP - Minimum Cost to Visit All Cities',
        slug: 'min-cost-visit-all-cities',
        functionName: 'minCostVisitAllCities',
        difficulty: 'Hard',
        topics: ['Dynamic Programming', 'Bit Manipulation', 'Graph'],
        companies: ['Google', 'Amazon', 'NVIDIA', 'Microsoft'],
        timeLimit: 2000,
        memoryLimit: 256,
        description: 'Find minimum Hamiltonian tour cost starting and ending at city 0.',
        constraints: '2 <= n <= 20\n0 <= cost[i][j] <= 1e6',
        sampleIn: '4\n0 10 15 20\n10 0 35 25\n15 35 0 30\n20 25 30 0',
        sampleOut: '80',
        hiddenIn: '2\n0 5\n5 0',
        hiddenOut: '10'
    },
    {
        title: 'Strongly Connected Components Counter',
        slug: 'strongly-connected-components-counter',
        functionName: 'countStronglyConnectedComponents',
        difficulty: 'Hard',
        topics: ['Graph', 'Depth First Search', 'Strongly Connected Components'],
        companies: ['Google', 'Meta', 'Amazon', 'Microsoft'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'Count SCCs in directed graph and print component sizes in descending order.',
        constraints: '1 <= n <= 1e5\n0 <= m <= 2e5',
        sampleIn: '5 6\n1 2\n2 3\n3 1\n3 4\n4 5\n5 4',
        sampleOut: '2\n3 2',
        hiddenIn: '3 3\n1 2\n2 3\n3 1',
        hiddenOut: '1\n3'
    },
    {
        title: 'Maximum Flow in Pipeline Network',
        slug: 'maximum-flow-pipeline',
        functionName: 'maximumFlowPipelineNetwork',
        difficulty: 'Hard',
        topics: ['Network Flow', 'Graph', 'Breadth First Search'],
        companies: ['Google', 'Amazon', 'Microsoft', 'NVIDIA'],
        timeLimit: 2000,
        memoryLimit: 256,
        description: 'Compute maximum flow from source node 1 to sink node n in a capacity network.',
        constraints: '2 <= n <= 500\n1 <= m <= 5000',
        sampleIn: '4 5\n1 2 3\n1 3 2\n2 4 2\n3 4 3\n2 3 1',
        sampleOut: '5',
        hiddenIn: '2 2\n1 2 5\n1 2 3',
        hiddenOut: '8'
    },
    {
        title: 'Nim Game Strategy',
        slug: 'nim-game-strategy',
        functionName: 'nimGameStrategy',
        difficulty: 'Hard',
        topics: ['Game Theory', 'Bit Manipulation', 'Mathematics'],
        companies: ['Google', 'Meta', 'NVIDIA', 'Apple'],
        timeLimit: 1000,
        memoryLimit: 256,
        description: 'For initial piles and updates, output First/Second winner using Nim-sum.',
        constraints: '1 <= n <= 1e5\n1 <= q <= 1e5',
        sampleIn: '3\n1 2 3\n2\n2 5\n3 3',
        sampleOut: 'Second\nFirst\nSecond',
        hiddenIn: '1\n5\n1\n1 0',
        hiddenOut: 'First\nSecond'
    },
    {
        title: 'Longest Common Substring via Suffix Array',
        slug: 'longest-common-substring-suffix-array',
        functionName: 'longestCommonSubstring',
        difficulty: 'Hard',
        topics: ['Suffix Array', 'Strings', 'Binary Search'],
        companies: ['Google', 'Amazon', 'Microsoft', 'Adobe'],
        timeLimit: 2000,
        memoryLimit: 256,
        description: 'Find length of the longest common contiguous substring between two strings.',
        constraints: '1 <= |S|,|T| <= 1e5',
        sampleIn: 'abcdef\nzcdemf',
        sampleOut: '3',
        hiddenIn: 'abcabc\nbcabca',
        hiddenOut: '5'
    },
    {
        title: 'Meet in the Middle - Subset Sum Close to Target',
        slug: 'meet-middle-subset-sum',
        functionName: 'subsetSumMeetMiddle',
        difficulty: 'Hard',
        topics: ['Meet in the Middle', 'Bit Manipulation', 'Binary Search', 'Backtracking'],
        companies: ['Google', 'Amazon', 'Meta', 'NVIDIA'],
        timeLimit: 2000,
        memoryLimit: 256,
        description: 'Find maximum subset sum not exceeding target T for n up to 40.',
        constraints: '1 <= n <= 40\n0 <= T <= 1e15',
        sampleIn: '4 10\n3 5 7 2',
        sampleOut: '10',
        hiddenIn: '3 6\n4 3 2',
        hiddenOut: '6'
    }
];

const buildStarterCode = (functionName) => ({
    javascript: `function ${functionName}(input) {\n    // Parse input and return output string.\n    return '';\n}`,
    python: `def ${functionName}(input: str) -> str:\n    # Parse input and return output string.\n    return ''`,
    java: `public class Solution {\n    public String ${functionName}(String input) {\n        // Parse input and return output string.\n        return \"\";\n    }\n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nstring ${functionName}(string input) {\n    // Parse input and return output string.\n    return \"\";\n}`,
    c: `#include <stdio.h>\n\nchar* ${functionName}(char* input) {\n    static char output[4096];\n    output[0] = '\\0';\n    return output;\n}`
});

const buildEditorial = (problem) => ({
    approaches: [
        {
            title: `${problem.title} - Core Approach`,
            description: 'Use the standard optimal approach for this problem statement.',
            timeComplexity: 'As per optimal solution',
            spaceComplexity: 'As per optimal solution',
            codeLanguage: 'javascript',
            code: `function ${problem.functionName}(input) {\n    // Implement optimal approach here.\n    return '';\n}`
        }
    ]
});

const upsertProblem = async (problem, adminId, order) => {
    const payload = {
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        difficulty: problem.difficulty,
        topic: problem.topics[0],
        topics: problem.topics,
        tags: problem.topics,
        companies: problem.companies,
        constraints: problem.constraints,
        sampleTestCases: [
            { input: problem.sampleIn, output: problem.sampleOut, explanation: 'Sample case' }
        ],
        hiddenTestCases: [
            { input: problem.hiddenIn, output: problem.hiddenOut, isHidden: true }
        ],
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        functionName: problem.functionName,
        starterCode: buildStarterCode(problem.functionName),
        createdBy: adminId,
        isPublished: true,
        status: 'PUBLISHED',
        approvalStatus: 'APPROVED',
        editorial: buildEditorial(problem),
        editorialPublished: true,
        publishedAt: new Date(),
        order
    };

    const existing = await Problem.findOne({
        $or: [{ slug: problem.slug }, { title: problem.title }]
    });
    if (!existing) {
        const created = await Problem.create(payload);
        return { action: 'created', title: created.title };
    }

    existing.set({ ...payload, problemNumber: existing.problemNumber, order: existing.order || order });
    await existing.save();
    return { action: 'updated', title: existing.title };
};

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    let admin = await User.findOne({ username: 'adityaram4' }).select('_id username role email');
    let adminCreated = false;
    let adminPromoted = false;

    if (!admin) {
        admin = await User.create({
            username: 'adityaram4',
            email: 'adityaram4@algoverse.local',
            password: 'AdityaRam@2026',
            role: 'ADMIN',
            adminRole: 'ADMIN',
            fullName: 'Aditya Ram',
            isVerified: true,
            accountStatus: 'Active'
        });
        adminCreated = true;
    } else if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
        admin.role = 'ADMIN';
        admin.adminRole = 'ADMIN';
        admin.accountStatus = 'Active';
        await admin.save();
        adminPromoted = true;
    }

    if (adminCreated) {
        console.log('Created admin user `adityaram4` with default password `AdityaRam@2026`.');
    } else if (adminPromoted) {
        console.log('Promoted existing `adityaram4` account to ADMIN.');
    }

    const fnSet = new Set();
    for (const p of problems) {
        if (fnSet.has(p.functionName.toLowerCase())) {
            throw new Error(`Duplicate function name: ${p.functionName}`);
        }
        fnSet.add(p.functionName.toLowerCase());
    }

    const maxOrderDoc = await Problem.findOne({}, { order: 1 }).sort({ order: -1 }).lean();
    let nextOrder = (maxOrderDoc?.order || 0) + 1;

    let createdCount = 0;
    let updatedCount = 0;
    for (const p of problems) {
        const result = await upsertProblem(p, admin._id, nextOrder);
        if (result.action === 'created') createdCount++;
        else updatedCount++;
        console.log(`${result.action.toUpperCase()}: ${result.title}`);
        nextOrder++;
    }

    console.log(`Done. created=${createdCount}, updated=${updatedCount}, total=${problems.length}`);
};

run()
    .then(async () => {
        await mongoose.disconnect();
        process.exit(0);
    })
    .catch(async (error) => {
        console.error(error.message || error);
        await mongoose.disconnect();
        process.exit(1);
    });
