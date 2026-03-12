// Segment Tree — Educational step-by-step build + range sum query
// Each leaf and internal node is created one at a time with clear explanations

let idCounter = 0;

const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

/**
 * Build the segment tree recursively, recording a step for each node creation.
 */
const buildWithSteps = (arr, lo, hi, steps, nodeStates, getRoot) => {
    const id = `seg_${idCounter++}`;

    if (lo === hi) {
        // Leaf node
        const node = {
            id, value: arr[lo], label: `${arr[lo]}`,
            left: null, right: null, lo, hi
        };
        nodeStates[id] = 'inserted';
        steps.push({
            type: 'tree',
            description: `🍃 Leaf node: arr[${lo}] = ${arr[lo]}. This node covers only index ${lo}.`,
            treeData: cloneTree(getRoot() || node),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...arr],
            activeArrayIndex: [lo]
        });
        nodeStates[id] = 'default';
        return node;
    }

    const mid = Math.floor((lo + hi) / 2);

    // Placeholder node — will be filled after children are built
    const node = {
        id, value: '?', label: `[${lo}..${hi}]`,
        left: null, right: null, lo, hi
    };

    // We need to attach this node into the tree BEFORE recursing
    // so the full-tree snapshot shows the placeholder
    const setNode = (n) => { node.value = n.value; node.label = n.label; node.left = n.left; node.right = n.right; };

    // Build left subtree
    node.left = buildWithSteps(arr, lo, mid, steps, nodeStates, getRoot);
    // Build right subtree
    node.right = buildWithSteps(arr, mid + 1, hi, steps, nodeStates, getRoot);

    // Merge step
    const sum = node.left.value + node.right.value;
    node.value = sum;
    node.label = `${sum}`;

    nodeStates[id] = 'comparing';
    nodeStates[node.left.id] = 'visiting';
    nodeStates[node.right.id] = 'visiting';
    steps.push({
        type: 'tree',
        description: `🔗 Merge: [${lo}..${mid}] = ${node.left.value} + [${mid + 1}..${hi}] = ${node.right.value} → Parent [${lo}..${hi}] = ${sum}.`,
        treeData: cloneTree(getRoot() || node),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...arr],
        activeArrayIndex: Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
    });
    nodeStates[id] = 'default';
    nodeStates[node.left.id] = 'default';
    nodeStates[node.right.id] = 'default';

    return node;
};

export const generateSegmentTreeSteps = (inputArray) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    const arr = (inputArray && inputArray.length > 0) ? inputArray.slice(0, 10) : [1, 3, 5, 7, 9, 11];

    // Concept introduction
    steps.push({
        type: 'tree',
        description: `📚 Segment Tree: A tree where each node stores the sum of a range of the array. Supports O(log n) range queries and updates.`,
        treeData: null,
        nodeStates: {}
    });

    steps.push({
        type: 'tree',
        description: `📊 Input array: [${arr.join(', ')}] with ${arr.length} elements. We'll build the tree bottom-up.`,
        treeData: null,
        nodeStates: {}
    });

    // Build tree with step-by-step creation
    let root = null;
    const getRoot = () => root;
    root = buildWithSteps(arr, 0, arr.length - 1, steps, nodeStates, getRoot);

    // Show completed tree
    steps.push({
        type: 'tree',
        description: `✅ Segment Tree complete! Root covers [0..${arr.length - 1}] with total sum = ${root.value}. Now let's query it.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...arr],
        activeArrayIndex: -1
    });

    // --- Range Sum Query ---
    const ql = 1;
    const qr = Math.min(4, arr.length - 1);
    const expectedSum = arr.slice(ql, qr + 1).reduce((a, b) => a + b, 0);

    Object.keys(nodeStates).forEach(k => { nodeStates[k] = 'default'; });
    steps.push({
        type: 'tree',
        description: `🔍 Query: What is the sum of arr[${ql}] to arr[${qr}]? Expected = ${arr.slice(ql, qr + 1).join(' + ')} = ${expectedSum}.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...arr],
        activeArrayIndex: Array.from({ length: qr - ql + 1 }, (_, i) => ql + i)
    });

    let queryResult = 0;
    const query = (node) => {
        if (!node) return;

        // Check if completely outside
        if (qr < node.lo || node.hi < ql) {
            nodeStates[node.id] = 'default';
            steps.push({
                type: 'tree',
                description: `❌ Node [${node.lo}..${node.hi}] is completely outside query range [${ql}..${qr}]. Skip.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...arr],
                activeArrayIndex: Array.from({ length: node.hi - node.lo + 1 }, (_, i) => node.lo + i)
            });
            return;
        }

        // Check if completely inside
        if (ql <= node.lo && node.hi <= qr) {
            queryResult += node.value;
            nodeStates[node.id] = 'found';
            steps.push({
                type: 'tree',
                description: `✅ Node [${node.lo}..${node.hi}] = ${node.value} is fully inside [${ql}..${qr}]. Add to sum → Running total = ${queryResult}.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...arr],
                activeArrayIndex: Array.from({ length: node.hi - node.lo + 1 }, (_, i) => node.lo + i)
            });
            return;
        }

        // Partial overlap — split
        nodeStates[node.id] = 'partial';
        steps.push({
            type: 'tree',
            description: `⚡ Node [${node.lo}..${node.hi}] partially overlaps [${ql}..${qr}]. Must check both children.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...arr],
            activeArrayIndex: Array.from({ length: node.hi - node.lo + 1 }, (_, i) => node.lo + i)
        });
        query(node.left);
        query(node.right);
    };

    query(root);

    steps.push({
        type: 'tree-complete',
        description: `🎯 Query complete! Sum of arr[${ql}..${qr}] = ${queryResult}. The Segment Tree answered in O(log n) steps.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...arr],
        activeArrayIndex: -1
    });

    return steps;
};
