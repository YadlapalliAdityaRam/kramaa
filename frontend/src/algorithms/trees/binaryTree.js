// Build a BST from array of values
const buildBST = (values) => {
    let idCounter = 0;
    const insert = (root, val) => {
        if (!root) return { id: `n${idCounter++}`, value: val, left: null, right: null };
        if (val < root.value) root.left = insert(root.left, val);
        else root.right = insert(root.right, val);
        return root;
    };
    let root = null;
    for (const v of values) {
        root = insert(root, v);
    }
    return root;
};

// Deep clone a tree for snapshots
const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

export const defaultTreeValues = [50, 30, 70, 20, 40, 60, 80];

export const generateBinaryTreeTraversalSteps = (values, traversalType = 'inorder') => {
    const steps = [];
    const tree = buildBST(values || defaultTreeValues);
    const nodeStates = {};
    const result = [];

    // Gather all node IDs
    const gatherIds = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'default';
        gatherIds(node.left);
        gatherIds(node.right);
    };
    gatherIds(tree);

    steps.push({
        type: 'tree',
        description: `Starting ${traversalType.charAt(0).toUpperCase() + traversalType.slice(1)} traversal of BST.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [...result]
    });

    const inorder = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'visiting';
        steps.push({
            type: 'tree',
            description: `Going left from ${node.value}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });
        inorder(node.left);

        nodeStates[node.id] = 'current';
        result.push(node.value);
        steps.push({
            type: 'tree',
            description: `Visit ${node.value}. Result: [${result.join(', ')}]`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });

        steps.push({
            type: 'tree',
            description: `Going right from ${node.value}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });
        inorder(node.right);
        nodeStates[node.id] = 'visited';
    };

    const preorder = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'current';
        result.push(node.value);
        steps.push({
            type: 'tree',
            description: `Visit ${node.value}. Result: [${result.join(', ')}]`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });

        nodeStates[node.id] = 'visiting';
        steps.push({
            type: 'tree',
            description: `Going left from ${node.value}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });
        preorder(node.left);

        steps.push({
            type: 'tree',
            description: `Going right from ${node.value}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });
        preorder(node.right);
        nodeStates[node.id] = 'visited';
    };

    const postorder = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'visiting';
        steps.push({
            type: 'tree',
            description: `Going left from ${node.value}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });
        postorder(node.left);

        steps.push({
            type: 'tree',
            description: `Going right from ${node.value}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });
        postorder(node.right);

        nodeStates[node.id] = 'current';
        result.push(node.value);
        steps.push({
            type: 'tree',
            description: `Visit ${node.value}. Result: [${result.join(', ')}]`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });
        nodeStates[node.id] = 'visited';
    };

    if (traversalType === 'inorder') inorder(tree);
    else if (traversalType === 'preorder') preorder(tree);
    else postorder(tree);

    steps.push({
        type: 'tree-complete',
        description: `${traversalType.charAt(0).toUpperCase() + traversalType.slice(1)} traversal complete! Result: [${result.join(', ')}]`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [...result]
    });

    return steps;
};
