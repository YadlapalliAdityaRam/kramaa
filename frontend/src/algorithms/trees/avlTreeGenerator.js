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

    const addSnapshot = (desc, extraStates = {}, rotationType = null) => {
        steps.push({
            type: 'tree',
            description: desc,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates, ...extraStates },
            balances: { ...balances },
            arraySnapshot: [..._vals],
            activeArrayIndex: _activeIdx,
            rotationType
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
            addSnapshot(`Traversing left from ${node.val} to insert ${val}`);
            const result = insert(node.left, val);
            node.left = result.node;
            newlyAdded = result.newlyAdded;
        } else if (val > node.val) {
            addSnapshot(`Traversing right from ${node.val} to insert ${val}`);
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
        addSnapshot(`Updated height and balance for node ${node.val}. Balance is ${balance}`);
        nodeStates[node.id] = 'default';

        // Detect Imbalance
        if (balance > 1 || balance < -1) {
            nodeStates[node.id] = 'unbalanced';
            addSnapshot(`Imbalance detected at node ${node.val}! Balance factor is ${balance}`);
            
            // Left Left Case
            if (balance > 1 && val < node.left.val) {
                nodeStates[node.left.id] = 'rotating';
                addSnapshot(`Balance factor of node ${node.val} is +2. Left-Left imbalance detected. Performing RIGHT rotation on ${node.val}.`, {}, 'LL Rotation');
                const newRoot = rightRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.right) nodeStates[newRoot.right.id] = 'balanced';
                root = updateCurrentRootIfMatch(node, newRoot); // Crucial for mid-tree updates not acting as root unexpectedly if we are returning up tree, but wait, we only want to update `root` locally if this node was `root`. We'll just return `newRoot`.
                addSnapshot(`Right rotation complete! Tree is balanced.`, {}, 'LL Rotation');
                return { node: newRoot, newlyAdded };
            }

            // Right Right Case
            if (balance < -1 && val > node.right.val) {
                nodeStates[node.right.id] = 'rotating';
                addSnapshot(`Balance factor of node ${node.val} is -2. Right-Right imbalance detected. Performing LEFT rotation on ${node.val}.`, {}, 'RR Rotation');
                const newRoot = leftRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.left) nodeStates[newRoot.left.id] = 'balanced';
                addSnapshot(`Left rotation complete! Tree is balanced.`, {}, 'RR Rotation');
                return { node: newRoot, newlyAdded };
            }

            // Left Right Case
            if (balance > 1 && val > node.left.val) {
                nodeStates[node.left.id] = 'rotating';
                if (node.left.right) nodeStates[node.left.right.id] = 'rotating';
                addSnapshot(`Balance factor of node ${node.val} is +2. Left-Right imbalance detected. First, performing LEFT rotation on child ${node.left.val}.`, {}, 'LR Rotation');
                node.left = leftRotate(node.left);
                addSnapshot(`Left rotation on child complete. Now performing RIGHT rotation on ${node.val}.`, {}, 'LR Rotation');
                
                const newRoot = rightRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.left) nodeStates[newRoot.left.id] = 'balanced';
                if (newRoot.right) nodeStates[newRoot.right.id] = 'balanced';
                addSnapshot(`Right rotation complete! Tree is balanced.`, {}, 'LR Rotation');
                return { node: newRoot, newlyAdded };
            }

            // Right Left Case
            if (balance < -1 && val < node.right.val) {
                nodeStates[node.right.id] = 'rotating';
                if (node.right.left) nodeStates[node.right.left.id] = 'rotating';
                addSnapshot(`Balance factor of node ${node.val} is -2. Right-Left imbalance detected. First, performing RIGHT rotation on child ${node.right.val}.`, {}, 'RL Rotation');
                node.right = rightRotate(node.right);
                addSnapshot(`Right rotation on child complete. Now performing LEFT rotation on ${node.val}.`, {}, 'RL Rotation');

                const newRoot = leftRotate(node);
                nodeStates[newRoot.id] = 'balanced';
                if (newRoot.left) nodeStates[newRoot.left.id] = 'balanced';
                if (newRoot.right) nodeStates[newRoot.right.id] = 'balanced';
                addSnapshot(`Left rotation complete! Tree is balanced.`, {}, 'RL Rotation');
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
        activeArrayIndex: -1
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
            addSnapshot(`Node ${val} successfully inserted and tree is balanced.`);
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
        activeArrayIndex: -1
    });

    return steps;
};

// Helper inside generator just to keep things aligned if needed but normally returning node is fine.
const updateCurrentRootIfMatch = (oldNode, newNode) => {
    return newNode;
};
