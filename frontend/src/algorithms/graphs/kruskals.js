export const generateKruskalsSteps = (graphData) => {
    const steps = [];
    const nodeStates = {};
    const edgeStates = {};
    let mstEdges = [];
    let unionFindSets = {};
    let totalWeight = 0;

    const nodes = graphData.nodes || [];
    let edges = graphData.edges || [];

    // Filter out duplicate undirected edges to prevent redundant processing
    // Example: A-B and B-A should be treated as one edge
    const uniqueEdgesMap = new Map();
    edges.forEach(e => {
        const u = e.from;
        const v = e.to;
        const w = e.weight || 1;
        const key = u < v ? `${u}-${v}` : `${v}-${u}`;

        // If there are multiple edges between the same two nodes, Kruskal's will pick the smallest weight
        if (!uniqueEdgesMap.has(key) || uniqueEdgesMap.get(key).weight > w) {
            uniqueEdgesMap.set(key, { from: u, to: v, weight: w, originalId: e.id || `${e.from}-${e.to}` });
        }
    });
    edges = Array.from(uniqueEdgesMap.values());

    // Step 1: Initialization
    nodes.forEach(n => {
        nodeStates[n.id] = 'default';
        unionFindSets[n.id] = [n.id]; // Each node is initially in its own set
    });
    edges.forEach(e => {
        // Find both directed permutations just in case GraphCanvas expects exact ID match
        edgeStates[`${e.from}-${e.to}`] = 'default';
        edgeStates[`${e.to}-${e.from}`] = 'default';
    });

    const getSnapshot = (overrideSortedEdges = null) => ({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        mstEdges: [...mstEdges],
        totalWeight,
        unionFindSets: { ...unionFindSets },
        sortedEdges: overrideSortedEdges !== null ? overrideSortedEdges : [...edges]
    });

    steps.push({
        type: 'graph',
        description: 'Rules:\n1. Sort all edges by increasing weight.\n2. Pick the smallest edge.\n3. Add it only if it doesn\'t form a cycle.\n4. Use Union-Find (Disjoint Set) to detect cycles.\n5. Continue until V - 1 edges are selected.',
        ...getSnapshot([])
    });

    // Step 2: Sort edges by weight
    edges.sort((a, b) => a.weight - b.weight);

    steps.push({
        type: 'graph',
        description: 'Sorted all edges by increasing weight. Now we can pick the smallest available edge.',
        ...getSnapshot()
    });

    // Union-Find helper structures
    const parent = {};
    const rank = {};

    nodes.forEach(n => {
        parent[n.id] = n.id;
        rank[n.id] = 0;
    });

    const find = (i) => {
        if (parent[i] === i) return i;
        // Path compression
        parent[i] = find(parent[i]);
        return parent[i];
    };

    const union = (i, j) => {
        const rootI = find(i);
        const rootJ = find(j);

        if (rootI !== rootJ) {
            if (rank[rootI] < rank[rootJ]) {
                parent[rootI] = rootJ;
                // Merge sets for visualization
                unionFindSets[rootJ] = [...unionFindSets[rootJ], ...unionFindSets[rootI]];
                delete unionFindSets[rootI];
            } else if (rank[rootI] > rank[rootJ]) {
                parent[rootJ] = rootI;
                unionFindSets[rootI] = [...unionFindSets[rootI], ...unionFindSets[rootJ]];
                delete unionFindSets[rootJ];
            } else {
                parent[rootJ] = rootI;
                rank[rootI]++;
                unionFindSets[rootI] = [...unionFindSets[rootI], ...unionFindSets[rootJ]];
                delete unionFindSets[rootJ];
            }
            return true;
        }
        return false;
    };

    // Step 3: Iterate through sorted edges
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const u = edge.from;
        const v = edge.to;
        const weight = edge.weight || 1;
        const edgeIdForward = `${u}-${v}`;
        const edgeIdReverse = `${v}-${u}`;

        // Stop early if MST is complete (V - 1 edges)
        if (mstEdges.length === nodes.length - 1) {
            steps.push({
                type: 'graph',
                description: `MST is complete! Selected ${mstEdges.length} edges connecting ${nodes.length} nodes.`,
                ...getSnapshot()
            });
            break;
        }

        // Highlight current edge
        edgeStates[edgeIdForward] = 'considering';
        edgeStates[edgeIdReverse] = 'considering';
        nodeStates[u] = 'visiting';
        nodeStates[v] = 'visiting';

        steps.push({
            type: 'graph',
            description: `Picking the smallest edge (${u}, ${v}) with weight ${weight}. Using Union-Find to check if it forms a cycle...`,
            currentEdgeIndex: i,
            ...getSnapshot()
        });

        const rootU = find(u);
        const rootV = find(v);

        if (rootU !== rootV) {
            // No cycle, add to MST
            union(u, v);
            mstEdges.push(edge);
            totalWeight += weight;

            edgeStates[edgeIdForward] = 'mst-edge';
            edgeStates[edgeIdReverse] = 'mst-edge';
            nodeStates[u] = 'mst-node';
            nodeStates[v] = 'mst-node';

            steps.push({
                type: 'graph',
                description: `No cycle formed! (Find(${u}) ≠ Find(${v})). Adding edge (${u}, ${v}) to the Minimum Spanning Tree.`,
                currentEdgeIndex: i,
                ...getSnapshot()
            });
        } else {
            // Cycle detected, reject edge
            edgeStates[edgeIdForward] = 'rejected';
            edgeStates[edgeIdReverse] = 'rejected';
            nodeStates[u] = 'default';
            nodeStates[v] = 'default';

            // Keep previously confirmed MST nodes styled as MST instead of reverting to default
            if (find(u) === rootU && mstEdges.some(e => e.from === u || e.to === u)) nodeStates[u] = 'mst-node';
            if (find(v) === rootV && mstEdges.some(e => e.from === v || e.to === v)) nodeStates[v] = 'mst-node';

            steps.push({
                type: 'graph',
                description: `Cycle formed! Both ${u} and ${v} are in the same component. Now we are removing the edge which caused this.`,
                currentEdgeIndex: i,
                ...getSnapshot()
            });
        }
    }

    // Final Step
    steps.push({
        type: 'graph',
        description: `Kruskal's Algorithm Finished. Minimum Spanning Tree Weight is ${totalWeight}.`,
        currentEdgeIndex: -1, // Clear active highlighting
        ...getSnapshot()
    });

    return steps;
};
