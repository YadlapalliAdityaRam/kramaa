// AVL Tree with step-by-step visualization of insertions and rotations

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

export const generateAVLTreeSteps = (values) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    let root = null;

    const insert = (node, val) => {
        if (!node) {
            const n = newNode(val);
            nodeStates[n.id] = 'inserted';
            steps.push({
                type: 'tree',
                description: `Inserted ${val} as a new leaf node.`,
                treeData: cloneTree(root || n),
                nodeStates: { ...nodeStates }
            });
            return n;
        }

        nodeStates[node.id] = 'visiting';
        if (val < node.value) {
            steps.push({
                type: 'tree',
                description: `${val} < ${node.value}, going left.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates }
            });
            node.left = insert(node.left, val);
        } else if (val > node.value) {
            steps.push({
                type: 'tree',
                description: `${val} > ${node.value}, going right.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates }
            });
            node.right = insert(node.right, val);
        } else {
            return node; // Duplicate
        }

        updateHeight(node);
        const bf = balanceFactor(node);

        nodeStates[node.id] = 'comparing';
        steps.push({
            type: 'tree',
            description: `Checking balance at ${node.value}: BF = ${bf}.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates }
        });

        // LL
        if (bf > 1 && val < node.left.value) {
            steps.push({
                type: 'tree',
                description: `Left-Left case at ${node.value}. Performing RIGHT rotation.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates }
            });
            nodeStates[node.id] = 'rotated';
            return rightRotate(node);
        }

        // RR
        if (bf < -1 && val > node.right.value) {
            steps.push({
                type: 'tree',
                description: `Right-Right case at ${node.value}. Performing LEFT rotation.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates }
            });
            nodeStates[node.id] = 'rotated';
            return leftRotate(node);
        }

        // LR
        if (bf > 1 && val > node.left.value) {
            steps.push({
                type: 'tree',
                description: `Left-Right case at ${node.value}. LEFT rotate left child, then RIGHT rotate.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates }
            });
            node.left = leftRotate(node.left);
            nodeStates[node.id] = 'rotated';
            return rightRotate(node);
        }

        // RL
        if (bf < -1 && val < node.right.value) {
            steps.push({
                type: 'tree',
                description: `Right-Left case at ${node.value}. RIGHT rotate right child, then LEFT rotate.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates }
            });
            node.right = rightRotate(node.right);
            nodeStates[node.id] = 'rotated';
            return leftRotate(node);
        }

        nodeStates[node.id] = 'default';
        return node;
    };

    const vals = values || [30, 20, 40, 10, 25, 35, 50, 5, 15];

    steps.push({
        type: 'tree',
        description: `AVL Tree: Inserting values [${vals.join(', ')}] one by one, auto-balancing after each.`,
        treeData: null,
        nodeStates: {}
    });

    for (const val of vals) {
        steps.push({
            type: 'tree',
            description: `--- Inserting value ${val} ---`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates }
        });
        root = insert(root, val);

        // Reset states after insertion
        Object.keys(nodeStates).forEach(k => { nodeStates[k] = 'default'; });

        steps.push({
            type: 'tree',
            description: `After inserting ${val}, tree is balanced.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates }
        });
    }

    steps.push({
        type: 'tree-complete',
        description: `AVL Tree construction complete with ${vals.length} values. All nodes balanced.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates }
    });

    return steps;
};
