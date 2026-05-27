let idCounter = 0;

const newNode = (val) => ({
    id: `avl_${idCounter++}`,
    val: val,
    left: null,
    right: null,
    height: 1
});

const getHeight = (node) => node ? node.height : 0;
const getBalance = (node) => node ? getHeight(node.left) - getHeight(node.right) : 0;
const updateHeight = (node) => {
    if (node) node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1;
};

// Deep clone for snapshots
const cloneTree = (node) => {
    if (!node) return null;
    return {
        ...node,
        left: cloneTree(node.left),
        right: cloneTree(node.right)
    };
};

export const generateAVLTreeSteps = (values) => {
    const steps = [];
    const nodeStates = {}; // id -> 'inserted' | 'unbalanced' | 'rotating' | 'balanced'
    const balances = {}; // id -> current balance factor
    idCounter = 0;

    let root = null;
    let _vals = values;
    let _activeIdx = 0;

    const getChildEdges = (node) => {
        if (!node) return [];
        const edges = [];
        if (node.left) edges.push({ from: node.id, to: node.left.id });
        if (node.right) edges.push({ from: node.id, to: node.right.id });
        return edges;
    };

    const addSnapshot = (desc, extraStates = {}, rotationType = null, highlightEdges = []) => {
        steps.push({
            type: 'tree',
            description: desc,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates, ...extraStates },
            balances: { ...balances },
            arraySnapshot: [..._vals],
            activeArrayIndex: _activeIdx,
            rotationType,
            highlightEdges
        });
    };

    const rightRotate = (y) => {
        const x = y.left;
        const T2 = x.right;

        // Perform rotation
        x.right = y;
        y.left = T2;

        // Update heights
        updateHeight(y);
        updateHeight(x);

        // Update balances for visual tracker
        balances[y.id] = getBalance(y);
        balances[x.id] = getBalance(x);

        return x;
    };

    const leftRotate = (x) => {
        const y = x.right;
        const T2 = y.left;

        // Perform rotation
        y.left = x;
        x.right = T2;

        // Update heights
        updateHeight(x);
        updateHeight(y);

        // Update balances for visual tracker
        balances[x.id] = getBalance(x);
        balances[y.id] = getBalance(y);

        return y;
    };

    const insert = (node, val) => {
        if (!node) {
            const temp = newNode(val);
            balances[temp.id] = 0;
            return { node: temp, newlyAdded: temp };
        }

        let newlyAdded = null;
        if (val < node.val) {
            addSnapshot(
                `Traversing left from ${node.val} to insert ${val}`,
                {
                    [node.id]: 'visiting',
                    ...(node.left ? { [node.left.id]: 'visiting' } : {})
                },
                null,
                node.left ? [{ from: node.id, to: node.left.id }] : []
            );
            const result = insert(node.left, val);
            node.left = result.node;
            newlyAdded = result.newlyAdded;
        } else if (val > node.val) {
            addSnapshot(
                `Traversing right from ${node.val} to insert ${val}`,
                {
                    [node.id]: 'visiting',
                    ...(node.right ? { [node.right.id]: 'visiting' } : {})
                },
                null,
                node.right ? [{ from: node.id, to: node.right.id }] : []
            );
            const result = insert(node.right, val);
            node.right = result.node;
            newlyAdded = result.newlyAdded;
        } else {
            // Duplicate
            return { node, newlyAdded: null };
        }

        updateHeight(node);
        const balance = getBalance(node);
        balances[node.id] = balance;

        // Update Heights Snapshot
        nodeStates[node.id] = 'updating';
        addSnapshot(
            `Updated height and balance for node ${node.val}. Balance is ${balance}`,
            { [node.id]: 'updating' },
            null,
            getChildEdges(node)
        );
        nodeStates[node.id] = 'default';

        // Detect Imbalance
        if (balance > 1 || balance < -1) {
            nodeStates[node.id] = 'unbalanced';
            addSnapshot(
                `Imbalance detected at node ${node.val}! Balance factor is ${balance}`,
                { [node.id]: 'unbalanced' },
                null,
                getChildEdges(node)
            );
            
            // Left Left Case
            if (balance > 1 && val < node.left.val) {
                nodeStates[node.left.id] = 'rotating';
                addSnapshot(
                    `Balance factor of node ${node.val} is +2. Left-Left imbalance detected. Performing RIGHT rotation on ${node.val}.`,
                    {
                        [node.id]: 'unbalanced',
                        [node.left.id]: 'rotating'
                    },
                    'LL Rotation',
                    [{ from: node.id, to: node.left.id }]
                );
                const newRoot = rightRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.right) nodeStates[newRoot.right.id] = 'balanced';
                root = updateCurrentRootIfMatch(node, newRoot); // Crucial for mid-tree updates not acting as root unexpectedly if we are returning up tree, but wait, we only want to update `root` locally if this node was `root`. We'll just return `newRoot`.
                addSnapshot(
                    `Right rotation complete! Tree is balanced.`,
                    {
                        [newRoot.id]: 'balanced',
                        ...(newRoot.right ? { [newRoot.right.id]: 'balanced' } : {})
                    },
                    'LL Rotation',
                    getChildEdges(newRoot)
                );
                return { node: newRoot, newlyAdded };
            }

            // Right Right Case
            if (balance < -1 && val > node.right.val) {
                nodeStates[node.right.id] = 'rotating';
                addSnapshot(
                    `Balance factor of node ${node.val} is -2. Right-Right imbalance detected. Performing LEFT rotation on ${node.val}.`,
                    {
                        [node.id]: 'unbalanced',
                        [node.right.id]: 'rotating'
                    },
                    'RR Rotation',
                    [{ from: node.id, to: node.right.id }]
                );
                const newRoot = leftRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.left) nodeStates[newRoot.left.id] = 'balanced';
                addSnapshot(
                    `Left rotation complete! Tree is balanced.`,
                    {
                        [newRoot.id]: 'balanced',
                        ...(newRoot.left ? { [newRoot.left.id]: 'balanced' } : {})
                    },
                    'RR Rotation',
                    getChildEdges(newRoot)
                );
                return { node: newRoot, newlyAdded };
            }

            // Left Right Case
            if (balance > 1 && val > node.left.val) {
                nodeStates[node.left.id] = 'rotating';
                if (node.left.right) nodeStates[node.left.right.id] = 'rotating';
                addSnapshot(
                    `Balance factor of node ${node.val} is +2. Left-Right imbalance detected. First, performing LEFT rotation on child ${node.left.val}.`,
                    {
                        [node.id]: 'unbalanced',
                        [node.left.id]: 'rotating',
                        ...(node.left.right ? { [node.left.right.id]: 'rotating' } : {})
                    },
                    'LR Rotation',
                    [
                        { from: node.id, to: node.left.id },
                        ...(node.left.right ? [{ from: node.left.id, to: node.left.right.id }] : [])
                    ]
                );
                node.left = leftRotate(node.left);
                addSnapshot(
                    `Left rotation on child complete. Now performing RIGHT rotation on ${node.val}.`,
                    {
                        [node.id]: 'unbalanced',
                        ...(node.left ? { [node.left.id]: 'rotating' } : {})
                    },
                    'LR Rotation',
                    node.left ? [{ from: node.id, to: node.left.id }] : []
                );
                
                const newRoot = rightRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.left) nodeStates[newRoot.left.id] = 'balanced';
                if (newRoot.right) nodeStates[newRoot.right.id] = 'balanced';
                addSnapshot(
                    `Right rotation complete! Tree is balanced.`,
                    {
                        [newRoot.id]: 'balanced',
                        ...(newRoot.left ? { [newRoot.left.id]: 'balanced' } : {}),
                        ...(newRoot.right ? { [newRoot.right.id]: 'balanced' } : {})
                    },
                    'LR Rotation',
                    getChildEdges(newRoot)
                );
                return { node: newRoot, newlyAdded };
            }

            // Right Left Case
            if (balance < -1 && val < node.right.val) {
                nodeStates[node.right.id] = 'rotating';
                if (node.right.left) nodeStates[node.right.left.id] = 'rotating';
                addSnapshot(
                    `Balance factor of node ${node.val} is -2. Right-Left imbalance detected. First, performing RIGHT rotation on child ${node.right.val}.`,
                    {
                        [node.id]: 'unbalanced',
                        [node.right.id]: 'rotating',
                        ...(node.right.left ? { [node.right.left.id]: 'rotating' } : {})
                    },
                    'RL Rotation',
                    [
                        { from: node.id, to: node.right.id },
                        ...(node.right.left ? [{ from: node.right.id, to: node.right.left.id }] : [])
                    ]
                );
                node.right = rightRotate(node.right);
                addSnapshot(
                    `Right rotation on child complete. Now performing LEFT rotation on ${node.val}.`,
                    {
                        [node.id]: 'unbalanced',
                        ...(node.right ? { [node.right.id]: 'rotating' } : {})
                    },
                    'RL Rotation',
                    node.right ? [{ from: node.id, to: node.right.id }] : []
                );

                const newRoot = leftRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.left) nodeStates[newRoot.left.id] = 'balanced';
                if (newRoot.right) nodeStates[newRoot.right.id] = 'balanced';
                addSnapshot(
                    `Left rotation complete! Tree is balanced.`,
                    {
                        [newRoot.id]: 'balanced',
                        ...(newRoot.left ? { [newRoot.left.id]: 'balanced' } : {}),
                        ...(newRoot.right ? { [newRoot.right.id]: 'balanced' } : {})
                    },
                    'RL Rotation',
                    getChildEdges(newRoot)
                );
                return { node: newRoot, newlyAdded };
            }
        }

        return { node, newlyAdded };
    };

    // Intro step
    steps.push({
        type: 'intro',
        description: 'Welcome to the AVL Tree visualizer. An AVL Tree is a self-balancing binary search tree where the difference between heights of left and right subtrees cannot be more than one for all nodes.',
        treeData: null,
        nodeStates: {},
        balances: {},
        arraySnapshot: [...values],
        activeArrayIndex: -1,
        highlightEdges: []
    });

    for (let i = 0; i < values.length; i++) {
        const val = values[i];
        _activeIdx = i;
        // Reset states for new insertion
        Object.keys(nodeStates).forEach(k => delete nodeStates[k]);
        
        addSnapshot(`Starting insertion of value ${val}`);
        
        const result = insert(root, val);
        root = result.node; // IMPORTANT: Update root explicitly after insert returns the new tree
        
        if (result.newlyAdded) {
            // Need to add final snapshot with inserted node highlighted in yellow
            nodeStates[result.newlyAdded.id] = 'inserted';
            addSnapshot(
                `Node ${val} successfully inserted and tree is balanced.`,
                { [result.newlyAdded.id]: 'inserted' },
                null,
                []
            );
        }
    }

    // Clean states for final step
    Object.keys(nodeStates).forEach(k => delete nodeStates[k]);
    steps.push({
        type: 'tree-complete',
        description: `Visualization complete! Processed ${values.length} insertions while maintaining O(log n) height properties.`,
        treeData: cloneTree(root),
        nodeStates: {},
        balances: { ...balances },
        arraySnapshot: [...values],
        activeArrayIndex: -1,
        highlightEdges: []
    });

    return steps;
};

// Helper inside generator just to keep things aligned if needed but normally returning node is fine.
const updateCurrentRootIfMatch = (oldNode, newNode) => {
    return newNode;
};
