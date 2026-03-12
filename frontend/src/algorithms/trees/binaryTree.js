// Binary Tree Traversals — Educational inorder, preorder, postorder
// Shows the traversal order rule, result array building, and clear path explanations

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

const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

export const defaultTreeValues = [50, 30, 70, 20, 40, 60, 80];

export const generateBinaryTreeTraversalSteps = (values, traversalType = 'inorder', customTreeData = null) => {
    const inputArr = values || defaultTreeValues;
    const tree = customTreeData || buildBST(inputArr);
    const steps = [];
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

    const typeName = traversalType.charAt(0).toUpperCase() + traversalType.slice(1);

    // Concept introduction  
    const orderRules = {
        inorder: 'LEFT subtree → ROOT → RIGHT subtree',
        preorder: 'ROOT → LEFT subtree → RIGHT subtree',
        postorder: 'LEFT subtree → RIGHT subtree → ROOT'
    };

    const useCases = {
        inorder: 'Produces sorted order for BSTs',
        preorder: 'Used for tree copying and serialization',
        postorder: 'Used for deletion and expression evaluation'
    };

    steps.push({
        type: 'tree',
        description: `📚 ${typeName} Traversal: Visit nodes in order: ${orderRules[traversalType]}. Use case: ${useCases[traversalType]}.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [],
        arraySnapshot: [...inputArr],
        activeArrayIndex: -1
    });

    steps.push({
        type: 'tree',
        description: `📊 Starting ${typeName} traversal. Result: [] (empty). Beginning at root ${tree.value}.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [],
        arraySnapshot: [...inputArr],
        activeArrayIndex: -1
    });

    // --- INORDER ---
    const inorder = (node) => {
        if (!node) return;

        // Step 1: Visit node — going left first
        nodeStates[node.id] = 'visiting';
        steps.push({
            type: 'tree',
            description: `🔍 At node ${node.value}: ${node.left ? `First, go LEFT to ${node.left.value} (Inorder rule: left first)` : `No left child → Visit ${node.value} next`}.`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result],
            arraySnapshot: [...inputArr],
            activeArrayIndex: inputArr.indexOf(node.value)
        });

        // Recurse left
        inorder(node.left);

        // Step 2: Process current node
        nodeStates[node.id] = 'current';
        result.push(node.value);
        steps.push({
            type: 'tree',
            description: `✅ Visit ${node.value}! Left subtree done. Add to result. Result: [${result.join(', ')}]. ${node.right ? `Now go RIGHT to ${node.right.value}.` : 'No right child.'}`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result],
            arraySnapshot: [...inputArr],
            activeArrayIndex: inputArr.indexOf(node.value)
        });

        nodeStates[node.id] = 'visited';

        // Recurse right
        inorder(node.right);
    };

    // --- PREORDER ---
    const preorder = (node) => {
        if (!node) return;

        // Step 1: Process current node FIRST
        nodeStates[node.id] = 'current';
        result.push(node.value);
        steps.push({
            type: 'tree',
            description: `✅ Visit ${node.value} FIRST (Preorder rule: root first). Result: [${result.join(', ')}]. ${node.left ? `Now go LEFT to ${node.left.value}.` : 'No left child.'}`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result],
            arraySnapshot: [...inputArr],
            activeArrayIndex: inputArr.indexOf(node.value)
        });
        nodeStates[node.id] = 'visited';

        // Recurse left
        if (node.left) {
            nodeStates[node.left.id] = 'visiting';
            steps.push({
                type: 'tree',
                description: `🔍 Going LEFT from ${node.value} to ${node.left.value}.`,
                treeData: cloneTree(tree),
                nodeStates: { ...nodeStates },
                result: [...result],
                arraySnapshot: [...inputArr],
                activeArrayIndex: inputArr.indexOf(node.value)
            });
        }
        preorder(node.left);

        // Recurse right
        if (node.right) {
            nodeStates[node.right.id] = 'visiting';
            steps.push({
                type: 'tree',
                description: `🔍 Left subtree of ${node.value} done. Going RIGHT to ${node.right.value}.`,
                treeData: cloneTree(tree),
                nodeStates: { ...nodeStates },
                result: [...result],
                arraySnapshot: [...inputArr],
                activeArrayIndex: inputArr.indexOf(node.value)
            });
        }
        preorder(node.right);
    };

    // --- POSTORDER ---
    const postorder = (node) => {
        if (!node) return;

        // Visit — going to children first
        nodeStates[node.id] = 'visiting';
        steps.push({
            type: 'tree',
            description: `🔍 At node ${node.value}: ${node.left ? `First go LEFT to ${node.left.value}` : 'No left child'}. (Postorder rule: visit children before root)`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result],
            arraySnapshot: [...inputArr],
            activeArrayIndex: inputArr.indexOf(node.value)
        });

        // Recurse left
        postorder(node.left);

        // Recurse right
        if (node.right) {
            steps.push({
                type: 'tree',
                description: `🔍 Left subtree of ${node.value} done. Now go RIGHT to ${node.right.value}.`,
                treeData: cloneTree(tree),
                nodeStates: { ...nodeStates },
                result: [...result],
                arraySnapshot: [...inputArr],
                activeArrayIndex: inputArr.indexOf(node.value)
            });
        }
        postorder(node.right);

        // Process current LAST
        nodeStates[node.id] = 'current';
        result.push(node.value);
        steps.push({
            type: 'tree',
            description: `✅ Both children of ${node.value} done → Visit ${node.value} LAST. Result: [${result.join(', ')}].`,
            treeData: cloneTree(tree),
            nodeStates: { ...nodeStates },
            result: [...result],
            arraySnapshot: [...inputArr],
            activeArrayIndex: inputArr.indexOf(node.value)
        });
        nodeStates[node.id] = 'visited';
    };

    // Execute the selected traversal
    if (traversalType === 'preorder') preorder(tree);
    else if (traversalType === 'postorder') postorder(tree);
    else inorder(tree);

    steps.push({
        type: 'tree-complete',
        description: `🎯 ${typeName} Traversal complete! Final result: [${result.join(', ')}]. Order: ${orderRules[traversalType]}.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        result: [...result],
        arraySnapshot: [...inputArr],
        activeArrayIndex: -1
    });

    return steps;
};

// --- BST OPERATIONS (Interactive) ---

export const generateBSTInsertSteps = (values, newValue) => {
    let idCounter = 0;
    const generateId = () => `n${idCounter++}`;
    
    // 1. Build initial tree from existing values
    const insertRaw = (root, val) => {
        if (!root) return { id: generateId(), value: val, left: null, right: null };
        if (val < root.value) root.left = insertRaw(root.left, val);
        else if (val > root.value) root.right = insertRaw(root.right, val);
        return root;
    };
    
    let tree = null;
    for (const v of values) tree = insertRaw(tree, v);
    
    const steps = [];
    const nodeStates = {};
    const inputArr = [...values];
    
    const gatherIds = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'default';
        gatherIds(node.left);
        gatherIds(node.right);
    };
    gatherIds(tree);

    const getSnapshot = (desc) => ({
        type: 'tree',
        description: desc,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...inputArr],
        activeArrayIndex: -1
    });

    steps.push(getSnapshot(`🎬 Starting insertion of ${newValue}. We'll follow BST rules: smaller values left, larger values right.`));

    // 2. Animate the insertion process
    const animateInsert = (node, val) => {
        if (!node) {
            const newNode = { id: generateId(), value: val, left: null, right: null };
            steps.push({
                type: 'tree',
                description: `✨ Space found! Creating new node with value ${val}.`,
                treeData: cloneTree(tree), // snapshot before insertion in loop
                nodeStates: { ...nodeStates },
                arraySnapshot: [...inputArr, val],
                activeArrayIndex: inputArr.length
            });
            return newNode;
        }

        nodeStates[node.id] = 'visiting';
        if (val < node.value) {
            steps.push(getSnapshot(`🔍 Comparing ${val} with ${node.value}: ${val} < ${node.value} → Moving LEFT.`));
            nodeStates[node.id] = 'default';
            node.left = animateInsert(node.left, val);
        } else if (val > node.value) {
            steps.push(getSnapshot(`🔍 Comparing ${val} with ${node.value}: ${val} > ${node.value} → Moving RIGHT.`));
            nodeStates[node.id] = 'default';
            node.right = animateInsert(node.right, val);
        } else {
            steps.push(getSnapshot(`⚠️ Value ${val} already exists in the tree. BSTs typically don't allow duplicates.`));
        }
        return node;
    };

    tree = animateInsert(tree, newValue);
    // Add to input array for sync
    const finalValues = values.includes(newValue) ? values : [...values, newValue];
    
    steps.push({
        type: 'tree-complete',
        description: `🎯 Insertion of ${newValue} complete. The tree remains a valid BST.`,
        treeData: cloneTree(tree),
        nodeStates: {},
        arraySnapshot: finalValues,
        activeArrayIndex: -1
    });

    return steps;
};

export const generateBSTSearchSteps = (values, target) => {
    const tree = buildBST(values);
    const steps = [];
    const nodeStates = {};
    const gatherIds = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'default';
        gatherIds(node.left);
        gatherIds(node.right);
    };
    gatherIds(tree);

    const getSnapshot = (desc) => ({
        type: 'tree',
        description: desc,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...values],
        activeArrayIndex: -1
    });

    steps.push(getSnapshot(`🎬 Searching for value ${target} in the BST.`));

    let curr = tree;
    let found = false;

    while (curr) {
        nodeStates[curr.id] = 'visiting';
        if (curr.value === target) {
            nodeStates[curr.id] = 'current';
            steps.push(getSnapshot(`✅ Found! Node ${curr.value} matches our target ${target}.`));
            found = true;
            break;
        } else if (target < curr.value) {
            steps.push(getSnapshot(`🔍 ${target} < ${curr.value} → Moving LEFT to find smaller values.`));
            nodeStates[curr.id] = 'visited';
            curr = curr.left;
        } else {
            steps.push(getSnapshot(`🔍 ${target} > ${curr.value} → Moving RIGHT to find larger values.`));
            nodeStates[curr.id] = 'visited';
            curr = curr.right;
        }
    }

    if (!found) {
        steps.push(getSnapshot(`❌ Value ${target} was not found in the BST.`));
    }

    steps.push({
        type: 'tree-complete',
        description: found ? `🎯 Search successful. Found ${target}.` : `⚠️ Search finished. ${target} not in tree.`,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...values],
        activeArrayIndex: -1
    });

    return steps;
};

