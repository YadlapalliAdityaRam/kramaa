import { buildAdjList } from './graphData';

export const generatePrimsSteps = (graph, startNode) => {
    const steps = [];
    const { nodes, edges } = graph;
    const adj = buildAdjList(nodes, edges);
    const start = startNode || nodes[0].id;

    const inMST = new Set();
    const key = {};
    const parent = {};
    const nodeStates = {};
    const edgeStates = {};

    nodes.forEach(n => {
        key[n.id] = Infinity;
        parent[n.id] = null;
        nodeStates[n.id] = 'default';
    });
    key[start] = 0;
    nodeStates[start] = 'current';

    steps.push({
        type: 'graph',
        description: `Prim's MST starting from node ${start}. Key[${start}] = 0, all others = ∞.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...key }
    });

    let totalWeight = 0;

    for (let i = 0; i < nodes.length; i++) {
        // Pick minimum key vertex not in MST
        let minKey = Infinity;
        let minNode = null;
        for (const n of nodes) {
            if (!inMST.has(n.id) && key[n.id] < minKey) {
                minKey = key[n.id];
                minNode = n.id;
            }
        }

        if (minNode === null) break;

        inMST.add(minNode);
        nodeStates[minNode] = 'mst-node';

        if (parent[minNode]) {
            const ek1 = `${parent[minNode]}-${minNode}`;
            const ek2 = `${minNode}-${parent[minNode]}`;
            edgeStates[ek1] = 'mst-edge';
            edgeStates[ek2] = 'mst-edge';
            totalWeight += key[minNode];
        }

        steps.push({
            type: 'graph',
            description: `Adding node ${minNode} to MST${parent[minNode] ? ` via edge ${parent[minNode]}→${minNode} (weight ${key[minNode]})` : ''}. MST weight so far: ${totalWeight}.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distanceTable: { ...key }
        });

        // Update keys of adjacent vertices
        for (const { node: neighbor, weight } of adj[minNode]) {
            if (!inMST.has(neighbor) && weight < key[neighbor]) {
                const oldKey = key[neighbor];
                key[neighbor] = weight;
                parent[neighbor] = minNode;
                nodeStates[neighbor] = 'in-queue';

                const ek1 = `${minNode}-${neighbor}`;
                const ek2 = `${neighbor}-${minNode}`;
                edgeStates[ek1] = 'considering';
                edgeStates[ek2] = 'considering';

                steps.push({
                    type: 'graph',
                    description: `Edge ${minNode}→${neighbor} (weight ${weight}) < current key ${oldKey === Infinity ? '∞' : oldKey}. Updated key[${neighbor}] = ${weight}.`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    distanceTable: { ...key }
                });
            }
        }
    }

    steps.push({
        type: 'graph-complete',
        description: `Prim's MST complete! Total MST weight: ${totalWeight}. ${inMST.size} nodes connected.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...key }
    });

    return steps;
};
