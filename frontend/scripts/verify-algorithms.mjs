import assert from 'node:assert/strict';
import { generateBubbleSortSteps } from '../src/algorithms/sorting/bubbleSort.js';
import { generateInsertionSortSteps } from '../src/algorithms/sorting/insertionSort.js';
import { generateSelectionSortSteps } from '../src/algorithms/sorting/selectionSort.js';
import { generateShellSortSteps } from '../src/algorithms/sorting/shellSort.js';
import { generateMergeSortSteps } from '../src/algorithms/sorting/mergeSort.js';
import { generateQuickSortSteps } from '../src/algorithms/sorting/quickSort.js';
import { generateHeapSortSteps } from '../src/algorithms/sorting/heapSort.js';
import { generateBucketSortSteps } from '../src/algorithms/sorting/bucketSort.js';
import { generateRadixSortSteps } from '../src/algorithms/sorting/radixSort.js';
import { generateCocktailShakerSortSteps } from '../src/algorithms/sorting/cocktailShakerSort.js';
import { generateCombSortSteps } from '../src/algorithms/sorting/combSort.js';
import { generateCountingSortSteps } from '../src/algorithms/sorting/countingSort.js';
import { generateTimSortSteps } from '../src/algorithms/sorting/timSort.js';
import { generateCycleSortSteps } from '../src/algorithms/sorting/cycleSort.js';
import { generateLinearSearchSteps } from '../src/algorithms/searching/linearSearch.js';
import { generateSentinelLinearSearchSteps } from '../src/algorithms/searching/sentinelLinearSearch.js';
import { generateBinarySearchSteps } from '../src/algorithms/searching/binarySearch.js';
import { generateJumpSearchSteps } from '../src/algorithms/searching/jumpSearch.js';
import { generateInterpolationSearchSteps } from '../src/algorithms/searching/interpolationSearch.js';
import { generateExponentialSearchSteps } from '../src/algorithms/searching/exponentialSearch.js';
import { generateFibonacciSearchSteps } from '../src/algorithms/searching/fibonacciSearch.js';
import { generateTwoPointersSteps } from '../src/algorithms/searching/twoPointers.js';
import { generateSlidingWindowSteps } from '../src/algorithms/searching/slidingWindow.js';
import { generateBFSSteps } from '../src/algorithms/graphs/bfs.js';
import { generateDFSSteps } from '../src/algorithms/graphs/dfs.js';
import { generateDijkstraSteps } from '../src/algorithms/graphs/dijkstra.js';
import { generateBellmanFordSteps } from '../src/algorithms/graphs/bellmanFord.js';
import { generatePrimsSteps } from '../src/algorithms/graphs/prims.js';
import { generateKruskalsSteps } from '../src/algorithms/graphs/kruskals.js';
import { generateFloydWarshallSteps } from '../src/algorithms/graphs/floydWarshall.js';
import { generateTopologicalSortSteps } from '../src/algorithms/graphs/topologicalSort.js';
import { generateFloydCycleSteps } from '../src/algorithms/graphs/floydCycle.js';
import { generateKosarajuSteps } from '../src/algorithms/graphs/kosaraju.js';
import { generateAStarGridSteps } from '../src/algorithms/graphs/aStarGridCompare.js';
import { defaultGraph, defaultWeightedGraph } from '../src/algorithms/graphs/graphData.js';
import { generateBinaryTreeTraversalSteps, generateBSTDeleteSteps, generateBSTInsertSteps, generateBSTSearchSteps } from '../src/algorithms/trees/binaryTree.js';
import { generateAVLTreeSteps } from '../src/algorithms/trees/avlTree.js';
import { generateRedBlackTreeSteps } from '../src/algorithms/trees/redBlackTree.js';
import { generateSegmentTreeSteps } from '../src/algorithms/trees/segmentTree.js';
import { generateFenwickTreeSteps } from '../src/algorithms/trees/fenwickTree.js';
import { generateHeapSteps } from '../src/algorithms/trees/heap.js';
import { generateSplayTreeSteps } from '../src/algorithms/trees/splayTree.js';
import { generateTrieSteps } from '../src/algorithms/trees/trie.js';
import { defaultNaryTreeData, generateNaryBFSSteps, generateNaryDFSSteps, generateNaryTreeHeightSteps } from '../src/algorithms/trees/naryTree.js';
import { generateKnapsackSteps } from '../src/algorithms/dp/knapsack.js';
import { generateLCSSteps } from '../src/algorithms/dp/lcs.js';
import { generateEditDistanceSteps } from '../src/algorithms/dp/editDistance.js';
import { generateCoinChangeSteps } from '../src/algorithms/dp/coinChange.js';
import { generateCoinChangeWaysSteps } from '../src/algorithms/dp/coinChangeWays.js';
import { generateLISSteps } from '../src/algorithms/dp/lis.js';
import { generateMatrixChainSteps } from '../src/algorithms/dp/matrixChain.js';
import { generateRodCuttingSteps } from '../src/algorithms/dp/rodCutting.js';
import { generateEggDropSteps } from '../src/algorithms/dp/eggDrop.js';
import { generateSubsetSumSteps } from '../src/algorithms/dp/subsetSum.js';
import { generatePalindromePartitionSteps } from '../src/algorithms/dp/palindromePartition.js';
import { generateActivitySelectionSteps } from '../src/algorithms/greedy/activitySelection.js';
import { generateHuffmanCodingSteps } from '../src/algorithms/greedy/huffmanCoding.js';
import { generateFractionalKnapsackSteps } from '../src/algorithms/greedy/fractionalKnapsack.js';
import { generateJobSequencingSteps } from '../src/algorithms/greedy/jobSequencing.js';
import { generateKMPSteps } from '../src/algorithms/string/kmp.js';
import { generateRabinKarpSteps } from '../src/algorithms/string/rabinKarp.js';
import { generateZAlgorithmSteps } from '../src/algorithms/string/zAlgorithm.js';
import { generateBoyerMooreSteps } from '../src/algorithms/string/boyerMoore.js';
import { generateManacherSteps } from '../src/algorithms/string/manacher.js';
import { generateNQueensSteps } from '../src/algorithms/backtracking/nQueens.js';
import { generateRatInMazeSteps } from '../src/algorithms/backtracking/ratInMaze.js';
import { generatePalindromePartitioningSteps } from '../src/algorithms/backtracking/palindromePartitioning.js';
import { generateSieveSteps } from '../src/algorithms/math/sieve.js';
import { generateGCDSteps } from '../src/algorithms/math/euclideanGcd.js';
import { generateFastExpSteps } from '../src/algorithms/math/fastExponentiation.js';
import { generateBitManipulationSteps } from '../src/algorithms/math/bitManipulation.js';

