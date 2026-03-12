import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimationCanvas from './AnimationCanvas';
import TreeCanvas from './TreeCanvas';
import GraphCanvas from './GraphCanvas';
import GraphInput from '../components/GraphInput/GraphInput';
import TreeInputModal from './TreeInputModal';
import DPTableCanvas from './DPTableCanvas';
import ActivityCanvas from './ActivityCanvas';
import StringMatchMiniCanvas from './StringMatchMiniCanvas';
import AStarMiniCanvas from './AStarMiniCanvas';
import GridCanvas from './GridCanvas';
import InputArrayDisplay from '../components/InputArrayDisplay';

import { generateBubbleSortSteps } from '../algorithms/sorting/bubbleSort';
import { generateSelectionSortSteps } from '../algorithms/sorting/selectionSort';
import { generateInsertionSortSteps } from '../algorithms/sorting/insertionSort';
import { generateMergeSortSteps } from '../algorithms/sorting/mergeSort';
import { generateQuickSortSteps } from '../algorithms/sorting/quickSort';
import { generateHeapSortSteps } from '../algorithms/sorting/heapSort';
import { generateBucketSortSteps } from '../algorithms/sorting/bucketSort';
import { generateRadixSortSteps } from '../algorithms/sorting/radixSort';
import { generateLinearSearchSteps } from '../algorithms/searching/linearSearch';
import { generateBinarySearchSteps } from '../algorithms/searching/binarySearch';
import { generateJumpSearchSteps } from '../algorithms/searching/jumpSearch';
import { generateInterpolationSearchSteps } from '../algorithms/searching/interpolationSearch';
import { generateExponentialSearchSteps } from '../algorithms/searching/exponentialSearch';
import { generateTwoPointersSteps } from '../algorithms/searching/twoPointers';
import { generateSlidingWindowSteps } from '../algorithms/searching/slidingWindow';

import { generateFibonacciSearchSteps } from '../algorithms/searching/fibonacciSearch';
import { generateSentinelLinearSearchSteps } from '../algorithms/searching/sentinelLinearSearch';
import { generateShellSortSteps } from '../algorithms/sorting/shellSort';
import { generateCountingSortSteps } from '../algorithms/sorting/countingSort';
import { generateTimSortSteps } from '../algorithms/sorting/timSort';
import { generateCycleSortSteps } from '../algorithms/sorting/cycleSort';
import { generateCocktailShakerSortSteps } from '../algorithms/sorting/cocktailShakerSort';
import { generateCombSortSteps } from '../algorithms/sorting/combSort';
import { generateBFSSteps } from '../algorithms/graphs/bfs';
import { generateDFSSteps } from '../algorithms/graphs/dfs';
import { generateDijkstraSteps } from '../algorithms/graphs/dijkstra';
import { generateBellmanFordSteps } from '../algorithms/graphs/bellmanFord';
import { generatePrimsSteps } from '../algorithms/graphs/prims';
import { generateAStarGridSteps } from '../algorithms/graphs/aStarGridCompare';
import { generateKruskalsSteps } from '../algorithms/graphs/kruskals';
import { defaultGraph, defaultWeightedGraph } from '../algorithms/graphs/graphData';
import { 
    generateBinaryTreeTraversalSteps, 
    generateBSTInsertSteps,
    generateBSTSearchSteps,
    generateBSTDeleteSteps,
    defaultTreeValues 
} from '../algorithms/trees/binaryTree';
import { generateAVLTreeSteps } from '../algorithms/trees/avlTree';
import { generateRedBlackTreeSteps } from '../algorithms/trees/redBlackTree';
import { generateKnapsackSteps } from '../algorithms/dp/knapsack';
import { generateLCSSteps } from '../algorithms/dp/lcs';
import { generateCoinChangeSteps } from '../algorithms/dp/coinChange';
import { generateActivitySelectionSteps } from '../algorithms/greedy/activitySelection';
import { generateHuffmanCodingSteps } from '../algorithms/greedy/huffmanCoding';
import { generateBoyerMooreSteps } from '../algorithms/string/boyerMoore';
import { generateNaryDFSSteps, generateNaryBFSSteps, generateNaryTreeHeightSteps } from '../algorithms/trees/naryTree';
import { generateSegmentTreeSteps } from '../algorithms/trees/segmentTree';
import { generateFenwickTreeSteps } from '../algorithms/trees/fenwickTree';
import { generateHeapSteps } from '../algorithms/trees/heap';
import { generateSplayTreeSteps } from '../algorithms/trees/splayTree';
import { generateTrieSteps } from '../algorithms/trees/trie';
import { generateLISSteps } from '../algorithms/dp/lis';
import { generateEditDistanceSteps } from '../algorithms/dp/editDistance';
import { generateMatrixChainSteps } from '../algorithms/dp/matrixChain';
import { generateRodCuttingSteps } from '../algorithms/dp/rodCutting';
import { generateEggDropSteps } from '../algorithms/dp/eggDrop';
import { generatePalindromePartitionSteps } from '../algorithms/dp/palindromePartition';
import { generateFractionalKnapsackSteps } from '../algorithms/greedy/fractionalKnapsack';
import { generateJobSequencingSteps } from '../algorithms/greedy/jobSequencing';
import { generateKMPSteps } from '../algorithms/string/kmp';
import { generateRabinKarpSteps } from '../algorithms/string/rabinKarp';
import { generateZAlgorithmSteps } from '../algorithms/string/zAlgorithm';
import { generateManacherSteps } from '../algorithms/string/manacher';
import { generateNQueensSteps } from '../algorithms/backtracking/nQueens';
import { generateRatInMazeSteps } from '../algorithms/backtracking/ratInMaze';
import { generateSubsetSumSteps } from '../algorithms/dp/subsetSum';
import { generateSieveSteps } from '../algorithms/math/sieve';
import { generateGCDSteps } from '../algorithms/math/euclideanGcd';
import { generateFastExpSteps } from '../algorithms/math/fastExponentiation';
import { generateFloydWarshallSteps } from '../algorithms/graphs/floydWarshall';
import { generateTopologicalSortSteps } from '../algorithms/graphs/topologicalSort';
import { generateKosarajuSteps } from '../algorithms/graphs/kosaraju';
import { generateFloydCycleSteps } from '../algorithms/graphs/floydCycle';
import { generateFallbackArraySteps, normalizeCategoryKey, resolveDefaultTarget, sanitizeArrayInput } from './algorithmFallbacks';

const resolveGraphStartNode = (graphData, params = []) => {
    const nodes = graphData?.nodes || [];
    if (!nodes.length) return 'A';

    const raw = Array.isArray(params) ? params[0] : null;
    const asNumber = Number(raw);
    if (Number.isFinite(asNumber)) {
        const index = Math.abs(Math.round(asNumber)) % nodes.length;
        return nodes[index]?.id || nodes[0].id;
    }

    const asString = String(raw || '').trim();
    const nodeMatch = nodes.find((node) => String(node.id).toLowerCase() === asString.toLowerCase());
    return nodeMatch?.id || nodes[0].id;
};

const TREE_TRAVERSAL_TYPES = ['inorder', 'preorder', 'postorder'];

const normalizeTraversalMode = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 1;
    const safe = Math.abs(Math.round(numeric));
    if (safe < 1) return 1;
    return ((safe - 1) % TREE_TRAVERSAL_TYPES.length) + 1;
};

const resolveTraversalType = (params = [], fallback = 'inorder') => {
    const baseFallback = TREE_TRAVERSAL_TYPES.includes(fallback) ? fallback : 'inorder';
    const raw = Array.isArray(params) && params.length ? params[0] : baseFallback;
    const value = String(raw ?? '').trim().toLowerCase();

    if (TREE_TRAVERSAL_TYPES.includes(value)) return value;
    const mode = normalizeTraversalMode(raw);
    return TREE_TRAVERSAL_TYPES[mode - 1] || baseFallback;
};

const resolveTraversalModeInput = (value) => {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return null;
    if (raw === 'inorder') return 1;
    if (raw === 'preorder') return 2;
    if (raw === 'postorder') return 3;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return null;
    return normalizeTraversalMode(numeric);
};

