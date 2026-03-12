// Min-Heap — Educational step-by-step insert (bubble-up) + extract-min (heapify-down)
// Shows array-to-tree mapping, parent/child relationships, and the heap property

let idCounter = 0;

const buildTreeFromArray = (arr) => {
    if (arr.length === 0) return null;
    idCounter = 0;
    const nodes = arr.map((val, i) => ({
        id: `hp_${i}`,
        value: val,
        label: `${val}`,
        arrayIndex: i,
        left: null,
        right: null
    }));
    for (let i = 0; i < nodes.length; i++) {
        const li = 2 * i + 1;
        const ri = 2 * i + 2;
        if (li < nodes.length) nodes[i].left = nodes[li];
        if (ri < nodes.length) nodes[i].right = nodes[ri];
    }
    return nodes[0];
};

const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

const makeStates = (heap) => {
    const states = {};
    for (let i = 0; i < heap.length; i++) states[`hp_${i}`] = 'default';
    return states;
};

export const generateHeapSteps = (inputValues, mode = 'min') => {
    const steps = [];
    const isMin = mode === 'min';

    const vals = (inputValues && inputValues.length > 0) ? inputValues.slice(0, 10) : [10, 5, 20, 3, 8, 15, 2];
    const heap = [];

    // Concept introduction
    steps.push({
        type: 'info',
        description: `📚 ${isMin ? 'Min-Heap' : 'Max-Heap'}: A complete binary tree where every parent ${isMin ? '≤' : '≥'} both children. The ${isMin ? 'minimum' : 'maximum'} element is always at the root.`,
        treeData: null,
        nodeStates: {},
        arraySnapshot: []
    });

    steps.push({
        type: 'info',
        description: `📊 Array-to-Tree mapping: For index i → left child = 2i+1, right child = 2i+2, parent = ⌊(i-1)/2⌋. Inserting [${vals.join(', ')}].`,
        treeData: null,
        nodeStates: {},
        arraySnapshot: []
    });

    // --- INSERT PHASE ---
    for (const val of vals) {
        heap.push(val);
        let i = heap.length - 1;
        let states = makeStates(heap);
        states[`hp_${i}`] = 'inserted';

        steps.push({
            type: 'insert',
            description: `📥 Insert ${val} at the next available position (index ${i}). Array: [${heap.join(', ')}].`,
            treeData: cloneTree(buildTreeFromArray(heap)),
            nodeStates: { ...states },
            arraySnapshot: [...heap],
            highlightIndices: [i]
        });

        // Bubble Up (Heapify Up)
        while (i > 0) {
            const parent = Math.floor((i - 1) / 2);
            const condition = isMin ? (heap[parent] <= heap[i]) : (heap[parent] >= heap[i]);

            if (condition) {
                states = makeStates(heap);
                states[`hp_${i}`] = 'found';
                steps.push({
                    type: 'check',
                    description: `✅ Parent ${heap[parent]} ${isMin ? '≤' : '≥'} child ${heap[i]}. Heap property satisfied!`,
                    treeData: cloneTree(buildTreeFromArray(heap)),
                    nodeStates: { ...states },
                    arraySnapshot: [...heap],
                    highlightIndices: [parent, i]
                });
                break;
            }

            // Show comparison
            states = makeStates(heap);
            states[`hp_${i}`] = 'comparing';
            states[`hp_${parent}`] = 'comparing';
            steps.push({
                type: 'compare',
                description: `⚖️ Compare: child ${heap[i]} vs parent ${heap[parent]}. Violation! (Need to bubble up)`,
                treeData: cloneTree(buildTreeFromArray(heap)),
                nodeStates: { ...states },
                arraySnapshot: [...heap],
                highlightIndices: [parent, i]
            });

            // Perform swap
            [heap[i], heap[parent]] = [heap[parent], heap[i]];
            i = parent;

            states = makeStates(heap);
            states[`hp_${i}`] = 'swapping';
            steps.push({
                type: 'swap',
                description: `🔄 Swapped with parent! ${heap[i]} moves higher. Array: [${heap.join(', ')}].`,
                treeData: cloneTree(buildTreeFromArray(heap)),
                nodeStates: { ...states },
                arraySnapshot: [...heap],
                highlightIndices: [parent, i]
            });
        }

        if (i === 0) {
            states = makeStates(heap);
            states[`hp_0`] = 'found';
            steps.push({
                type: 'root',
                description: `👑 ${heap[0]} has reached the root!`,
                treeData: cloneTree(buildTreeFromArray(heap)),
                nodeStates: { ...states },
                arraySnapshot: [...heap],
                highlightIndices: [0]
            });
        }
    }

    // --- EXTRACT PHASE ---
    if (heap.length > 0) {
        let extracted = heap[0];
        let states = makeStates(heap);
        states['hp_0'] = 'current';
        steps.push({
            type: 'extract-start',
            description: `📤 Extract ${isMin ? 'Min' : 'Max'}: Remove root ${extracted}.`,
            treeData: cloneTree(buildTreeFromArray(heap)),
            nodeStates: { ...states },
            arraySnapshot: [...heap],
            highlightIndices: [0]
        });

        if (heap.length > 1) {
            const lastVal = heap.pop();
            heap[0] = lastVal;

            states = makeStates(heap);
            states['hp_0'] = 'swapping';
            steps.push({
                type: 'extract-move',
                description: `🔄 Move last element ${lastVal} to root. Array: [${heap.join(', ')}]. Now heapify down.`,
                treeData: cloneTree(buildTreeFromArray(heap)),
                nodeStates: { ...states },
                arraySnapshot: [...heap],
                highlightIndices: [0]
            });

            // Heapify down
            let i = 0;
            while (true) {
                let targetIdx = i;
                const li = 2 * i + 1;
                const ri = 2 * i + 2;

                if (li < heap.length) {
                    const lCondition = isMin ? (heap[li] < heap[targetIdx]) : (heap[li] > heap[targetIdx]);
                    if (lCondition) targetIdx = li;
                }
                if (ri < heap.length) {
                    const rCondition = isMin ? (heap[ri] < heap[targetIdx]) : (heap[ri] > heap[targetIdx]);
                    if (rCondition) targetIdx = ri;
                }

                if (targetIdx === i) {
                    states = makeStates(heap);
                    states[`hp_${i}`] = 'found';
                    steps.push({
                        type: 'check',
                        description: `✅ Node ${heap[i]} is correctly positioned. Heap property restored!`,
                        treeData: cloneTree(buildTreeFromArray(heap)),
                        nodeStates: { ...states },
                        arraySnapshot: [...heap],
                        highlightIndices: [i]
                    });
                    break;
                }

                states = makeStates(heap);
                states[`hp_${i}`] = 'comparing';
                states[`hp_${targetIdx}`] = 'comparing';
                steps.push({
                    type: 'compare',
                    description: `⚖️ Compare: parent ${heap[i]} vs largest child ${heap[targetIdx]}. Violation! (Need to heapify down)`,
                    treeData: cloneTree(buildTreeFromArray(heap)),
                    nodeStates: { ...states },
                    arraySnapshot: [...heap],
                    highlightIndices: [i, targetIdx]
                });

                [heap[i], heap[targetIdx]] = [heap[targetIdx], heap[i]];
                i = targetIdx;

                states = makeStates(heap);
                states[`hp_${i}`] = 'swapping';
                steps.push({
                    type: 'swap',
                    description: `🔄 Swapped! Array: [${heap.join(', ')}].`,
                    treeData: cloneTree(buildTreeFromArray(heap)),
                    nodeStates: { ...states },
                    arraySnapshot: [...heap],
                    highlightIndices: [i, targetIdx]
                });
            }
        } else {
            heap.pop();
        }
    }

    steps.push({
        type: 'completed',
        description: `🎯 Operations complete! Final heap structure maintained.`,
        treeData: heap.length > 0 ? cloneTree(buildTreeFromArray(heap)) : null,
        nodeStates: makeStates(heap),
        arraySnapshot: [...heap],
        highlightIndices: []
    });

    return steps;
};
