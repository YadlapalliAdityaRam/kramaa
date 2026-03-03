const normalizeCategory = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'dynamic programming') return 'dp';
    return normalized;
};

const CATEGORY_STEPS = {
    sorting: [
        'Start with the unsorted list.',
        'Compare values using the algorithm rule.',
        'Move values into better positions step by step.',
        'Repeat until the list is fully ordered.'
    ],
    searching: [
        'Set the target value you want to find.',
        'Check elements or ranges using the search rule.',
        'Remove impossible positions after each check.',
        'Stop when the target is found or no options remain.'
    ],
    graphs: [
        'Model the problem as nodes and edges.',
        'Choose a start node or start edge set.',
        'Expand to connected nodes while tracking state.',
        'Finish when traversal or path goal is complete.'
    ],
    trees: [
        'Treat data as connected parent-child nodes.',
        'Visit nodes in a rule-based order.',
        'Use left/right or subtree decisions at each step.',
        'Stop when all required nodes are processed.'
    ],
    dp: [
        'Break the big problem into smaller subproblems.',
        'Store solved subproblem answers in a table.',
        'Reuse stored results instead of recalculating.',
        'Build the final answer from those stored states.'
    ],
    greedy: [
        'Sort or rank choices by a local priority.',
        'Pick the best valid choice available now.',
        'Lock that choice and continue forward.',
        'Stop when no better valid choice remains.'
    ],
    string: [
        'Scan text with a pattern-matching rule.',
        'Compare characters, prefixes, or hashes.',
        'Skip redundant checks whenever possible.',
        'Return match positions or a no-match result.'
    ],
    backtracking: [
        'Try one choice and move deeper.',
        'If the choice fails, undo and go back.',
        'Try the next possible choice.',
        'Keep only complete valid solutions.'
    ],
    math: [
        'Apply a small numeric rule repeatedly.',
        'Reduce the problem size each step.',
        'Track only the values needed next.',
        'Stop when the base condition is reached.'
    ],
    default: [
        'Read the input and identify the goal.',
        'Process the data using a repeatable rule.',
        'Keep useful state after every step.',
        'Stop when the answer condition is met.'
    ]
};

const CATEGORY_CORE_IDEA = {
    sorting: 'Keep improving local order so global order naturally appears.',
    searching: 'Each check should remove as much impossible data as possible.',
    graphs: 'Controlled expansion with state tracking prevents wrong revisits and wasted work.',
    trees: 'Use tree structure to guide decisions instead of scanning everything.',
    dp: 'Solve once, store once, reuse everywhere.',
    greedy: 'Take the best safe local decision at each step to build a strong final result.',
    string: 'Use pattern structure to avoid unnecessary character-by-character repeats.',
    backtracking: 'Explore choices systematically and back out immediately from dead ends.',
    math: 'A simple repeated identity can shrink a hard problem into an easy one.',
    default: 'A clear repeatable rule plus state tracking drives the solution.'
};

const SORTING_PROPERTIES = {
    'Bubble Sort': { stable: 'Yes', inPlace: 'Yes' },
    'Insertion Sort': { stable: 'Yes', inPlace: 'Yes' },
    'Selection Sort': { stable: 'No', inPlace: 'Yes' },
    'Merge Sort': { stable: 'Yes', inPlace: 'No' },
    'Quick Sort': { stable: 'No', inPlace: 'Yes' },
    'Heap Sort': { stable: 'No', inPlace: 'Yes' },
    'Bucket Sort': { stable: 'Depends on bucket sorting method', inPlace: 'No' },
    'Radix Sort': { stable: 'Yes', inPlace: 'No' },
    'Shell Sort': { stable: 'No', inPlace: 'Yes' },
    'Counting Sort': { stable: 'Yes', inPlace: 'No' },
    'Tim Sort': { stable: 'Yes', inPlace: 'No' },
    'Cycle Sort': { stable: 'No', inPlace: 'Yes' },
    'Cocktail Shaker Sort': { stable: 'Yes', inPlace: 'Yes' },
    'Comb Sort': { stable: 'No', inPlace: 'Yes' }
};