const GENERATORS = {
    'Bubble Sort': { canvasType: 'array', generate: (data) => generateBubbleSortSteps(data, true), needsTarget: false },
    'Selection Sort': { canvasType: 'array', generate: (data) => generateSelectionSortSteps(data, true), needsTarget: false },
    'Insertion Sort': { canvasType: 'array', generate: (data) => generateInsertionSortSteps(data, true), needsTarget: false },
    'Merge Sort': { canvasType: 'array', generate: (data) => generateMergeSortSteps(data, true), needsTarget: false },
    'Quick Sort': { canvasType: 'array', generate: (data) => generateQuickSortSteps(data, true), needsTarget: false },
    'Heap Sort': { canvasType: 'array', generate: (data) => generateHeapSortSteps(data, true), needsTarget: false },
    'Bucket Sort': { canvasType: 'array', generate: (data) => generateBucketSortSteps(data, true), needsTarget: false },
    'Radix Sort': { canvasType: 'array', generate: (data) => generateRadixSortSteps(data, true), needsTarget: false },
    'Linear Search': { canvasType: 'array', generate: (data, target) => generateLinearSearchSteps(data, target), needsTarget: true },
    'Binary Search': { canvasType: 'array', generate: (data, target) => generateBinarySearchSteps(data, target), needsTarget: true },
    'Jump Search': { canvasType: 'array', generate: (data, target) => generateJumpSearchSteps(data, target), needsTarget: true },
    'Interpolation Search': { canvasType: 'array', generate: (data, target) => generateInterpolationSearchSteps(data, target), needsTarget: true },
    'Exponential Search': { canvasType: 'array', generate: (data, target) => generateExponentialSearchSteps(data, target), needsTarget: true },
    'Shell Sort': { canvasType: 'array', generate: (data) => generateShellSortSteps(data), needsTarget: false },
    'Counting Sort': { canvasType: 'array', generate: (data) => generateCountingSortSteps(data), needsTarget: false },
    'Tim Sort': { canvasType: 'array', generate: (data) => generateTimSortSteps(data), needsTarget: false },
    'Cycle Sort': { canvasType: 'array', generate: (data) => generateCycleSortSteps(data), needsTarget: false },
    'Cocktail Shaker Sort': { canvasType: 'array', generate: (data) => generateCocktailShakerSortSteps(data), needsTarget: false },
    'Comb Sort': { canvasType: 'array', generate: (data) => generateCombSortSteps(data), needsTarget: false },

    'Fibonacci Search': { canvasType: 'array', generate: (data, target) => generateFibonacciSearchSteps(data, target), needsTarget: true },
    'Sentinel Linear Search': { canvasType: 'array', generate: (data, target) => generateSentinelLinearSearchSteps(data, target), needsTarget: true },
    'Two Pointers Technique': { canvasType: 'array', generate: (data, target) => generateTwoPointersSteps(data, target), needsTarget: true },
    'Sliding Window Technique': { canvasType: 'array', generate: (data, target) => generateSlidingWindowSteps(data, target), needsTarget: true },

    'Breadth-First Search (BFS)': {
        canvasType: 'graph',
        graphData: defaultGraph,
        generate: (_data, _target, params, graphData) => generateBFSSteps(graphData || defaultGraph, resolveGraphStartNode(graphData || defaultGraph, params))
    },
    'Depth-First Search (DFS)': {
        canvasType: 'graph',
        graphData: defaultGraph,
        generate: (_data, _target, params, graphData) => generateDFSSteps(graphData || defaultGraph, resolveGraphStartNode(graphData || defaultGraph, params))
    },
    "Dijkstra's Algorithm": {
        canvasType: 'graph',
        graphData: defaultWeightedGraph,
        generate: (_data, _target, params, graphData) => generateDijkstraSteps(graphData || defaultWeightedGraph, resolveGraphStartNode(graphData || defaultWeightedGraph, params))
    },
    'Bellman-Ford': {
        canvasType: 'graph',
        graphData: defaultWeightedGraph,
        generate: (_data, _target, params, graphData) => generateBellmanFordSteps(graphData || defaultWeightedGraph, resolveGraphStartNode(graphData || defaultWeightedGraph, params))
    },
    "Prim's MST": {
        canvasType: 'graph',
        graphData: defaultWeightedGraph,
        generate: (_data, _target, params, graphData) => generatePrimsSteps(graphData || defaultWeightedGraph, resolveGraphStartNode(graphData || defaultWeightedGraph, params))
    },
    "Kruskal's MST": {
        canvasType: 'graph',
        graphData: defaultWeightedGraph,
        generate: (_data, _t, _p, graphData) => generateKruskalsSteps(graphData || defaultWeightedGraph)
    },
    'A* Search': {
        canvasType: 'astar',
        generate: (data, target, params) => generateAStarGridSteps(data, target, params),
        needsTarget: false
    },

    'Binary Tree Traversals': {
        canvasType: 'tree',
        generate: (data, _target, params, _graph, treeData) => generateBinaryTreeTraversalSteps(
            (data && data.length && data !== DEFAULT_DATA) ? data : defaultTreeValues,
            resolveTraversalType(params, 'inorder'),
            treeData || null
        )
    },
    'Binary Search Tree': {
        canvasType: 'tree',
        generate: (data, target, params, graph, treeData) => {
            const input = (data && data.length && data !== DEFAULT_DATA) ? data : defaultTreeValues;
            const val = params[0] || (data && data.length ? data[0] : 50);
            return generateBSTInsertSteps(input, val);
        }
    },
    'AVL Tree': {
        canvasType: 'tree',
        generate: (data, _t, _p, _g, treeData) => generateAVLTreeSteps((data && data.length && data !== DEFAULT_DATA) ? data : defaultTreeValues, _t, _p, _g, treeData || null)
    },
    'Red-Black Tree': {
        canvasType: 'tree',
        generate: (data, _t, _p, _g, treeData) => generateRedBlackTreeSteps((data && data.length && data !== DEFAULT_DATA) ? data : defaultTreeValues, _t, _p, _g, treeData || null)
    },
    'Huffman Coding': {
        canvasType: 'tree',
        generate: () => generateHuffmanCodingSteps()
    },
    'N-ary DFS': {
        canvasType: 'tree',
        generate: (data, _t, _p, _g, treeData) => generateNaryDFSSteps(treeData || null)
    },
    'N-ary BFS (Level Order)': {
        canvasType: 'tree',
        generate: (data, _t, _p, _g, treeData) => generateNaryBFSSteps(treeData || null)
    },
    'N-ary Tree Height': {
        canvasType: 'tree',
        generate: (data, _t, _p, _g, treeData) => generateNaryTreeHeightSteps(treeData || null)
    },
    'Segment Tree': {
        canvasType: 'tree',
        generate: (data) => generateSegmentTreeSteps((data && data.length && data !== DEFAULT_DATA) ? data : undefined)
    },
    'Fenwick Tree (BIT)': {
        canvasType: 'tree',
        generate: (data) => generateFenwickTreeSteps((data && data.length && data !== DEFAULT_DATA) ? data : undefined)
    },
    'Heap / Priority Queue': {
        canvasType: 'tree',
        generate: (data) => generateHeapSteps((data && data.length && data !== DEFAULT_DATA) ? data : undefined)
    },
    'Splay Tree': {
        canvasType: 'tree',
        generate: (data) => generateSplayTreeSteps((data && data.length && data !== DEFAULT_DATA) ? data : undefined)
    },
    'Trie (Prefix Tree)': {
        canvasType: 'tree',
        generate: () => generateTrieSteps()
    },

    'Knapsack Problem (0/1)': {
        canvasType: 'dp',
        generate: (data, target, params) => {
            const weights = Array.isArray(data) ? data.slice(0, 5) : [1, 3, 4, 5];
            const values = weights.map(w => Math.floor(w * 1.5));
            const capacity = params[0] || 7;
            return generateKnapsackSteps(capacity, weights, values);
        }
    },
    'Longest Common Subsequence': {
        canvasType: 'dp',
        generate: (data, target, params) => {
            const s1 = params[0] || 'ABCBDAB';
            const s2 = params[1] || 'BDCABA';
            return generateLCSSteps(s1, s2);
        }
    },
    'Coin Change (Min Coins)': {
        canvasType: 'dp',
        generate: (data, target, params) => {
            const coins = Array.isArray(data) ? [...new Set(data.slice(0, 5).map(x => Math.max(1, x % 10)))] : [1, 3, 4];
            const amount = params[0] || 6;
            return generateCoinChangeSteps(coins, amount);
        }
    },
    'Coin Change (Total Ways)': {
        canvasType: 'dp',
        generate: (data, target, params) => {
            const coins = Array.isArray(data) ? [...new Set(data.slice(0, 5).map(x => Math.max(1, x % 10)))] : [1, 3, 4];
            const amount = params[0] || 6;
            return generateCoinChangeSteps(coins, amount, true);
        }
    },
    'Longest Increasing Subsequence': { canvasType: 'dp', generate: (data) => generateLISSteps(data) },
    'Edit Distance (Levenshtein)': { canvasType: 'dp', generate: () => generateEditDistanceSteps() },
    'Matrix Chain Multiplication': { canvasType: 'dp', generate: (data) => generateMatrixChainSteps(data) },
    'Rod Cutting': { canvasType: 'dp', generate: (data) => generateRodCuttingSteps(data) },
    'Egg Drop Problem': { canvasType: 'dp', generate: () => generateEggDropSteps() },
    'Palindrome Partitioning': { canvasType: 'dp', generate: () => generatePalindromePartitionSteps() },

    'Activity Selection': { canvasType: 'activity', generate: () => generateActivitySelectionSteps() },
    'Fractional Knapsack': { canvasType: 'array', generate: (data) => generateFractionalKnapsackSteps(data), needsTarget: false },
    'Job Sequencing with Deadlines': { canvasType: 'array', generate: (data) => generateJobSequencingSteps(data), needsTarget: false },

    'Boyer-Moore Algorithm': {
        canvasType: 'string',
        needsTarget: true,
        generate: (data, target) => {
            const text = Array.isArray(data) ? data.join('') : String(data);
            const pattern = String(target);
            return generateBoyerMooreSteps(text, pattern);
        }
    },
    'KMP Algorithm': { canvasType: 'array', generate: () => generateKMPSteps(), needsTarget: false },
    'Rabin-Karp Algorithm': { canvasType: 'array', generate: () => generateRabinKarpSteps(), needsTarget: false },
    'Z-Algorithm': { canvasType: 'array', generate: () => generateZAlgorithmSteps(), needsTarget: false },
    "Manacher's Algorithm": { canvasType: 'array', generate: () => generateManacherSteps(), needsTarget: false },

    'N-Queens Problem': { canvasType: 'grid', generate: (data) => generateNQueensSteps(data && data[0]), needsTarget: false },
    'Rat in a Maze': { canvasType: 'grid', generate: (data) => generateRatInMazeSteps(data && data[0]), needsTarget: false },
    'Subset Sum': { canvasType: 'dp', generate: (data, target) => generateSubsetSumSteps(data, target), needsTarget: true },

    'Sieve of Eratosthenes': { canvasType: 'array', generate: (data) => generateSieveSteps(data && data[0]), needsTarget: false },
    'Euclidean GCD': { canvasType: 'array', generate: (data) => generateGCDSteps(data && data[0], data && data[1]), needsTarget: false },
    'Fast Exponentiation': { canvasType: 'array', generate: (data) => generateFastExpSteps(data && data[0], data && data[1]), needsTarget: false },
    'Bit Manipulation Basics': { canvasType: 'array', generate: (data) => generateFallbackArraySteps({ categoryKey: 'math', name: 'Bit Manipulation Basics', array: data }), needsTarget: false },

    'Floyd-Warshall': {
        canvasType: 'graph', graphData: defaultWeightedGraph,
        generate: (_data, _target, params, graphData) => generateFloydWarshallSteps(graphData || defaultWeightedGraph, resolveGraphStartNode(graphData || defaultWeightedGraph, params))
    },
    'Topological Sort': {
        canvasType: 'graph', graphData: defaultGraph,
        generate: (_data, _target, params, graphData) => generateTopologicalSortSteps(graphData || defaultGraph, resolveGraphStartNode(graphData || defaultGraph, params))
    },
    "Cycle Detection (Floyd's)": {
        canvasType: 'graph', graphData: defaultGraph,
        generate: (_data, _target, params, graphData) => generateFloydCycleSteps(graphData || defaultGraph, resolveGraphStartNode(graphData || defaultGraph, params))
    },
    "Kosaraju's Algorithm": {
        canvasType: 'graph', graphData: defaultGraph,
        generate: (_data, _target, params, graphData) => generateKosarajuSteps(graphData || defaultGraph, resolveGraphStartNode(graphData || defaultGraph, params))
    }
};

