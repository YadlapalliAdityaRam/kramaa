export const validateTreeEdgeList = (rawInput) => {
    const lines = rawInput.split('\n').map(s => s.trim()).filter(s => s);
    if (lines.length === 0) return { error: "Tree cannot be empty." };

    const adjList = new Map();
    const inDegree = new Map();
    const nodeSet = new Set();
    const edges = [];

    for (const line of lines) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        if (parts.length !== 2) {
            return { error: `Invalid format around "${line}". Use "Parent Child" (e.g. 1 2).` };
        }

        const [u, v] = parts;
        if (u === v) return { error: `Self-edges not allowed in a tree (node ${u}).` };

        nodeSet.add(u);
        nodeSet.add(v);

        if (!adjList.has(u)) adjList.set(u, []);
        if (!adjList.has(v)) adjList.set(v, []);

        if (!inDegree.has(u)) inDegree.set(u, 0);
        if (!inDegree.has(v)) inDegree.set(v, 0);

        adjList.get(u).push({ id: v, value: Number.isFinite(Number(v)) ? Number(v) : v });
        inDegree.set(v, inDegree.get(v) + 1);
        edges.push([u, v]);
    }

    // A valid tree with N nodes must have N - 1 edges
    if (edges.length !== nodeSet.size - 1) {
        return { error: "Invalid tree structure. A tree with N nodes must have exactly N-1 edges (check for cycles or disjoint components)." };
    }

    // A valid tree has exactly one root (node with in-degree 0)
    let rootCount = 0;
    let rootId = null;
    for (const [node, degree] of inDegree.entries()) {
        if (degree === 0) {
            rootCount++;
            rootId = node;
        } else if (degree > 1) {
            return { error: `Node ${node} has multiple parents, which violates tree structure.` };
        }
    }

    if (rootCount === 0) return { error: "No root found. The graph contains a cycle." };
    if (rootCount > 1) return { error: "Multiple roots found. Disconnected components exist." };

    // Building the Tree Structure Object
    const buildTree = (currentId) => {
        let numericValue = Number(currentId);
        let val = Number.isFinite(numericValue) ? numericValue : currentId;

        const node = { id: currentId, value: val, children: [] };
        for (const child of adjList.get(currentId) || []) {
            node.children.push(buildTree(child.id));
        }
        return node;
    };

    const treeRoot = buildTree(rootId);
    return { treeData: treeRoot, error: null };
};
