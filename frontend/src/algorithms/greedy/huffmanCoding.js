export const generateHuffmanCodingSteps = (text) => {
    const steps = [];
    const input = text || 'BCAADDDCCACACAC';

    // Phase 1: Frequency Calculation
    const freqMap = {};
    for (let char of input) {
        freqMap[char] = (freqMap[char] || 0) + 1;
    }

    steps.push({
        type: 'init',
        description: `Calculated frequencies for string "${input}"\n${Object.entries(freqMap).map(([c, f]) => `'${c}': ${f}`).join(', ')}`,
        freqMap: { ...freqMap },
        queue: [],
        nodes: [],
        edges: []
    });

    // Phase 2: Initialize Priority Queue (Min-Heap conceptually)
    let nodeIdCounter = 1;
    let nodesList = Object.entries(freqMap).map(([char, freq]) => ({
        id: `N${nodeIdCounter++}`,
        label: `${char}\n(${freq})`,
        char: char,
        freq: freq,
        isLeaf: true
    }));

    // Sort queue by frequency
    let queue = [...nodesList].sort((a, b) => {
        if (a.freq !== b.freq) return a.freq - b.freq;
        return a.char.localeCompare(b.char);
    });

    let currentNodes = [...nodesList];
    let currentEdges = [];

    steps.push({
        type: 'queue-init',
        description: `Created isolated leaf nodes for each character and added to Priority Queue based on frequency.`,
        freqMap: { ...freqMap },
        queue: [...queue],
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
        highlightedNodes: []
    });

    // Phase 3: Bottom-up construction
    while (queue.length > 1) {
        let left = queue.shift();
        let right = queue.shift();

        steps.push({
            type: 'extract-min',
            description: `Extracted two nodes with minimum frequencies: ${left.freq} and ${right.freq} from Queue.`,
            freqMap: { ...freqMap },
            queue: [...queue],
            nodes: JSON.parse(JSON.stringify(currentNodes)),
            edges: JSON.parse(JSON.stringify(currentEdges)),
            highlightedNodes: [left.id, right.id]
        });

        let parentFreq = left.freq + right.freq;
        let parentId = `N${nodeIdCounter++}`;
        let parentNode = {
            id: parentId,
            label: `${parentFreq}`,
            freq: parentFreq,
            isLeaf: false,
            leftId: left.id,
            rightId: right.id
        };

        currentNodes.push(parentNode);

        // Add edges: Parent -> Left (0), Parent -> Right (1)
        currentEdges.push({ from: parentId, to: left.id, label: '0', directed: true });
        currentEdges.push({ from: parentId, to: right.id, label: '1', directed: true });

        queue.push(parentNode);
        queue.sort((a, b) => a.freq - b.freq);

        steps.push({
            type: 'merge',
            description: `Merged nodes to create new parent with frequency ${parentFreq}. Assigned edge '0' to left and '1' to right.\nInserted parent back into queue.`,
            freqMap: { ...freqMap },
            queue: [...queue],
            nodes: JSON.parse(JSON.stringify(currentNodes)),
            edges: JSON.parse(JSON.stringify(currentEdges)),
            highlightedNodes: [parentId],
            newEdgeIds: [`${parentId}-${left.id}`, `${parentId}-${right.id}`]
        });
    }

    // Phase 4: Final Tree & Code Generation
    let root = queue[0];
    let huffmanCodes = {};

    const generateCodes = (nodeId, currentCode) => {
        const node = currentNodes.find(n => n.id === nodeId);
        if (!node) return;

        if (node.isLeaf) {
            huffmanCodes[node.char] = currentCode;
            return;
        }

        generateCodes(node.leftId, currentCode + '0');
        generateCodes(node.rightId, currentCode + '1');
    };

    if (root) {
        if (root.isLeaf) {
            huffmanCodes[root.char] = '0';
        } else {
            generateCodes(root.id, '');
        }
    }

    let encodedStrLength = 0;
    for (let char of input) {
        if (huffmanCodes[char]) {
            encodedStrLength += huffmanCodes[char].length;
        }
    }
    let originalStrLength = input.length * 8; // Assuming 8-bit ASCII

    steps.push({
        type: 'complete',
        description: `Huffman Tree complete.\nOriginal Size (8-bit): ${originalStrLength} bits.\nCompressed Size: ${encodedStrLength} bits.`,
        freqMap: { ...freqMap },
        queue: [...queue],
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
        highlightedNodes: [],
        huffmanCodes: { ...huffmanCodes },
        compressionStats: { originalStrLength, encodedStrLength }
    });

    return steps;
};
