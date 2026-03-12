/**
 * Topological Sort (Kahn's Algorithm)
 * Arranges tasks based on dependencies in a DAG.
 */

export const generateTopologicalSortSteps = (nodes, edges) => {
    const steps = [];
    const n = nodes.length;

    // Initial State: Calculate In-Degrees
    const inDegree = {};
    nodes.forEach(node => inDegree[node.id] = 0);
    edges.forEach(edge => {
        inDegree[edge.to] = (inDegree[edge.to] || 0) + 1;
    });

    steps.push({
        type: 'init',
        description: "🚀 Initializing: Calculate the In-degree (number of incoming dependencies) for each node.",
        inDegree: { ...inDegree },
        queue: [],
        sortedOrder: [],
        highlightNodes: [],
        highlightEdges: [],
        processedNodes: []
    });

    // Find nodes with in-degree 0
    let queue = nodes.filter(node => inDegree[node.id] === 0).map(node => node.id);

    steps.push({
        type: 'find-zeros',
        description: `🟢 Found ${queue.length} node(s) with In-degree 0: [${queue.join(', ')}]. These have no dependencies and are ready!`,
        inDegree: { ...inDegree },
        queue: [...queue],
        sortedOrder: [],
        highlightNodes: [...queue],
        highlightEdges: [],
        processedNodes: []
    });

    const sortedOrder = [];
    const processedNodes = new Set();

    while (queue.length > 0) {
        const u = queue.shift();
        processedNodes.add(u);
        sortedOrder.push(u);

        steps.push({
            type: 'process',
            description: `🟡 Processing ${u}. Adding it to the final topological sequence.`,
            inDegree: { ...inDegree },
            queue: [...queue],
            sortedOrder: [...sortedOrder],
            highlightNodes: [u],
            highlightEdges: [],
            processedNodes: Array.from(processedNodes)
        });

        // Find neighbors
        const neighbors = edges.filter(edge => edge.from === u).map(edge => edge.to);

        if (neighbors.length > 0) {
            steps.push({
                type: 'check-neighbors',
                description: `🔍 Removing dependencies from ${u} to its neighbors: [${neighbors.join(', ')}].`,
                inDegree: { ...inDegree },
                queue: [...queue],
                sortedOrder: [...sortedOrder],
                highlightNodes: [u],
                highlightEdges: edges.filter(edge => edge.from === u).map(edge => `${edge.from}-${edge.to}`),
                processedNodes: Array.from(processedNodes)
            });

            for (const v of neighbors) {
                inDegree[v]--;
                const newlyReady = inDegree[v] === 0;

                if (newlyReady) {
                    queue.push(v);
                }

                steps.push({
                    type: 'update-indegree',
                    description: `📉 Decreasing In-degree of ${v} to ${inDegree[v]}. ${newlyReady ? `✨ ${v} is now ready!` : ''}`,
                    inDegree: { ...inDegree },
                    queue: [...queue],
                    sortedOrder: [...sortedOrder],
                    highlightNodes: [v],
                    highlightEdges: [`${u}-${v}`],
                    processedNodes: Array.from(processedNodes)
                });
            }
        }
    }

    // Final Check: Is it a DAG?
    const hasCycle = sortedOrder.length !== nodes.length;

    steps.push({
        type: 'complete',
        description: hasCycle
            ? "⚠️ Cycle Detected! This graph is not a DAG. Topological sort is only possible for acyclic graphs."
            : `🎯 Success! All tasks are ordered: [${sortedOrder.join(' → ')}].`,
        inDegree: { ...inDegree },
        queue: [],
        sortedOrder: [...sortedOrder],
        highlightNodes: [],
        highlightEdges: [],
        processedNodes: Array.from(processedNodes),
        isSuccess: !hasCycle
    });

    return steps;
};
