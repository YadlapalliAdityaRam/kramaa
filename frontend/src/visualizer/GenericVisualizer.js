import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DualView from './DualView';
import AnimationCanvas from './AnimationCanvas';
import GraphCanvas from './GraphCanvas';
import TreeCanvas, { TREE_STATE_COLORS } from './TreeCanvas';
import DPTableCanvas from './DPTableCanvas';
import ActivityCanvas from './ActivityCanvas';
import GridCanvas from './GridCanvas';
import GraphInput from '../components/GraphInput/GraphInput';
import TreeInputModal from './TreeInputModal';
import StringMatchMiniCanvas from './StringMatchMiniCanvas';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useAnimation from '../hooks/useAnimation';
import useGenericAnimation from '../hooks/useGenericAnimation';
import InputArrayDisplay from '../components/InputArrayDisplay';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { algorithmLineMaps } from '../data/algorithmLineMaps';
import { algorithmList } from '../data/algorithmsData';
import {
    clampAlgorithmTarget,
    generateFallbackArraySteps,
    generateFallbackCode,
    getCanvasTypeForCategory,
    getDefaultArrayData,
    getFallbackLineMap,
    getTargetFieldMeta,
    normalizeCategoryKey,
    pathToSlug,
    resolveAlgorithmTargetDefault,
    resolveDefaultTarget,
    sanitizeArrayInput
} from './algorithmFallbacks';
import { buildAlgorithmOverview } from './algorithmOverview';

// ── Sorting ───────────────────────────────────────────────
import { generateBubbleSortSteps } from '../algorithms/sorting/bubbleSort';
import { generateInsertionSortSteps } from '../algorithms/sorting/insertionSort';
import { generateSelectionSortSteps } from '../algorithms/sorting/selectionSort';
import { generateMergeSortSteps } from '../algorithms/sorting/mergeSort';
import { generateQuickSortSteps } from '../algorithms/sorting/quickSort';
import { generateHeapSortSteps } from '../algorithms/sorting/heapSort';
import { generateBucketSortSteps } from '../algorithms/sorting/bucketSort';
import { generateRadixSortSteps } from '../algorithms/sorting/radixSort';
import { generateShellSortSteps } from '../algorithms/sorting/shellSort';
import { generateCountingSortSteps } from '../algorithms/sorting/countingSort';
import { generateTimSortSteps } from '../algorithms/sorting/timSort';
import { generateCycleSortSteps } from '../algorithms/sorting/cycleSort';
import { generateCocktailShakerSortSteps } from '../algorithms/sorting/cocktailShakerSort';
import { generateCombSortSteps } from '../algorithms/sorting/combSort';

// ── Searching ─────────────────────────────────────────────
import { generateLinearSearchSteps } from '../algorithms/searching/linearSearch';
import { generateBinarySearchSteps } from '../algorithms/searching/binarySearch';
import { generateJumpSearchSteps } from '../algorithms/searching/jumpSearch';
import { generateInterpolationSearchSteps } from '../algorithms/searching/interpolationSearch';
import { generateExponentialSearchSteps } from '../algorithms/searching/exponentialSearch';

import { generateFibonacciSearchSteps } from '../algorithms/searching/fibonacciSearch';
import { generateSentinelLinearSearchSteps } from '../algorithms/searching/sentinelLinearSearch';
import { generateTwoPointersSteps } from '../algorithms/searching/twoPointers';
import { generateSlidingWindowSteps } from '../algorithms/searching/slidingWindow';

// ── Graphs ────────────────────────────────────────────────
import { generateBFSSteps } from '../algorithms/graphs/bfs';
import { generateDFSSteps } from '../algorithms/graphs/dfs';
import { generateDijkstraSteps } from '../algorithms/graphs/dijkstra';
import { generateBellmanFordSteps } from '../algorithms/graphs/bellmanFord';
import { generatePrimsSteps } from '../algorithms/graphs/prims';
import { defaultGraph, defaultWeightedGraph, bfsGraph, dfsGraph } from '../algorithms/graphs/graphData';

// ── Trees ─────────────────────────────────────────────────
import { generateBinaryTreeTraversalSteps, defaultTreeValues } from '../algorithms/trees/binaryTree';
import { generateAVLTreeSteps } from '../algorithms/trees/avlTree';
import { generateRedBlackTreeSteps } from '../algorithms/trees/redBlackTree';
import { defaultNaryTreeData, generateNaryDFSSteps, generateNaryBFSSteps, generateNaryTreeHeightSteps } from '../algorithms/trees/naryTree';
import { generateSegmentTreeSteps } from '../algorithms/trees/segmentTree';
import { generateFenwickTreeSteps } from '../algorithms/trees/fenwickTree';
import { generateHeapSteps } from '../algorithms/trees/heap';
import { generateSplayTreeSteps } from '../algorithms/trees/splayTree';
import { generateTrieSteps } from '../algorithms/trees/trie';

// ── DP ────────────────────────────────────────────────────
import { generateKnapsackSteps } from '../algorithms/dp/knapsack';
import { generateLCSSteps } from '../algorithms/dp/lcs';
import { generateCoinChangeSteps } from '../algorithms/dp/coinChange';
import { generateLISSteps } from '../algorithms/dp/lis';
import { generateEditDistanceSteps } from '../algorithms/dp/editDistance';
import { generateMatrixChainSteps } from '../algorithms/dp/matrixChain';
import { generateRodCuttingSteps } from '../algorithms/dp/rodCutting';
import { generateEggDropSteps } from '../algorithms/dp/eggDrop';
import { generatePalindromePartitionSteps } from '../algorithms/dp/palindromePartition';

// ── Greedy ────────────────────────────────────────────────
import { generateActivitySelectionSteps } from '../algorithms/greedy/activitySelection';
import { generateHuffmanCodingSteps } from '../algorithms/greedy/huffmanCoding';
import { generateFractionalKnapsackSteps } from '../algorithms/greedy/fractionalKnapsack';
import { generateJobSequencingSteps } from '../algorithms/greedy/jobSequencing';

