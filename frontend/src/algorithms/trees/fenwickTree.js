// Fenwick Tree (BIT) — Educational step-by-step build + prefix sum query
// Shows the i += (i & -i) update propagation and i -= (i & -i) query path

let idCounter = 0;

const cloneTree = (node) => {
    if (!node) return null;
    const clone = { ...node };
    clone.children = (node.children || []).map(c => cloneTree(c));
    return clone;
};

/**
 * Build a tree visualization of the BIT responsibility hierarchy.
 * Child of index i: any j where j + (j & -j) === i
 */
const buildVizTree = (bit, n) => {
    const childrenMap = {};
    for (let i = 0; i <= n; i++) childrenMap[i] = [];
    for (let j = 1; j <= n; j++) {
        const p = j + (j & -j);
        if (p <= n) childrenMap[p].push(j);
    }

    const buildNode = (idx) => ({
        id: `fw_${idCounter++}`,
        value: bit[idx],
        label: `B[${idx}]=${bit[idx]}`,
        bitIndex: idx,
        children: childrenMap[idx].map(c => buildNode(c))
    });

    // Find root indices
    const roots = [];
    for (let j = 1; j <= n; j++) {
        if (j + (j & -j) > n) roots.push(j);
    }

    if (roots.length === 1) return buildNode(roots[0]);
    return {
        id: `fw_${idCounter++}`, value: '', label: 'BIT',
        bitIndex: 0, children: roots.map(r => buildNode(r))
    };
};

const findByIndex = (node, idx) => {
    if (!node) return null;
    if (node.bitIndex === idx) return node;
    for (const c of (node.children || [])) {
        const f = findByIndex(c, idx);
        if (f) return f;
    }
    return null;
};

const collectIds = (node, map) => {
    if (!node) return;
    map[node.id] = node;
    (node.children || []).forEach(c => collectIds(c, map));
};

const resetStates = (tree, nodeStates) => {
    const map = {};
    collectIds(tree, map);
    Object.values(map).forEach(nd => { nodeStates[nd.id] = 'default'; });
};

export const generateFenwickTreeSteps = (inputArray) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    const arr = (inputArray && inputArray.length > 0) ? inputArray.slice(0, 10) : [2, 4, 5, 7, 8, 6, 3, 1];
    const n = arr.length;
    const bit = new Array(n + 1).fill(0);

    // Concept introduction
    steps.push({
        type: 'tree',
        description: `📚 Fenwick Tree (Binary Indexed Tree): Efficiently computes prefix sums in O(log n). Uses bit manipulation: index & (-index) gives the lowest set bit.`,
        treeData: null,
        nodeStates: {},
        arraySnapshot: [...arr],
        activeArrayIndex: -1
    });

    steps.push({
        type: 'tree',
        description: `📊 Input array: [${arr.join(', ')}]. We'll build the BIT by updating indices using i += (i & -i).`,
        treeData: null,
        nodeStates: {},
        arraySnapshot: [...arr],
        activeArrayIndex: -1
    });

    // Build BIT element by element with step-by-step propagation
    for (let i = 0; i < n; i++) {
        const val = arr[i];
        let idx = i + 1;

        steps.push({
            type: 'tree',
            description: `📥 Processing arr[${i}] = ${val}. Start updating from BIT index ${idx}.`,
            treeData: null,
            nodeStates: {},
            arraySnapshot: [...arr],
            activeArrayIndex: i
        });

        while (idx <= n) {
            const oldVal = bit[idx];
            bit[idx] += val;
            const lowbit = idx & (-idx);

            idCounter = 0;
            const tree = buildVizTree(bit, n);
            resetStates(tree, nodeStates);

            const nd = findByIndex(tree, idx);
            if (nd) nodeStates[nd.id] = 'inserted';

            steps.push({
                type: 'tree',
                description: `➕ BIT[${idx}] += ${val} → BIT[${idx}] = ${oldVal} + ${val} = ${bit[idx]}. Lowest set bit of ${idx} = ${lowbit}. Next: ${idx} + ${lowbit} = ${idx + lowbit}.`,
                treeData: cloneTree(tree),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...arr],
                activeArrayIndex: i
            });

            idx += lowbit;
        }
    }

    // Final tree state
    idCounter = 0;
    const finalTree = buildVizTree(bit, n);
    resetStates(finalTree, nodeStates);
    steps.push({
        type: 'tree',
        description: `✅ BIT construction complete! Each node stores a partial sum for its responsibility range.`,
        treeData: cloneTree(finalTree),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...arr],
        activeArrayIndex: -1
    });

    // --- Prefix Sum Query ---
    const queryIdx = Math.min(n, 5);
    const actualSum = arr.slice(0, queryIdx).reduce((a, b) => a + b, 0);
    let prefixSum = 0;
    let idx2 = queryIdx;

    steps.push({
        type: 'tree',
        description: `🔍 Prefix Sum Query: Sum of first ${queryIdx} elements. Expected = ${arr.slice(0, queryIdx).join(' + ')} = ${actualSum}. We traverse using i -= (i & -i).`,
        treeData: cloneTree(finalTree),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...arr],
        activeArrayIndex: Array.from({ length: queryIdx }, (_, k) => k)
    });

    while (idx2 > 0) {
        prefixSum += bit[idx2];
        const lowbit = idx2 & (-idx2);

        idCounter = 0;
        const qTree = buildVizTree(bit, n);
        resetStates(qTree, nodeStates);

        const nd = findByIndex(qTree, idx2);
        if (nd) nodeStates[nd.id] = 'current';

        steps.push({
            type: 'tree',
            description: `🧮 Add BIT[${idx2}] = ${bit[idx2]} → Running sum = ${prefixSum}. Lowest bit of ${idx2} = ${lowbit}. Next: ${idx2} - ${lowbit} = ${idx2 - lowbit}.`,
            treeData: cloneTree(qTree),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...arr],
            activeArrayIndex: Array.from({ length: queryIdx }, (_, k) => k)
        });

        idx2 -= lowbit;
    }

    steps.push({
        type: 'tree-complete',
        description: `🎯 Prefix sum of first ${queryIdx} elements = ${prefixSum}. Query completed in O(log n) steps!`,
        treeData: cloneTree(finalTree),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...arr],
        activeArrayIndex: Array.from({ length: queryIdx }, (_, k) => k)
    });

    return steps;
};