const NAME_OVERRIDES = {
    'Binary Search': {
        howItWorks: [
            'Start with low and high pointers on a sorted list.',
            'Check the middle value.',
            'Keep only the half that can still contain the target.',
            'Repeat until found or pointers cross.'
        ],
        coreIdea: 'Halve the search space after every comparison.'
    },
    'Linear Search': {
        howItWorks: [
            'Start from the first element.',
            'Compare each element with the target.',
            'Stop immediately when a match appears.',
            'Return not found if the list ends.'
        ]
    },
    "Dijkstra's Algorithm": {
        coreIdea: 'Always expand the currently cheapest known node first.',
        howItWorks: [
            'Set source distance to 0 and others to infinity.',
            'Pick the unvisited node with minimum distance.',
            'Relax edges to update better distances.',
            'Repeat until all reachable nodes are finalized.'
        ]
    },
    'Breadth-First Search (BFS)': {
        howItWorks: [
            'Push the start node into a queue.',
            'Pop from front and visit neighbors.',
            'Mark visited nodes to avoid repeats.',
            'Continue until the queue becomes empty.'
        ],
        coreIdea: 'Process nodes layer by layer using a queue.'
    },
    'Depth-First Search (DFS)': {
        howItWorks: [
            'Start at one node and go as deep as possible.',
            'Mark nodes as visited.',
            'Backtrack when no unvisited neighbor exists.',
            'Continue until all reachable nodes are explored.'
        ],
        coreIdea: 'Explore one path fully before trying sibling paths.'
    },
    '0/1 Knapsack': {
        whatItDoes: [
            'It finds the maximum total value you can carry within a weight limit.',
            'Each item can be picked at most once.'
        ]
    },
    'Knapsack Problem': {
        whatItDoes: [
            'It finds the maximum total value you can carry within a weight limit.',
            'Each item can be picked at most once.'
        ]
    },
    'Longest Common Subsequence': {
        coreIdea: 'Compare prefixes and keep the best smaller answer for reuse.'
    },
    'Coin Change': {
        whatItDoes: [
            'It computes how to make a target amount using given coin values.',
            'Depending on variant, it gives minimum coins or number of ways.'
        ]
    }
};

const splitDescription = (description) => {
    if (!description) return [];
    return String(description)
        .split('.')
        .map((part) => part.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => `${part}.`);
};

const formatTimeComplexity = (timeComplexity) => {
    if (!timeComplexity) return 'N/A';
    const best = timeComplexity.best || 'N/A';
    const average = timeComplexity.average || timeComplexity.avg || 'N/A';
    const worst = timeComplexity.worst || 'N/A';
    return `Best: ${best} | Average: ${average} | Worst: ${worst}`;
};

export const buildAlgorithmOverview = ({
    name,
    category,
    description,
    useCases,
    timeComplexity,
    spaceComplexity
}) => {
    const categoryKey = normalizeCategory(category);
    const override = NAME_OVERRIDES[name] || {};
    const descriptionSentences = splitDescription(description);

    const whatItDoes = override.whatItDoes
        || [
            descriptionSentences[0] || `${name} solves a ${categoryKey || 'general'} problem in a structured way.`,
            useCases?.[0] ? `It is commonly used for ${String(useCases[0]).toLowerCase()}.` : ''
        ].filter(Boolean).slice(0, 2);

    const howItWorks = (override.howItWorks || CATEGORY_STEPS[categoryKey] || CATEGORY_STEPS.default).slice(0, 5);
    const coreIdea = override.coreIdea || CATEGORY_CORE_IDEA[categoryKey] || CATEGORY_CORE_IDEA.default;

    const sortingProps = SORTING_PROPERTIES[name];

    return {
        whatItDoes,
        howItWorks,
        coreIdea,
        complexity: {
            time: formatTimeComplexity(timeComplexity),
            space: spaceComplexity || 'N/A',
            stable: sortingProps?.stable || null,
            inPlace: sortingProps?.inPlace || null
        }
    };
};