const MAX_INPUT_ELEMENTS = 10;
const DEFAULT_DATA = [42, 17, 63, 9, 88, 31, 54, 26, 71, 13];
const DEFAULT_SPEED = 1.25;
const INPUT_STYLE = {
    width: '100%',
    background: 'var(--viz-input-bg, #1e1e1e)',
    border: '1px solid var(--viz-input-border, rgba(255,255,255,0.12))',
    borderRadius: '14px',
    padding: '0 14px',
    minHeight: '44px',
    color: 'var(--viz-input-text, #f5f5f5)',
    fontSize: '0.95rem',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
};

const CATEGORY_PARAM_RULES = {
    searching: { count: 1, label: 'target', example: '45' },
    graphs: { count: 2, label: 'start, end', example: '1, 6' },
    trees: { count: 2, label: 'value, mode', example: '30, 2' },
    dp: { count: 2, label: 'param1, param2', example: '6, 10' },
    greedy: { count: 2, label: 'param1, param2', example: '8, 20' },
    string: { count: 2, label: 'param1, param2', example: '5, 3' },
    backtracking: { count: 2, label: 'param1, param2', example: '4, 9' },
    math: { count: 2, label: 'a, b', example: '84, 36' }
};

const ALGORITHM_PARAM_RULES = {
    'Binary Tree Traversals': {
        count: 1,
        label: 'mode (1=inorder, 2=preorder, 3=postorder)',
        example: '2',
        mode: 'tree-traversal'
    },
    'A* Search': {
        count: 2,
        label: 'movement, heuristic (1=4dir, 2=8dir | 1=Manhattan, 2=Euclidean, 3=Diagonal)',
        example: '1, 1',
        mode: 'astar-options'
    },
    'Sliding Window Technique': {
        count: 1,
        label: 'window size',
        example: '3'
    },
    'Two Pointers Technique': {
        count: 1,
        label: 'target sum',
        example: '15'
    },
    'Longest Common Subsequence': {
        count: 2,
        label: 'string A, string B',
        example: 'ABCDGH, AEDFHR'
    },
    'Binary Search Tree': {
        count: 1,
        label: 'value to insert',
        example: '45'
    }
};

const normalizeParamCategory = (category) => {
    const normalized = normalizeCategoryKey(category);
    if (normalized === 'dynamic programming') return 'dp';
    return normalized;
};

const resolveParamRule = (algorithm, laneConfig) => {
    if (laneConfig?.canvasType === 'graph') return null;
    const fromAlgorithm = ALGORITHM_PARAM_RULES[algorithm?.name];
    if (fromAlgorithm) return { ...fromAlgorithm };
    const categoryKey = normalizeParamCategory(algorithm?.category);
    const fromCategory = CATEGORY_PARAM_RULES[categoryKey];
    if (fromCategory) return { ...fromCategory };
    if (laneConfig?.needsTarget) return { ...CATEGORY_PARAM_RULES.searching };
    return null;
};

const clampParam = (value) => Math.max(1, Math.min(120, Math.round(value)));

const buildRandomParams = (rule, array) => {
    if (!rule?.count) return [];
    if (rule.mode === 'tree-traversal') {
        return [Math.floor(Math.random() * 3) + 1];
    }
    if (rule.mode === 'astar-options') {
        return [Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 3) + 1];
    }
    const source = Array.isArray(array) && array.length ? array : DEFAULT_DATA;
    const first = clampParam(resolveDefaultTarget(source));
    const secondSeedIndex = source.length > 1 ? (Math.floor(source.length / 3) + 2) % source.length : 0;
    const second = clampParam(source[secondSeedIndex] ?? first + 1);
    const values = [];
    for (let i = 0; i < rule.count; i += 1) {
        if (i === 0) values.push(first);
        else if (i === 1) values.push(second === first ? clampParam(first + 1) : second);
        else values.push(clampParam(Math.floor(Math.random() * 95) + 5));
    }
    return values;
};

const buildKey = (algorithm, index) => `${algorithm?.id || algorithm?.name || 'algo'}-${index}`;

const getFallbackLaneConfig = (algorithm) => {
    const categoryKey = normalizeCategoryKey(algorithm?.category);
    if (categoryKey === 'trees') {
        const useTraversalMode = algorithm?.name === 'Binary Tree Traversals';
        return {
            canvasType: 'tree',
            generate: (data, _target, params) => generateBinaryTreeTraversalSteps(
                (data && data.length && data !== DEFAULT_DATA) ? data : defaultTreeValues,
                useTraversalMode ? resolveTraversalType(params, 'inorder') : 'inorder'
            ),
            needsTarget: false
        };
    }
    if (categoryKey === 'graphs') {
        return {
            canvasType: 'graph',
            graphData: defaultGraph,
            generate: (_data, _target, params, graphData) => generateBFSSteps(graphData || defaultGraph, resolveGraphStartNode(graphData || defaultGraph, params)),
            needsTarget: false
        };
    }
    if (categoryKey === 'dynamic programming' || categoryKey === 'dp') {
        return {
            canvasType: 'dp',
            generate: () => generateKnapsackSteps(),
            needsTarget: false
        };
    }
    if (categoryKey === 'greedy') {
        return {
            canvasType: 'activity',
            generate: () => generateActivitySelectionSteps(),
            needsTarget: false
        };
    }

    return {
        canvasType: 'array',
        generate: (data, target) => generateFallbackArraySteps({
            categoryKey: categoryKey || 'sorting',
            name: algorithm?.name || 'Algorithm',
            array: sanitizeArrayInput(data),
            target
        }),
        needsTarget: categoryKey === 'searching'
    };
};

const getLaneConfig = (algorithm) => GENERATORS[algorithm?.name] || getFallbackLaneConfig(algorithm);

const randomData = (len = MAX_INPUT_ELEMENTS, order = 'random', isStringMode = false) => {
    if (isStringMode) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length)));
    }
    const data = Array.from({ length: len }, () => Math.floor(Math.random() * 95) + 5);
    return order === 'increasing' ? [...data].sort((a, b) => a - b) : data;
};