// ── String ────────────────────────────────────────────────
import { generateKMPSteps } from '../algorithms/string/kmp';
import { generateRabinKarpSteps } from '../algorithms/string/rabinKarp';
import { generateZAlgorithmSteps } from '../algorithms/string/zAlgorithm';
import { generateManacherSteps } from '../algorithms/string/manacher';

// ── Backtracking ──────────────────────────────────────────
import { generateNQueensSteps } from '../algorithms/backtracking/nQueens';
import { generateRatInMazeSteps } from '../algorithms/backtracking/ratInMaze';
import { generateSubsetSumSteps } from '../algorithms/dp/subsetSum';

// ── Math ──────────────────────────────────────────────────
import { generateSieveSteps } from '../algorithms/math/sieve';
import { generateGCDSteps } from '../algorithms/math/euclideanGcd';
import { generateFastExpSteps } from '../algorithms/math/fastExponentiation';

// ── Additional Graphs ─────────────────────────────────────
import { generateFloydWarshallSteps } from '../algorithms/graphs/floydWarshall';
import { generateTopologicalSortSteps } from '../algorithms/graphs/topologicalSort';
import { generateKosarajuSteps } from '../algorithms/graphs/kosaraju';
import { generateFloydCycleSteps } from '../algorithms/graphs/floydCycle';

// Stable constants to avoid creating new references each render
const DUMMY_ARRAY = [1];
const EMPTY_STEPS = [];
const BINARY_TREE_LEGEND = [
    {
        label: 'Default',
        description: 'Node has not been explored yet.',
        color: TREE_STATE_COLORS.default
    },
    {
        label: 'Exploring',
        description: 'Traversal is moving through this node.',
        color: TREE_STATE_COLORS.visiting
    },
    {
        label: 'Current Visit',
        description: 'This node is being added to the traversal result now.',
        color: TREE_STATE_COLORS.current
    },
    {
        label: 'Visited',
        description: 'This node was already recorded in the result.',
        color: TREE_STATE_COLORS.visited
    }
];

