import { buildAdjList } from './graphData';

export const generateBellmanFordSteps = (graph, startNode) => {
    const steps = [];
    const { nodes, edges } = graph;
    const start = startNode || nodes[0].id;
    const V = nodes.length;

    const dist = {};
    const prev = {};
    const nodeStates = {};
    const edgeStates = {};

    // Initialise
    nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
        nodeStates[n.id] = 'default';
    });
    dist[start] = 0;
    nodeStates[start] = 'source';

    // Build directed edge list. For undirected input add both directions.
    const directed = edges.some(e => e.directed);
    const allEdges = [];
    edges.forEach(e => {
        allEdges.push({ from: e.from, to: e.to, weight: e.weight ?? 1, directed: true });
        if (!directed && !e.directed) {
            allEdges.push({ from: e.to, to: e.from, weight: e.weight ?? 1, directed: true });
        }
    });

    const totalIterations = V - 1;

    // Initialisation step
    steps.push({
        type: 'init',
        description: `Initialise: dist[${start}] = 0, all others = ∞. Will perform ${totalIterations} iterations over ${allEdges.length} edges.`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...dist },
        prevTable: { ...prev },
        iteration: 0,
        totalIterations,
        currentEdge: null,
        formula: null,
        negativeCycleDetected: false,
        negativeCycleEdges: []
    });

    // ── Main relaxation: V-1 passes ──
    for (let pass = 0; pass < totalIterations; pass++) {
        let updatedThisPass = false;

        // Reset edge states for this pass
        Object.keys(edgeStates).forEach(k => { edgeStates[k] = 'default'; });

        // Iteration start marker
        steps.push({
            type: 'iteration-start',
            description: `Iteration ${pass + 1} / ${totalIterations}: Begin relaxing all edges.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distanceTable: { ...dist },
            prevTable: { ...prev },
            iteration: pass + 1,
            totalIterations,
            currentEdge: null,
            formula: null,
            negativeCycleDetected: false,
            negativeCycleEdges: []
        });

        for (const edge of allEdges) {
            const edgeKey = `${edge.from}-${edge.to}`;
            const newDist = dist[edge.from] + edge.weight;
            const canRelax = dist[edge.from] !== Infinity && newDist < dist[edge.to];

            const oldDistVal = dist[edge.to];
            const formulaStr = dist[edge.from] === Infinity
                ? `dist[${edge.to}] = min(${oldDistVal === Infinity ? '∞' : oldDistVal}, ∞ + ${edge.weight}) — skip`
                : `dist[${edge.to}] = min(${oldDistVal === Infinity ? '∞' : oldDistVal}, ${dist[edge.from]} + ${edge.weight})`;

            if (canRelax) {
                dist[edge.to] = newDist;
                prev[edge.to] = edge.from;
                updatedThisPass = true;

                edgeStates[edgeKey] = 'relaxed';            // green
                nodeStates[edge.to] = 'visiting';            // highlight updated node

                steps.push({
                    type: 'relax-success',
                    description: `Edge ${edge.from}→${edge.to} (w=${edge.weight}): ${dist[edge.from]} + ${edge.weight} = ${newDist} < ${oldDistVal === Infinity ? '∞' : oldDistVal}. Updated dist[${edge.to}] = ${newDist}`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    distanceTable: { ...dist },
                    prevTable: { ...prev },
                    iteration: pass + 1,
                    totalIterations,
                    currentEdge: { ...edge },
                    formula: formulaStr,
                    relaxed: true,
                    negativeCycleDetected: false,
                    negativeCycleEdges: []
                });

                // Reset edge visual after showing
                edgeStates[edgeKey] = 'selected';
            } else {
                edgeStates[edgeKey] = 'considering';          // gray

                steps.push({
                    type: 'relax-skip',
                    description: dist[edge.from] === Infinity
                        ? `Edge ${edge.from}→${edge.to} (w=${edge.weight}): dist[${edge.from}] = ∞, skip.`
                        : `Edge ${edge.from}→${edge.to} (w=${edge.weight}): ${dist[edge.from]} + ${edge.weight} = ${newDist} ≥ ${oldDistVal === Infinity ? '∞' : oldDistVal}. No update.`,
                    nodeStates: { ...nodeStates },
                    edgeStates: { ...edgeStates },
                    distanceTable: { ...dist },
                    prevTable: { ...prev },
                    iteration: pass + 1,
                    totalIterations,
                    currentEdge: { ...edge },
                    formula: formulaStr,
                    relaxed: false,
                    negativeCycleDetected: false,
                    negativeCycleEdges: []
                });

                edgeStates[edgeKey] = 'default';
            }
        }

        if (!updatedThisPass) {
            steps.push({
                type: 'early-exit',
                description: `Iteration ${pass + 1}: No distances updated — algorithm terminates early!`,
                nodeStates: { ...nodeStates },
                edgeStates: { ...edgeStates },
                distanceTable: { ...dist },
                prevTable: { ...prev },
                iteration: pass + 1,
                totalIterations,
                currentEdge: null,
                formula: null,
                negativeCycleDetected: false,
                negativeCycleEdges: []
            });
            break;
        }
    }

    // ── Negative cycle detection (V-th pass) ──
    Object.keys(edgeStates).forEach(k => { edgeStates[k] = 'default'; });

    let negativeCycle = false;
    const cycleEdges = [];

    steps.push({
        type: 'neg-cycle-check-start',
        description: `Checking for negative weight cycles: one more pass over all edges…`,
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distanceTable: { ...dist },
        prevTable: { ...prev },
        iteration: totalIterations + 1,
        totalIterations,
        currentEdge: null,
        formula: null,
        negativeCycleDetected: false,
        negativeCycleEdges: []
    });

    for (const edge of allEdges) {
        const edgeKey = `${edge.from}-${edge.to}`;
        const newDist = dist[edge.from] + edge.weight;

        if (dist[edge.from] !== Infinity && newDist < dist[edge.to]) {
            negativeCycle = true;
            cycleEdges.push({ ...edge });
            edgeStates[edgeKey] = 'negative-cycle';
            nodeStates[edge.from] = 'negative-cycle-node';
            nodeStates[edge.to] = 'negative-cycle-node';
        }
    }

    if (negativeCycle) {
        steps.push({
            type: 'neg-cycle-detected',
            description: `⚠️ Negative weight cycle detected! Shortest paths cannot be determined for affected nodes.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distanceTable: { ...dist },
            prevTable: { ...prev },
            iteration: totalIterations + 1,
            totalIterations,
            currentEdge: null,
            formula: null,
            negativeCycleDetected: true,
            negativeCycleEdges: cycleEdges
        });
    } else {
        // Mark final shortest-path tree
        nodes.forEach(n => {
            if (n.id === start) {
                nodeStates[n.id] = 'source';
            } else {
                nodeStates[n.id] = dist[n.id] !== Infinity ? 'shortest-path' : 'default';
            }
        });

        Object.keys(edgeStates).forEach(k => { edgeStates[k] = 'default'; });
        for (const [node, parent] of Object.entries(prev)) {
            if (parent) {
                edgeStates[`${parent}-${node}`] = 'shortest-edge';
            }
        }

        steps.push({
            type: 'complete',
            description: `Bellman-Ford complete! No negative cycles. Distances: ${nodes.map(n => `${n.id}=${dist[n.id] === Infinity ? '∞' : dist[n.id]}`).join(', ')}.`,
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distanceTable: { ...dist },
            prevTable: { ...prev },
            iteration: totalIterations + 1,
            totalIterations,
            currentEdge: null,
            formula: null,
            negativeCycleDetected: false,
            negativeCycleEdges: []
        });
    }

    return steps;
};
