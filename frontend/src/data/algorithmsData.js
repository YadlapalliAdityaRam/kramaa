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
        id: 's-shell',
        name: 'Shell Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/shell',
        description: 'Gap-based variation of Insertion Sort. Sorts distant elements and shrinks gap to 1.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n^(4/3))', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Medium-sized lists', 'Embedded systems', 'Where memory is tight']
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
        description: 'Divide-and-conquer sorting that uses a pivot element to partition the array into smaller and larger subarrays.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n^2)' },
        spaceComplexity: 'O(log n)',
        useCases: ['General-purpose array sorting', 'Performance critical applications', 'Standard library implementations']
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
        id: 's9',
        name: 'Cocktail Shaker Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/cocktail-shaker',
        description: 'Bidirectional variation of Bubble Sort that traverses in both directions.',
        timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Nearly sorted data', 'Reducing "turtles" in Bubble Sort', 'Small datasets']
    },
    {
        id: 's10',
        name: 'Comb Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/comb',
        description: 'Improves Bubble Sort by using a shrinking gap to compare distant elements.',
        timeComplexity: { best: 'O(n log n)', average: 'O(n^2 / 2^p)', worst: 'O(n^2)' },
        spaceComplexity: 'O(1)',
        useCases: ['Eliminating turtles in Bubble Sort', 'Small/Medium datasets', 'Non-stable sorting needs']
    },
    {
        id: 's11',
        name: 'Counting Sort',
        category: 'Sorting',
        difficulty: 'Intermediate',
        path: '/algorithms/sorting/counting',
        description: 'A non-comparison based sorting algorithm that counts the frequency of each element.',
        timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)' },
        spaceComplexity: 'O(n + k)',
        useCases: ['Small range of integer values', 'Sub-routine for Radix Sort', 'When stability is required']
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
        id: 'se1_5',
        name: 'Sentinel Linear Search',
        category: 'Searching',
        difficulty: 'Beginner',
        path: '/algorithms/searching/sentinel-linear',
        description: 'Improves Linear Search by replacing the last element with the target to avoid boundary checks in the loop.',
        timeComplexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Unsorted arrays where minimizing loop conditions improves performance slightly']
    },
    {
        id: 'se2',
        name: 'Binary Search',
        category: 'Searching',
        difficulty: 'Beginner',
        path: '/algorithms/searching/binary',
        description: 'Efficiently find a target in a sorted collection by repeatedly halving the search area.',
        timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Search in sorted datasets', 'Looking up words in a dictionary', 'Finding a value in a range']
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
        path: '/algorithms/searching/exponential-search',
        description: 'Expands search range exponentially then applies binary search.',
        timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Unbounded arrays', 'Sorted streams', 'Early-target lookups']
    },

    {
        id: 'se7',
        name: 'Fibonacci Search',
        category: 'Searching',
        difficulty: 'Advanced',
        path: '/algorithms/searching/fibonacci-search',
        description: 'Search algorithm for sorted arrays using Fibonacci numbers to divide the range.',
        timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Systems with slow multiplication', 'Large sorted datasets', 'Uniform memory scale']
    },
    {
        id: 'g1',
        name: 'Breadth-First Search (BFS)',
        category: 'Graphs',
        difficulty: 'Intermediate',
        path: '/algorithms/graphs/bfs',
        description: 'Traverses graph level-by-level using a queue. Ideal for finding shortest paths in unweighted graphs.',
        timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
        spaceComplexity: 'O(V)',
        useCases: ['Shortest path in unweighted networks', 'Social network connections (degree of separation)', 'GPS navigation foundations']
    },
    {
        id: 'g6',
        name: 'Dijkstra\'s Algorithm',
        category: 'Graphs',
        difficulty: 'Intermediate',
        path: '/algorithms/graphs/dijkstra',
        description: 'Finds the shortest path from a source node to all other nodes in a weighted graph.',
        timeComplexity: { best: 'O((V + E) log V)', average: 'O((V + E) log V)', worst: 'O((V + E) log V)' },
        spaceComplexity: 'O(V)',
        useCases: ['Dijkstra\'s is the foundation for most modern navigation and routing systems.']
    },
    {
        id: 'g2',
        name: 'Depth-First Search (DFS)',
        category: 'Graphs',
        difficulty: 'Intermediate',
        path: '/algorithms/graphs/dfs',
        description: 'Explores graph branches deeply using a stack or recursion. Fundamental for structure analysis.',
        timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
        spaceComplexity: 'O(V)',
        useCases: ['Cycle detection in graphs', 'Topological sorting', 'Solving puzzles (like mazes) and structural connectivity']
    },

    {
        id: 'g4',
        name: "Bellman-Ford",
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
        path: '/algorithms/trees/avl-tree',
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
        path: '/algorithms/trees/red-black-tree',
        description: 'Balanced BST using coloring rules for near-logarithmic operations.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Language/runtime maps', 'Set implementations', 'Balanced dictionary indexing']
    },
    {
        id: 't4',
        name: 'Segment Tree',
        category: 'Trees',
        difficulty: 'Advanced',
        path: '/algorithms/trees/segment-tree',
        description: 'Supports efficient range queries and point updates on an array.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Range sum queries', 'Range min/max', 'Competitive programming']
    },
    {
        id: 't5',
        name: 'Fenwick Tree (BIT)',
        category: 'Trees',
        difficulty: 'Advanced',
        path: '/algorithms/trees/fenwick',
        description: 'Binary Indexed Tree for efficient prefix sum computation and point updates.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Prefix sums', 'Frequency counting', 'Inversions counting']
    },
    {
        id: 't6',
        name: 'Heap / Priority Queue',
        category: 'Trees',
        difficulty: 'Intermediate',
        path: '/algorithms/trees/priority-queue',
        description: 'Min-Heap with insert (bubble-up) and extract-min (heapify-down) operations.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Priority scheduling', 'Heap sort', 'Dijkstra / Prim helpers']
    },
    {
        id: 't7',
        name: 'Splay Tree',
        category: 'Trees',
        difficulty: 'Hard',
        path: '/algorithms/trees/splay',
        description: 'A self-adjusting binary search tree where recently accessed elements are moved to the root using rotations.',
        timeComplexity: { best: 'O(log n)', average: 'O(log n) amortized', worst: 'O(n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Cache implementations', 'Memory management', 'Data streams with frequent access to recent elements']
    },
    {
        id: 't8',
        name: 'Trie (Prefix Tree)',
        category: 'Trees',
        difficulty: 'Intermediate',
        path: '/algorithms/trees/trie',
        description: 'An efficient information retrieval data structure that stores character paths to share common prefixes among words.',
        timeComplexity: { best: 'O(m)', average: 'O(m)', worst: 'O(m)' },
        spaceComplexity: 'O(ALPHABET * m * n)',
        useCases: ['Autocomplete features', 'Spell checkers', 'IP routing tables', 'T9 predictive text']
    },
    {
        id: 't-nary-dfs',
        name: 'N-ary DFS',
        category: 'Trees',
        difficulty: 'Intermediate',
        path: '/algorithms/trees/nary-dfs',
        description: 'Depth-first search traversal on a general tree with any number of children.',
        timeComplexity: { best: 'O(V)', average: 'O(V)', worst: 'O(V)' },
        spaceComplexity: 'O(H)',
        useCases: ['Folder structure traversal', 'DOM tree analysis']
    },
    {
        id: 't-nary-bfs',
        name: 'N-ary BFS (Level Order)',
        category: 'Trees',
        difficulty: 'Intermediate',
        path: '/algorithms/trees/nary-bfs',
        description: 'Breadth-first search traversal on a general tree, visiting nodes level-by-level.',
        timeComplexity: { best: 'O(V)', average: 'O(V)', worst: 'O(V)' },
        spaceComplexity: 'O(W)',
        useCases: ['Organizational chart leveling', 'Broad search workloads']
    },
    {
        id: 't-nary-height',
        name: 'N-ary Tree Height',
        category: 'Trees',
        difficulty: 'Intermediate',
        path: '/algorithms/trees/nary-height',
        description: 'Calculates the maximum depth/height of a general N-ary tree.',
        timeComplexity: { best: 'O(V)', average: 'O(V)', worst: 'O(V)' },
        spaceComplexity: 'O(H)',
        useCases: ['Tree metrics', 'Structural analysis']
    },
    {
        id: 'dp1',
        name: 'Knapsack Problem (0/1)',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/knapsack',
        description: 'An optimization problem that finds the maximum value of items that can fit into a fixed-capacity knapsack.',
        timeComplexity: { best: 'O(nW)', average: 'O(nW)', worst: 'O(nW)' },
        spaceComplexity: 'O(nW)',
        useCases: ['Resource allocation', 'Budget optimization', 'Load balancing in distributed systems', 'Investment selection']
    },
    {
        id: 'dp-lcs',
        name: 'Longest Common Subsequence',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/lcs',
        description: 'Finds the longest subsequence present in both strings in the same relative order.',
        timeComplexity: { best: 'O(mn)', average: 'O(mn)', worst: 'O(mn)' },
        spaceComplexity: 'O(mn)',
        useCases: ['Diff tools', 'Bioinformatics', 'Version control systems']
    },
    {
        id: 'dp2',
        name: 'Edit Distance (Levenshtein)',
        category: 'Dynamic Programming',
        difficulty: 'Advanced',
        path: '/algorithms/dp/edit-distance',
        description: 'Calculates the minimum number of operations (insert, delete, replace) to transform one string into another.',
        timeComplexity: { best: 'O(mn)', average: 'O(mn)', worst: 'O(mn)' },
        spaceComplexity: 'O(mn)',
        useCases: ['Spell checkers', 'DNA sequence alignment', 'Natural Language Processing', 'Diff tools']
    },
    {
        id: 'dp3',
        name: 'Coin Change (Min Coins)',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/coin-change',
        description: 'Computes the minimum number of coins needed to make a target amount using given denominations.',
        timeComplexity: { best: 'O(n * amount)', average: 'O(n * amount)', worst: 'O(n * amount)' },
        spaceComplexity: 'O(amount)',
        useCases: ['Currency calculation', 'Payment systems', 'Optimization problems', 'Combinatorics foundations']
    },
    {
        id: 'dp4',
        name: 'Coin Change (Total Ways)',
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/coin-change-ways',
        description: 'Computes the total number of distinct ways to make a target amount using given denominations, order un-important.',
        timeComplexity: { best: 'O(n * amount)', average: 'O(n * amount)', worst: 'O(n * amount)' },
        spaceComplexity: 'O(n * amount)',
        useCases: ['Combinatorics', 'Mathematical ways counting', 'Unbounded knapsack variants']
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
        path: '/algorithms/graphs/kruskals-mst',
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
        category: 'Dynamic Programming',
        difficulty: 'Intermediate',
        path: '/algorithms/dp/subset-sum',
        description: 'Determines if any subset of the given array adds up to a target sum using a 2D boolean DP grid and traces back to find the exact elements.',
        timeComplexity: { best: 'O(n * target)', average: 'O(n * target)', worst: 'O(n * target)' },
        spaceComplexity: 'O(n * target)',
        useCases: ['0/1 Knapsack variants', 'Exact change problems', 'Partition problems']
    },
    {
        id: 'u36',
        name: 'Sieve of Eratosthenes',
        category: 'Math',
        difficulty: 'Beginner',
        path: '/algorithms/math/sieve',
        description: 'Efficiently find all prime numbers up to N by systematically crossing out multiples in a grid.',
        timeComplexity: { best: 'O(n log log n)', average: 'O(n log log n)', worst: 'O(n log log n)' },
        spaceComplexity: 'O(n)',
        useCases: ['Prime number precomputation', 'Number theory education', 'Competitive programming']
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
    },
    {
        id: 'tp1',
        name: 'Two Pointers Technique',
        category: 'Searching',
        difficulty: 'Beginner',
        path: '/algorithms/searching/two-pointers',
        description: 'Uses two indices moving inward from opposite ends of a sorted array to efficiently find pairs.',
        timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Pair sum problems', 'Sorted array scanning', 'Reducing nested loops']
    },
    {
        id: 'sw1',
        name: 'Sliding Window Technique',
        category: 'Searching',
        difficulty: 'Beginner',
        path: '/algorithms/searching/sliding-window',
        description: 'Processes a moving window of elements to find optimal subarrays without rescanning.',
        timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
        spaceComplexity: 'O(1)',
        useCases: ['Maximum subarray sum', 'Fixed-size window problems', 'String pattern matching']
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
