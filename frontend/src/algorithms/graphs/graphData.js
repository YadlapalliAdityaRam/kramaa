// Default sample graph for general visualizations
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

// Specialized BFS Graph: Layered/Tree-like to show level discovery
export const bfsGraph = {
    nodes: [
        { id: '1', label: '1' },
        { id: '2', label: '2' },
        { id: '3', label: '3' },
        { id: '4', label: '4' },
        { id: '5', label: '5' },
        { id: '6', label: '6' },
        { id: '7', label: '7' }
    ],
    edges: [
        { from: '1', to: '2' },
        { from: '1', to: '3' },
        { from: '2', to: '4' },
        { from: '2', to: '5' },
        { from: '3', to: '6' },
        { from: '3', to: '7' }
    ]
};

// Specialized DFS Graph: Deep paths and cycles to show depth-first behavior
export const dfsGraph = {
    nodes: [
        { id: 'A', label: 'A' },
        { id: 'B', label: 'B' },
        { id: 'C', label: 'C' },
        { id: 'D', label: 'D' },
        { id: 'E', label: 'E' },
        { id: 'F', label: 'F' }
    ],
    edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'D' },
        { from: 'D', to: 'E' },
        { from: 'E', to: 'F' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'E' }
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
