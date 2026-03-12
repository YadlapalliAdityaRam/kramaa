export const generatePrimsSteps = (graphData, startNodeId = null) => {
    const steps = [];
    const nodes = graphData.nodes || [];
    let edges = graphData.edges || [];

    // Filter duplicate undirected edges (A-B and B-A) keeping smallest weight
    const uniqueEdgesMap = new Map();
    edges.forEach(e => {
        const u = e.from;
        const v = e.to;
        const w = e.weight || 1;
        const key = u < v ? `${u}-${v}` : `${v}-${u}`;
        if (!uniqueEdgesMap.has(key) || uniqueEdgesMap.get(key).weight > w) {
            uniqueEdgesMap.set(key, { from: u, to: v, weight: w, originalId: e.id || `${e.from}-${e.to}` });
        }
    });
    edges = Array.from(uniqueEdgesMap.values());

    // Build Adjacency List: node -> array of { neighbor, weight, originalEdge }
    const adj = {};
    nodes.forEach(n => { adj[n.id] = []; });
    edges.forEach(e => {
        adj[e.from].push({ neighbor: e.to, weight: e.weight, edge: e });
        adj[e.to].push({ neighbor: e.from, weight: e.weight, edge: e });
    });

    const nodeStates = {};
    const edgeStates = {};
    const visitedNodes = new Set();
    const mstEdges = [];
    let candidateEdges = [];
    let totalWeight = 0;

    // Initialization
    nodes.forEach(n => { nodeStates[n.id] = 'default'; });
    edges.forEach(e => {
        edgeStates[`${e.from}-${e.to}`] = 'default';
        edgeStates[`${e.to}-${e.from}`] = 'default';
    });

    const getSnapshot = (overrideCandidates = null) => ({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        mstEdges: [...mstEdges],
        visitedNodes: Array.from(visitedNodes),
        candidateEdges: overrideCandidates !== null ? overrideCandidates : [...candidateEdges],
        totalWeight
    });

    // Start Node Logic
    const startNode = startNodeId || nodes[Math.floor(Math.random() * nodes.length)]?.id;
    if (!startNode || !adj[startNode]) return steps; // Guard for empty graphs

    steps.push({
        type: 'graph',
        description: "Prim's Algorithm builds the Minimum Spanning Tree (MST) by starting from a single node and repeatedly adding the cheapest edge that connects the growing tree to a new, unvisited node.",
        ...getSnapshot()
    });

    // Mark start node as visited
    visitedNodes.add(startNode);
    nodeStates[startNode] = 'mst-node';

    steps.push({
        type: 'graph',
        description: `Step 1: Randomly selected node "${startNode}" to start the MST. Marked it as visited.`,
        ...getSnapshot()
    });

    // Push initial connected edges to PQ
    adj[startNode].forEach(conn => {
        candidateEdges.push({
            from: startNode,
            to: conn.neighbor,
            weight: conn.weight,
            originalId: conn.edge.originalId
        });
        const edgeKeyF = `${startNode}-${conn.neighbor}`;
        const edgeKeyR = `${conn.neighbor}-${startNode}`;
        edgeStates[edgeKeyF] = 'considering';
        edgeStates[edgeKeyR] = 'considering';
    });

    // Sort candidate edges (Priority Queue conceptually)
    candidateEdges.sort((a, b) => a.weight - b.weight);

    steps.push({
        type: 'graph',
        description: `Step 2: Added all edges connected to "${startNode}" into the candidate edge list (priority queue). Sorted from smallest weight.`,
        ...getSnapshot()
    });

    // Main Loop
    while (visitedNodes.size < nodes.length && candidateEdges.length > 0) {
        // Find the smallest edge that points to an UNVISITED node
        let minEdgeIndex = -1;
        let selectedEdge = null;
        let targetNode = null;

        for (let i = 0; i < candidateEdges.length; i++) {
            const edge = candidateEdges[i];
            const isToVisited = visitedNodes.has(edge.to);
            const isFromVisited = visitedNodes.has(edge.from);

            // Edge is valid if EXACTLY ONE endpoint is visited
            if ((isToVisited && !isFromVisited) || (!isToVisited && isFromVisited)) {
                minEdgeIndex = i;
                selectedEdge = edge;
                targetNode = isToVisited ? edge.from : edge.to;
                break;
            }
        }

        // If no valid edge was found, graph might be disconnected
        if (minEdgeIndex === -1) {
            break;
        }

        const edgeKeyF = `${selectedEdge.from}-${selectedEdge.to}`;
        const edgeKeyR = `${selectedEdge.to}-${selectedEdge.from}`;

        // Add to MST
        mstEdges.push({ ...selectedEdge });
        visitedNodes.add(targetNode);
        totalWeight += selectedEdge.weight;

        nodeStates[targetNode] = 'mst-node';
        edgeStates[edgeKeyF] = 'mst-edge';
        edgeStates[edgeKeyR] = 'mst-edge';

        // Remove the selected edge from candidates
        candidateEdges.splice(minEdgeIndex, 1);

        steps.push({
            type: 'graph',
            description: `Selected the smallest valid edge (${selectedEdge.from}, ${selectedEdge.to}) with weight ${selectedEdge.weight}. Adding node "${targetNode}" to the MST.`,
            activeEdge: selectedEdge,
            ...getSnapshot()
        });

        // Add new neighbor edges to candidate list
        let newEdgesAdded = false;
        adj[targetNode].forEach(conn => {
            // Only add edge if the neighbor is NOT already visited
            // This prevents adding completely useless internal MST edges
            if (!visitedNodes.has(conn.neighbor)) {
                candidateEdges.push({
                    from: targetNode,
                    to: conn.neighbor,
                    weight: conn.weight,
                    originalId: conn.edge.originalId
                });
                newEdgesAdded = true;

                // Color as considering
                const ekF = `${targetNode}-${conn.neighbor}`;
                const ekR = `${conn.neighbor}-${targetNode}`;
                if (edgeStates[ekF] !== 'mst-edge') {
                    edgeStates[ekF] = 'considering';
                    edgeStates[ekR] = 'considering';
                }
            }
        });

        // Filter out edges where BOTH endpoints are now inside MST (clean PQ)
        candidateEdges = candidateEdges.filter(e => {
            const isUseless = visitedNodes.has(e.from) && visitedNodes.has(e.to);
            if (isUseless) {
                // Return them to default visually if they were 'considering'
                const ekF = `${e.from}-${e.to}`;
                const ekR = `${e.to}-${e.from}`;
                if (edgeStates[ekF] === 'considering') {
                    edgeStates[ekF] = 'rejected';
                    edgeStates[ekR] = 'rejected';
                }
            }
            return !isUseless;
        });

        // Resort priority queue
        candidateEdges.sort((a, b) => a.weight - b.weight);

        if (newEdgesAdded) {
            steps.push({
                type: 'graph',
                description: `Added all new outgoing edges from "${targetNode}" to the candidate list and updated the priority queue. Removed edges that form cycles.`,
                ...getSnapshot()
            });
        }
    }

    steps.push({
        type: 'graph',
        description: `Prim's Algorithm Finished! Minimum Spanning Tree Weight is ${totalWeight}. Connected ${visitedNodes.size} / ${nodes.length} nodes.`,
        currentEdgeIndex: -1,
        ...getSnapshot()
    });

    return steps;
};