export const generateBSTDeleteSteps = (values, target) => {
    let tree = buildBST(values);
    const steps = [];
    const nodeStates = {};
    const inputArr = [...values];

    const gatherIds = (node) => {
        if (!node) return;
        nodeStates[node.id] = 'default';
        gatherIds(node.left);
        gatherIds(node.right);
    };
    gatherIds(tree);

    const getSnapshot = (desc) => ({
        type: 'tree',
        description: desc,
        treeData: cloneTree(tree),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...inputArr],
        activeArrayIndex: -1
    });

    steps.push(getSnapshot(`🎬 Preparing to delete ${target} from the BST.`));

    const findMin = (node) => {
        let current = node;
        while (current.left) current = current.left;
        return current;
    };

    const deleteNode = (root, val) => {
        if (!root) {
            steps.push(getSnapshot(`❌ Node ${val} not found. Nothing to delete.`));
            return null;
        }

        nodeStates[root.id] = 'visiting';
        if (val < root.value) {
            steps.push(getSnapshot(`🔍 ${val} < ${root.value} → Moving LEFT.`));
            nodeStates[root.id] = 'default';
            root.left = deleteNode(root.left, val);
        } else if (val > root.value) {
            steps.push(getSnapshot(`🔍 ${val} > ${root.value} → Moving RIGHT.`));
            nodeStates[root.id] = 'default';
            root.right = deleteNode(root.right, val);
        } else {
            // Found the node!
            nodeStates[root.id] = 'current';
            steps.push(getSnapshot(`🎯 Found node ${root.value}! Analyzing case for deletion...`));

            // Case 1: Leaf or Case 2: One Child
            if (!root.left) {
                steps.push(getSnapshot(`🛠 Node has no left child. Replacing with right subtree.`));
                return root.right;
            } else if (!root.right) {
                steps.push(getSnapshot(`🛠 Node has no right child. Replacing with left subtree.`));
                return root.left;
            }

            // Case 3: Two Children
            steps.push(getSnapshot(`🛠 Node has TWO children. Finding in-order successor...`));
            const successor = findMin(root.right);
            steps.push(getSnapshot(`🔍 In-order successor is ${successor.value} (smallest in right subtree).`));
            
            root.value = successor.value;
            steps.push(getSnapshot(`✨ Swapped current node value with successor value (${successor.value}). Now deleting the duplicate successor.`));
            
            root.right = deleteNode(root.right, successor.value);
        }
        return root;
    };

    tree = deleteNode(tree, target);
    const finalValues = inputArr.filter(v => v !== target);

    steps.push({
        type: 'tree-complete',
        description: `🎯 Deletion of ${target} complete. BST structure preserved.`,
        treeData: cloneTree(tree),
        nodeStates: {},
        arraySnapshot: finalValues,
        activeArrayIndex: -1
    });

    return steps;
};
