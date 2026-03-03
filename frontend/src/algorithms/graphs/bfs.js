import { buildAdjList } from './graphData';

export const generateBFSSteps = (graph, startNode) => {
    const steps = [];
    const { nodes, edges } = graph;
    const adj = buildAdjList(nodes, edges);
    const start = startNode || nodes[0].id;

    const visited = new Set();
    const queue = [start];
    visited.add(start);

    const nodeStates = {};
    const edgeStates = {};
    nodes.forEach(n => { nodeStates[n.id] = 'default'; });

    nodeStates[start] = 'current';

    steps.push({
        type: 'graph',
        description: `Starting BFS from node ${start}. Adding ${start} to the queue.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        queue: [...queue],
        visited: [...visited]
    });

    while (queue.length > 0) {
        const current = queue.shift();
        nodeStates[current] = 'current';

        steps.push({
            type: 'graph',
            description: `Dequeued node ${current}. Exploring its neighbors.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            queue: [...queue],
            visited: [...visited]
        });

        const neighbors = adj[current] || [];
        for (const { node: neighbor } of neighbors) {
            const edgeKey1 = `${current}-${neighbor}`;
            const edgeKey2 = `${neighbor}-${current}`;

            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
                nodeStates[neighbor] = 'in-queue';
                edgeStates[edgeKey1] = 'considering';
                edgeStates[edgeKey2] = 'considering';

                steps.push({
                    type: 'graph',
                    description: `Discovered node ${neighbor} from ${current}. Added to queue.`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    queue: [...queue],
                    visited: [...visited]
                });
            } else {
                edgeStates[edgeKey1] = edgeStates[edgeKey1] || 'default';
                edgeStates[edgeKey2] = edgeStates[edgeKey2] || 'default';

                steps.push({
                    type: 'graph',
                    description: `Node ${neighbor} already visited. Skipping.`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    queue: [...queue],
                    visited: [...visited]
                });
            }
        }

        nodeStates[current] = 'visited';
        // Mark edges as selected
        for (const { node: neighbor } of neighbors) {
            if (visited.has(neighbor)) {
                const ek1 = `${current}-${neighbor}`;
                const ek2 = `${neighbor}-${current}`;
                if (edgeStates[ek1] === 'considering') edgeStates[ek1] = 'selected';
                if (edgeStates[ek2] === 'considering') edgeStates[ek2] = 'selected';
            }
        }

        steps.push({
            type: 'graph',
            description: `Finished exploring node ${current}. Marked as visited.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            queue: [...queue],
            visited: [...visited]
        });
    }

    // Mark all visited
    nodes.forEach(n => {
        if (visited.has(n.id)) nodeStates[n.id] = 'visited';
    });

    steps.push({
        type: 'graph-complete',
        description: `BFS complete! Visited ${visited.size} nodes in total.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        queue: [],
        visited: [...visited]
    });

    return steps;
};