const parseData = (raw, isStringMode = false) => {
    if (isStringMode) {
        if (!raw || !String(raw).trim()) return { error: 'Enter valid text.' };
        return { values: String(raw).split('') };
    }
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (parts.length < 1) return { error: 'Enter at least 1 number.' };
    if (parts.length > MAX_INPUT_ELEMENTS) return { error: `Maximum ${MAX_INPUT_ELEMENTS} numbers are allowed.` };
    const nums = parts.map(Number);
    if (nums.some((n) => !Number.isFinite(n))) return { error: 'Only numeric values are allowed.' };
    return { values: nums.map((n) => Math.max(1, Math.min(120, Math.round(n)))) };
};

const parseParamValues = (raw, rule) => {
    if (!rule?.count) return { values: [] };
    const parts = String(raw || '').split(/[\s,]+/).filter(Boolean);
    if (parts.length < rule.count) {
        return { error: `Enter ${rule.count} parameter${rule.count > 1 ? 's' : ''}.` };
    }
    if (rule.mode === 'tree-traversal') {
        const mode = resolveTraversalModeInput(parts[0]);
        if (!mode) {
            return { error: 'Traversal mode must be 1/2/3 or inorder/preorder/postorder.' };
        }
        return { values: [mode] };
    }
    const selected = parts.slice(0, rule.count).map(Number);
    if (selected.some((value) => !Number.isFinite(value))) {
        return { error: 'Parameters must be numeric.' };
    }
    return { values: selected.map(clampParam) };
};

const normalizeParamValues = (values, rule, array) => {
    if (!rule?.count) return [];
    const fallback = buildRandomParams(rule, array);
    if (!Array.isArray(values)) return fallback;
    const next = values.slice(0, rule.count).map(Number);
    if (next.some((value) => !Number.isFinite(value)) || next.length < rule.count) return fallback;
    if (rule.mode === 'tree-traversal') {
        return [normalizeTraversalMode(next[0])];
    }
    if (rule.mode === 'astar-options') {
        const movement = Math.max(1, Math.min(2, Math.round(next[0])));
        const heuristic = Math.max(1, Math.min(3, Math.round(next[1])));
        return [movement, heuristic];
    }
    return next.map(clampParam);
};

const buildParamPlaceholder = (rule) => {
    if (!rule?.count) return '';
    return `Enter ${rule.count} parameter${rule.count > 1 ? 's' : ''} (${rule.label}). e.g. ${rule.example}`;
};

const countComparisons = (steps, upto = steps.length - 1) => {
    let count = 0;
    for (let i = 0; i <= Math.max(0, Math.min(upto, steps.length - 1)); i += 1) {
        if (steps[i]?.type === 'compare') count += 1;
    }
    return count;
};

const makeCard = (algorithm, data, overrides = {}) => {
    const config = getLaneConfig(algorithm);
    const generator = config?.generate;
    const canvasType = config?.canvasType || 'array';
    const graphData = overrides.graphData || config?.graphData || null;
    const array = Array.isArray(data) && data.length ? sanitizeArrayInput(data, DEFAULT_DATA) : [...DEFAULT_DATA];
    const fallbackTarget = Number.isFinite(Number(overrides.searchTarget))
        ? Math.round(Number(overrides.searchTarget))
        : resolveDefaultTarget(array);
    const paramRule = resolveParamRule(algorithm, config);
    const paramValues = Array.isArray(overrides.paramValues)
        ? normalizeParamValues(overrides.paramValues, paramRule, array)
        : (paramRule?.count ? buildRandomParams(paramRule, array) : []);
    if (config?.needsTarget && paramValues.length > 0) {
        paramValues[0] = clampParam(paramValues[0]);
    }
    const searchTarget = config?.needsTarget
        ? (paramValues[0] ?? fallbackTarget)
        : fallbackTarget;
    const paramInput = overrides.paramInput ?? (paramValues.length ? paramValues.join(', ') : '');
    const paramsReady = paramRule?.count ? Boolean(overrides.paramsReady) : true;
    const startNode = canvasType === 'graph'
        ? resolveGraphStartNode(graphData || defaultGraph, [overrides.startNode])
        : null;
    const card = {
        algorithm,
        data: array,
        canvasType,
        graphData,
        startNode,
        isSupported: Boolean(generator),
        isCustom: overrides.isCustom || false,
        customInput: overrides.customInput || '',
        needsTarget: Boolean(config?.needsTarget),
        paramRule,
        paramValues,
        paramInput,
        paramsReady,
        searchTarget,
        targetInput: overrides.targetInput ?? String(searchTarget),
        speed: overrides.speed ?? DEFAULT_SPEED,
        status: overrides.status || 'idle',
        stepIndex: overrides.stepIndex || 0,
        elapsedMs: overrides.elapsedMs || 0,
        steps: [],
        totalComparisons: 0
    };
    if (!generator) return card;

    let steps = [];
    try {
        const laneParams = canvasType === 'graph' ? [startNode] : paramValues;
        const treeDataPassed = overrides.treeData || null; // Access stored treeData for custom tree injections
        steps = generator([...array], searchTarget, laneParams, graphData, treeDataPassed) || [];
    } catch (error) {
        steps = [];
    }
    if (!steps.length) {
        steps = [{ type: 'info', indices: [], sortedIndices: [], description: 'No visualization steps were generated.', arraySnapshot: [...array] }];
    }
    return { ...card, steps, totalComparisons: countComparisons(steps) };
};

const formatTime = (ms) => `${(ms / 1000).toFixed(1)}s`;

const formatParamSummary = (card) => {
    if (!card?.paramRule) return '';
    if (!card.paramsReady) return `pending (${card.paramRule.count})`;
    if (card.algorithm?.name === 'Binary Tree Traversals') {
        const traversalType = resolveTraversalType(card.paramValues, 'inorder');
        return `${traversalType} (mode ${normalizeTraversalMode(card.paramValues?.[0])})`;
    }
    if (card.algorithm?.name === 'A* Search') {
        const movement = Number(card.paramValues?.[0]) === 2 ? '8-dir' : '4-dir';
        const heuristic = Number(card.paramValues?.[1]) === 2
            ? 'Euclidean'
            : (Number(card.paramValues?.[1]) === 3 ? 'Diagonal' : 'Manhattan');
        return `${movement}, ${heuristic}`;
    }
    return card.paramValues.join(', ');
};

