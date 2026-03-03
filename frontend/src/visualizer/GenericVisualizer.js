import React, { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import DualView from './DualView';
import AnimationCanvas from './AnimationCanvas';
import GraphCanvas from './GraphCanvas';
import TreeCanvas from './TreeCanvas';
import DPTableCanvas from './DPTableCanvas';
import ActivityCanvas from './ActivityCanvas';
import GraphInputModal from './GraphInputModal';
import AnimationControls from '../components/animation-controls/AnimationControls';
import useAnimation from '../hooks/useAnimation';
import useGenericAnimation from '../hooks/useGenericAnimation';
import { algorithmCodes } from '../data/algorithmCodes';
import { toast } from 'react-hot-toast';
import { algorithmLineMaps } from '../data/algorithmLineMaps';
import { algorithmList } from '../data/algorithmsData';
import {
    generateFallbackArraySteps,
    generateFallbackCode,
    getCanvasTypeForCategory,
    getDefaultArrayData,
    getFallbackLineMap,
    normalizeCategoryKey,
    pathToSlug,
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

// ── Searching ─────────────────────────────────────────────
import { generateLinearSearchSteps } from '../algorithms/searching/linearSearch';
import { generateBinarySearchSteps } from '../algorithms/searching/binarySearch';
import { generateJumpSearchSteps } from '../algorithms/searching/jumpSearch';
import { generateInterpolationSearchSteps } from '../algorithms/searching/interpolationSearch';
import { generateExponentialSearchSteps } from '../algorithms/searching/exponentialSearch';

// ── Graphs ────────────────────────────────────────────────
import { generateBFSSteps } from '../algorithms/graphs/bfs';
import { generateDFSSteps } from '../algorithms/graphs/dfs';
import { generateDijkstraSteps } from '../algorithms/graphs/dijkstra';
import { generateBellmanFordSteps } from '../algorithms/graphs/bellmanFord';
import { generatePrimsSteps } from '../algorithms/graphs/prims';
import { defaultGraph, defaultWeightedGraph } from '../algorithms/graphs/graphData';

// ── Trees ─────────────────────────────────────────────────
import { generateBinaryTreeTraversalSteps, defaultTreeValues } from '../algorithms/trees/binaryTree';
import { generateAVLTreeSteps } from '../algorithms/trees/avlTree';
import { generateRedBlackTreeSteps } from '../algorithms/trees/redBlackTree';

// ── DP ────────────────────────────────────────────────────
import { generateKnapsackSteps } from '../algorithms/dp/knapsack';
import { generateLCSSteps } from '../algorithms/dp/lcs';
import { generateCoinChangeSteps } from '../algorithms/dp/coinChange';

// ── Greedy ────────────────────────────────────────────────
import { generateActivitySelectionSteps } from '../algorithms/greedy/activitySelection';
import { generateHuffmanCodingSteps } from '../algorithms/greedy/huffmanCoding';

// Stable constants to avoid creating new references each render
const DUMMY_ARRAY = [1];
const EMPTY_STEPS = [];

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

    // Graphs (canvasType: 'graph')
    'graphs/bfs': {
        name: 'Breadth-First Search',
        canvasType: 'graph',
        generator: (graph, startNode) => generateBFSSteps(graph, startNode),
        defaultData: defaultGraph,
        codeKey: 'bfs'
    },
    'graphs/dfs': {
        name: 'Depth-First Search',
        canvasType: 'graph',
        generator: (graph, startNode) => generateDFSSteps(graph, startNode),
        defaultData: defaultGraph,
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
        generator: (values) => generateBinaryTreeTraversalSteps(values, 'inorder'),
        defaultData: defaultTreeValues,
        codeKey: 'binaryTree'
    },
    'trees/avl': {
        name: 'AVL Tree',
        canvasType: 'tree',
        generator: (values) => generateAVLTreeSteps(values),
        defaultData: [30, 20, 40, 10, 25, 35, 50, 5, 15],
        codeKey: 'avlTree'
    },
    'trees/rbt': {
        name: 'Red-Black Tree',
        canvasType: 'tree',
        generator: (values) => generateRedBlackTreeSteps(values),
        defaultData: [41, 22, 58, 15, 33, 50, 63, 10, 27],
        codeKey: 'redBlackTree'
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

    // State for array-based algorithms
    const [array, setArray] = useState(getDefaultArrayData());
    const [searchTarget, setSearchTarget] = useState(resolveDefaultTarget(getDefaultArrayData()));

    // State for graph-based algorithms
    const [customGraph, setCustomGraph] = useState(null);
    const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
    const [customStartNode, setCustomStartNode] = useState(null);

    // State for language selection
    const [activeLanguage, setActiveLanguage] = useState('javascript');

    // State for traversal type selector
    const [traversalType, setTraversalType] = useState('inorder');

    // Generate steps
    const steps = useMemo(() => {
        if (isArrayBased) {
            if (needsTarget) {
                return generator(array, searchTarget);
            }
            return generator(array);
        }
        if (canvasType === 'tree' && name === 'Binary Tree Traversals') {
            return generateBinaryTreeTraversalSteps(defaultData, traversalType);
        }
        if (canvasType === 'graph') {
            const graphToUse = customGraph || defaultData;
            return generator(graphToUse, customStartNode || graphToUse?.nodes?.[0]?.id);
        }
        if (defaultData) {
            return generator(defaultData);
        }
        return generator();
    }, [isArrayBased, canvasType, name, generator, array, searchTarget, needsTarget, defaultData, traversalType, customGraph, customStartNode]);

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
    };

    const handleManualInput = (inputVal) => {
        const MAX_INPUT_ELEMENTS = 10;
        if (!Array.isArray(inputVal) || inputVal.length === 0) return;
        if (inputVal.length > MAX_INPUT_ELEMENTS) {
            toast.error(`Maximum ${MAX_INPUT_ELEMENTS} elements are allowed.`);
            return;
        }
        setArray(inputVal);
    };

    const handleGraphGenerate = (graphData) => {
        setCustomGraph(graphData);
    };

    // Render the appropriate canvas
    const renderCanvas = () => {
        const step = anim.currentStep;

        switch (canvasType) {
            case 'array':
                return (
                    <AnimationCanvas
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

            case 'tree':
                return (
                    <TreeCanvas
                        treeData={step?.treeData || null}
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
                <div style={{
                    marginBottom: '10px',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-primary)'
                }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Beginner Overview</div>

                    <div style={{ fontSize: '0.86rem', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>1) What It Does</div>
                        {overview.whatItDoes.map((line, index) => (
                            <div key={`what-${index}`} style={{ color: 'var(--text-secondary)', marginBottom: '3px' }}>{line}</div>
                        ))}
                    </div>

                    <div style={{ fontSize: '0.86rem', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>2) How It Works</div>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                            {overview.howItWorks.map((step, index) => (
                                <li key={`how-${index}`} style={{ marginBottom: '3px' }}>{step}</li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ fontSize: '0.86rem', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>3) Core Idea</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{overview.coreIdea}</div>
                    </div>

                    <div style={{ fontSize: '0.86rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>4) Complexity</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Time Complexity: {overview.complexity.time}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>Space Complexity: {overview.complexity.space}</div>
                        {overview.complexity.stable && (
                            <div style={{ color: 'var(--text-secondary)' }}>Stable: {overview.complexity.stable}</div>
                        )}
                        {overview.complexity.inPlace && (
                            <div style={{ color: 'var(--text-secondary)' }}>In-place: {overview.complexity.inPlace}</div>
                        )}
                    </div>
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '10px', overflow: 'auto', minHeight: '400px' }}>
                    {renderCanvas()}
                </div>

                {/* Dynamic Algorithm Parameters */}
                {(needsTarget || canvasType === 'graph' || (canvasType === 'tree' && config.name === 'Binary Tree Traversals')) && (
                    <div style={{ display: 'flex', gap: '16px', padding: '12px 20px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                        {needsTarget && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>Search Target:</label>
                                <input
                                    type="number"
                                    value={searchTarget}
                                    onChange={(e) => setSearchTarget(parseInt(e.target.value) || 0)}
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
                        inputType={canvasType === 'graph' ? 'graph' : 'array'}
                    />
                </div>
            </div>

            {
                canvasType === 'graph' && (
                    <GraphInputModal
                        isOpen={isGraphModalOpen}
                        onClose={() => setIsGraphModalOpen(false)}
                        onGenerate={handleGraphGenerate}
                        defaultDirected={config.defaultData?.directed || false}
                        defaultWeighted={config.defaultData?.edges?.[0]?.weight !== undefined}
                    />
                )
            }
        </DualView >
    );
};

export default GenericVisualizer;
