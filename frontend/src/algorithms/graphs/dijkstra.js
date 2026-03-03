import { buildAdjList } from './graphData';

export const generateDijkstraSteps = (graph, startNode) => {
    const steps = [];
    const { nodes, edges } = graph;
    const adj = buildAdjList(nodes, edges);
    const start = startNode || nodes[0].id;

    const dist = {};
    const prev = {};
    const visited = new Set();
    const nodeStates = {};
    const edgeStates = {};

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
        nodeStates[n.id] = 'default';
    });
    dist[start] = 0;
    nodeStates[start] = 'current';

    steps.push({
        type: 'graph',
        description: `Initializing Dijkstra from node ${start}. Distance to ${start} = 0, all others = ∞.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...dist }
    });

    const getMinNode = () => {
        let minDist = Infinity;
        let minNode = null;
        for (const n of nodes) {
            if (!visited.has(n.id) && dist[n.id] < minDist) {
                minDist = dist[n.id];
                minNode = n.id;
            }
        }
        return minNode;
    };

    for (let i = 0; i < nodes.length; i++) {
        const current = getMinNode();
        if (current === null) break;

        visited.add(current);
        nodeStates[current] = 'current';

        steps.push({
            type: 'graph',
            description: `Selected node ${current} with shortest distance ${dist[current]}. Relaxing edges.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distanceTable: { ...dist }
        });

        for (const { node: neighbor, weight } of adj[current]) {
            const edgeKey1 = `${current}-${neighbor}`;
            const edgeKey2 = `${neighbor}-${current}`;
            const newDist = dist[current] + weight;

            edgeStates[edgeKey1] = 'considering';
            edgeStates[edgeKey2] = 'considering';

            if (newDist < dist[neighbor]) {
                const oldDist = dist[neighbor];
                dist[neighbor] = newDist;
                prev[neighbor] = current;

                if (!visited.has(neighbor)) {
                    nodeStates[neighbor] = 'in-queue';
                }

                edgeStates[edgeKey1] = 'relaxed';
                edgeStates[edgeKey2] = 'relaxed';

                steps.push({
                    type: 'graph',
                    description: `Edge ${current}→${neighbor} (weight ${weight}): ${dist[current]} + ${weight} = ${newDist} < ${oldDist === Infinity ? '∞' : oldDist}. Updated distance to ${neighbor}.`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    distanceTable: { ...dist }
                });
            } else {
                steps.push({
                    type: 'graph',
                    description: `Edge ${current}→${neighbor} (weight ${weight}): ${dist[current]} + ${weight} = ${newDist} ≥ ${dist[neighbor]}. No improvement.`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    distanceTable: { ...dist }
                });

                edgeStates[edgeKey1] = edgeStates[edgeKey1] === 'relaxed' ? 'relaxed' : 'default';
                edgeStates[edgeKey2] = edgeStates[edgeKey2] === 'relaxed' ? 'relaxed' : 'default';
            }
        }

        nodeStates[current] = 'visited';

        steps.push({
            type: 'graph',
            description: `Node ${current} fully processed. Shortest distance: ${dist[current]}.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distanceTable: { ...dist }
        });
    }

    // Highlight shortest path tree
    nodes.forEach(n => {
        if (visited.has(n.id)) nodeStates[n.id] = 'shortest-path';
    });
    for (const [node, parent] of Object.entries(prev)) {
        if (parent) {
            edgeStates[`${parent}-${node}`] = 'shortest-edge';
            edgeStates[`${node}-${parent}`] = 'shortest-edge';
        }
    }

    steps.push({
        type: 'graph-complete',
        description: `Dijkstra complete! Shortest distances from ${start}: ${nodes.map(n => `${n.id}=${dist[n.id] === Infinity ? '∞' : dist[n.id]}`).join(', ')}.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...dist }
    });

    return steps;
};
