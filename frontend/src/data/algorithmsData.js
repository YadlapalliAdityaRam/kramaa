const coreAlgorithms = [
    {
        id: 's1',
        name: 'Bubble Sort',
        category: 'Sorting',
        difficulty: 'Beginner',
        path: '/algorithms/sorting/bubble',
        description: 'Simple comparison-based sorting algorithm.',
        timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Teaching purposes', 'Small datasets', 'Nearly sorted data']
    },
    {
        id: 's2',
        name: 'Insertion Sort',
        category: 'Sorting',
        difficulty: 'Beginner',
        path: '/algorithms/sorting/insertion',
        description: 'Builds the final sorted array one item at a time.',
        timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Small datasets', 'Online sorting', 'Nearly sorted data']
    },
    {
        id: 's3',
        name: 'Selection Sort',
        category: 'Sorting',
        difficulty: 'Beginner',
        path: '/algorithms/sorting/selection',
        description: 'Repeatedly finds the minimum element and places it first.',
        timeComplexity: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Small datasets', 'Memory constrained systems', 'Low swap count workflows']
    },
    {
        id: 's4',
        name: 'Merge Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/merge',
        description: 'Divide-and-conquer sorting by recursively merging sorted halves.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Large datasets', 'Stable sorting', 'Linked list sorting']
    },
    {
        id: 's5',
        name: 'Quick Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/quick',
        description: 'Divide-and-conquer sorting using pivot partitioning.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n^2)' },
        spaceComplexity: 'O(log n)',
        useCases: ['General-purpose array sorting', 'Performance critical apps', 'In-place sorting']
    },
    {
        id: 's6',
        name: 'Heap Sort',
        category: 'Sorting',
        difficulty: 'Advanced',
        path: '/algorithms/sorting/heap',
        description: 'Uses a binary heap to repeatedly extract the maximum/minimum.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Constant space sorting', 'Priority queue foundation', 'Embedded constraints']
    },
    {
        id: 's7',
        name: 'Bucket Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/bucket',
        description: 'Distributes items into buckets, sorts buckets, then concatenates.',
        timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n^2)' },
        spaceComplexity: 'O(n)',
        useCases: ['Uniformly distributed values', 'Known ranges', 'Float grouping']
    },
    {
        id: 's8',
        name: 'Radix Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/radix',
        description: 'Non-comparison sorting by processing digits from least/most significant.',
        timeComplexity: { best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)' },
        spaceComplexity: 'O(n + k)',
        useCases: ['Fixed-length integers', 'Known digit widths', 'Large integer batches']
    },
    {
        id: 'se1',
        name: 'Linear Search',
        category: 'Searching',
        difficulty: 'Beginner',
        path: '/algorithms/searching/linear',
        description: 'Scans each element sequentially until target is found.',
        timeComplexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Unsorted arrays', 'Small datasets', 'One-off lookups']
    },
    {
        id: 'se2',
        name: 'Binary Search',
        category: 'Searching',
        difficulty: 'Beginner',
        path: '/algorithms/searching/binary',
        description: 'Searches sorted arrays by halving search space each step.',
        timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Sorted arrays', 'Fast repeated lookups', 'Large datasets']
    },
    {
        id: 'se3',
        name: 'Jump Search',
        category: 'Searching',
        difficulty: 'Intermediate',
        path: '/algorithms/searching/jump',
        description: 'Searches sorted arrays by fixed block jumps plus linear scan.',
        timeComplexity: { best: 'O(1)', average: 'O(sqrt(n))', worst: 'O(sqrt(n))' },
        spaceComplexity: 'O(1)',
        useCases: ['Sorted arrays', 'Low-memory environments', 'Index-based scans']
    },
    {
        id: 'se4',
        name: 'Interpolation Search',
        category: 'Searching',
        difficulty: 'Intermediate',
        path: '/algorithms/searching/interpolation',
        description: 'Estimates likely index based on value distribution in sorted data.',
        timeComplexity: { best: 'O(1)', average: 'O(log log n)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Uniformly distributed sorted data', 'Numeric key stores']
    },
    {
        id: 'se5',
        name: 'Exponential Search',
        category: 'Searching',
        difficulty: 'Intermediate',
        path: '/algorithms/searching/exponential',
        description: 'Expands search range exponentially then applies binary search.',
        timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Unbounded arrays', 'Sorted streams', 'Early-target lookups']
    },
    {
        id: 'g1',
        name: 'Breadth-First Search (BFS)',
        category: 'Graphs',
        difficulty: 'Intermediate',
        path: '/algorithms/graphs/bfs',
        description: 'Traverses graph level by level from a source node.',
        timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
        spaceComplexity: 'O(V)',
        useCases: ['Shortest path in unweighted graphs', 'Connectivity checks', 'Layered traversal']
    },
    {
        id: 'g2',
        name: 'Depth-First Search (DFS)',
        category: 'Graphs',
        difficulty: 'Intermediate',
        path: '/algorithms/graphs/dfs',
        description: 'Traverses graph by exploring one branch deeply before backtracking.',
        timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
        spaceComplexity: 'O(V)',
        useCases: ['Cycle detection', 'Topological processing', 'Component detection']
    },
    {
        id: 'g3',
        name: "Dijkstra's Algorithm",
        category: 'Graphs',
        difficulty: 'Advanced',
        path: '/algorithms/graphs/dijkstra',
        description: 'Finds shortest path from a source in non-negative weighted graphs.',
        timeComplexity: { best: 'O((V + E) log V)', average: 'O((V + E) log V)', worst: 'O((V + E) log V)' },
        spaceComplexity: 'O(V)',
        useCases: ['Routing', 'Navigation systems', 'Network optimization']
    },
    {
        id: 'g4',
        name: 'Bellman-Ford',
        category: 'Graphs',
        difficulty: 'Advanced',
        path: '/algorithms/graphs/bellman-ford',
        description: 'Computes single-source shortest paths, supports negative weights.',
        timeComplexity: { best: 'O(VE)', average: 'O(VE)', worst: 'O(VE)' },
        spaceComplexity: 'O(V)',
        useCases: ['Negative-edge graphs', 'Cycle detection', 'Distance constraints']
    },
    {
        id: 'g5',
        name: "Prim's MST",
        category: 'Graphs',
        difficulty: 'Advanced',
        path: '/algorithms/graphs/prims',
        description: 'Greedy algorithm to compute a minimum spanning tree.',
        timeComplexity: { best: 'O(E log V)', average: 'O(E log V)', worst: 'O(E log V)' },
        spaceComplexity: 'O(V)',
        useCases: ['Network design', 'Cable cost minimization', 'Cluster connectivity']
    },
    {
        id: 't1',
        name: 'Binary Tree Traversals',
        category: 'Trees',
        difficulty: 'Beginner',
        path: '/algorithms/trees/traversals',
        description: 'Inorder, preorder, and postorder traversal patterns.',
        timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(h)',
        useCases: ['Expression trees', 'Serialization', 'Tree analysis']
    },
    {
        id: 't2',
        name: 'AVL Tree',
        category: 'Trees',
        difficulty: 'Advanced',
        path: '/algorithms/trees/avl',
        description: 'Self-balancing BST with strict height-balance rotations.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Ordered maps', 'Frequent search workloads', 'Balanced index structures']
    },
    {
        id: 't3',
        name: 'Red-Black Tree',
        category: 'Trees',
        difficulty: 'Advanced',
        path: '/algorithms/trees/rbt',
        description: 'Balanced BST using coloring rules for near-logarithmic operations.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Language/runtime maps', 'Set implementations', 'Balanced dictionary indexing']
    },
    {
        id: 'dp1',
        name: 'Knapsack Problem',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/knapsack',
        description: 'Optimizes maximum value under weight capacity constraints.',
        timeComplexity: { best: 'O(nW)', average: 'O(nW)', worst: 'O(nW)' },
        spaceComplexity: 'O(nW)',
        useCases: ['Resource allocation', 'Budget optimization', 'Subset optimization']
    },
    {
        id: 'dp2',
        name: 'Longest Common Subsequence',
        category: 'Dynamic Programming',
        difficulty: 'Advanced',
        path: '/algorithms/dp/lcs',
        description: 'Finds longest subsequence common to two sequences.',
        timeComplexity: { best: 'O(mn)', average: 'O(mn)', worst: 'O(mn)' },
        spaceComplexity: 'O(mn)',
        useCases: ['Diff tools', 'Version compare', 'DNA/protein sequence matching']
    },
    {
        id: 'dp3',
        name: 'Coin Change',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/coin-change',
        description: 'Computes minimum coins or number of ways for a target amount.',
        timeComplexity: { best: 'O(n * amount)', average: 'O(n * amount)', worst: 'O(n * amount)' },
        spaceComplexity: 'O(amount)',
        useCases: ['Payment systems', 'Combinatorics education', 'Optimization practice']
    },
    {
        id: 'gr1',
        name: 'Activity Selection',
        category: 'Greedy',
        difficulty: 'Intermediate',
        path: '/algorithms/greedy/activity-selection',
        description: 'Selects maximum number of non-overlapping activities by end time.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Scheduling', 'Interval optimization', 'Resource planning']
    },
    {
        id: 'gr2',
        name: 'Huffman Coding',
        category: 'Greedy',
        difficulty: 'Advanced',
        path: '/algorithms/greedy/huffman',
        description: 'Builds optimal prefix-free binary encoding from frequency table.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Compression', 'Prefix coding', 'Entropy-based encoding']
    }
];

