// Red-Black Tree — Educational step-by-step insertion with rule explanations
// Shows the 4 RB rules, color changes, and rotation cases

let idCounter = 0;

const newNode = (val, color = 'red') => ({
    id: `rb_${idCounter++}`,
    value: val,
    color,
    left: null,
    right: null
});

const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

export const generateRedBlackTreeSteps = (values, _t, _p, _g, customTreeData = null) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    if (customTreeData) {
        return [{
            type: 'tree-complete',
            description: `Viewing Custom Red-Black Tree Structure.`,
            treeData: cloneTree(customTreeData),
            nodeStates: {},
            arraySnapshot: [],
            activeArrayIndex: -1
        }];
    }

    let root = null;
    let currentArrayIndex = -1;
    let currentArraySnapshot = [];

    const leftRotate = (node) => {
        const right = node.right;
        node.right = right.left;
        right.left = node;
        right.color = node.color;
        node.color = 'red';
        return right;
    };

    const rightRotate = (node) => {
        const left = node.left;
        node.left = left.right;
        left.right = node;
        left.color = node.color;
        node.color = 'red';
        return left;
    };

    const isRed = (node) => node && node.color === 'red';

    const flipColors = (node) => {
        node.color = node.color === 'red' ? 'black' : 'red';
        if (node.left) node.left.color = node.left.color === 'red' ? 'black' : 'red';
        if (node.right) node.right.color = node.right.color === 'red' ? 'black' : 'red';
    };

    const insert = (node, val) => {
        if (!node) {
            const n = newNode(val, 'red');
            nodeStates[n.id] = 'inserted';
            steps.push({
                type: 'tree',
                description: `🔴 Insert ${val} as RED node. (Rule: All new nodes start as RED to avoid violating black-height property.)`,
                treeData: cloneTree(root || n),
                nodeStates: { ...nodeStates },
                arraySnapshot: currentArraySnapshot,
                activeArrayIndex: currentArrayIndex
            });
            return n;
        }

        nodeStates[node.id] = 'visiting';

        if (val < node.value) {
            steps.push({
                type: 'tree',
                description: `🔍 ${val} < ${node.value} → Go LEFT.`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates },
                arraySnapshot: currentArraySnapshot,
                activeArrayIndex: currentArrayIndex
            });
            nodeStates[node.id] = 'default';
            node.left = insert(node.left, val);
        } else if (val > node.value) {
            steps.push({
                type: 'tree',
                description: `🔍 ${val} > ${node.value} → Go RIGHT.`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates },
                arraySnapshot: currentArraySnapshot,
                activeArrayIndex: currentArrayIndex
            });
            nodeStates[node.id] = 'default';
            node.right = insert(node.right, val);
        } else {
            return node;
        }

        // Fix-up: Left-leaning Red-Black tree rules
        if (isRed(node.right) && !isRed(node.left)) {
            nodeStates[node.id] = 'rotated';
            steps.push({
                type: 'tree',
                description: `🔄 Rule violation at ${node.value}: RED right child but BLACK left child. Fix: LEFT rotate to lean left. (LLRB rule: red links lean left.)`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates },
                arraySnapshot: currentArraySnapshot,
                activeArrayIndex: currentArrayIndex
            });
            node = leftRotate(node);
        }

        if (isRed(node.left) && node.left && isRed(node.left.left)) {
            nodeStates[node.id] = 'rotated';
            steps.push({
                type: 'tree',
                description: `🔄 Rule violation at ${node.value}: Two consecutive RED nodes on the left. Fix: RIGHT rotate to balance. (No two reds in a row!)`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates },
                arraySnapshot: currentArraySnapshot,
                activeArrayIndex: currentArrayIndex
            });
            node = rightRotate(node);
        }

        if (isRed(node.left) && isRed(node.right)) {
            steps.push({
                type: 'tree',
                description: `🎨 Color flip at ${node.value}: Both children are RED. Fix: Flip colors — parent becomes RED, children become BLACK. (Maintains black-height balance.)`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates },
                arraySnapshot: currentArraySnapshot,
                activeArrayIndex: currentArrayIndex
            });
            flipColors(node);
        }

        nodeStates[node.id] = 'default';
        return node;
    };

    const vals = values || [41, 22, 58, 15, 33, 50, 63, 10, 27];
    currentArraySnapshot = vals;

    // Concept introduction
    steps.push({
        type: 'tree',
        description: `📚 Red-Black Tree: A balanced BST using coloring rules. This is the Left-Leaning RB (LLRB) variant used in many language standard libraries.`,
        treeData: null,
        nodeStates: {},
        arraySnapshot: vals,
        activeArrayIndex: -1
    });

    steps.push({
        type: 'tree',
        description: `📜 Rules: (1) Every node is RED or BLACK. (2) Root is always BLACK. (3) No two consecutive RED nodes. (4) Every path from root to leaf has same # of BLACK nodes.`,
        treeData: null,
        nodeStates: {},
        arraySnapshot: vals,
        activeArrayIndex: -1
    });

    steps.push({
        type: 'tree',
        description: `📊 Inserting values: [${vals.join(', ')}]. New nodes are RED. We fix violations via rotations and color flips.`,
        treeData: null,
        nodeStates: {},
        arraySnapshot: vals,
        activeArrayIndex: -1
    });

    for (let i = 0; i < vals.length; i++) {
        const val = vals[i];
        currentArrayIndex = i;

        steps.push({
            type: 'tree',
            description: `📥 --- Insert ${val} ---`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: vals,
            activeArrayIndex: i
        });

        root = insert(root, val);
        if (root) root.color = 'black';

        Object.keys(nodeStates).forEach(k => { nodeStates[k] = 'default'; });

        steps.push({
            type: 'tree',
            description: `✅ After inserting ${val}: Root ${root.value} is BLACK (Rule 2). Tree is balanced.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: vals,
            activeArrayIndex: i
        });
    }

    steps.push({
        type: 'tree-complete',
        description: `🎯 Red-Black Tree complete! ${vals.length} values inserted. All 4 rules maintained. Black-height is uniform across all paths.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: vals,
        activeArrayIndex: -1
    });

    return steps;
};
