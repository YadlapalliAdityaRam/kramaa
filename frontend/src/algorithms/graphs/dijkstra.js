/**
 * Generates steps for Dijkstra's Algorithm visualization.
 * 
 * Step Types:
 * - 'initialization': Setting distances to infinity and source to 0
 * - 'select-node': Selecting the unvisited node with the smallest distance
 * - 'relax-neighbor': Checking a neighbor's distance
 * - 'relax-success': Updating shortest path tree and distance
 * - 'node-visited': Marking node as finalized
 * - 'final': Algorithm complete
 */
export const generateDijkstraSteps = (nodes, edges, sourceId) => {
    const steps = [];
    const distances = {};
    const previous = {};
    const visited = new Set();
    const unvisited = new Set();
    const shortestPathTree = new Set();

    // 1. Initialization
    nodes.forEach(node => {
        distances[node.id] = Infinity;
        previous[node.id] = null;
        unvisited.add(node.id);
    });
    distances[sourceId] = 0;

    let updatesStats = 0;

    const createSnapshot = (type, currId, activeEdge, desc) => {
        // Calculate priority queue (closest unvisited nodes)
        const pq = Array.from(unvisited)
            .map(id => ({ node: id, distance: distances[id] }))
            .sort((a, b) => a.distance - b.distance);

        return {
            type,
            distances: { ...distances },
            visited: Array.from(visited),
            currentNodeId: currId,
            activeEdge,
            shortestPathTree: Array.from(shortestPathTree),
            pq,
            description: desc,
            stats: { processedNodes: visited.size, updates: updatesStats }
        };
    };

    steps.push(createSnapshot(
        'initialization',
        sourceId,
        null,
        `Starting Dijkstra's from source node ${sourceId}. Initial distances set to ∞.`
    ));

    while (unvisited.size > 0) {
        // Find node with smallest distance
        let currId = null;
        let minDistance = Infinity;

        unvisited.forEach(id => {
            if (distances[id] < minDistance) {
                minDistance = distances[id];
                currId = id;
            }
        });

        // If even the smallest distance is infinity, the remaining nodes are unreachable
        if (currId === null || distances[currId] === Infinity) {
            break;
        }

        steps.push(createSnapshot(
            'select-node',
            currId,
            null,
            `Selecting node ${currId} as it has the smallest known distance (${distances[currId]}).`
        ));

        unvisited.delete(currId);
        visited.add(currId);

        // Check neighbors
        const neighbors = edges.filter(e => e.from === currId || e.to === currId);

        for (const edge of neighbors) {
            const neighborId = edge.from === currId ? edge.to : edge.from;
            if (visited.has(neighborId)) continue; // Already finalized

            const weight = parseInt(edge.weight) || 1;
            const newDist = distances[currId] + weight;

            steps.push(createSnapshot(
                'relax-neighbor',
                currId,
                edge.id,
                `Checking neighbor ${neighborId} through node ${currId}. Path distance: ${distances[currId]} + ${weight} = ${newDist}.`
            ));

            if (newDist < distances[neighborId]) {
                distances[neighborId] = newDist;
                previous[neighborId] = currId;
                shortestPathTree.add(edge.id);
                updatesStats++;

                // If this neighbor was reachable via a different edge previously, we ideally would track it
                // For visualization ease, we just add the new edge to the path tree

                steps.push(createSnapshot(
                    'relax-success',
                    currId,
                    edge.id,
                    `Found shorter path to ${neighborId}! Updating distance to ${newDist}.`
                ));
            }
        }

        steps.push(createSnapshot(
            'node-visited',
            currId,
            null,
            `Shortest distance to ${currId} is finalized at ${distances[currId]}.`
        ));
    }

    steps.push(createSnapshot(
        'final',
        null,
        null,
        "Dijkstra's Algorithm complete! All reachable shortest paths found."
    ));

    return steps;
};
