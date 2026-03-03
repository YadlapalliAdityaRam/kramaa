import { buildAdjList } from './graphData';

export const generateDFSSteps = (graph, startNode) => {
    const steps = [];
    const { nodes, edges } = graph;
    const adj = buildAdjList(nodes, edges);
    const start = startNode || nodes[0].id;

    const visited = new Set();
    const stack = [start];

    const nodeStates = {};
    const edgeStates = {};
    nodes.forEach(n => { nodeStates[n.id] = 'default'; });

    nodeStates[start] = 'in-stack';

    steps.push({
        type: 'graph',
        description: `Starting DFS from node ${start}. Pushing ${start} onto the stack.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        stack: [...stack],
        visited: [...visited]
    });

    while (stack.length > 0) {
        const current = stack.pop();

        if (visited.has(current)) {
            steps.push({
                type: 'graph',
                description: `Popped ${current} but already visited. Skipping.`,
                nodeStates: { ...nodeStates },
                edgeStates: { ...edgeStates },
                stack: [...stack],
                visited: [...visited]
            });
            continue;
        }

        visited.add(current);
        nodeStates[current] = 'current';

        steps.push({
            type: 'graph',
            description: `Popped node ${current} from stack. Visiting it now.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            stack: [...stack],
            visited: [...visited]
        });

        const neighbors = (adj[current] || []).reverse(); // reverse for natural DFS order
        for (const { node: neighbor } of neighbors) {
            const edgeKey1 = `${current}-${neighbor}`;
            const edgeKey2 = `${neighbor}-${current}`;

            if (!visited.has(neighbor)) {
                stack.push(neighbor);
                nodeStates[neighbor] = 'in-stack';
                edgeStates[edgeKey1] = 'considering';
                edgeStates[edgeKey2] = 'considering';

                steps.push({
                    type: 'graph',
                    description: `Discovered unvisited neighbor ${neighbor}. Pushed onto stack.`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    stack: [...stack],
                    visited: [...visited]
                });
            }
        }

        nodeStates[current] = 'visited';
        // Mark traversal edges
        for (const { node: neighbor } of neighbors) {
            const ek1 = `${current}-${neighbor}`;
            const ek2 = `${neighbor}-${current}`;
            if (edgeStates[ek1] === 'considering') edgeStates[ek1] = 'selected';
            if (edgeStates[ek2] === 'considering') edgeStates[ek2] = 'selected';
        }

        steps.push({
            type: 'graph',
            description: `Finished exploring node ${current}. Backtracking.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            stack: [...stack],
            visited: [...visited]
        });
    }

    steps.push({
        type: 'graph-complete',
        description: `DFS complete! Visited ${visited.size} nodes.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        stack: [],
        visited: [...visited]
    });

    return steps;
};