const sourceValues = [5, 1, 4, 2, 8, 5];
const sortedValues = [1, 2, 4, 5, 5, 8];
const sortedInput = [2, 4, 6, 8, 10, 12];
const activityInput = [
    { id: 'A', start: 1, end: 2 },
    { id: 'B', start: 2, end: 4 },
    { id: 'C', start: 3, end: 5 }
];

const containsInvalidNumber = (value) => {
    if (typeof value === 'number') return Number.isNaN(value);
    if (!value || typeof value !== 'object') return false;
    return Object.values(value).some(containsInvalidNumber);
};

const getFinalArray = (steps) => {
    for (let index = steps.length - 1; index >= 0; index -= 1) {
        const step = steps[index];
        if (Array.isArray(step?.arraySnapshot)) return step.arraySnapshot;
        if (Array.isArray(step?.array)) return step.array;
    }
    return null;
};

const verifySteps = (name, run, expectedArray) => {
    const steps = run();
    assert.ok(Array.isArray(steps), `${name} must return an array of animation steps.`);
    assert.ok(steps.length > 0, `${name} must return at least one animation step.`);
    assert.equal(containsInvalidNumber(steps), false, `${name} produced a NaN state.`);
    if (expectedArray) assert.deepEqual(getFinalArray(steps), expectedArray, `${name} did not reach the expected final array.`);
    return steps;
};