const expansionAlgorithms = [
    {
        id: 'u01',
        name: 'Shell Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/shell',
        description: 'Generalized insertion sort with shrinking gaps for faster passes.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log^2 n)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Medium arrays', 'In-place optimization', 'Gap-based sorting education']
    },
    {
        id: 'u02',
        name: 'Counting Sort',
        category: 'Sorting',
        difficulty: 'Beginner',
        path: '/algorithms/sorting/counting',
        description: 'Counts frequency of values and rebuilds sorted array by index counts.',
        timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)' },
        spaceComplexity: 'O(k)',
        useCases: ['Small bounded integers', 'Stable sorting foundation', 'Frequency-based sorting']
    },
    {
        id: 'u03',
        name: 'Tim Sort',
        category: 'Sorting',
        difficulty: 'Advanced',
        path: '/algorithms/sorting/tim',
        description: 'Hybrid insertion + merge strategy used in production runtimes.',
        timeComplexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Real-world sorting', 'Partially sorted data', 'Stable performance']
    },
    {
        id: 'u04',
        name: 'Cycle Sort',
        category: 'Sorting',
        difficulty: 'Advanced',
        path: '/algorithms/sorting/cycle',
        description: 'Minimizes write operations by placing elements directly into final cycles.',
        timeComplexity: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Write-costly memory', 'Min-write workflows', 'Algorithm comparison']
    },
    {
        id: 'u05',
        name: 'Cocktail Shaker Sort',
        category: 'Sorting',
        difficulty: 'Beginner',
        path: '/algorithms/sorting/cocktail-shaker',
        description: 'Bidirectional bubble sort that sweeps both ends each pass.',
        timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Teaching bidirectional scans', 'Small arrays', 'Boundary shrinking demos']
    },
    {
        id: 'u06',
        name: 'Comb Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/comb',
        description: 'Improves bubble sort by comparing distant elements using a shrinking gap.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Bubble sort optimization', 'Gap shrink techniques', 'Intro to practical improvements']
    },
    {
        id: 'u07',
        name: 'Ternary Search',
        category: 'Searching',
        difficulty: 'Intermediate',
        path: '/algorithms/searching/ternary',
        description: 'Splits sorted range into three parts using two mid points.',
        timeComplexity: { best: 'O(1)', average: 'O(log_3 n)', worst: 'O(log_3 n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Sorted arrays', 'Search strategy comparison', 'Divide-and-conquer learning']
    },
    {
        id: 'u08',
        name: 'Fibonacci Search',
        category: 'Searching',
        difficulty: 'Intermediate',
        path: '/algorithms/searching/fibonacci',
        description: 'Searches sorted arrays with Fibonacci-indexed offsets.',
        timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Sorted arrays', 'Low division-cost systems', 'Search method comparison']
    },
    {
        id: 'u09',
        name: 'Sentinel Linear Search',
        category: 'Searching',
        difficulty: 'Beginner',
        path: '/algorithms/searching/sentinel-linear',
        description: 'Linear search with sentinel to reduce boundary checks.',
        timeComplexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Loop optimization demos', 'Intro optimization techniques', 'Simple scan tasks']
    },
    {
        id: 'u10',
        name: 'Floyd-Warshall',
        category: 'Graphs',
        difficulty: 'Advanced',
        path: '/algorithms/graphs/floyd-warshall',
        description: 'All-pairs shortest path dynamic programming over adjacency matrix.',
        timeComplexity: { best: 'O(n^3)', average: 'O(n^3)', worst: 'O(n^3)' },
        spaceComplexity: 'O(n^2)',
        useCases: ['All-pairs routing', 'Dense weighted graphs', 'Path matrix analysis']
    },
    {
        id: 'u11',
        name: "Kruskal's MST",
        category: 'Graphs',
        difficulty: 'Advanced',
        path: '/algorithms/graphs/kruskal',
        description: 'Builds MST by sorting edges and using Union-Find cycle checks.',
        timeComplexity: { best: 'O(E log E)', average: 'O(E log E)', worst: 'O(E log E)' },
        spaceComplexity: 'O(V)',
        useCases: ['Minimum spanning trees', 'Network optimization', 'Union-Find practice']
    },
    {
        id: 'u12',
        name: 'Topological Sort',
        category: 'Graphs',
        difficulty: 'Intermediate',
        path: '/algorithms/graphs/topological-sort',
        description: 'Linear ordering of DAG vertices respecting directed dependencies.',
        timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
        spaceComplexity: 'O(V)',
        useCases: ['Dependency scheduling', 'Build pipelines', 'Task ordering']
    },
    {
        id: 'u13',
        name: 'A* Search',
        category: 'Graphs',
        difficulty: 'Advanced',
        path: '/algorithms/graphs/a-star',
        description: 'Heuristic shortest path using f(n)=g(n)+h(n).',
        timeComplexity: { best: 'O(1)', average: 'O(E)', worst: 'O(b^d)' },
        spaceComplexity: 'O(V)',
        useCases: ['Pathfinding', 'Game AI', 'Grid navigation']
    },
    {
        id: 'u14',
        name: "Cycle Detection (Floyd's)",
        category: 'Graphs',
        difficulty: 'Intermediate',
        path: '/algorithms/graphs/floyd-cycle',
        description: 'Tortoise-hare pointer method for cycle detection in linked structures.',
        timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Linked list analysis', 'Cycle entry detection', 'Pointer algorithm practice']
    },
    {
        id: 'u15',
        name: "Kosaraju's Algorithm",
        category: 'Graphs',
        difficulty: 'Advanced',
        path: '/algorithms/graphs/kosaraju',
        description: 'Two-pass DFS algorithm for strongly connected components.',
        timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
        spaceComplexity: 'O(V)',
        useCases: ['SCC decomposition', 'Graph condensation', 'Directed graph analysis']
    },
    {
        id: 'u16',
        name: 'Trie (Prefix Tree)',
        category: 'Trees',
        difficulty: 'Intermediate',
        path: '/algorithms/trees/trie',
        description: 'Character tree optimized for prefix-based queries.',
        timeComplexity: { best: 'O(L)', average: 'O(L)', worst: 'O(L)' },
        spaceComplexity: 'O(alphabet * L * N)',
        useCases: ['Autocomplete', 'Dictionary lookup', 'Prefix matching']
    },
    {
        id: 'u17',
        name: 'Segment Tree',
        category: 'Trees',
        difficulty: 'Advanced',
        path: '/algorithms/trees/segment-tree',
        description: 'Range query + point update structure with logarithmic operations.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Range sums/min/max', 'Competitive programming', 'Interval updates']
    },
    {
        id: 'u18',
        name: 'Fenwick Tree (BIT)',
        category: 'Trees',
        difficulty: 'Advanced',
        path: '/algorithms/trees/fenwick',
        description: 'Binary indexed tree for efficient prefix sums and updates.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Prefix sums', 'Frequency tables', 'Online range queries']
    },
    {
        id: 'u19',
        name: 'Heap / Min-Max Priority Queue',
        category: 'Trees',
        difficulty: 'Beginner',
        path: '/algorithms/trees/priority-queue',
        description: 'Complete tree represented as array for efficient priority operations.',
        timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Task scheduling', 'Event simulation', 'Shortest-path internals']
    },
    {
        id: 'u20',
        name: 'Splay Tree',
        category: 'Trees',
        difficulty: 'Advanced',
        path: '/algorithms/trees/splay',
        description: 'Self-adjusting BST that splays accessed nodes toward root.',
        timeComplexity: { best: 'O(1)', average: 'O(log n) amortized', worst: 'O(n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Adaptive access patterns', 'Cache-friendly trees', 'Amortized analysis']
    },
    {
        id: 'u21',
        name: 'Longest Increasing Subsequence',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/lis',
        description: 'Finds the longest strictly increasing subsequence in an array.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(n)',
        useCases: ['Sequence analysis', 'DP pattern study', 'Optimization interviews']
    },
    {
        id: 'u22',
        name: 'Edit Distance (Levenshtein)',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/edit-distance',
        description: 'Minimum insert/delete/replace operations to transform one string to another.',
        timeComplexity: { best: 'O(m * n)', average: 'O(m * n)', worst: 'O(m * n)' },
        spaceComplexity: 'O(m * n)',
        useCases: ['Spell correction', 'String similarity', 'Diff engines']
    },
    {
        id: 'u23',
        name: 'Matrix Chain Multiplication',
        category: 'Dynamic Programming',
        difficulty: 'Advanced',
        path: '/algorithms/dp/matrix-chain',
        description: 'Computes lowest multiplication cost by optimal parenthesization.',
        timeComplexity: { best: 'O(n^3)', average: 'O(n^3)', worst: 'O(n^3)' },
        spaceComplexity: 'O(n^2)',
        useCases: ['Compiler optimization', 'Expression optimization', 'DP table practice']
    },
    {
        id: 'u24',
        name: 'Rod Cutting',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/rod-cutting',
        description: 'Maximizes revenue by partitioning a rod into priced lengths.',
        timeComplexity: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(n)',
        useCases: ['Unbounded knapsack variants', 'Revenue optimization', 'DP reconstruction']
    },
    {
        id: 'u25',
        name: 'Egg Drop Problem',
        category: 'Dynamic Programming',
        difficulty: 'Advanced',
        path: '/algorithms/dp/egg-drop',
        description: 'Finds minimum worst-case trials to determine critical floor.',
        timeComplexity: { best: 'O(e * f^2)', average: 'O(e * f * log f)', worst: 'O(e * f^2)' },
        spaceComplexity: 'O(e * f)',
        useCases: ['Decision strategy optimization', 'Worst-case planning', 'DP transitions']
    },
    {
        id: 'u26',
        name: 'Fractional Knapsack',
        category: 'Greedy',
        difficulty: 'Intermediate',
        path: '/algorithms/greedy/fractional-knapsack',
        description: 'Maximizes value with divisible items using ratio-based greedy choice.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Resource allocation', 'Ratio-based optimization', 'Greedy correctness demos']
    },
    {
        id: 'u27',
        name: 'Job Sequencing with Deadlines',
        category: 'Greedy',
        difficulty: 'Intermediate',
        path: '/algorithms/greedy/job-sequencing',
        description: 'Schedules jobs before deadlines to maximize total profit.',
        timeComplexity: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(n)',
        useCases: ['Deadline planning', 'Slot allocation', 'Profit optimization']
    },
    {
        id: 'u28',
        name: 'KMP Algorithm',
        category: 'String',
        difficulty: 'Intermediate',
        path: '/algorithms/string/kmp',
        description: 'Pattern matching using LPS table to skip redundant comparisons.',
        timeComplexity: { best: 'O(n + m)', average: 'O(n + m)', worst: 'O(n + m)' },
        spaceComplexity: 'O(m)',
        useCases: ['Substring search', 'Text engines', 'Efficient matching']
    },
    {
        id: 'u29',
        name: 'Rabin-Karp Algorithm',
        category: 'String',
        difficulty: 'Intermediate',
        path: '/algorithms/string/rabin-karp',
        description: 'Pattern matching with rolling hash and collision verification.',
        timeComplexity: { best: 'O(n + m)', average: 'O(n + m)', worst: 'O(n * m)' },
        spaceComplexity: 'O(1)',
        useCases: ['Multi-pattern hashing', 'Document search', 'Rolling hash workflows']
    },
    {
        id: 'u30',
        name: 'Z-Algorithm',
        category: 'String',
        difficulty: 'Intermediate',
        path: '/algorithms/string/z-algorithm',
        description: 'Computes Z-array for linear-time prefix-based pattern matching.',
        timeComplexity: { best: 'O(n + m)', average: 'O(n + m)', worst: 'O(n + m)' },
        spaceComplexity: 'O(n + m)',
        useCases: ['String matching', 'Prefix computations', 'Pattern analytics']
    },
    {
        id: 'u31',
        name: 'Boyer-Moore Algorithm',
        category: 'String',
        difficulty: 'Advanced',
        path: '/algorithms/string/boyer-moore',
        description: 'Right-to-left pattern matching with large jumps via heuristics.',
        timeComplexity: { best: 'O(n / m)', average: 'O(n / m)', worst: 'O(n * m)' },
        spaceComplexity: 'O(alphabet)',
        useCases: ['High-performance search', 'Large text scanning', 'Search optimization']
    },
    {
        id: 'u32',
        name: "Manacher's Algorithm",
        category: 'String',
        difficulty: 'Advanced',
        path: '/algorithms/string/manacher',
        description: 'Finds longest palindromic substring in linear time.',
        timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Palindrome analysis', 'String optimization', 'Linear palindrome search']
    },
    {
        id: 'u33',
        name: 'N-Queens Problem',
        category: 'Backtracking',
        difficulty: 'Advanced',
        path: '/algorithms/backtracking/n-queens',
        description: 'Places N queens on board without row/column/diagonal conflicts.',
        timeComplexity: { best: 'O(N!)', average: 'O(N!)', worst: 'O(N!)' },
        spaceComplexity: 'O(N)',
        useCases: ['Constraint solving', 'Backtracking education', 'Search tree pruning']
    },
    {
        id: 'u34',
        name: 'Rat in a Maze',
        category: 'Backtracking',
        difficulty: 'Intermediate',
        path: '/algorithms/backtracking/rat-in-maze',
        description: 'Explores all valid paths from source to destination in blocked grid.',
        timeComplexity: { best: 'O(2^(n^2))', average: 'O(2^(n^2))', worst: 'O(2^(n^2))' },
        spaceComplexity: 'O(n^2)',
        useCases: ['Path enumeration', 'Grid recursion', 'Backtracking traversal']
    },
    {
        id: 'u35',
        name: 'Subset Sum',
        category: 'Backtracking',
        difficulty: 'Intermediate',
        path: '/algorithms/backtracking/subset-sum',
        description: 'Finds subsets whose total equals a target using include/exclude recursion.',
        timeComplexity: { best: 'O(2^n)', average: 'O(2^n)', worst: 'O(2^n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Combinatorial search', 'Pruning strategy learning', 'Target sum problems']
    },
    {
        id: 'u36',
        name: 'Sieve of Eratosthenes',
        category: 'Math',
        difficulty: 'Beginner',
        path: '/algorithms/math/sieve',
        description: 'Marks multiples to efficiently list prime numbers up to N.',
        timeComplexity: { best: 'O(n log log n)', average: 'O(n log log n)', worst: 'O(n log log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Prime precomputation', 'Number theory', 'Competitive programming']
    },
    {
        id: 'u37',
        name: 'Euclidean GCD',
        category: 'Math',
        difficulty: 'Beginner',
        path: '/algorithms/math/euclidean-gcd',
        description: 'Computes greatest common divisor using repeated modulo reduction.',
        timeComplexity: { best: 'O(log min(a,b))', average: 'O(log min(a,b))', worst: 'O(log min(a,b))' },
        spaceComplexity: 'O(1)',
        useCases: ['Fraction reduction', 'Modular arithmetic', 'Number theory foundations']
    },
    {
        id: 'u38',
        name: 'Fast Exponentiation',
        category: 'Math',
        difficulty: 'Intermediate',
        path: '/algorithms/math/fast-exponentiation',
        description: 'Computes power in logarithmic time via repeated squaring.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(log n)',
        useCases: ['Modular exponentiation', 'Cryptography basics', 'Power calculations']
    },
    {
        id: 'u39',
        name: 'Bit Manipulation Basics',
        category: 'Math',
        difficulty: 'Beginner',
        path: '/algorithms/math/bit-manipulation',
        description: 'Core bit operations: set/clear/toggle/check/count and power-of-two checks.',
        timeComplexity: { best: 'O(1)', average: 'O(1)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Low-level optimization', 'Competitive programming tricks', 'Binary arithmetic']
    },
    {
        id: 'u40',
        name: 'Palindrome Partitioning',
        category: 'Dynamic Programming',
        difficulty: 'Advanced',
        path: '/algorithms/dp/palindrome-partitioning',
        description: 'Generates partitions where every substring is a palindrome.',
        timeComplexity: { best: 'O(n * 2^n)', average: 'O(n * 2^n)', worst: 'O(n * 2^n)' },
        spaceComplexity: 'O(n^2)',
        useCases: ['Palindrome decomposition', 'DP + backtracking blend', 'Partition generation']
    }
];

const defaultComplexity = {
    best: 'N/A',
    average: 'N/A',
    worst: 'N/A'
};

const defaultUseCases = [
    'Algorithm study',
    'Interview preparation',
    'Visualizer practice'
];

export const algorithmList = [...coreAlgorithms, ...expansionAlgorithms].map((algorithm) => ({
    ...algorithm,
    inputLimit: 10,
    timeComplexity: {
        ...defaultComplexity,
        ...(algorithm.timeComplexity || {})
    },
    spaceComplexity: algorithm.spaceComplexity || 'N/A',
    useCases: Array.isArray(algorithm.useCases) && algorithm.useCases.length
        ? algorithm.useCases
        : defaultUseCases
}));
