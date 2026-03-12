// Helpers to map tree structures into visualization steps

export const defaultNaryTreeData = {
    id: 'Root',
    value: 'Root',
    children: [
        {
            id: 'A',
            value: 'A',
            children: [
                { id: 'D', value: 'D', children: [] },
                { id: 'E', value: 'E', children: [] },
                { id: 'F', value: 'F', children: [] }
            ]
        },
        {
            id: 'B',
            value: 'B',
            children: []
        },
        {
            id: 'C',
            value: 'C',
            children: [
                { id: 'G', value: 'G', children: [] },
                { id: 'H', value: 'H', children: [] }
            ]
        }
    ]
};

// Deep clone a tree for snapshots
const cloneTree = (node) => {
    if (!node) return null;
    return {
        ...node,
        children: (node.children || []).map(cloneTree),
        // For backwards compatibility where treeCanvas checked left/right
        left: node.children && node.children.length > 0 ? cloneTree(node.children[0]) : null,
        right: node.children && node.children.length > 1 ? cloneTree(node.children[1]) : null
    };
};

export const generateNaryDFSSteps = (tree) => {
    const steps = [];
    if (!tree) return steps;
    const nodeStates = {};
    const result = [];

    const gatherIds = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'default';
        for (const child of node.children || []) gatherIds(child);
    };
    gatherIds(tree);

    steps.push({
        type: 'tree',
        description: `Starting DFS on Tree.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [...result]
    });

    const dfs = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'visiting';
        steps.push({
            type: 'tree',
            description: `Visiting ${node.value}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });

        nodeStates[node.id] = 'current';
        result.push(node.value);
        steps.push({
            type: 'tree',
            description: `Process node ${node.value}. Path: [${result.join(' → ')}]`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });

        for (const child of node.children || []) {
            steps.push({
                type: 'tree',
                description: `Moving to child ${child.value}.`,
                treeData: cloneTree(tree),
                nodeStates: { ...nodeStates },
                result: [...result]
            });
            dfs(child);
        }

        nodeStates[node.id] = 'visited';
    };

    dfs(tree);

    steps.push({
        type: 'tree',
        description: `DFS Traversal Complete. Final Order: [${result.join(' → ')}]`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [...result]
    });

    return steps;
};

export const generateNaryBFSSteps = (tree) => {
    const steps = [];
    if (!tree) return steps;
    const nodeStates = {};
    const result = [];

    const gatherIds = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'default';
        for (const child of node.children || []) gatherIds(child);
    };
    gatherIds(tree);

    steps.push({
        type: 'tree',
        description: `Starting BFS (Level Order) on Tree.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [...result]
    });

    const queue = [tree];

    while (queue.length > 0) {
        const node = queue.shift();

        nodeStates[node.id] = 'current';
        result.push(node.value);

        steps.push({
            type: 'tree',
            description: `Dequeue ${node.value}. Processing node. Path: [${result.join(' → ')}]`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result]
        });

        for (const child of node.children || []) {
            nodeStates[child.id] = 'visiting';
            queue.push(child);
        }

        if ((node.children || []).length > 0) {
            steps.push({
                type: 'tree',
                description: `Enqueueing children of ${node.value}.`,
                treeData: cloneTree(tree),
                nodeStates: { ...nodeStates },
                result: [...result]
            });
        }

        nodeStates[node.id] = 'visited';
    }

    steps.push({
        type: 'tree',
        description: `BFS Traversal Complete. Final Order: [${result.join(' → ')}]`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [...result]
    });

    return steps;
};

export const generateNaryTreeHeightSteps = (tree) => {
    const steps = [];
    if (!tree) return steps;
    const nodeStates = {};

    const gatherIds = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'default';
        for (const child of node.children || []) gatherIds(child);
    };
    gatherIds(tree);

    steps.push({
        type: 'tree',
        description: `Calculating height of N-ary Tree. Base case: Height of null is 0.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates }
    });

    const getHeight = (node) => {
        if (!node) return 0;

        nodeStates[node.id] = 'visiting';
        steps.push({
            type: 'tree',
            description: `Calculating height from ${node.value}...`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates }
        });

        let maxChildHeight = 0;
        for (const child of node.children || []) {
            const h = getHeight(child);
            maxChildHeight = Math.max(maxChildHeight, h);
        }

        const currentHeight = 1 + maxChildHeight;
        nodeStates[node.id] = 'visited';

        steps.push({
            type: 'tree',
            description: `Height of subtree at ${node.value} resolves to ${currentHeight}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates }
        });

        return currentHeight;
    };

    const finalHeight = getHeight(tree);

    steps.push({
        type: 'tree',
        description: `Tree height calculation complete! Max Height: ${finalHeight}.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates }
    });

    return steps;
};
