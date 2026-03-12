// Trie (Prefix Tree) — Educational step-by-step insert + search
// Shows character-by-character path with accumulated word tracking

let idCounter = 0;

const cloneTree = (node) => {
    if (!node) return null;
    const clone = { ...node };
    clone.children = (node.children || []).map(c => cloneTree(c));
    return clone;
};

const createTrieNode = (char, isRoot = false) => ({
    id: `tr_${idCounter++}`,
    value: char,
    label: isRoot ? 'ROOT' : char,
    isEnd: false,
    children: [],
    charKey: char
});

const findChild = (node, char) => {
    return (node.children || []).find(c => c.charKey === char) || null;
};

const resetStates = (node, states) => {
    if (!node) return;
    states[node.id] = 'default';
    (node.children || []).forEach(c => resetStates(c, states));
};

const markWordEnds = (node, states) => {
    if (!node) return;
    if (node.isEnd) states[node.id] = 'visited';
    (node.children || []).forEach(c => markWordEnds(c, states));
};

export const generateTrieSteps = (inputWords) => {
    const steps = [];
    const nodeStates = {};
    idCounter = 0;

    const defaultWords = ['cat', 'car', 'cap', 'bat', 'bar'];
    const words = (inputWords && inputWords.length > 0) ? inputWords.slice(0, 10) : defaultWords;

    const root = createTrieNode('', true);

    // Concept introduction
    steps.push({
        type: 'tree',
        description: `📚 Trie (Prefix Tree): Stores strings character by character. Words sharing a common prefix share the same path in the tree.`,
        treeData: cloneTree(root),
        nodeStates: {},
        arraySnapshot: [...words],
        activeArrayIndex: -1
    });

    steps.push({
        type: 'tree',
        description: `📊 Words to insert: [${words.map(w => '"' + w + '"').join(', ')}]. Each character becomes a node. Green nodes mark end-of-word.`,
        treeData: cloneTree(root),
        nodeStates: {},
        arraySnapshot: [...words],
        activeArrayIndex: -1
    });

    // --- INSERT PHASE ---
    for (let w = 0; w < words.length; w++) {
        const word = words[w];
        let current = root;
        resetStates(root, nodeStates);
        markWordEnds(root, nodeStates);
        nodeStates[root.id] = 'current';

        steps.push({
            type: 'tree',
            description: `📥 --- Inserting "${word}" --- Starting at ROOT.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...words],
            activeArrayIndex: w
        });

        let pathSoFar = '';
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            pathSoFar += char;
            let child = findChild(current, char);

            if (child) {
                // Node exists — traverse
                resetStates(root, nodeStates);
                markWordEnds(root, nodeStates);
                nodeStates[child.id] = 'visiting';

                steps.push({
                    type: 'tree',
                    description: `✅ Letter '${char}': Node already exists (shared prefix). Traverse to '${char}'. Path: ${pathSoFar}`,
                    treeData: cloneTree(root),
                    nodeStates: { ...nodeStates },
                    arraySnapshot: [...words],
                    activeArrayIndex: w
                });
                current = child;
            } else {
                // Create new node
                child = createTrieNode(char);
                current.children.push(child);

                resetStates(root, nodeStates);
                markWordEnds(root, nodeStates);
                nodeStates[child.id] = 'inserted';

                steps.push({
                    type: 'tree',
                    description: `🆕 Letter '${char}': No child '${char}' found → Create new node. Path: ${pathSoFar}`,
                    treeData: cloneTree(root),
                    nodeStates: { ...nodeStates },
                    arraySnapshot: [...words],
                    activeArrayIndex: w
                });
                current = child;
            }
        }

        // Mark end of word
        current.isEnd = true;
        resetStates(root, nodeStates);
        markWordEnds(root, nodeStates);

        steps.push({
            type: 'tree',
            description: `🏁 Mark '${current.charKey}' as end-of-word for "${word}". Green nodes = complete words.`,
            treeData: cloneTree(root),
            nodeStates: { ...nodeStates },
            arraySnapshot: [...words],
            activeArrayIndex: w
        });
    }

    // Show completed trie
    resetStates(root, nodeStates);
    markWordEnds(root, nodeStates);
    steps.push({
        type: 'tree',
        description: `✅ All ${words.length} words inserted! Notice how words with shared prefixes share the same path (e.g., "ca" for "cat"/"car"/"cap").`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...words],
        activeArrayIndex: -1
    });

    // --- SEARCH PHASE 1: existing word ---
    const searchWord = words[0];
    resetStates(root, nodeStates);
    markWordEnds(root, nodeStates);

    steps.push({
        type: 'tree',
        description: `🔍 --- Search for "${searchWord}" --- Follow the path character by character.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...words],
        activeArrayIndex: 0
    });

    let searchNode = root;
    let searchPath = '';
    for (let i = 0; i < searchWord.length; i++) {
        const char = searchWord[i];
        const child = findChild(searchNode, char);
        searchPath += char;

        if (child) {
            resetStates(root, nodeStates);
            markWordEnds(root, nodeStates);
            nodeStates[child.id] = 'current';
            steps.push({
                type: 'tree',
                description: `✅ Found '${char}' → Path so far: ${searchPath}`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...words],
                activeArrayIndex: 0
            });
            searchNode = child;
        }
    }

    steps.push({
        type: 'tree',
        description: `🎯 Reached end of "${searchWord}". Node is marked as end-of-word? ${searchNode.isEnd ? 'YES ✅' : 'NO ❌'}. "${searchWord}" ${searchNode.isEnd ? 'EXISTS' : 'is just a PREFIX'} in the Trie!`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...words],
        activeArrayIndex: 0
    });

    // --- SEARCH PHASE 2: non-existing word ---
    const fakeWord = words[0].slice(0, -1) + 'z';
    resetStates(root, nodeStates);
    markWordEnds(root, nodeStates);

    steps.push({
        type: 'tree',
        description: `🔍 --- Search for "${fakeWord}" (doesn't exist) ---`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...words, fakeWord],
        activeArrayIndex: words.length
    });

    let fakeNode = root;
    let fakePath = '';
    let failed = false;
    for (let i = 0; i < fakeWord.length; i++) {
        const char = fakeWord[i];
        const child = findChild(fakeNode, char);
        fakePath += char;

        if (child) {
            resetStates(root, nodeStates);
            markWordEnds(root, nodeStates);
            nodeStates[child.id] = 'current';
            steps.push({
                type: 'tree',
                description: `✅ Found '${char}' → Path: ${fakePath}`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...words, fakeWord],
                activeArrayIndex: words.length
            });
            fakeNode = child;
        } else {
            failed = true;
            steps.push({
                type: 'tree',
                description: `❌ No child '${char}' found at current node! "${fakeWord}" does NOT exist in the Trie.`,
                treeData: cloneTree(root),
                nodeStates: { ...nodeStates },
                arraySnapshot: [...words, fakeWord],
                activeArrayIndex: words.length
            });
            break;
        }
    }

    steps.push({
        type: 'tree-complete',
        description: `🎯 Trie operations complete! ${words.length} words stored. Search is O(m) where m = word length. Tries power autocomplete, spell-check, and IP routing.`,
        treeData: cloneTree(root),
        nodeStates: { ...nodeStates },
        arraySnapshot: [...words, fakeWord],
        activeArrayIndex: -1
    });

    return steps;
};