// ──────────────────────────────────────────────────────────
// Algorithm registry: maps URL slug to config
// ──────────────────────────────────────────────────────────
const CORE_ALGORITHM_REGISTRY = {
    // Sorting (canvasType: 'array')
    'sorting/bubble': {
        name: 'Bubble Sort',
        canvasType: 'array',
        generator: generateBubbleSortSteps,
        codeKey: 'bubbleSort'
    },
    'sorting/insertion': {
        name: 'Insertion Sort',
        canvasType: 'array',
        generator: generateInsertionSortSteps,
        codeKey: 'insertionSort'
    },
    'sorting/selection': {
        name: 'Selection Sort',
        canvasType: 'array',
        generator: generateSelectionSortSteps,
        codeKey: 'selectionSort'
    },
    'sorting/merge': {
        name: 'Merge Sort',
        canvasType: 'array',
        generator: generateMergeSortSteps,
        codeKey: 'mergeSort'
    },
    'sorting/quick': {
        name: 'Quick Sort',
        canvasType: 'array',
        generator: generateQuickSortSteps,
        codeKey: 'quickSort'
    },
    'sorting/heap': {
        name: 'Heap Sort',
        canvasType: 'array',
        generator: generateHeapSortSteps,
        codeKey: 'heapSort'
    },
    'sorting/bucket': {
        name: 'Bucket Sort',
        canvasType: 'array',
        generator: generateBucketSortSteps,
        codeKey: 'bucketSort'
    },
    'sorting/radix': {
        name: 'Radix Sort',
        canvasType: 'array',
        generator: generateRadixSortSteps,
        codeKey: 'radixSort'
    },
    'sorting/shell': {
        name: 'Shell Sort',
        canvasType: 'array',
        generator: generateShellSortSteps,
        codeKey: 'shellSort'
    },
    'sorting/counting': {
        name: 'Counting Sort',
        canvasType: 'array',
        generator: generateCountingSortSteps,
        codeKey: 'countingSort'
    },
    'sorting/tim': {
        name: 'Tim Sort',
        canvasType: 'array',
        generator: generateTimSortSteps,
        codeKey: 'timSort'
    },
    'sorting/cycle': {
        name: 'Cycle Sort',
        canvasType: 'array',
        generator: generateCycleSortSteps,
        codeKey: 'cycleSort'
    },
    'sorting/cocktail-shaker': {
        name: 'Cocktail Shaker Sort',
        canvasType: 'array',
        generator: generateCocktailShakerSortSteps,
        codeKey: 'cocktailShakerSort'
    },
    'sorting/comb': {
        name: 'Comb Sort',
        canvasType: 'array',
        generator: generateCombSortSteps,
        codeKey: 'combSort'
    },

    // Searching (canvasType: 'array')
    'searching/linear': {
        name: 'Linear Search',
        canvasType: 'array',
        generator: generateLinearSearchSteps,
        needsTarget: true,
        codeKey: 'linearSearch'
    },
    'searching/binary': {
        name: 'Binary Search',
        canvasType: 'array',
        generator: generateBinarySearchSteps,
        needsTarget: true,
        codeKey: 'binarySearch'
    },
    'searching/jump': {
        name: 'Jump Search',
        canvasType: 'array',
        generator: generateJumpSearchSteps,
        needsTarget: true,
        codeKey: 'jumpSearch'
    },
    'searching/interpolation': {
        name: 'Interpolation Search',
        canvasType: 'array',
        generator: generateInterpolationSearchSteps,
        needsTarget: true,
        codeKey: 'interpolationSearch'
    },
    'searching/exponential': {
        name: 'Exponential Search',
        canvasType: 'array',
        generator: generateExponentialSearchSteps,
        needsTarget: true,
        codeKey: 'exponentialSearch'
    },

    'searching/fibonacci': {
        name: 'Fibonacci Search',
        canvasType: 'array',
        generator: generateFibonacciSearchSteps,
        needsTarget: true,
        codeKey: 'fibonacciSearch'
    },
    'searching/sentinel-linear': {
        name: 'Sentinel Linear Search',
        canvasType: 'array',
        generator: generateSentinelLinearSearchSteps,
        needsTarget: true,
        codeKey: 'sentinelLinearSearch'
    },
    'searching/two-pointers': {
        name: 'Two Pointers Technique',
        canvasType: 'array',
        generator: (values, target) => generateTwoPointersSteps(values, target),
        needsTarget: true,
        defaultData: [1, 2, 4, 6, 8, 10],
        defaultTarget: 10,
        codeKey: 'twoPointers'
    },
    'searching/sliding-window': {
        name: 'Sliding Window Technique',
        canvasType: 'array',
        generator: (values, target) => generateSlidingWindowSteps(values, target),
        needsTarget: true,
        defaultData: [2, 1, 5, 1, 3, 2],
        defaultTarget: 3,
        codeKey: 'slidingWindow'
    },

    // Graphs (canvasType: 'graph')
    'graphs/bfs': {
        name: 'Breadth-First Search',
        canvasType: 'graph',
        generator: (graph, startNode) => generateBFSSteps(graph, startNode),
        defaultData: bfsGraph,
        codeKey: 'bfs'
    },
    'graphs/dfs': {
        name: 'Depth-First Search',
        canvasType: 'graph',
        generator: (graph, startNode) => generateDFSSteps(graph, startNode),
        defaultData: dfsGraph,
        codeKey: 'dfs'
    },
    'graphs/dijkstra': {
        name: "Dijkstra's Algorithm",
        canvasType: 'graph',
        generator: (graph, startNode) => generateDijkstraSteps(graph, startNode),
        defaultData: defaultWeightedGraph,
        codeKey: 'dijkstra'
    },
    'graphs/bellman-ford': {
        name: 'Bellman-Ford Algorithm',
        canvasType: 'graph',
        generator: (graph, startNode) => generateBellmanFordSteps(graph, startNode),
        defaultData: defaultWeightedGraph,
        codeKey: 'bellmanFord'
    },
    'graphs/prims': {
        name: "Prim's MST",
        canvasType: 'graph',
        generator: (graph, startNode) => generatePrimsSteps(graph, startNode),
        defaultData: defaultWeightedGraph,
        codeKey: 'prims'
    },

    // Trees (canvasType: 'tree')
    'trees/traversals': {
        name: 'Binary Tree Traversals',
        canvasType: 'tree',
        generator: (values, traversalType, customTreeData) => generateBinaryTreeTraversalSteps(values, traversalType || 'inorder', customTreeData || null),
        defaultData: defaultTreeValues,
        codeKey: 'binaryTree'
    },
    'trees/avl': {
        name: 'AVL Tree',
        canvasType: 'tree',
        generator: (values, _t, _p, _g, customTreeData) => generateAVLTreeSteps(values, _t, _p, _g, customTreeData || null),
        defaultData: [30, 20, 40, 10, 25, 35, 50, 5, 15],
        codeKey: 'avlTree'
    },
    'trees/red-black-tree': {
        name: 'Red-Black Tree',
        canvasType: 'tree',
        generator: (values, _t, _p, _g, customTreeData) => generateRedBlackTreeSteps(values, _t, _p, _g, customTreeData || null),
        defaultData: [41, 22, 58, 15, 33, 50, 63, 10, 27],
        codeKey: 'redBlackTree'
    },
    'trees/nary-dfs': {
        name: 'N-ary DFS',
        canvasType: 'tree',
        generator: (values, t, p, g, treeData) => generateNaryDFSSteps(treeData || null),
        defaultData: defaultNaryTreeData,
        codeKey: 'naryDFS'
    },
    'trees/nary-bfs': {
        name: 'N-ary BFS',
        canvasType: 'tree',
        generator: (values, t, p, g, treeData) => generateNaryBFSSteps(treeData || null),
        defaultData: defaultNaryTreeData,
        codeKey: 'naryBFS'
    },
    'trees/nary-height': {
        name: 'N-ary Tree Height',
        canvasType: 'tree',
        generator: (values, t, p, g, treeData) => generateNaryTreeHeightSteps(treeData || null),
        defaultData: defaultNaryTreeData,
        codeKey: 'naryHeight'
    },
    'trees/segment-tree': {
        name: 'Segment Tree',
        canvasType: 'tree',
        generator: (values) => generateSegmentTreeSteps(values),
        defaultData: [1, 3, 5, 7, 9, 11],
        codeKey: 'segmentTree'
    },
    'trees/fenwick': {
        name: 'Fenwick Tree (BIT)',
        canvasType: 'tree',
        generator: (values) => generateFenwickTreeSteps(values),
        defaultData: [2, 4, 5, 7, 8, 6, 3, 1],
        codeKey: 'fenwickTree'
    },
    'trees/priority-queue': {
        name: 'Heap / Min-Max Priority Queue',
        canvasType: 'tree',
        generator: (values) => generateHeapSteps(values),
        defaultData: [10, 5, 20, 3, 8, 15, 2],
        codeKey: 'heap'
    },
    'trees/splay': {
        name: 'Splay Tree',
        canvasType: 'tree',
        generator: (values) => generateSplayTreeSteps(values),
        defaultData: [10, 20, 30, 40, 50, 25],
        codeKey: 'splayTree'
    },
    'trees/trie': {
        name: 'Trie (Prefix Tree)',
        canvasType: 'tree',
        generator: () => generateTrieSteps(),
        codeKey: 'trie'
    },

    // DP (canvasType: 'dp')
    'dp/knapsack': {
        name: '0/1 Knapsack',
        canvasType: 'dp',
        generator: () => generateKnapsackSteps(),
        codeKey: 'knapsack'
    },
    'dp/lcs': {
        name: 'Longest Common Subsequence',
        canvasType: 'dp',
        generator: () => generateLCSSteps(),
        codeKey: 'lcs'
    },
    'dp/coin-change': {
        name: 'Coin Change',
        canvasType: 'dp',
        generator: () => generateCoinChangeSteps(),
        codeKey: 'coinChange'
    },
    'dp/lis': {
        name: 'Longest Increasing Subsequence',
        canvasType: 'dp',
        generator: (values) => generateLISSteps(values),
        codeKey: 'lis'
    },
    'dp/edit-distance': {
        name: 'Edit Distance (Levenshtein)',
        canvasType: 'dp',
        generator: () => generateEditDistanceSteps(),
        codeKey: 'editDistance'
    },
    'dp/matrix-chain': {
        name: 'Matrix Chain Multiplication',
        canvasType: 'dp',
        generator: (values) => generateMatrixChainSteps(values),
        codeKey: 'matrixChain'
    },
    'dp/rod-cutting': {
        name: 'Rod Cutting',
        canvasType: 'dp',
        generator: (values) => generateRodCuttingSteps(values),
        codeKey: 'rodCutting'
    },
    'dp/egg-drop': {
        name: 'Egg Drop Problem',
        canvasType: 'dp',
        generator: () => generateEggDropSteps(),
        codeKey: 'eggDrop'
    },
    'dp/palindrome-partitioning': {
        name: 'Palindrome Partitioning',
        canvasType: 'dp',
        generator: () => generatePalindromePartitionSteps(),
        codeKey: 'palindromePartition'
    },

    // Greedy
    'greedy/activity-selection': {
        name: 'Activity Selection',
        canvasType: 'activity',
        generator: () => generateActivitySelectionSteps(),
        codeKey: 'activitySelection'
    },
    'greedy/huffman': {
        name: 'Huffman Coding',
        canvasType: 'tree',
        generator: () => generateHuffmanCodingSteps(),
        codeKey: 'huffmanCoding'
    },
    'greedy/fractional-knapsack': {
        name: 'Fractional Knapsack',
        canvasType: 'array',
        generator: (values) => generateFractionalKnapsackSteps(values),
        codeKey: 'fractionalKnapsack'
    },
    'greedy/job-sequencing': {
        name: 'Job Sequencing with Deadlines',
        canvasType: 'array',
        generator: (values) => generateJobSequencingSteps(values),
        codeKey: 'jobSequencing'
    },

    // String
    'string/kmp': {
        name: 'KMP Algorithm',
        canvasType: 'string',
        needsTarget: true,
        generator: (values, target) => generateKMPSteps(values, target),
        codeKey: 'kmp'
    },
    'string/rabin-karp': {
        name: 'Rabin-Karp Algorithm',
        canvasType: 'string',
        needsTarget: true,
        generator: (values, target) => generateRabinKarpSteps(values, target),
        defaultData: ['A', 'B', 'C', 'C', 'D', 'D', 'A', 'E', 'F', 'G'],
        defaultTarget: 'CDD',
        codeKey: 'rabinKarp'
    },
    'string/z-algorithm': {
        name: 'Z-Algorithm',
        canvasType: 'array',
        generator: () => generateZAlgorithmSteps(),
        codeKey: 'zAlgorithm'
    },
    'string/manacher': {
        name: "Manacher's Algorithm",
        canvasType: 'array',
        generator: () => generateManacherSteps(),
        codeKey: 'manacher'
    },
    // Backtracking
    'backtracking/n-queens': {
        name: 'N-Queens Problem',
        canvasType: 'grid',
        categoryKey: 'backtracking',
        generator: (values) => generateNQueensSteps(values && values[0]),
        codeKey: 'nQueens'
    },
    'backtracking/rat-in-maze': {
        name: 'Rat in a Maze',
        canvasType: 'grid',
        categoryKey: 'backtracking',
        generator: (values) => generateRatInMazeSteps(values && values[0]),
        codeKey: 'ratInMaze'
    },
    'backtracking/subset-sum': {
        name: 'Subset Sum',
        canvasType: 'array',
        categoryKey: 'backtracking',
        generator: (values, target) => generateSubsetSumSteps(values, target),
        needsTarget: true,
        codeKey: 'subsetSum'
    },

    // Math
    'math/sieve': {
        name: 'Sieve of Eratosthenes',
        canvasType: 'grid',
        categoryKey: 'math',
        generator: (values) => generateSieveSteps(values && values[0]),
        codeKey: 'sieve'
    },
    'math/euclidean-gcd': {
        name: 'Euclidean GCD',
        canvasType: 'array',
        generator: (values) => generateGCDSteps(values && values[0], values && values[1]),
        codeKey: 'euclideanGcd'
    },
    'math/fast-exponentiation': {
        name: 'Fast Exponentiation',
        canvasType: 'array',
        generator: (values) => generateFastExpSteps(values && values[0], values && values[1]),
        codeKey: 'fastExponentiation'
    },

    // Additional Graphs
    'graphs/floyd-warshall': {
        name: 'Floyd-Warshall',
        canvasType: 'graph',
        generator: (graph, startNode) => generateFloydWarshallSteps(graph, startNode),
        defaultData: defaultWeightedGraph,
        codeKey: 'floydWarshall'
    },
    'graphs/topological-sort': {
        name: 'Topological Sort',
        canvasType: 'graph',
        generator: (graph, startNode) => generateTopologicalSortSteps(graph, startNode),
        defaultData: defaultGraph,
        codeKey: 'topologicalSort'
    },
    'graphs/floyd-cycle': {
        name: "Cycle Detection (Floyd's)",
        canvasType: 'graph',
        generator: (graph, startNode) => generateFloydCycleSteps(graph, startNode),
        defaultData: defaultGraph,
        codeKey: 'floydCycle'
    },
    'graphs/kosaraju': {
        name: "Kosaraju's Algorithm",
        canvasType: 'graph',
        generator: (graph, startNode) => generateKosarajuSteps(graph, startNode),
        defaultData: defaultGraph,
        codeKey: 'kosaraju'
    }
};