const MultiAlgoVisualizer = ({ algorithms = [] }) => {
    const navigate = useNavigate();
    const [globalData, setGlobalData] = useState([...DEFAULT_DATA]);
    const [globalInput, setGlobalInput] = useState(DEFAULT_DATA.join(', '));
    const [globalSearchTarget, setGlobalSearchTarget] = useState(DEFAULT_DATA[Math.floor(DEFAULT_DATA.length / 2)]);
    const [globalTargetInput, setGlobalTargetInput] = useState(String(DEFAULT_DATA[Math.floor(DEFAULT_DATA.length / 2)]));
    const [orderMode, setOrderMode] = useState('random');
    const [globalSpeed, setGlobalSpeed] = useState(DEFAULT_SPEED);
    const [globalError, setGlobalError] = useState('');
    const [cards, setCards] = useState({});
    const [runMode, setRunMode] = useState('none');
    const [winnerKey, setWinnerKey] = useState(null);
    const [comparisonInputReady, setComparisonInputReady] = useState(algorithms.length <= 1);
    const [comparisonInputType, setComparisonInputType] = useState(algorithms.length <= 1 ? 'default' : null);
    const [graphModalLaneKey, setGraphModalLaneKey] = useState(null);
    const [treeModalLaneKey, setTreeModalLaneKey] = useState(null);
    const [viewportWidth, setViewportWidth] = useState(() => (
        typeof window !== 'undefined' ? window.innerWidth : 1400
    ));

    const entries = useMemo(() => algorithms.map((algorithm, index) => ({ key: buildKey(algorithm, index), algorithm })), [algorithms]);
    const keys = useMemo(() => entries.map((entry) => entry.key), [entries]);
    const isMultiComparison = entries.length > 1;
    const hasSearchAlgorithms = useMemo(
        () => entries.some(({ algorithm }) => getLaneConfig(algorithm)?.needsTarget),
        [entries]
    );
    const isMobile = viewportWidth <= 768;
    const isTablet = viewportWidth > 768 && viewportWidth <= 1100;
    const globalGridColumns = isMobile
        ? '1fr'
        : (isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(240px, 1fr))');
    const laneGridColumns = isMobile
        ? '1fr'
        : (isTablet ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fit, minmax(360px, 1fr))');

    const cardsRef = useRef(cards);
    const timersRef = useRef({});
    const runModeRef = useRef(runMode);
    const globalSpeedRef = useRef(globalSpeed);
    const globalInputRef = useRef(null);

    useEffect(() => { cardsRef.current = cards; }, [cards]);
    useEffect(() => { runModeRef.current = runMode; }, [runMode]);
    useEffect(() => { globalSpeedRef.current = globalSpeed; }, [globalSpeed]);
    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    useEffect(() => {
        if (algorithms.length > 1) {
            setComparisonInputReady(false);
            setComparisonInputType(null);
        } else {
            setComparisonInputReady(true);
            setComparisonInputType('default');
        }
    }, [algorithms.length]);

    const clearTimer = useCallback((key) => {
        if (timersRef.current[key]) {
            clearTimeout(timersRef.current[key]);
            delete timersRef.current[key];
        }
    }, []);

    const clearAllTimers = useCallback(() => {
        Object.keys(timersRef.current).forEach((key) => clearTimer(key));
    }, [clearTimer]);

    const finalize = useCallback(() => {
        const snapshot = cardsRef.current;
        const running = Object.values(snapshot).some((card) => card.status === 'running');
        if (running) return;

        if (runModeRef.current === 'all') {
            const contenders = keys
                .map((key) => ({ key, card: snapshot[key] }))
                .filter(({ card }) => card?.isSupported && card.status === 'done')
                .sort((a, b) => a.card.elapsedMs - b.card.elapsedMs);
            if (contenders[0]) setWinnerKey(contenders[0].key);
        }
        runModeRef.current = 'none';
        setRunMode('none');
    }, [keys]);

    const getDelay = useCallback((key) => {
        const speed = runModeRef.current === 'all'
            ? globalSpeedRef.current
            : (cardsRef.current[key]?.speed || DEFAULT_SPEED);
        return Math.max(45, Math.round(700 / Math.max(speed, 0.1)));
    }, []);

    const tick = useCallback((key) => {
        clearTimer(key);
        const delay = getDelay(key);
        timersRef.current[key] = setTimeout(() => {
            setCards((prev) => {
                const card = prev[key];
                if (!card || card.status !== 'running' || !card.isSupported) return prev;
                const nextIndex = Math.min(card.stepIndex + 1, card.steps.length - 1);
                const done = nextIndex >= card.steps.length - 1;
                return { ...prev, [key]: { ...card, stepIndex: nextIndex, elapsedMs: card.elapsedMs + delay, status: done ? 'done' : 'running' } };
            });
            setTimeout(() => {
                if (cardsRef.current[key]?.status === 'running') {
                    tick(key);
                } else {
                    clearTimer(key);
                    finalize();
                }
            }, 0);
        }, delay);
    }, [clearTimer, finalize, getDelay]);

    useEffect(() => {
        setCards((prev) => {
            const next = {};
            const active = new Set(keys);
            Object.keys(prev).forEach((key) => { if (!active.has(key)) clearTimer(key); });
            entries.forEach(({ key, algorithm }) => {
                const previous = prev[key];
                const data = previous?.isCustom ? previous.data : globalData;
                next[key] = makeCard(algorithm, data, {
                    isCustom: previous?.isCustom || false,
                    customInput: previous?.isCustom ? previous.customInput : '',
                    searchTarget: previous?.isCustom ? previous.searchTarget : globalSearchTarget,
                    targetInput: previous?.isCustom ? previous.targetInput : String(globalSearchTarget),
                    paramValues: previous?.paramValues,
                    paramInput: previous?.paramInput,
                    paramsReady: previous?.paramsReady,
                    graphData: previous?.graphData,
                    treeData: previous?.treeData,
                    startNode: previous?.startNode,
                    speed: previous?.speed ?? DEFAULT_SPEED,
                    status: 'idle',
                    stepIndex: 0,
                    elapsedMs: 0
                });
            });
            return next;
        });
        clearAllTimers();
        setWinnerKey(null);
        runModeRef.current = 'none';
        setRunMode('none');
    }, [clearAllTimers, clearTimer, entries, globalData, globalSearchTarget, keys]);

    useEffect(() => () => clearAllTimers(), [clearAllTimers]);

    const anyRunning = useMemo(() => Object.values(cards).some((card) => card.status === 'running'), [cards]);
    const supportedKeys = useMemo(() => keys.filter((key) => cards[key]?.isSupported), [cards, keys]);
    const pendingParamKeys = useMemo(
        () => keys.filter((key) => cards[key]?.isSupported && cards[key]?.paramRule?.count > 0 && !cards[key]?.paramsReady),
        [cards, keys]
    );

    const updateCard = useCallback((key, updater) => {
        setCards((prev) => {
            const card = prev[key];
            if (!card) return prev;
            return { ...prev, [key]: updater(card) };
        });
    }, []);

    const randomizeLaneParams = (key) => {
        const lane = cardsRef.current[key];
        if (lane?.status === 'running') return;
        if (!lane?.paramRule?.count) return;
        const values = buildRandomParams(lane.paramRule, lane.data);
        const nextTarget = lane.needsTarget ? values[0] : lane.searchTarget;
        setGlobalError('');
        setCards((prev) => ({
            ...prev,
            [key]: makeCard(prev[key].algorithm, prev[key].data, {
                isCustom: prev[key].isCustom,
                customInput: prev[key].customInput,
                searchTarget: nextTarget,
                targetInput: String(nextTarget),
                paramValues: values,
                paramInput: values.join(', '),
                paramsReady: true,
                graphData: prev[key].graphData,
                startNode: prev[key].startNode,
                speed: prev[key].speed
            })
        }));
    };

    const applyLaneParams = (key) => {
        const lane = cardsRef.current[key];
        if (lane?.status === 'running') return;
        if (!lane?.paramRule?.count) return;
        const parsed = parseParamValues(lane.paramInput, lane.paramRule);
        if (parsed.error) {
            setGlobalError(`${lane.algorithm?.name}: ${parsed.error}`);
            return;
        }
        const values = normalizeParamValues(parsed.values, lane.paramRule, lane.data);
        const nextTarget = lane.needsTarget ? values[0] : lane.searchTarget;
        setGlobalError('');
        setCards((prev) => ({
            ...prev,
            [key]: makeCard(prev[key].algorithm, prev[key].data, {
                isCustom: prev[key].isCustom,
                customInput: prev[key].customInput,
                searchTarget: nextTarget,
                targetInput: String(nextTarget),
                paramValues: values,
                paramInput: values.join(', '),
                paramsReady: true,
                graphData: prev[key].graphData,
                startNode: prev[key].startNode,
                speed: prev[key].speed
            })
        }));
    };

    const randomizeAllParams = () => {
        if (anyRunning) return;
        setGlobalError('');
        setCards((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((key) => {
                const lane = next[key];
                if (!lane?.paramRule?.count) return;
                const values = buildRandomParams(lane.paramRule, lane.data);
                const nextTarget = lane.needsTarget ? values[0] : lane.searchTarget;
                next[key] = makeCard(lane.algorithm, lane.data, {
                    isCustom: lane.isCustom,
                    customInput: lane.customInput,
                    searchTarget: nextTarget,
                    targetInput: String(nextTarget),
                    paramValues: values,
                    paramInput: values.join(', '),
                    paramsReady: true,
                    graphData: lane.graphData,
                    startNode: lane.startNode,
                    speed: lane.speed
                });
            });
            return next;
        });
    };

    const prepareLaneForExecution = (lane) => {
        if (!lane?.isSupported) return { lane };

        let prepared = lane;

        if (prepared?.needsTarget && prepared?.paramRule?.count === 1 && !prepared.paramsReady) {
            const parsedTarget = Number(prepared.targetInput);
            const autoTarget = Number.isFinite(parsedTarget)
                ? clampParam(parsedTarget)
                : resolveDefaultTarget(prepared.data);
            prepared = makeCard(prepared.algorithm, prepared.data, {
                isCustom: prepared.isCustom,
                customInput: prepared.customInput,
                searchTarget: autoTarget,
                targetInput: String(autoTarget),
                paramValues: [autoTarget],
                paramInput: String(autoTarget),
                paramsReady: true,
                graphData: prepared.graphData,
                startNode: prepared.startNode,
                speed: prepared.speed,
                status: prepared.status,
                stepIndex: prepared.stepIndex,
                elapsedMs: prepared.elapsedMs
            });
        }

        if (prepared?.paramRule?.count > 0 && !prepared.paramsReady) {
            return { error: `${prepared.algorithm?.name}: enter parameters or click Random Params first.` };
        }

        return { lane: prepared };
    };

    const runSingle = (key) => {
        const lane = cardsRef.current[key];
        if (!lane?.isSupported || lane.status === 'running') return;

        const preparedResult = prepareLaneForExecution(lane);
        if (preparedResult.error) {
            setGlobalError(preparedResult.error);
            return;
        }
        const preparedLane = preparedResult.lane;

        setGlobalError('');
        clearTimer(key);
        setWinnerKey(null);
        runModeRef.current = 'single';
        setRunMode('single');
        setCards((prev) => {
            const next = { ...prev };
            const restart = preparedLane.stepIndex >= preparedLane.steps.length - 1;
            next[key] = {
                ...preparedLane,
                status: 'running',
                stepIndex: restart ? 0 : preparedLane.stepIndex,
                elapsedMs: restart ? 0 : preparedLane.elapsedMs
            };
            return next;
        });
        setTimeout(() => tick(key), 0);
    };

    const stopSingle = (key) => {
        clearTimer(key);
        updateCard(key, (card) => ({ ...card, status: card.status === 'running' ? 'stopped' : card.status }));
        setTimeout(() => finalize(), 0);
    };

    const resetSingle = (key) => {
        clearTimer(key);
        updateCard(key, (card) => ({ ...card, status: 'idle', stepIndex: 0, elapsedMs: 0 }));
        setTimeout(() => finalize(), 0);
    };

    const runAll = () => {
        if (isMultiComparison && !comparisonInputReady) {
            setGlobalError('For multi-algorithm comparison, enter input and click Set Data, or click Random Data first.');
            return;
        }
        if (anyRunning || !supportedKeys.length) return;

        const preparedByKey = {};
        for (const key of supportedKeys) {
            const lane = cardsRef.current[key];
            const prepared = prepareLaneForExecution(lane);
            if (prepared.error) {
                setGlobalError(prepared.error);
                return;
            }
            preparedByKey[key] = prepared.lane;
        }

        setGlobalError('');
        setWinnerKey(null);
        runModeRef.current = 'all';
        setRunMode('all');
        setCards((prev) => {
            const next = { ...prev };
            supportedKeys.forEach((key) => {
                next[key] = { ...preparedByKey[key], status: 'running', stepIndex: 0, elapsedMs: 0 };
            });
            return next;
        });
        setTimeout(() => supportedKeys.forEach((key) => tick(key)), 0);
    };

    const stopAll = () => {
        clearAllTimers();
        setCards((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((key) => {
                if (next[key].status === 'running') next[key] = { ...next[key], status: 'stopped' };
            });
            return next;
        });
        runModeRef.current = 'none';
        setRunMode('none');
    };

    const resetAll = () => {
        clearAllTimers();
        setWinnerKey(null);
        setCards((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((key) => { next[key] = { ...next[key], status: 'idle', stepIndex: 0, elapsedMs: 0 }; });
            return next;
        });
        runModeRef.current = 'none';
        setRunMode('none');
    };

    const applyGlobalData = () => {
        if (anyRunning) return;
        const parsed = parseData(globalInput);
        if (parsed.error) return setGlobalError(parsed.error);
        setGlobalError('');
        setGlobalData(parsed.values);
        setGlobalInput(parsed.values.join(', '));
        const defaultTarget = parsed.values[Math.floor(parsed.values.length / 2)];
        setGlobalSearchTarget(defaultTarget);
        setGlobalTargetInput(String(defaultTarget));
        setComparisonInputReady(true);
        setComparisonInputType('custom');
    };

    const newGlobalData = () => {
        if (anyRunning) return;
        const data = randomData(MAX_INPUT_ELEMENTS, orderMode);
        setGlobalError('');
        setGlobalData(data);
        setGlobalInput(data.join(', '));
        const defaultTarget = data[Math.floor(data.length / 2)];
        setGlobalSearchTarget(defaultTarget);
        setGlobalTargetInput(String(defaultTarget));
        setComparisonInputReady(true);
        setComparisonInputType('random');
    };

    const randomRunAll = () => {
        if (anyRunning) return;
        setGlobalError('');
        
        // 1. Generate new global data
        const data = randomData(MAX_INPUT_ELEMENTS, orderMode);
        setGlobalData(data);
        setGlobalInput(data.join(', '));
        const defaultTarget = data[Math.floor(data.length / 2)];
        setGlobalSearchTarget(defaultTarget);
        setGlobalTargetInput(String(defaultTarget));
        setComparisonInputReady(true);
        setComparisonInputType('random');

        // 2. We need to wait for state updates or force immediate card regeneration
        // In this component's effect structure, updating globalData will trigger card reset.
        // We'll use a timeout to ensure cards are randomized after they reset from globalData change.
        setTimeout(() => {
            randomizeAllParams();
            setTimeout(() => {
                runAll();
            }, 100);
        }, 100);
    };

    const applyGlobalTarget = () => {
        if (anyRunning) return;
        const parsedTarget = Number(globalTargetInput);
        if (!Number.isFinite(parsedTarget)) {
            setGlobalError('Search target must be a valid number.');
            return;
        }
        const normalizedTarget = clampParam(parsedTarget);
        setGlobalError('');
        setGlobalSearchTarget(normalizedTarget);
        setCards((prev) => {
            const next = { ...prev };
            Object.keys(next).forEach((key) => {
                const lane = next[key];
                if (!lane?.needsTarget || lane.isCustom) return;
                const baseValues = Array.isArray(lane.paramValues) ? [...lane.paramValues] : [];
                if (baseValues.length === 0) baseValues.push(normalizedTarget);
                baseValues[0] = normalizedTarget;
                next[key] = makeCard(lane.algorithm, lane.data, {
                    isCustom: lane.isCustom,
                    customInput: lane.customInput,
                    searchTarget: normalizedTarget,
                    targetInput: String(normalizedTarget),
                    paramValues: baseValues,
                    paramInput: baseValues.join(', '),
                    paramsReady: true,
                    graphData: lane.graphData,
                    startNode: lane.startNode,
                    speed: lane.speed
                });
            });
            return next;
        });
    };

    const onGlobalSpeed = (speed) => {
        const value = Number(speed);
        setGlobalSpeed(value);
        globalSpeedRef.current = value;
        if (runModeRef.current === 'all') {
            supportedKeys.forEach((key) => {
                if (cardsRef.current[key]?.status === 'running') tick(key);
            });
        }
    };

    return (
        <div className="glass-panel visualizer-ui theatre-mode" style={{ padding: isMobile ? '14px' : '24px', borderRadius: '20px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: isMobile ? '14px' : '20px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: isMobile ? '1.08rem' : '1.32rem', color: 'var(--text-primary)', fontWeight: 700 }}>Live Algorithm Race Arena</h3>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontWeight: 500 }}>Start one lane or run all lanes to compare performance side-by-side.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" className="control-btn" onClick={newGlobalData} disabled={anyRunning} title="Generate new random array for all algorithms">
                        Random Data
                    </button>
                    <button type="button" className="control-btn" onClick={randomizeAllParams} disabled={anyRunning || !pendingParamKeys.length} title="Randomize extra parameters for all lanes">
                        Random Params All
                    </button>
                    <button type="button" className="control-btn play-btn" onClick={randomRunAll} disabled={anyRunning || !supportedKeys.length} title="Randomize everything and run all algorithms">
                        Random & Run
                    </button>
                    <button type="button" className="control-btn play-btn" onClick={runAll} disabled={anyRunning || !supportedKeys.length}>Run All</button>
                    <button type="button" className="control-btn" onClick={stopAll} disabled={!anyRunning}>Stop All</button>
                    <button type="button" className="control-btn" onClick={resetAll}>Reset All</button>
                </div>
            </div>

            {pendingParamKeys.length > 0 && (
                <div style={{
                    marginBottom: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(251, 191, 36, 0.45)',
                    background: 'rgba(251, 191, 36, 0.12)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        Extra parameters required for {pendingParamKeys.length} lane{pendingParamKeys.length > 1 ? 's' : ''}. Enter parameters or generate random parameters.
                    </span>
                    <button
                        type="button"
                        className="control-btn play-btn"
                        onClick={randomizeAllParams}
                        disabled={anyRunning}
                    >
                        Random Params All
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: globalGridColumns, gap: '14px', marginBottom: '14px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Global Speed ({globalSpeed.toFixed(2)}x)</label>
                    <input type="range" min="0.5" max="3" step="0.05" value={globalSpeed} onChange={(e) => onGlobalSpeed(e.target.value)} style={{ width: '100%' }} />
                </div>
            </div>

            {globalError && <div style={{ marginTop: '10px', color: '#f87171', fontSize: '0.85rem' }}>{globalError}</div>}
            {!anyRunning && winnerKey && cards[winnerKey] && (
                <div style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.45)' }}>
                    Winner: <strong>{cards[winnerKey].algorithm?.name}</strong> ({formatTime(cards[winnerKey].elapsedMs)})
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: laneGridColumns, gap: '18px', marginTop: '18px', alignItems: 'start' }}>
                {entries.map(({ key, algorithm }, sectionIndex) => {
                    const card = cards[key];
                    if (!card) return null;

                    const step = card.steps[card.stepIndex] || null;
                    const array = step?.arraySnapshot || card.data;
                    const compare = step?.type === 'compare' ? (step.indices || []) : [];
                    const active = step?.type !== 'compare' ? (step?.indices || []) : [];
                    const sorted = step?.sortedIndices || (step?.type === 'completed' ? array.map((_, i) => i) : []);
                    const liveComp = countComparisons(card.steps, card.stepIndex);
                    const isWinner = key === winnerKey;
                    const laneIsRunning = card.status === 'running';

                    const renderLaneCanvas = () => {
                        if (!card.isSupported) return null;
                        if (card.canvasType === 'tree') {
                            return <TreeCanvas treeData={step?.treeData || null} nodeStates={step?.nodeStates || {}} />;
                        }
                        if (card.canvasType === 'graph') {
                            const graphData = card.graphData || defaultGraph;
                            return (
                                <GraphCanvas
                                    nodes={graphData.nodes || []}
                                    edges={graphData.edges || []}
                                    nodeStates={step?.nodeStates || {}}
                                    edgeStates={step?.edgeStates || {}}
                                    distanceTable={step?.distanceTable || null}
                                />
                            );
                        }
                        if (card.canvasType === 'tree') {
                            return (
                                <TreeCanvas
                                    treeData={step?.treeSnapshot || step?.treeData || null}
                                />
                            );
                        }
                        if (card.canvasType === 'astar') {
                            return (
                                <AStarMiniCanvas
                                    gridSnapshot={step?.gridSnapshot || []}
                                    stats={step?.stats || null}
                                />
                            );
                        }
                        if (card.canvasType === 'dp') {
                            return (
                                <DPTableCanvas
                                    table={step?.table || []}
                                    cellStates={step?.cellStates || {}}
                                    rowLabels={step?.rowLabels || []}
                                    colLabels={step?.colLabels || []}
                                    highlightCells={step?.highlightCells || []}
                                />
                            );
                        }
                        if (card.canvasType === 'activity') {
                            return (
                                <ActivityCanvas
                                    activities={step?.activities || []}
                                    actStates={step?.actStates || {}}
                                    selected={step?.selected || []}
                                />
                            );
                        }
                        if (card.canvasType === 'string') {
                            return (
                                <StringMatchMiniCanvas
                                    textData={array}
                                    target={card.searchTarget}
                                    currentStep={step}
                                />
                            );
                        }
                        if (card.canvasType === 'grid') {
                            return (
                                <GridCanvas
                                    array={array}
                                    currentIndices={active}
                                    compareIndices={compare}
                                    sortedIndices={sorted}
                                />
                            );
                        }
                        return <AnimationCanvas array={array} currentIndices={active} compareIndices={compare} sortedIndices={sorted} />;
                    };

                    return (
                        <section
                            key={key}
                            className="glass-panel visualizer-lane theatre-stage"
                            style={{
                                padding: isMobile ? '14px' : '18px',
                                borderRadius: '16px',
                                border: isWinner ? '1px solid rgba(251, 191, 36, 0.7)' : '1px solid rgba(255,255,255,0.12)',
                                background: 'var(--viz-panel-bg, #1a1a1a)',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.28)'
                            }}
                        >
                            <div style={{
                                marginBottom: '12px',
                                paddingBottom: '10px',
                                borderBottom: '1px solid rgba(255,255,255,0.08)',
                                color: 'var(--text-secondary)',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase'
                            }}>
                                Algorithm Section {sectionIndex + 1}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700 }}>{algorithm?.name}</h4>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {card.isCustom && <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(56,189,248,0.2)' }}>Custom</span>}
                                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.09)' }}>{card.status}</span>
                                    <button
                                        type="button"
                                        className="control-btn"
                                        onClick={() => algorithm?.path && navigate(algorithm.path)}
                                        disabled={!algorithm?.path}
                                        title="Open full-screen algorithm visualizer"
                                    >
                                        Full Screen
                                    </button>
                                </div>
                            </div>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: card.paramRule
                                        ? (isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))')
                                        : (isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))'),
                                    gap: '8px',
                                    margin: '10px 0'
                                }}
                            >
                                <div style={{ background: 'var(--viz-card-bg, #222222)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Step: {card.stepIndex}/{Math.max(card.steps.length - 1, 0)}</div>
                                <div style={{ background: 'var(--viz-card-bg, #222222)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Time: {formatTime(card.elapsedMs)}</div>
                                <div style={{ background: 'var(--viz-card-bg, #222222)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>Cmp: {liveComp}/{card.totalComparisons}</div>
                                {card.paramRule && (
                                    <div style={{ background: 'var(--viz-card-bg, #222222)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                        Params: {formatParamSummary(card)}
                                    </div>
                                )}
                            </div>

                            {card.isSupported ? (
                                <>
                                    <div style={{ height: isMobile ? '220px' : '300px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px', marginBottom: '10px', overflow: 'auto', background: 'var(--viz-input-bg, #1e1e1e)' }}>
                                        {step?.arraySnapshot && (
                                            <InputArrayDisplay arraySnapshot={step.arraySnapshot} activeArrayIndex={step.activeArrayIndex} />
                                        )}
                                        {renderLaneCanvas()}
                                    </div>
                                    <div style={{ minHeight: '38px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '10px', fontWeight: 500 }}>
                                        {step?.description || 'Ready at Step 0.'}
                                    </div>
                                </>
                            ) : (
                                <div style={{ border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                                    <p style={{ margin: 0, fontWeight: 600 }}>Mini visual lane not available yet</p>
                                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                                        {algorithm?.name} can still run stats and controls, and Full Screen opens the complete algorithm page.
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : (isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))'), gap: '10px', marginBottom: '10px' }}>
                                <button type="button" className="control-btn play-btn" onClick={() => runSingle(key)} disabled={laneIsRunning || !card.isSupported}>Run</button>
                                <button type="button" className="control-btn" onClick={() => stopSingle(key)} disabled={!laneIsRunning}>Stop</button>
                                <button type="button" className="control-btn" onClick={() => resetSingle(key)} disabled={laneIsRunning}>Reset</button>
                                <button
                                    type="button"
                                    className="control-btn"
                                    onClick={() => {
                                        if (laneIsRunning) return;
                                        if (card.canvasType === 'graph') {
                                            setGraphModalLaneKey(key);
                                            return;
                                        }
                                        const isStr = card.canvasType === 'string';
                                        const data = randomData(isStr ? 12 : (card.data.length || globalData.length || DEFAULT_DATA.length), 'random', isStr);
                                        const laneTarget = isStr ? data.slice(1, 4).join('') : data[Math.floor(data.length / 2)];
                                        setCards((prev) => ({
                                            ...prev,
                                            [key]: makeCard(prev[key].algorithm, data, {
                                                isCustom: true,
                                                customInput: data.join(', '),
                                                searchTarget: laneTarget,
                                                targetInput: String(laneTarget),
                                                paramValues: prev[key].paramValues,
                                                paramInput: prev[key].paramInput,
                                                paramsReady: prev[key].paramsReady,
                                                graphData: prev[key].graphData,
                                                startNode: prev[key].startNode,
                                                speed: prev[key].speed
                                            })
                                        }));
                                    }}
                                    disabled={laneIsRunning}
                                >
                                    {card.canvasType === 'graph' ? 'Configure' : 'Random'}
                                </button>
                                <button
                                    type="button"
                                    className="control-btn"
                                    onClick={() => {
                                        if (laneIsRunning) return;
                                        setCards((prev) => ({
                                            ...prev,
                                            [key]: makeCard(prev[key].algorithm, globalData, {
                                                searchTarget: globalSearchTarget,
                                                targetInput: String(globalSearchTarget),
                                                paramValues: prev[key].paramValues,
                                                paramInput: prev[key].paramInput,
                                                paramsReady: prev[key].paramsReady,
                                                graphData: prev[key].graphData,
                                                startNode: prev[key].startNode,
                                                speed: prev[key].speed
                                            })
                                        }));
                                    }}
                                    disabled={laneIsRunning || (card.canvasType !== 'graph' && !card.isCustom)}
                                >
                                    {card.canvasType === 'graph' ? 'Keep Graph' : 'Global'}
                                </button>
                            </div>

                            {card.paramRule && (
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto', gap: '10px', marginBottom: '10px' }}>
                                    <input
                                        value={card.paramInput}
                                        disabled={laneIsRunning}
                                        onChange={(e) => updateCard(key, (current) => ({ ...current, paramInput: e.target.value }))}
                                        placeholder={buildParamPlaceholder(card.paramRule)}
                                        style={INPUT_STYLE}
                                    />
                                    <button
                                        type="button"
                                        className="control-btn"
                                        disabled={laneIsRunning}
                                        onClick={() => applyLaneParams(key)}
                                    >
                                        Apply Params
                                    </button>
                                    <button
                                        type="button"
                                        className="control-btn"
                                        disabled={laneIsRunning}
                                        onClick={() => randomizeLaneParams(key)}
                                    >
                                        Random Params
                                    </button>
                                </div>
                            )}

                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Lane Speed ({card.speed.toFixed(2)}x)</label>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.05"
                                value={card.speed}
                                disabled={runMode === 'all'}
                                onChange={(e) => {
                                    const speed = Number(e.target.value);
                                    setCards((prev) => ({ ...prev, [key]: { ...prev[key], speed } }));
                                    if (runModeRef.current !== 'all' && cardsRef.current[key]?.status === 'running') tick(key);
                                }}
                                style={{ width: '100%', marginBottom: '8px' }}
                            />

                            {card.canvasType === 'graph' ? (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto', gap: '6px', marginBottom: '6px' }}>
                                        <select
                                            value={card.startNode || ''}
                                            disabled={laneIsRunning}
                                            onChange={(e) => {
                                                const nextStartNode = e.target.value;
                                                setCards((prev) => ({
                                                    ...prev,
                                                    [key]: makeCard(prev[key].algorithm, prev[key].data, {
                                                        isCustom: prev[key].isCustom,
                                                        customInput: prev[key].customInput,
                                                        searchTarget: prev[key].searchTarget,
                                                        targetInput: prev[key].targetInput,
                                                        paramValues: prev[key].paramValues,
                                                        paramInput: prev[key].paramInput,
                                                        paramsReady: prev[key].paramsReady,
                                                        graphData: prev[key].graphData,
                                                        startNode: nextStartNode,
                                                        speed: prev[key].speed
                                                    })
                                                }));
                                            }}
                                            style={INPUT_STYLE}
                                        >
                                            {(card.graphData?.nodes || []).map((node) => (
                                                <option key={node.id} value={node.id}>
                                                    Start Node {node.id}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="control-btn"
                                            disabled={laneIsRunning}
                                            onClick={() => setGraphModalLaneKey(key)}
                                        >
                                            Graph Input
                                        </button>
                                        <button
                                            type="button"
                                            className="control-btn"
                                            disabled={laneIsRunning}
                                            onClick={() => {
                                                const laneConfig = getLaneConfig(card.algorithm);
                                                const resetGraph = laneConfig?.graphData || defaultGraph;
                                                const resetStart = resolveGraphStartNode(resetGraph, [card.startNode]);
                                                setCards((prev) => ({
                                                    ...prev,
                                                    [key]: makeCard(prev[key].algorithm, prev[key].data, {
                                                        isCustom: false,
                                                        customInput: '',
                                                        searchTarget: prev[key].searchTarget,
                                                        targetInput: prev[key].targetInput,
                                                        paramValues: prev[key].paramValues,
                                                        paramInput: prev[key].paramInput,
                                                        paramsReady: prev[key].paramsReady,
                                                        graphData: resetGraph,
                                                        startNode: resetStart,
                                                        speed: prev[key].speed
                                                    })
                                                }));
                                            }}
                                        >
                                            Default Graph
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                        Graph algorithms use the same custom graph input flow as full visualizer.
                                    </div>
                                </>
                            ) : card.canvasType === 'tree' ? (
                                <>
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                        <button
                                            type="button"
                                            className="control-btn"
                                            disabled={laneIsRunning}
                                            onClick={() => setTreeModalLaneKey(key)}
                                            style={{ flex: 1 }}
                                        >
                                            Configure Tree
                                        </button>
                                        <button
                                            type="button"
                                            className="control-btn"
                                            disabled={laneIsRunning}
                                            onClick={() => {
                                                setCards((prev) => ({
                                                    ...prev,
                                                    [key]: makeCard(prev[key].algorithm, prev[key].data, {
                                                        isCustom: false,
                                                        customInput: '',
                                                        searchTarget: prev[key].searchTarget,
                                                        targetInput: prev[key].targetInput,
                                                        paramValues: prev[key].paramValues,
                                                        paramInput: prev[key].paramInput,
                                                        paramsReady: prev[key].paramsReady,
                                                        graphData: prev[key].graphData,
                                                        treeData: null,
                                                        startNode: prev[key].startNode,
                                                        speed: prev[key].speed
                                                    })
                                                }));
                                            }}
                                        >
                                            Reset Tree
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                        Configure an Edge List Tree or use default values.
                                    </div>
                                </>
                            ) : card.canvasType === 'tree' && card.algorithm?.name !== 'Huffman Coding' ? (
                                <>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="control-btn"
                                            style={{ flex: 1, padding: '10px' }}
                                            onClick={() => setTreeModalLaneKey(key)}
                                        >
                                            Configure Tree
                                        </button>
                                        <button
                                            className="control-btn"
                                            onClick={() => {
                                                setCards((prev) => ({
                                                    ...prev,
                                                    [key]: makeCard(prev[key].algorithm, defaultTreeValues, {
                                                        isCustom: false,
                                                        customInput: '',
                                                        searchTarget: prev[key].searchTarget,
                                                        targetInput: prev[key].targetInput,
                                                        paramValues: prev[key].paramValues,
                                                        paramInput: prev[key].paramInput,
                                                        paramsReady: prev[key].paramsReady,
                                                        graphData: prev[key].graphData,
                                                        treeData: null,
                                                        startNode: prev[key].startNode,
                                                        speed: prev[key].speed
                                                    })
                                                }));
                                            }}
                                        >
                                            Reset Tree
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                        Configure an Edge List N-ary Tree or use default values.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                        <input
                                            value={card.customInput}
                                            disabled={laneIsRunning}
                                            onChange={(e) => updateCard(key, (current) => ({ ...current, customInput: e.target.value }))}
                                            placeholder={card.canvasType === 'string' ? "Text string" : "e.g. 50, 10, 20 (max 10)"}
                                            style={INPUT_STYLE}
                                        />
                                        {card.needsTarget && (
                                            <input
                                                value={card.targetInput}
                                                disabled={laneIsRunning}
                                                onChange={(e) => updateCard(key, (current) => ({ ...current, targetInput: e.target.value }))}
                                                placeholder={card.canvasType === 'string' ? "Pattern" : "Target"}
                                                style={{ ...INPUT_STYLE, maxWidth: '100px' }}
                                            />
                                        )}
                                        <button
                                            type="button"
                                            className="control-btn"
                                            disabled={laneIsRunning || !card.customInput.trim()}
                                            onClick={() => {
                                                if (laneIsRunning) return;
                                                const isStr = card.canvasType === 'string';
                                                const parsed = parseData(card.customInput, isStr);
                                                if (parsed.error) return setGlobalError(`${card.algorithm?.name}: ${parsed.error}`);
                                                setGlobalError('');
                                                const laneTarget = (!isStr && Number.isFinite(Number(card.targetInput)))
                                                    ? Math.round(Number(card.targetInput))
                                                    : (isStr ? card.targetInput : resolveDefaultTarget(parsed.values));
                                                setCards((prev) => ({
                                                    ...prev,
                                                    [key]: makeCard(prev[key].algorithm, parsed.values, {
                                                        isCustom: true,
                                                        customInput: isStr ? parsed.values.join('') : parsed.values.join(', '),
                                                        searchTarget: laneTarget,
                                                        targetInput: String(laneTarget),
                                                        paramValues: prev[key].paramValues,
                                                        paramInput: prev[key].paramInput,
                                                        paramsReady: prev[key].paramsReady,
                                                        graphData: prev[key].graphData,
                                                        treeData: prev[key].treeData,
                                                        startNode: prev[key].startNode,
                                                        speed: prev[key].speed
                                                    })
                                                }));
                                            }}
                                        >
                                            Set
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                        {card.canvasType === 'string' ? 'Enter custom text and pattern to search.' : 'Enter up to 10 numbers separated by commas or spaces.'}
                                    </div>
                                </>
                            )}
                        </section>
                    );
                })}
            </div>
            {Boolean(graphModalLaneKey) && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setGraphModalLaneKey(null)}>
                    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', minWidth: '400px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>Update Graph</h3>
                            <button onClick={() => setGraphModalLaneKey(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <GraphInput
                            nodes={cards[graphModalLaneKey]?.graphData?.nodes || []}
                            edges={cards[graphModalLaneKey]?.graphData?.edges || []}
                            onGraphUpdate={(graphData) => {
                                setCards((prev) => {
                                    const lane = prev[graphModalLaneKey];
                                    if (!lane) return prev;
                                    const nextStartNode = resolveGraphStartNode(graphData, [lane.startNode]);
                                    return {
                                        ...prev,
                                        [graphModalLaneKey]: makeCard(lane.algorithm, lane.data, {
                                            isCustom: true,
                                            customInput: '',
                                            searchTarget: lane.searchTarget,
                                            targetInput: lane.targetInput,
                                            paramValues: lane.paramValues,
                                            paramInput: lane.paramInput,
                                            paramsReady: lane.paramsReady,
                                            graphData,
                                            startNode: nextStartNode,
                                            speed: lane.speed
                                        })
                                    };
                                });
                                setGraphModalLaneKey(null);
                            }}
                            requiresDirected={false}
                            requiresWeights={true}
                        />
                    </div>
                </div>
            )}
            <TreeInputModal
                isOpen={Boolean(treeModalLaneKey)}
                onClose={() => setTreeModalLaneKey(null)}
                onGenerate={(treeData) => {
                    if (!treeModalLaneKey) return;
                    setCards((prev) => {
                        const lane = prev[treeModalLaneKey];
                        if (!lane) return prev;
                        return {
                            ...prev,
                            [treeModalLaneKey]: makeCard(lane.algorithm, lane.data, {
                                isCustom: true,
                                customInput: '',
                                searchTarget: lane.searchTarget,
                                targetInput: lane.targetInput,
                                paramValues: lane.paramValues,
                                paramInput: lane.paramInput,
                                paramsReady: lane.paramsReady,
                                graphData: lane.graphData,
                                treeData: treeData,
                                startNode: lane.startNode,
                                speed: lane.speed
                            })
                        };
                    });
                    setTreeModalLaneKey(null);
                }}
            />
        </div>
    );
};

export default MultiAlgoVisualizer;
