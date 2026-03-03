// Red-Black Tree insertion with step-by-step visualization

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

export const generateRedBlackTreeSteps = (values) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    let root = null;

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
            return n;
        }

        nodeStates[node.id] = 'visiting';

        if (val < node.value) {
            node.left = insert(node.left, val);
        } else if (val > node.value) {
            node.right = insert(node.right, val);
        } else {
            return node;
        }

        // Fix-up: Left-leaning Red-Black tree rules
        if (isRed(node.right) && !isRed(node.left)) {
            steps.push({
                type: 'tree',
                description: `Red right child at ${node.value}. Left rotating.`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates }
            });
            node = leftRotate(node);
        }

        if (isRed(node.left) && node.left && isRed(node.left.left)) {
            steps.push({
                type: 'tree',
                description: `Two consecutive red lefts at ${node.value}. Right rotating.`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates }
            });
            node = rightRotate(node);
        }

        if (isRed(node.left) && isRed(node.right)) {
            steps.push({
                type: 'tree',
                description: `Both children of ${node.value} are red. Flipping colors.`,
                treeData: cloneTree(root || node),
                nodeStates: { ...nodeStates }
            });
            flipColors(node);
        }

        nodeStates[node.id] = 'default';
        return node;
    };

    const vals = values || [41, 22, 58, 15, 33, 50, 63, 10, 27];

    steps.push({
        type: 'tree',
        description: `Red-Black Tree: Inserting [${vals.join(', ')}] with auto-balancing (LLRB variant).`,
        treeData: null,
        nodeStates: {}
    });

    for (const val of vals) {
        steps.push({
            type: 'tree',
            description: `--- Inserting ${val} ---`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates }
        });

        root = insert(root, val);
        if (root) root.color = 'black'; // Root is always black

        Object.keys(nodeStates).forEach(k => { nodeStates[k] = 'default'; });

        steps.push({
            type: 'tree',
            description: `After inserting ${val}. Root is black. Tree is balanced.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates }
        });
    }

    steps.push({
        type: 'tree-complete',
        description: `Red-Black Tree complete! ${vals.length} values inserted with all RB properties maintained.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates }
    });

    return steps;
};
