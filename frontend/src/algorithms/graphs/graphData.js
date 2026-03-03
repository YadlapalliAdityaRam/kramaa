// Default sample graph for BFS/DFS visualizations
export const defaultGraph = {
    nodes: [
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
        { id: 'D', label: 'D' },
        { id: 'E', label: 'E' },
        { id: 'F', label: 'F' },
        { id: 'G', label: 'G' }
    ],
    edges: [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'D' },
        { from: 'B', to: 'E' },
        { from: 'C', to: 'F' },
        { from: 'D', to: 'G' },
        { from: 'E', to: 'G' }
    ]
};

// Weighted graph for Dijkstra/Bellman-Ford/Prim's
export const defaultWeightedGraph = {
    nodes: [
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
        { id: 'D', label: 'D' },
        { id: 'E', label: 'E' },
        { id: 'F', label: 'F' }
    ],
    edges: [
        { from: 'A', to: 'B', weight: 4 },
        { from: 'A', to: 'C', weight: 2 },
        { from: 'B', to: 'C', weight: 1 },
        { from: 'B', to: 'D', weight: 5 },
        { from: 'C', to: 'D', weight: 8 },
        { from: 'C', to: 'E', weight: 10 },
        { from: 'D', to: 'E', weight: 2 },
        { from: 'D', to: 'F', weight: 6 },
        { from: 'E', to: 'F', weight: 3 }
    ]
};

// Build adjacency list from edge list
export const buildAdjList = (nodes, edges, undirected = true) => {
    const adj = {};
    nodes.forEach(n => { adj[n.id] = []; });
    edges.forEach(e => {
        adj[e.from].push({ node: e.to, weight: e.weight || 1 });
        if (undirected) {
            adj[e.to].push({ node: e.from, weight: e.weight || 1 });
        }
    });
    return adj;
};