const buildFallbackConfig = (algorithmMeta) => {
    const slug = pathToSlug(algorithmMeta.path);
    const categoryKey = normalizeCategoryKey(slug.split('/')[0]);
    const canvasType = getCanvasTypeForCategory(categoryKey);
    const fallbackCodeKey = `fallback_${slug.replace(/[\/-]/g, '_')}`;

    if (canvasType === 'array') {
        return {
            name: algorithmMeta.name,
            canvasType,
            codeKey: fallbackCodeKey,
            categoryKey,
            needsTarget: categoryKey === 'searching',
            generator: (inputArray, target) => generateFallbackArraySteps({
                categoryKey,
                name: algorithmMeta.name,
                array: sanitizeArrayInput(inputArray, getDefaultArrayData()),
                target
            })
        };
    }

    if (canvasType === 'graph') {
        return {
            name: algorithmMeta.name,
            canvasType,
            codeKey: fallbackCodeKey,
            categoryKey,
            defaultData: defaultGraph,
            generator: (graph, startNode) => generateBFSSteps(graph || defaultGraph, startNode || graph?.nodes?.[0]?.id || 'A')
        };
    }

    if (canvasType === 'tree') {
        return {
            name: algorithmMeta.name,
            canvasType,
            codeKey: fallbackCodeKey,
            categoryKey,
            defaultData: defaultTreeValues,
            generator: (values) => generateBinaryTreeTraversalSteps(values || defaultTreeValues, 'inorder')
        };
    }

    if (canvasType === 'dp') {
        return {
            name: algorithmMeta.name,
            canvasType,
            codeKey: fallbackCodeKey,
            categoryKey,
            generator: () => generateKnapsackSteps()
        };
    }

    return {
        name: algorithmMeta.name,
        canvasType: 'activity',
        codeKey: fallbackCodeKey,
        categoryKey,
        generator: () => generateActivitySelectionSteps()
    };
};

