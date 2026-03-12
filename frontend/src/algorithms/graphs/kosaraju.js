/**
 * Kosaraju's Algorithm — Educational logic
 * 1. DFS to get finishing order (Stack)
 * 2. Reverse Graph
 * 3. DFS in stack order to find SCCs
 */

export const generateKosarajuSteps = (nodes, edges) => {
    const steps = [];
    const adj = {};
    const revAdj = {};
    nodes.forEach(n => {
        adj[n.id] = [];
        revAdj[n.id] = [];
    });
    edges.forEach(e => {
        adj[e.from].push(e.to);
        revAdj[e.to].push(e.from);
    });

    const visited = new Set();
    const stack = [];

    // --- STEP 1: First DFS (Finishing Order) ---
    steps.push({
        type: 'info',
        description: "🚀 Phase 1: Performing DFS to determine the finishing order of nodes.",
        nodes: nodes.map(n => ({ ...n, state: 'default' })),
        edges: edges.map(e => ({ ...e, state: 'default' })),
        stack: [],
        sccs: []
    });

    const dfs1 = (u) => {
        visited.add(u);
        steps.push({
            type: 'dfs1-visit',
            description: `🟡 DFS 1: Visiting node ${u}.`,
            nodes: nodes.map(n => ({
                ...n,
                state: visited.has(n.id) ? 'visited' : 'default',
                isCurrent: n.id === u
            })),
            edges: edges.map(e => ({ ...e, state: 'default' })),
            stack: [...stack],
            sccs: []
        });

        for (const v of adj[u]) {
            if (!visited.has(v)) {
                dfs1(v);
            }
        }

        stack.push(u);
        steps.push({
            type: 'dfs1-finish',
            description: `✅ Finished node ${u}. Pushing to stack.`,
            nodes: nodes.map(n => ({
                ...n,
                state: visited.has(n.id) ? 'visited' : 'default',
                isFinished: n.id === u
            })),
            edges: edges.map(e => ({ ...e, state: 'default' })),
            stack: [...stack],
            sccs: []
        });
    };

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            dfs1(node.id);
        }
    }

    // --- STEP 2: Reverse Graph ---
    steps.push({
        type: 'reverse',
        description: "🔄 Phase 2: Reversing all edges in the graph.",
        nodes: nodes.map(n => ({ ...n, state: 'default' })),
        edges: edges.map(e => ({ ...e, state: 'reversed' })),
        stack: [...stack],
        sccs: []
    });

    // --- STEP 3: Second DFS (Find SCCs) ---
    const visited2 = new Set();
    const sccs = [];
    let currentSCC = [];

    const dfs2 = (u, color) => {
        visited2.add(u);
        currentSCC.push(u);

        steps.push({
            type: 'dfs2-visit',
            description: `🟡 DFS 2: Exploring node ${u} from the stack. It belongs to a new SCC.`,
            nodes: nodes.map(n => {
                const sccIndex = sccs.findIndex(s => s.nodes.includes(n.id));
                return {
                    ...n,
                    state: visited2.has(n.id) ? 'scc' : 'default',
                    isCurrent: n.id === u,
                    sccColor: sccIndex !== -1 ? sccs[sccIndex].color : (n.id === u ? color : null)
                };
            }),
            edges: edges.map(e => ({ ...e, state: 'reversed' })),
            stack: [...stack],
            sccs: [...sccs.map(s => s.nodes), currentSCC]
        });

        for (const v of revAdj[u]) {
            if (!visited2.has(v)) {
                dfs2(v, color);
            }
        }
    };

    const sccColors = ['#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6', '#06b6d4'];
    let colorIdx = 0;

    const stackCopy = [...stack];
    while (stackCopy.length > 0) {
        const u = stackCopy.pop();

        steps.push({
            type: 'pop-stack',
            description: `📤 Popped ${u} from the stack. Checking if it's already visited in Phase 2.`,
            nodes: nodes.map(n => {
                const sccIndex = sccs.findIndex(s => s.nodes.includes(n.id));
                return {
                    ...n,
                    state: visited2.has(n.id) ? 'scc' : 'default',
                    isCurrent: n.id === u,
                    sccColor: sccIndex !== -1 ? sccs[sccIndex].color : null
                };
            }),
            edges: edges.map(e => ({ ...e, state: 'reversed' })),
            stack: [...stackCopy, u], // Show the u being popped
            highlightPop: u,
            sccs: sccs.map(s => s.nodes)
        });

        if (!visited2.has(u)) {
            currentSCC = [];
            const color = sccColors[colorIdx % sccColors.length];
            colorIdx++;

            dfs2(u, color);

            sccs.push({ nodes: [...currentSCC], color });

            steps.push({
                type: 'scc-found',
                description: `✨ Identified Strongly Connected Component: {${currentSCC.join(', ')}}`,
                nodes: nodes.map(n => {
                    const sccIndex = sccs.findIndex(s => s.nodes.includes(n.id));
                    return {
                        ...n,
                        state: visited2.has(n.id) ? 'scc' : 'default',
                        sccColor: sccIndex !== -1 ? sccs[sccIndex].color : null
                    };
                }),
                edges: edges.map(e => ({ ...e, state: 'reversed' })),
                stack: [...stackCopy],
                sccs: sccs.map(s => s.nodes)
            });
        }
    }

    steps.push({
        type: 'complete',
        description: `🎯 Kosaraju's Algorithm Complete! Found ${sccs.length} Strongly Connected Components.`,
        nodes: nodes.map(n => {
            const sccIndex = sccs.findIndex(s => s.nodes.includes(n.id));
            return {
                ...n,
                state: 'scc',
                sccColor: sccIndex !== -1 ? sccs[sccIndex].color : null
            };
        }),
        edges: edges.map(e => ({ ...e, state: 'default' })), // Show original edges again
        stack: [],
        sccs: sccs.map(s => s.nodes)
    });

    return steps;
};
