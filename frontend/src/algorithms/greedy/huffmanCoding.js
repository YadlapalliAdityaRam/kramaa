const cloneTree = (node) => {
    if (!node) return null;
    return { ...node, left: cloneTree(node.left), right: cloneTree(node.right) };
};

export const generateHuffmanCodingSteps = (text) => {
    const steps = [];
    const input = text || 'ABRACADABRA';

    // Count frequencies
    const freq = {};
    for (const ch of input) {
        freq[ch] = (freq[ch] || 0) + 1;
    }

    steps.push({
        type: 'tree',
        description: `Huffman Coding for "${input}". Character frequencies: ${Object.entries(freq).map(([c, f]) => `'${c}'=${f}`).join(', ')}.`,
        treeData: null,
        nodeStates: {}
    });

    // Create leaf nodes, sorted by frequency
    let nodeId = 0;
    let nodes = Object.entries(freq).map(([ch, f]) => ({
        id: `h${nodeId++}`,
        value: `${ch}:${f}`,
        char: ch,
        freq: f,
        left: null,
        right: null
    }));

    nodes.sort((a, b) => a.freq - b.freq);
    const nodeStates = {};
    nodes.forEach(n => { nodeStates[n.id] = 'default'; });

    steps.push({
        type: 'tree',
        description: `Created ${nodes.length} leaf nodes, sorted by frequency: ${nodes.map(n => `${n.char}(${n.freq})`).join(', ')}.`,
        treeData: null,
        nodeStates: { ...nodeStates }
    });

    // Build Huffman tree
    while (nodes.length > 1) {
        const left = nodes.shift();
        const right = nodes.shift();

        nodeStates[left.id] = 'current';
        nodeStates[right.id] = 'current';

        steps.push({
            type: 'tree',
            description: `Merging two smallest: ${left.char || ''}(${left.freq}) + ${right.char || ''}(${right.freq}) = ${left.freq + right.freq}.`,
            treeData: null,
            nodeStates: { ...nodeStates }
        });

        const merged = {
            id: `h${nodeId++}`,
            value: `${left.freq + right.freq}`,
            char: null,
            freq: left.freq + right.freq,
            left,
            right
        };

        nodeStates[left.id] = 'visited';
        nodeStates[right.id] = 'visited';
        nodeStates[merged.id] = 'inserted';

        // Insert merged node in sorted order
        let inserted = false;
        for (let i = 0; i < nodes.length; i++) {
            if (merged.freq <= nodes[i].freq) {
                nodes.splice(i, 0, merged);
                inserted = true;
                break;
            }
        }
        if (!inserted) nodes.push(merged);

        steps.push({
            type: 'tree',
            description: `Created internal node (freq=${merged.freq}). Remaining nodes: ${nodes.length}.`,
            treeData: cloneTree(merged),
            nodeStates: { ...nodeStates }
        });
    }

    const root = nodes[0];

    // Generate codes
    const codes = {};
    const generateCodes = (node, code) => {
        if (!node) return;
        if (!node.left && !node.right && node.char) {
            codes[node.char] = code || '0';
        }
        generateCodes(node.left, code + '0');
        generateCodes(node.right, code + '1');
    };
    generateCodes(root, '');

    // Reset states
    Object.keys(nodeStates).forEach(k => { nodeStates[k] = 'default'; });

    steps.push({
        type: 'tree-complete',
        description: `Huffman Tree complete! Codes: ${Object.entries(codes).map(([c, code]) => `'${c}'=${code}`).join(', ')}. Encoded length: ${input.split('').map(c => codes[c].length).reduce((a, b) => a + b, 0)} bits.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates }
    });

    return steps;
};