const ALGORITHM_REGISTRY = (() => {
    const registry = { ...CORE_ALGORITHM_REGISTRY };
    algorithmList.forEach((algorithmMeta) => {
        const slug = pathToSlug(algorithmMeta.path);
        if (!slug || registry[slug]) return;
        registry[slug] = buildFallbackConfig(algorithmMeta);
    });
    return registry;
})();

// ──────────────────────────────────────────────────────────
// GenericVisualizer Component
// ──────────────────────────────────────────────────────────
const GenericVisualizer = () => {
    const { category, algorithm } = useParams();
    const slug = `${category}/${algorithm}`;
    const config = ALGORITHM_REGISTRY[slug];

    if (!config) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>{algorithm ? algorithm.charAt(0).toUpperCase() + algorithm.slice(1) : 'Algorithm'} Visualizer</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Visualization for <strong>{algorithm}</strong> is coming soon!
                </p>
            </div>
        );
    }

    return <VisualizerEngine config={config} slug={slug} />;
};

// ──────────────────────────────────────────────────────────
// Main rendering engine
// ──────────────────────────────────────────────────────────
const VisualizerEngine = ({ config, slug }) => {
    const { canvasType, name, generator, needsTarget, defaultData, codeKey } = config;
    const isArrayBased = canvasType === 'array';
    const targetMeta = useMemo(() => getTargetFieldMeta(name, canvasType), [name, canvasType]);

    // State for array-based algorithms
    const [array, setArray] = useState(getDefaultArrayData());
    const [searchTarget, setSearchTarget] = useState(() => resolveAlgorithmTargetDefault(name, getDefaultArrayData(), config.defaultTarget));

    // State for graph-based algorithms
    const [customGraph, setCustomGraph] = useState(null);
    const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
    const [customStartNode, setCustomStartNode] = useState(null);

    // State for tree-based algorithms
    const [customTree, setCustomTree] = useState(null);
    const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);

    // State for language selection
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    // State for traversal type selector
    const [traversalType, setTraversalType] = useState('inorder');

    useEffect(() => {
        if (!needsTarget) return;
        const seedData = Array.isArray(defaultData) && defaultData.length ? defaultData : getDefaultArrayData();
        setSearchTarget(resolveAlgorithmTargetDefault(name, seedData, config.defaultTarget));
    }, [defaultData, name, needsTarget, config.defaultTarget]);

    // Array-supported tree algorithms
    const isArrayTree = canvasType === 'tree' && ['Binary Tree Traversals', 'Segment Tree', 'Fenwick Tree (BIT)', 'Heap / Min-Max Priority Queue', 'Splay Tree', 'AVL Tree'].includes(name);
    const activeData = isArrayTree && array && array.length > 0 ? array : defaultData;

    // Generate steps
    const steps = useMemo(() => {
        if (isArrayBased) {
            if (needsTarget) {
                return generator(array, searchTarget);
            }
            return generator(array);
        }
        if (canvasType === 'string') {
            return generator(array, searchTarget);
        }
        if (canvasType === 'tree' && name.startsWith('N-ary')) {
            return generator([], searchTarget, [], null, customTree || defaultData || null);
        }
        if (canvasType === 'tree' && name === 'Binary Tree Traversals') {
            return generator(activeData, traversalType, customTree);
        }
        if (canvasType === 'tree' && name === 'AVL Tree') {
            return generator(activeData);
        }
        if (canvasType === 'tree' && name === 'Red-Black Tree') {
            return generator(defaultData, null, null, null, customTree);
        }
        if (canvasType === 'graph') {
            const graphToUse = customGraph || defaultData;
            return generator(graphToUse, customStartNode || graphToUse?.nodes?.[0]?.id);
        }
        if (isArrayTree && activeData) {
            return generator(activeData);
        }
        if (defaultData) {
            return generator(defaultData);
        }
        return generator();
    }, [isArrayBased, canvasType, name, generator, array, searchTarget, needsTarget, defaultData, traversalType, customGraph, customStartNode, customTree, isArrayTree, activeData]);

    // Stable generator for useAnimation (memoized to prevent re-render loops)
    const noopGenerator = useCallback(() => [], []);
    const arrayGenerator = useCallback(
        (arr) => needsTarget ? generator(arr, searchTarget) : generator(arr),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [needsTarget, searchTarget]
    );

    // Animation for array-based: use original hook
    const arrayAnim = useAnimation(
        isArrayBased ? arrayGenerator : noopGenerator,
        isArrayBased ? array : DUMMY_ARRAY
    );

    // Animation for non-array-based: use generic hook
    const genericAnim = useGenericAnimation(isArrayBased ? EMPTY_STEPS : steps);

    const anim = isArrayBased ? {
        currentStep: arrayAnim.currentStep,
        currentStepIndex: arrayAnim.currentStepIndex,
        totalSteps: arrayAnim.totalSteps,
        isPlaying: arrayAnim.isPlaying,
        speed: arrayAnim.speed,
        setSpeed: arrayAnim.setSpeed,
        play: arrayAnim.play,
        pause: arrayAnim.pause,
        stepForward: arrayAnim.stepForward,
        stepBackward: arrayAnim.stepBackward,
        reset: arrayAnim.reset,
        setStep: arrayAnim.setStep,
        currentArray: arrayAnim.currentArray
    } : {
        ...genericAnim,
        currentArray: genericAnim.currentStep?.arraySnapshot || []
    };

    const categoryKeyForFallback = config.categoryKey || (
        canvasType === 'graph'
            ? 'graphs'
            : canvasType === 'tree'
                ? 'trees'
                : canvasType === 'dp'
                    ? 'dp'
                    : canvasType === 'activity'
                        ? 'greedy'
                        : canvasType === 'grid'
                            ? (slug.includes('backtracking') ? 'backtracking' : 'general')
                            : needsTarget
                                ? 'searching'
                                : 'sorting'
    );
    const algorithmMeta = useMemo(
        () => algorithmList.find((item) => pathToSlug(item.path) === slug),
        [slug]
    );
    const overview = useMemo(
        () => buildAlgorithmOverview({
            name,
            category: algorithmMeta?.category || categoryKeyForFallback,
            description: algorithmMeta?.description || '',
            useCases: algorithmMeta?.useCases || [],
            timeComplexity: algorithmMeta?.timeComplexity || null,
            spaceComplexity: algorithmMeta?.spaceComplexity || 'N/A'
        }),
        [
            algorithmMeta?.category,
            algorithmMeta?.description,
            algorithmMeta?.spaceComplexity,
            algorithmMeta?.timeComplexity,
            algorithmMeta?.useCases,
            categoryKeyForFallback,
            name
        ]
    );
    const codeSnippet = algorithmCodes[codeKey]?.[activeLanguage]
        || generateFallbackCode({
            name,
            categoryKey: categoryKeyForFallback,
            language: activeLanguage
        });

    // ── Code line tracking ────────────────────────────────
    const getActiveLine = () => {
        const step = anim.currentStep;
        if (!step || !step.type) return 0;
        const t = step.type;
        const desc = step.description || '';

        const map = algorithmLineMaps[codeKey]?.[activeLanguage]
            || getFallbackLineMap(categoryKeyForFallback);

        // Direct type match
        if (map[t]) return map[t];

        // Fuzzy match from description for tree/graph/dp steps
        if (t === 'tree' || t === 'graph' || t === 'dp' || t === 'activity') {
            if (desc.includes('rotat') || desc.includes('Rotat')) return map['tree'] || map['graph'] || 8;
            if (desc.includes('Insert') || desc.includes('insert')) return map['tree'] || 2;
            if (desc.includes('Visit') || desc.includes('visit')) return map['visit'] || map['tree'] || 3;
            if (desc.includes('Compare') || desc.includes('compare')) return map['compare'] || 5;
            if (desc.includes('Relax') || desc.includes('relax')) return map['relax'] || 6;
            if (desc.includes('Select') || desc.includes('select')) return map['select'] || 5;
            if (desc.includes('Match')) return map['dp'] || 7;
            if (desc.includes('dp[')) return map['dp'] || 7;
            if (desc.includes('Merg')) return map['tree'] || 10;
            if (desc.includes('Flip') || desc.includes('flip')) return 11;
            if (desc.includes('Going left')) return 3;
            if (desc.includes('Going right')) return 5;
            if (desc.includes('Enqueue') || desc.includes('queue')) return map['enqueue'] || 9;
            if (desc.includes('Dequeue')) return map['dequeue'] || 6;
            if (desc.includes('Compatible') || desc.includes('Selected')) return 6;
            if (desc.includes('Overlaps') || desc.includes('Skipped')) return 4;
        }

        return map.info || 1;
    };

    const handleGenerateRandom = () => {
        const newArr = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 5);
        setArray(newArr);
        if (needsTarget) {
            setSearchTarget((current) => clampAlgorithmTarget(name, newArr, current));
        }
    };

    const handleManualInput = (inputVal) => {
        const MAX_INPUT_ELEMENTS = 10;
        if (!Array.isArray(inputVal) || inputVal.length === 0) return;
        if (inputVal.length > MAX_INPUT_ELEMENTS) {
            toast.error(`Maximum ${MAX_INPUT_ELEMENTS} elements are allowed.`);
            return;
        }
        setArray(inputVal);
        if (needsTarget) {
            setSearchTarget((current) => clampAlgorithmTarget(name, inputVal, current));
        }
    };

    const handleGraphGenerate = (graphData) => {
        setCustomGraph(graphData);
    };

    const handleTreeGenerate = (treeData) => {
        setCustomTree(treeData);
    };

    // Render the appropriate canvas
    const renderCanvas = () => {
        const step = anim.currentStep;

        switch (canvasType) {
            case 'array':
                return (
                    <AnimationCanvas
                        array={anim.currentArray}
                        algorithmName={name}
                        currentStep={step}
                        currentIndices={step?.type === 'swap' ? step.indices : []}
                        compareIndices={step?.type === 'compare' ? step.indices : []}
                        sortedIndices={step?.sortedIndices || []}
                    />
                );

            case 'grid':
                return (
                    <GridCanvas
                        array={anim.currentArray}
                        currentIndices={step?.type === 'swap' ? step.indices : []}
                        compareIndices={step?.type === 'compare' ? step.indices : []}
                        sortedIndices={step?.sortedIndices || []}
                    />
                );

            case 'graph':
                const graphData = customGraph || config.defaultData || {};
                return (
                    <GraphCanvas
                        nodes={graphData.nodes || []}
                        edges={graphData.edges || []}
                        nodeStates={step?.nodeStates || {}}
                        edgeStates={step?.edgeStates || {}}
                        distanceTable={step?.distanceTable || null}
                    />
                );

            case 'string':
                return (
                    <StringMatchMiniCanvas
                        textData={array}
                        target={searchTarget}
                        currentStep={step}
                    />
                );

            case 'tree':
                return (
                    <TreeCanvas
                        treeData={customTree || step?.treeData || defaultData || null}
                        nodeStates={step?.nodeStates || {}}
                    />
                );

            case 'dp':
                return (
                    <DPTableCanvas
                        table={step?.table || []}
                        cellStates={step?.cellStates || {}}
                        rowLabels={step?.rowLabels || []}
                        colLabels={step?.colLabels || []}
                        highlightCells={step?.highlightCells || []}
                    />
                );

            case 'activity':
                return (
                    <ActivityCanvas
                        activities={step?.activities || []}
                        actStates={step?.actStates || {}}
                        selected={step?.selected || []}
                    />
                );

            default:
                return <div>Unknown canvas type</div>;
        }
    };

    return (
        <DualView
            algorithmName={name}
            code={codeSnippet}
            activeLine={getActiveLine()}
            activeLanguage={activeLanguage}
            onLanguageChange={setActiveLanguage}
            description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: '0.85rem',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)'
                    }}>
                        Step {anim.currentStepIndex + 1} / {anim.totalSteps || 1}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {anim.currentStep?.description || 'Ready to start'}
                    </span>
                    {name === 'Two Pointers Technique' && Number.isFinite(anim.currentStep?.sum) && (
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            marginLeft: 'auto'
                        }}>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(59,130,246,0.14)',
                                color: '#93c5fd'
                            }}>
                                L: {anim.currentStep?.leftValue}
                            </span>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(249,115,22,0.16)',
                                color: '#fdba74'
                            }}>
                                R: {anim.currentStep?.rightValue}
                            </span>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(250,204,21,0.14)',
                                color: '#fde68a'
                            }}>
                                Sum: {anim.currentStep?.leftValue} + {anim.currentStep?.rightValue} = {anim.currentStep?.sum}
                            </span>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(34,197,94,0.14)',
                                color: '#86efac'
                            }}>
                                Target: {anim.currentStep?.target}
                            </span>
                        </div>
                    )}
                    {name === 'Sliding Window Technique' && (
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            marginLeft: 'auto'
                        }}>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(59,130,246,0.14)',
                                color: '#93c5fd'
                            }}>
                                Window: {Number.isInteger(anim.currentStep?.windowLeft) && Number.isInteger(anim.currentStep?.windowRight) && anim.currentStep?.windowRight >= anim.currentStep?.windowLeft
                                    ? `[${anim.currentStep?.windowLeft}..${anim.currentStep?.windowRight}]`
                                    : 'building'}
                            </span>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(250,204,21,0.14)',
                                color: '#fde68a'
                            }}>
                                Sum: {Number.isFinite(anim.currentStep?.windowSum) ? anim.currentStep?.windowSum : '-'}
                            </span>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(34,197,94,0.14)',
                                color: '#86efac'
                            }}>
                                Best: {Number.isFinite(anim.currentStep?.bestSum) ? anim.currentStep?.bestSum : 'waiting'}
                            </span>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(34,197,94,0.08)',
                                color: '#bbf7d0'
                            }}>
                                Best Window: {Number.isInteger(anim.currentStep?.bestLeft) && Number.isInteger(anim.currentStep?.bestRight) && anim.currentStep?.bestRight >= anim.currentStep?.bestLeft
                                    ? `[${anim.currentStep?.bestLeft}..${anim.currentStep?.bestRight}]`
                                    : 'waiting'}
                            </span>
                            <span style={{
                                fontSize: '0.82rem',
                                padding: '4px 8px',
                                borderRadius: '999px',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#e2e8f0'
                            }}>
                                k = {anim.currentStep?.k ?? searchTarget}
                            </span>
                        </div>
                    )}

                    {/* Traversal type selector for Binary Tree */}
                    {name === 'Binary Tree Traversals' && (
                        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                            {['inorder', 'preorder', 'postorder'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTraversalType(t)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: '600',
                                        background: traversalType === t ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Info badges */}
                    {anim.currentStep?.result && (
                        <span style={{
                            fontSize: '0.8rem',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '600'
                        }}>
                            Result: [{anim.currentStep.result.join(', ')}]
                        </span>
                    )}

                    {anim.currentStep?.queue && (
                        <span style={{
                            fontSize: '0.8rem',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#f59e0b',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '600'
                        }}>
                            Queue: [{anim.currentStep.queue.join(', ')}]
                        </span>
                    )}

                    {anim.currentStep?.stack && (
                        <span style={{
                            fontSize: '0.8rem',
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#a78bfa',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '600'
                        }}>
                            Stack: [{anim.currentStep.stack.join(', ')}]
                        </span>
                    )}
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="cs-education-panel" style={{ marginTop: 0, border: 'none', background: 'transparent' }}>
                    <div className="cs-edu-grid">
                        <div className="cs-edu-section">
                            <h3>How It Works</h3>
                            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                {overview.howItWorks.map((step, index) => (
                                    <li key={`how-${index}`} style={{ marginBottom: '3px', fontSize: '0.85rem' }}>{step}</li>
                                ))}
                            </ul>
                            
                            <h3 style={{ marginTop: '16px' }}>What It Does</h3>
                            {overview.whatItDoes.map((line, index) => (
                                <div key={`what-${index}`} style={{ color: 'var(--text-secondary)', marginBottom: '3px', fontSize: '0.85rem' }}>{line}</div>
                            ))}

                            <h3 style={{ marginTop: '16px' }}>Core Idea</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{overview.coreIdea}</p>
                        </div>
                        <div className="cs-edu-section">
                            <h3>Complexity</h3>
                            <div className="cs-complexity-bubble">
                                <div className="cs-complexity-item">
                                    <span>Time Complexity</span>
                                    <span style={{ color: '#34d399' }}>{overview.complexity.time}</span>
                                </div>
                                <div className="cs-complexity-item">
                                    <span>Space Complexity</span>
                                    <span style={{ color: '#6366f1' }}>{overview.complexity.space}</span>
                                </div>
                                {overview.complexity.stable && (
                                    <div className="cs-complexity-item">
                                        <span>Stable</span>
                                        <span style={{ color: '#fbbf24' }}>{overview.complexity.stable}</span>
                                    </div>
                                )}
                                {overview.complexity.inPlace && (
                                    <div className="cs-complexity-item">
                                        <span>In-Place</span>
                                        <span style={{ color: '#f87171' }}>{overview.complexity.inPlace}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '10px', overflow: 'auto', minHeight: '400px', maxHeight: '550px' }}>
                    {canvasType === 'tree' && anim.currentStep?.arraySnapshot && (
                        <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                            <InputArrayDisplay arraySnapshot={anim.currentStep.arraySnapshot} activeArrayIndex={anim.currentStep.activeIndex} />
                        </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {renderCanvas()}
                    </div>
                    {canvasType === 'tree' && name === 'Binary Tree Traversals' && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '8px 16px 0'
                        }}>
                            {BINARY_TREE_LEGEND.map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        borderRadius: '12px',
                                        background: 'rgba(15, 23, 42, 0.45)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#e2e8f0',
                                        fontSize: '0.82rem'
                                    }}
                                >
                                    <span
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '999px',
                                            background: item.color,
                                            boxShadow: `0 0 12px ${item.color}`
                                        }}
                                    />
                                    <span style={{ fontWeight: 700 }}>{item.label}:</span>
                                    <span style={{ color: '#cbd5e1' }}>{item.description}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dynamic Algorithm Parameters */}
                {(needsTarget || canvasType === 'string' || canvasType === 'graph' || (canvasType === 'tree' && config.name === 'Binary Tree Traversals')) && (
                    <div style={{ display: 'flex', gap: '16px', padding: '12px 20px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                        {canvasType === 'string' && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Text:</label>
                                <input
                                    type="text"
                                    value={Array.isArray(array) ? array.join('') : (array || '')}
                                    onChange={(e) => setArray(e.target.value.toUpperCase())}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(56, 189, 248, 0.4)',
                                        color: '#38bdf8',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        width: '150px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        outline: 'none',
                                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
                                    }}
                                />
                            </div>
                        )}
                        {needsTarget && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>{targetMeta.label}:</label>
                                <input
                                    type={canvasType === 'string' ? "text" : "number"}
                                    value={searchTarget}
                                    onChange={(e) => setSearchTarget(canvasType === 'string' ? e.target.value.toUpperCase() : (parseInt(e.target.value) || 0))}
                                    placeholder={targetMeta.placeholder}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(56, 189, 248, 0.4)',
                                        color: '#38bdf8',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        width: '100px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        outline: 'none',
                                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)'
                                    }}
                                />
                            </div>
                        )}

                        {canvasType === 'graph' && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Start Node:</label>
                                <select
                                    value={customStartNode || (customGraph || config.defaultData)?.nodes?.[0]?.id || ''}
                                    onChange={(e) => setCustomStartNode(e.target.value)}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                        color: '#10b981',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {(customGraph || config.defaultData)?.nodes?.map(node => (
                                        <option key={node.id} value={node.id}>
                                            Node {node.id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {canvasType === 'tree' && config.name === 'Binary Tree Traversals' && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Traversal Type:</label>
                                <select
                                    value={traversalType}
                                    onChange={(e) => setTraversalType(e.target.value)}
                                    style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(16, 185, 129, 0.4)',
                                        color: '#10b981',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        outline: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="inorder">In-Order</option>
                                    <option value="preorder">Pre-Order</option>
                                    <option value="postorder">Post-Order</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Controls */}
                <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', flexShrink: 0 }}>
                    <AnimationControls
                        isPlaying={anim.isPlaying}
                        onPlay={anim.play}
                        onPause={anim.pause}
                        onStepForward={anim.stepForward}
                        onStepBackward={anim.stepBackward}
                        onReset={anim.reset}
                        speed={anim.speed}
                        onSpeedChange={anim.setSpeed}
                        currentStep={anim.currentStepIndex}
                        totalSteps={anim.totalSteps}
                        onScrub={anim.setStep}
                        onManualInput={handleManualInput}
                        onGenerateRandom={isArrayBased ? handleGenerateRandom : undefined}
                        onOpenGraphModal={() => setIsGraphModalOpen(true)}
                        onOpenTreeModal={() => setIsTreeModalOpen(true)}
                        inputType={canvasType === 'graph' ? 'graph' : canvasType === 'tree' && !isArrayTree && config.name !== 'Huffman Coding' ? 'tree' : canvasType === 'string' ? 'string' : 'array'}
                    />
                </div>
            </div>

            {
                canvasType === 'graph' && isGraphModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsGraphModalOpen(false)}>
                        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', minWidth: '400px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0, color: 'white' }}>Update Graph</h3>
                                <button onClick={() => setIsGraphModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                            </div>
                            <GraphInput
                                nodes={customGraph?.nodes || config.defaultData?.nodes || []}
                                edges={customGraph?.edges || config.defaultData?.edges || []}
                                onGraphUpdate={(nodes, edges) => { handleGraphGenerate({ nodes, edges }); setIsGraphModalOpen(false); }}
                                requiresDirected={config.defaultData?.directed || false}
                                requiresWeights={config.defaultData?.edges?.[0]?.weight !== undefined}
                            />
                        </div>
                    </div>
                )
            }
            {
                canvasType === 'tree' && !isArrayTree && config.name !== 'Huffman Coding' && (
                    <TreeInputModal
                        isOpen={isTreeModalOpen}
                        onClose={() => setIsTreeModalOpen(false)}
                        onGenerate={handleTreeGenerate}
                    />
                )
            }
        </DualView >
    );
};

export default GenericVisualizer;
