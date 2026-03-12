export const generateFloydWarshallSteps = (graph) => {
    const steps = [];
    const nodes = graph.nodes || [];
    const n = nodes.length;

    // Map node IDs to indices for matrix operations
    const nodeToIndex = {};
    const indexToNode = {};
    nodes.forEach((node, i) => {
        nodeToIndex[node.id] = i;
        indexToNode[i] = node.id;
    });

    // Initialize distance matrix and next/parent matrix
    const dist = Array.from({ length: n }, () => Array(n).fill(Infinity));
    const next = Array.from({ length: n }, () => Array(n).fill(null));

    // Distance to self is 0
    for (let i = 0; i < n; i++) {
        dist[i][i] = 0;
        next[i][i] = indexToNode[i];
    }

    // Add edges to distance matrix
    const edges = graph.edges || [];
    edges.forEach((edge) => {
        const u = nodeToIndex[edge.from];
        const v = nodeToIndex[edge.to];
        if (u !== undefined && v !== undefined) {
            const weight = edge.weight !== undefined ? Number(edge.weight) : 1;
            dist[u][v] = weight;
            next[u][v] = indexToNode[v];

            // If graph is not directed, add reverse edge (though Floyd-Warshall UI assumes directed)
            if (!edge.directed && !graph.directed) {
                dist[v][u] = weight;
                next[v][u] = indexToNode[u];
            }
        }
    });

    // Helper to deeply clone matrix for steps
    const cloneMatrix = (matrix) => matrix.map((row) => [...row]);

    const getSnapshot = (type, k, i, j, description, extra = {}) => {
        const nodeStates = {};
        const edgeStates = {};
        const virtualEdges = [];
        let formula = '';

        if (k !== -1 && i !== -1 && j !== -1) {
            nodeStates[indexToNode[k]] = 'intermediate';
            nodeStates[indexToNode[i]] = 'source';
            nodeStates[indexToNode[j]] = 'target';

            const dIK = dist[i][k] === Infinity ? '∞' : dist[i][k];
            const dKJ = dist[k][j] === Infinity ? '∞' : dist[k][j];
            const dIJ = dist[i][j] === Infinity ? '∞' : dist[i][j];
            const sum = (dist[i][k] === Infinity || dist[k][j] === Infinity) ? '∞' : dist[i][k] + dist[k][j];

            // Render virtual indicator edges to show the path costs being evaluated
            if (i !== k && dIK !== '∞') {
                virtualEdges.push({ id: `v-${i}-${k}`, from: indexToNode[i], to: indexToNode[k], label: String(dIK), state: 'path' });
            }
            if (k !== j && dKJ !== '∞') {
                virtualEdges.push({ id: `v-${k}-${j}`, from: indexToNode[k], to: indexToNode[j], label: String(dKJ), state: 'path' });
            }
            if (i !== j) {
                virtualEdges.push({ id: `v-${i}-${j}`, from: indexToNode[i], to: indexToNode[j], label: String(dIJ), state: 'considering' });
            }

            // Also highlight physical edges subtly if they exist (optional, but good for context)
            const edgeIK = edges.find(e => e.from === indexToNode[i] && e.to === indexToNode[k]);
            const edgeKJ = edges.find(e => e.from === indexToNode[k] && e.to === indexToNode[j]);
            const edgeIJ = edges.find(e => e.from === indexToNode[i] && e.to === indexToNode[j]);
            if (edgeIK) edgeStates[edgeIK.id] = 'path';
            if (edgeKJ) edgeStates[edgeKJ.id] = 'path';
            if (edgeIJ) edgeStates[edgeIJ.id] = 'considering';

            formula = `min(dist[${indexToNode[i]}][${indexToNode[j]}], dist[${indexToNode[i]}][${indexToNode[k]}] + dist[${indexToNode[k]}][${indexToNode[j]}])\nmin(${dIJ}, ${dIK} + ${dKJ}) = min(${dIJ}, ${sum})`;
        } else if (k !== -1) {
            nodeStates[indexToNode[k]] = 'intermediate';
        }

        return {
            type,
            activeK: k !== -1 ? indexToNode[k] : null,
            activeI: i !== -1 ? indexToNode[i] : null,
            activeJ: j !== -1 ? indexToNode[j] : null,
            distMatrix: cloneMatrix(dist),
            nextMatrix: cloneMatrix(next),
            nodeIndexMap: indexToNode, // Provide map for UI rendering
            formula,
            description,
            nodeStates,
            edgeStates,
            virtualEdges,
            ...extra
        };
    };

    steps.push({
        ...getSnapshot('init', -1, -1, -1, '🚀 Initialization: Set dist[i][i]=0, dist(edges)=weight, others=∞.'),
        isInitial: true
    });

    const totalK = n;

    // Floyd-Warshall Algorithm
    for (let k = 0; k < n; k++) {
        steps.push(getSnapshot(
            'iteration-start',
            k, -1, -1,
            `🔄 Phase ${k + 1}/${totalK}: Using '${indexToNode[k]}' as intermediate node.`,
            { iteration: k + 1, totalIterations: totalK }
        ));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (dist[i][k] !== Infinity && dist[k][j] !== Infinity) {
                    const sum = dist[i][k] + dist[k][j];

                    if (sum < dist[i][j]) {
                        // We found a shorter path
                        const oldVal = dist[i][j];
                        dist[i][j] = sum;
                        next[i][j] = next[i][k];

                        const desc = `✅ Found shorter path ${indexToNode[i]}→${indexToNode[j]} via ${indexToNode[k]} (${sum} < ${oldVal === Infinity ? '∞' : oldVal}).`;
                        steps.push(getSnapshot(
                            'update',
                            k, i, j,
                            desc,
                            { relaxed: true, updatedCells: [`${i}-${j}`], iteration: k + 1, totalIterations: totalK }
                        ));
                    } else {
                        // Exploring but no update
                        steps.push(getSnapshot(
                            'compare',
                            k, i, j,
                            `❌ Path ${indexToNode[i]}→${indexToNode[j]} via ${indexToNode[k]} (${sum}) is not better than current (${dist[i][j]}).`,
                            { relaxed: false, iteration: k + 1, totalIterations: totalK }
                        ));
                    }
                } else if (i !== j && i !== k && j !== k) {
                    // One of the paths via k is Infinity
                    steps.push(getSnapshot(
                        'compare-inf',
                        k, i, j,
                        `⏭️ Cannot reach ${indexToNode[j]} from ${indexToNode[i]} via ${indexToNode[k]} (missing edges).`,
                        { relaxed: false, iteration: k + 1, totalIterations: totalK }
                    ));
                }
            }
        }
    }

    // Check for negative cycles
    let negativeCycleDetected = false;
    const negativeCycleNodes = [];
    for (let i = 0; i < n; i++) {
        if (dist[i][i] < 0) {
            negativeCycleDetected = true;
            negativeCycleNodes.push(indexToNode[i]);
        }
    }

    if (negativeCycleDetected) {
        const nodeStates = {};
        negativeCycleNodes.forEach(nodeId => {
            nodeStates[nodeId] = 'negative-cycle-node';
        });

        steps.push({
            type: 'neg-cycle',
            activeK: null, activeI: null, activeJ: null,
            distMatrix: cloneMatrix(dist),
            nextMatrix: cloneMatrix(next),
            nodeIndexMap: indexToNode,
            description: `⚠️ ERROR: Negative weight cycle detected involving nodes: ${negativeCycleNodes.join(', ')}`,
            nodeStates,
            edgeStates: {},
            formula: '',
            negativeCycleDetected: true,
            negativeCycleNodes
        });
    }

    steps.push({
        ...getSnapshot('complete', -1, -1, -1, '🏁 Algorithm Complete! Shortest paths for all pairs have been calculated.'),
        isComplete: true,
        negativeCycleDetected,
        finalNextMatrix: next,
        finalNodeMap: nodeToIndex
    });

    return steps;
};

// Helper function to reconstruct path using the generated nextMatrix
// Used directly by the UI, not part of the animation step generator
export const reconstructPath = (uId, vId, nextMatrix, nodeToIndexMap) => {
    let u = nodeToIndexMap[uId];
    const v = nodeToIndexMap[vId];

    if (u === undefined || v === undefined) return null;
    if (nextMatrix[u][v] === null) return []; // No path

    const path = [uId];
    while (u !== v) {
        // nextMatrix stores the string ID of the next node
        const nextNodeId = nextMatrix[u][v];
        if (!nextNodeId) break; // Safety break

        path.push(nextNodeId);
        u = nodeToIndexMap[nextNodeId];

        // Anti-infinite loop protection (graph shouldn't have unhandled negative cycles here, 
        // but just in case user tries to reconstruct path on a broken graph)
        if (path.length > nextMatrix.length + 1) break;
    }
    return path;
};