const checks = [
    ['Bubble Sort', () => generateBubbleSortSteps(sourceValues), sortedValues],
    ['Insertion Sort', () => generateInsertionSortSteps(sourceValues), sortedValues],
    ['Selection Sort', () => generateSelectionSortSteps(sourceValues), sortedValues],
    ['Shell Sort', () => generateShellSortSteps(sourceValues), sortedValues],
    ['Merge Sort', () => generateMergeSortSteps(sourceValues), sortedValues],
    ['Quick Sort', () => generateQuickSortSteps(sourceValues), sortedValues],
    ['Heap Sort', () => generateHeapSortSteps(sourceValues), sortedValues],
    ['Bucket Sort', () => generateBucketSortSteps(sourceValues), sortedValues],
    ['Radix Sort', () => generateRadixSortSteps(sourceValues), sortedValues],
    ['Cocktail Shaker Sort', () => generateCocktailShakerSortSteps(sourceValues), sortedValues],
    ['Comb Sort', () => generateCombSortSteps(sourceValues), sortedValues],
    ['Counting Sort', () => generateCountingSortSteps(sourceValues), sortedValues],
    ['Tim Sort', () => generateTimSortSteps(sourceValues), sortedValues],
    ['Cycle Sort', () => generateCycleSortSteps(sourceValues), sortedValues],
    ['Linear Search', () => generateLinearSearchSteps(sortedInput, 8)],
    ['Sentinel Linear Search', () => generateSentinelLinearSearchSteps(sortedInput, 8)],
    ['Binary Search', () => generateBinarySearchSteps(sortedInput, 8)],
    ['Jump Search', () => generateJumpSearchSteps(sortedInput, 8)],
    ['Interpolation Search', () => generateInterpolationSearchSteps(sortedInput, 8)],
    ['Exponential Search', () => generateExponentialSearchSteps(sortedInput, 8)],
    ['Fibonacci Search', () => generateFibonacciSearchSteps(sortedInput, 8)],
    ['Two Pointers', () => generateTwoPointersSteps(sortedInput, 14)],
    ['Sliding Window', () => generateSlidingWindowSteps(sourceValues, 3)],
    ['BFS', () => generateBFSSteps(defaultGraph, defaultGraph.nodes[0].id)],
    ['DFS', () => generateDFSSteps(defaultGraph, defaultGraph.nodes[0].id)],
    ['Dijkstra', () => generateDijkstraSteps(defaultWeightedGraph.nodes, defaultWeightedGraph.edges, defaultWeightedGraph.nodes[0].id)],
    ['Bellman-Ford', () => generateBellmanFordSteps(defaultWeightedGraph, defaultWeightedGraph.nodes[0].id)],
    ['Prim’s MST', () => generatePrimsSteps(defaultWeightedGraph, defaultWeightedGraph.nodes[0].id)],
    ['Kruskal’s MST', () => generateKruskalsSteps(defaultWeightedGraph)],
    ['Floyd-Warshall', () => generateFloydWarshallSteps(defaultWeightedGraph)],
    ['Topological Sort', () => generateTopologicalSortSteps(defaultGraph.nodes, defaultGraph.edges)],
    ['Floyd Cycle Detection', () => generateFloydCycleSteps([1, 2, 3, 4], 1)],
    ['Kosaraju’s Algorithm', () => generateKosarajuSteps(defaultGraph.nodes, defaultGraph.edges)],
    ['A* Search', () => generateAStarGridSteps()],
    ['Binary Tree Traversal', () => generateBinaryTreeTraversalSteps([4, 2, 6, 1, 3, 5, 7])],
    ['BST Insert', () => generateBSTInsertSteps([4, 2, 6], 5)],
    ['BST Search', () => generateBSTSearchSteps([4, 2, 6, 5], 5)],
    ['BST Delete', () => generateBSTDeleteSteps([4, 2, 6, 5], 6)],
    ['AVL Tree', () => generateAVLTreeSteps([30, 20, 10])],
    ['Red-Black Tree', () => generateRedBlackTreeSteps([10, 5, 15])],
    ['Segment Tree', () => generateSegmentTreeSteps([2, 1, 5, 3])],
    ['Fenwick Tree', () => generateFenwickTreeSteps([2, 1, 5, 3])],
    ['Heap / Priority Queue', () => generateHeapSteps([5, 2, 8])],
    ['Splay Tree', () => generateSplayTreeSteps([10, 20, 30, 25])],
    ['Trie', () => generateTrieSteps(['car', 'cat', 'dog'])],
    ['N-ary DFS', () => generateNaryDFSSteps(defaultNaryTreeData)],
    ['N-ary BFS', () => generateNaryBFSSteps(defaultNaryTreeData)],
    ['N-ary Tree Height', () => generateNaryTreeHeightSteps(defaultNaryTreeData)],
    ['0/1 Knapsack', () => generateKnapsackSteps(5, [2, 3], [4, 5])],
    ['Longest Common Subsequence', () => generateLCSSteps('ABC', 'AC')],
    ['Edit Distance', () => generateEditDistanceSteps('cat', 'cut')],
    ['Coin Change (Min Coins)', () => generateCoinChangeSteps([1, 3, 4], 6)],
    ['Coin Change (Total Ways)', () => generateCoinChangeWaysSteps([1, 2, 5], 5)],
    ['Longest Increasing Subsequence', () => generateLISSteps([10, 9, 2, 5, 3, 7, 101, 18])],
    ['Matrix Chain Multiplication', () => generateMatrixChainSteps([10, 20, 30, 40])],
    ['Rod Cutting', () => generateRodCuttingSteps([1, 5, 8, 9])],
    ['Egg Drop', () => generateEggDropSteps(2, 6)],
    ['Subset Sum', () => generateSubsetSumSteps([3, 34, 4, 12, 5, 2], 9)],
    ['Palindrome Partitioning', () => generatePalindromePartitionSteps('aab')],
    ['Activity Selection', () => generateActivitySelectionSteps(activityInput)],
    ['Huffman Coding', () => generateHuffmanCodingSteps('beep boop beer!')],
    ['Fractional Knapsack', () => generateFractionalKnapsackSteps([{ weight: 2, value: 10 }, { weight: 3, value: 12 }], 5)],
    ['Job Sequencing', () => generateJobSequencingSteps([{ id: 'A', deadline: 2, profit: 100 }, { id: 'B', deadline: 1, profit: 19 }])],
    ['KMP', () => generateKMPSteps('ABABAC', 'ABA')],
    ['Rabin-Karp', () => generateRabinKarpSteps('ABABAC', 'ABA')],
    ['Z-Algorithm', () => generateZAlgorithmSteps('ABABAC', 'ABA')],
    ['Boyer-Moore', () => generateBoyerMooreSteps('ABABAC', 'ABA')],
    ['Manacher’s Algorithm', () => generateManacherSteps('babad')],
    ['N-Queens', () => generateNQueensSteps(4)],
    ['Rat in a Maze', () => generateRatInMazeSteps([[1, 0, 0], [1, 1, 0], [0, 1, 1]])],
    ['Palindrome Partitions', () => generatePalindromePartitioningSteps('aab')],
    ['Sieve of Eratosthenes', () => generateSieveSteps(10)],
    ['Euclidean GCD', () => generateGCDSteps(48, 18)],
    ['Fast Exponentiation', () => generateFastExpSteps(2, 10)],
    ['Bit Manipulation', () => generateBitManipulationSteps(5, 3, 'AND')]
];

const edgeCaseChecks = [
    ['Bubble Sort empty input', () => generateBubbleSortSteps([]), []],
    ['Merge Sort single value', () => generateMergeSortSteps([7]), [7]],
    ['Binary Search missing target', () => generateBinarySearchSteps([], 8)],
    ['BFS single node', () => generateBFSSteps({ nodes: [{ id: 'A' }], edges: [] }, 'A')],
    ['Euclidean GCD zero input', () => generateGCDSteps(0, 18)],
    ['Sieve small limit', () => generateSieveSteps(2)]
];

const failures = [];
for (const [name, run, expectedArray] of [...checks, ...edgeCaseChecks]) {
    try {
        verifySteps(name, run, expectedArray);
    } catch (error) {
        failures.push(`${name}: ${error.message}`);
    }
}

if (failures.length) {
    console.error(`Algorithm verification failed (${failures.length}):\n${failures.join('\n')}`);
    process.exit(1);
}

console.log(`Algorithm verification passed: ${checks.length} primary checks and ${edgeCaseChecks.length} edge-case checks.`);
