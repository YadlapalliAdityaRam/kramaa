import { buildAdjList } from './graphData';

export const generateBellmanFordSteps = (graph, startNode) => {
    const steps = [];
    const { nodes, edges } = graph;
    const start = startNode || nodes[0].id;

    const dist = {};
    const nodeStates = {};
    const edgeStates = {};

    nodes.forEach(n => {
        dist[n.id] = Infinity;
        nodeStates[n.id] = 'default';
    });
    dist[start] = 0;
    nodeStates[start] = 'start';

    // Build full edge list (both directions for undirected)
    const allEdges = [];
    edges.forEach(e => {
        allEdges.push({ from: e.from, to: e.to, weight: e.weight || 1 });
        allEdges.push({ from: e.to, to: e.from, weight: e.weight || 1 });
    });

    steps.push({
        type: 'graph',
        description: `Bellman-Ford from ${start}. Will do ${nodes.length - 1} passes over all ${allEdges.length} edges.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...dist }
    });

    for (let pass = 0; pass < nodes.length - 1; pass++) {
        let updated = false;

        steps.push({
            type: 'graph',
            description: `Pass ${pass + 1} of ${nodes.length - 1}: Relaxing all edges.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distanceTable: { ...dist }
        });

        for (const edge of allEdges) {
            const edgeKey = `${edge.from}-${edge.to}`;
            const newDist = dist[edge.from] + edge.weight;

            if (dist[edge.from] !== Infinity && newDist < dist[edge.to]) {
                const oldDist = dist[edge.to];
                dist[edge.to] = newDist;
                updated = true;

                edgeStates[edgeKey] = 'relaxed';
                nodeStates[edge.to] = 'in-queue';

                steps.push({
                    type: 'graph',
                    description: `Edge ${edge.from}→${edge.to} (w=${edge.weight}): ${dist[edge.from]} + ${edge.weight} = ${newDist} < ${oldDist === Infinity ? '∞' : oldDist}. Updated!`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    distanceTable: { ...dist }
                });
            }
        }

        if (!updated) {
            steps.push({
                type: 'graph',
                description: `Pass ${pass + 1}: No distances updated. Algorithm can terminate early!`,
                nodeStates: { ...nodeStates },
                edgeStates: { ...edgeStates },
                distanceTable: { ...dist }
            });
            break;
        }
    }

    // Mark final states
    nodes.forEach(n => {
        nodeStates[n.id] = dist[n.id] !== Infinity ? 'visited' : 'default';
    });

    steps.push({
        type: 'graph-complete',
        description: `Bellman-Ford complete! Distances: ${nodes.map(n => `${n.id}=${dist[n.id] === Infinity ? '∞' : dist[n.id]}`).join(', ')}.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...dist }
    });

    return steps;
};
