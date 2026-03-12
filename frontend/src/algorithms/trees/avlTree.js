// AVL Tree — Educational step-by-step insertion with rotation animations
// Shows balance factor, height concepts, and 4 rotation cases clearly

let idCounter = 0;

const newNode = (val) => ({
    id: `avl_${idCounter++}`,
    value: val,
    left: null,
    right: null,
    height: 1
});

const height = (node) => (node ? node.height : 0);
const balanceFactor = (node) => (node ? height(node.left) - height(node.right) : 0);
const updateHeight = (node) => {
    if (node) node.height = 1 + Math.max(height(node.left), height(node.right));
};

const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

const rightRotate = (y) => {
    const x = y.left;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    updateHeight(y);
    updateHeight(x);
    return x;
};

const leftRotate = (x) => {
    const y = x.right;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    updateHeight(x);
    updateHeight(y);
    return y;
};

export const generateAVLTreeSteps = (values, _t, _p, _g, customTreeData = null) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    if (customTreeData) {
        return [{
            type: 'tree-complete',
            description: `Viewing Custom AVL Tree Structure.`,
            treeData: cloneTree(customTreeData),
            nodeStates: {}
        }];
    }

    let root = null;

    const insert = (node, val, vals, activeIdx) => {
        if (!node) {
            const n = newNode(val);
            nodeStates[n.id] = 'inserted';
            steps.push({
                type: 'tree',
                description: `🍃 Created leaf node ${val}. Height = 1, Balance Factor = 0.`,
                treeData: cloneTree(root || n),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            return n;
        }

        nodeStates[node.id] = 'visiting';
        if (val < node.value) {
            steps.push({
                type: 'tree',
                description: `🔍 ${val} < ${node.value} → Go LEFT. (BST rule: smaller values go left)`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            nodeStates[node.id] = 'default';
            node.left = insert(node.left, val, vals, activeIdx);
        } else if (val > node.value) {
            steps.push({
                type: 'tree',
                description: `🔍 ${val} > ${node.value} → Go RIGHT. (BST rule: larger values go right)`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            nodeStates[node.id] = 'default';
            node.right = insert(node.right, val, vals, activeIdx);
        } else {
            return node;
        }

        updateHeight(node);
        const bf = balanceFactor(node);

        nodeStates[node.id] = 'comparing';
        steps.push({
            type: 'tree',
            description: `⚖️ Check balance at ${node.value}: BF = height(left) − height(right) = ${height(node.left)} − ${height(node.right)} = ${bf}. ${Math.abs(bf) > 1 ? '⚠️ UNBALANCED!' : '✅ Balanced.'}`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: activeIdx
        });

        // LL Case
        if (bf > 1 && val < node.left.value) {
            nodeStates[node.id] = 'rotated';
            if (node.left) nodeStates[node.left.id] = 'rotated';
            steps.push({
                type: 'tree',
                description: `🔄 Left-Left Case at ${node.value}: BF = ${bf}. Perform single RIGHT rotation. ${node.left.value} goes up, ${node.value} goes down-right.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            return rightRotate(node);
        }

        // RR Case
        if (bf < -1 && val > node.right.value) {
            nodeStates[node.id] = 'rotated';
            if (node.right) nodeStates[node.right.id] = 'rotated';
            steps.push({
                type: 'tree',
                description: `🔄 Right-Right Case at ${node.value}: BF = ${bf}. Perform single LEFT rotation. ${node.right.value} goes up, ${node.value} goes down-left.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            return leftRotate(node);
        }

        // LR Case
        if (bf > 1 && val > node.left.value) {
            nodeStates[node.id] = 'rotated';
            nodeStates[node.left.id] = 'rotated';
            steps.push({
                type: 'tree',
                description: `🔄 Left-Right Case at ${node.value}: BF = ${bf}. First LEFT-rotate left child ${node.left.value}, then RIGHT-rotate ${node.value}.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        // RL Case
        if (bf < -1 && val < node.right.value) {
            nodeStates[node.id] = 'rotated';
            nodeStates[node.right.id] = 'rotated';
            steps.push({
                type: 'tree',
                description: `🔄 Right-Left Case at ${node.value}: BF = ${bf}. First RIGHT-rotate right child ${node.right.value}, then LEFT-rotate ${node.value}.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...vals],
                activeArrayIndex: activeIdx
            });
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        nodeStates[node.id] = 'default';
        return node;
    };

    const vals = values || [30, 20, 40, 10, 25, 35, 50, 5, 15];

    // Concept introduction
    steps.push({
        type: 'tree',
        description: `📚 AVL Tree: A self-balancing BST. Rule: |Balance Factor| must be ≤ 1 at every node, where BF = height(left) − height(right).`,
        treeData: null,
        nodeStates: {}
    });

    steps.push({
        type: 'tree',
        description: `📊 Inserting values: [${vals.join(', ')}]. After each insertion, we check balance and rotate if |BF| > 1.`,
        treeData: null,
        nodeStates: {}
    });

    for (let i = 0; i < vals.length; i++) {
        const val = vals[i];
        steps.push({
            type: 'tree',
            description: `📥 --- Insert ${val} ---`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: i
        });

        root = insert(root, val, vals, i);

        // Reset states and show balanced result
        Object.keys(nodeStates).forEach(k => { nodeStates[k] = 'default'; });
        steps.push({
            type: 'tree',
            description: `✅ After inserting ${val}: tree is balanced. Root = ${root.value}.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...vals],
            activeArrayIndex: i
        });
    }

    steps.push({
        type: 'tree-complete',
        description: `🎯 AVL Tree complete! ${vals.length} values inserted. All nodes have |BF| ≤ 1. Height = ${height(root)}, guaranteeing O(log n) operations.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...vals],
        activeArrayIndex: -1
    });

    return steps;
};
