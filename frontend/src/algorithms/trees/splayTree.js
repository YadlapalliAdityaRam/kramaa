// Splay Tree — Educational step-by-step BST insert + splay-to-root
// Shows Zig, Zig-Zig, Zig-Zag rotations with before/after snapshots

let idCounter = 0;

const newNode = (val) => ({
    id: `sp_${idCounter++}`,
    value: val,
    left: null,
    right: null
});

const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

const collectIds = (node, states) => {
    if (!node) return;
    states[node.id] = states[node.id] || 'default';
    collectIds(node.left, states);
    collectIds(node.right, states);
};

const resetAll = (root, states) => {
    Object.keys(states).forEach(k => delete states[k]);
    collectIds(root, states);
};

// Right rotation
const rightRotate = (x) => {
    const y = x.left;
    x.left = y.right;
    y.right = x;
    return y;
};

// Left rotation
const leftRotate = (x) => {
    const y = x.right;
    x.right = y.left;
    y.left = x;
    return y;
};

// Splay with step recording
const splay = (root, key, steps, nodeStates, vals, activeIdx) => {
    if (!root || root.value === key) return root;

    if (key < root.value) {
        if (!root.left) return root;

        if (key < root.left.value) {
            // Zig-Zig (Left-Left)
            root.left.left = splay(root.left.left, key, steps, nodeStates, vals, activeIdx);

            resetAll(root, nodeStates);
            nodeStates[root.id] = 'rotated';
            if (root.left) nodeStates[root.left.id] = 'comparing';
            steps.push({
                type: 'tree',
                description: `🔄 Zig-Zig (Left-Left): ${key} is in left-left subtree of ${root.value}. First right-rotate at ${root.value}.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            root = rightRotate(root);

        } else if (key > root.left.value) {
            // Zig-Zag (Left-Right)
            root.left.right = splay(root.left.right, key, steps, nodeStates, vals, activeIdx);

            if (root.left.right) {
                resetAll(root, nodeStates);
                nodeStates[root.left.id] = 'rotated';
                steps.push({
                    type: 'tree',
                    description: `🔄 Zig-Zag (Left-Right): ${key} is in left-right subtree. Left-rotate at ${root.left.value}.`,
                    treeData: cloneTree(root),
                    nodeStates: { ...nodeStates },
                    arraySnapshot: [...vals],
                    activeArrayIndex: activeIdx
                });
                root.left = leftRotate(root.left);
            }
        }

        if (!root.left) return root;

        resetAll(root, nodeStates);
        nodeStates[root.id] = 'rotated';
        steps.push({
            type: 'tree',
            description: `↗️ Zig: Right-rotate at ${root.value} to bring ${key} closer to root.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: activeIdx
        });
        return rightRotate(root);

    } else {
        if (!root.right) return root;

        if (key > root.right.value) {
            // Zig-Zig (Right-Right)
            root.right.right = splay(root.right.right, key, steps, nodeStates, vals, activeIdx);

            resetAll(root, nodeStates);
            nodeStates[root.id] = 'rotated';
            if (root.right) nodeStates[root.right.id] = 'comparing';
            steps.push({
                type: 'tree',
                description: `🔄 Zig-Zig (Right-Right): ${key} is in right-right subtree of ${root.value}. First left-rotate at ${root.value}.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            root = leftRotate(root);

        } else if (key < root.right.value) {
            // Zig-Zag (Right-Left)
            root.right.left = splay(root.right.left, key, steps, nodeStates, vals, activeIdx);

            if (root.right.left) {
                resetAll(root, nodeStates);
                nodeStates[root.right.id] = 'rotated';
                steps.push({
                    type: 'tree',
                    description: `🔄 Zig-Zag (Right-Left): ${key} is in right-left subtree. Right-rotate at ${root.right.value}.`,
                    treeData: cloneTree(root),
                    nodeStates: { ...nodeStates },
                    arraySnapshot: [...vals],
                    activeArrayIndex: activeIdx
                });
                root.right = rightRotate(root.right);
            }
        }

        if (!root.right) return root;

        resetAll(root, nodeStates);
        nodeStates[root.id] = 'rotated';
        steps.push({
            type: 'tree',
            description: `↗️ Zig: Left-rotate at ${root.value} to bring ${key} closer to root.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: activeIdx
        });
        return leftRotate(root);
    }
};

// BST insert with path tracing
const bstInsertWithSteps = (root, val, steps, nodeStates, vals, activeIdx) => {
    if (!root) {
        const n = newNode(val);
        nodeStates[n.id] = 'inserted';
        return n;
    }

    nodeStates[root.id] = 'visiting';
    if (val < root.value) {
        steps.push({
            type: 'tree',
            description: `🔍 ${val} < ${root.value}, go left.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: activeIdx
        });
        nodeStates[root.id] = 'default';
        root.left = bstInsertWithSteps(root.left, val, steps, nodeStates, vals, activeIdx);
    } else if (val > root.value) {
        steps.push({
            type: 'tree',
            description: `🔍 ${val} > ${root.value}, go right.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: activeIdx
        });
        nodeStates[root.id] = 'default';
        root.right = bstInsertWithSteps(root.right, val, steps, nodeStates, vals, activeIdx);
    }
    return root;
};

export const generateSplayTreeSteps = (inputValues) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    const vals = (inputValues && inputValues.length > 0) ? inputValues.slice(0, 10) : [10, 20, 30, 40, 50, 25];
    let root = null;

    // Concept introduction
    steps.push({
        type: 'tree',
        description: `📚 Splay Tree: A self-adjusting BST. Every time a node is accessed, it is "splayed" (rotated) to the root. Recently used nodes become faster to access.`,
        treeData: null,
        nodeStates: {}
    });

    steps.push({
        type: 'tree',
        description: `🔄 Three splay cases: ZIG (single rotation), ZIG-ZIG (same direction, double rotation), ZIG-ZAG (opposite direction, double rotation).`,
        treeData: null,
        nodeStates: {}
    });

    for (let i = 0; i < vals.length; i++) {
        const val = vals[i];
        resetAll(root, nodeStates);

        steps.push({
            type: 'tree',
            description: `📥 --- Insert ${val} ---`,
            treeData: root ? cloneTree(root) : null,
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: i
        });

        // BST insert with path tracing
        const tempRoot = root;
        root = bstInsertWithSteps(root, val, steps, nodeStates, vals, i);

        resetAll(root, nodeStates);
        // Find and mark inserted node
        const mark = (n) => { if (!n) return; if (n.value === val) nodeStates[n.id] = 'inserted'; mark(n.left); mark(n.right); };
        mark(root);

        steps.push({
            type: 'tree',
            description: `🍃 Inserted ${val} as a leaf (BST rule). Now splay ${val} to the root using rotations.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: i
        });

        // Splay to root
        resetAll(root, nodeStates);
        root = splay(root, val, steps, nodeStates, vals, i);

        // Show result
        resetAll(root, nodeStates);
        if (root) nodeStates[root.id] = 'found';
        steps.push({
            type: 'tree',
            description: `👑 Splay complete! ${val} is now the root. The tree has been restructured.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: i
        });
    }

    resetAll(root, nodeStates);
    steps.push({
        type: 'tree-complete',
        description: `🎯 Splay Tree complete with ${vals.length} values. Root = ${root ? root.value : 'empty'}. Last accessed node is always at root!`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...vals],
        activeArrayIndex: -1
    });

    return steps;
};
