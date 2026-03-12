export const generateBoyerMooreSteps = (text, pattern) => {
    const steps = [];
    const n = text ? text.length : 0;
    const m = pattern ? pattern.length : 0;
    const matches = [];
    let comparisonsCount = 0;

    const getSnapshot = (config) => ({
        textIndex: -1,
        patternIndex: -1,
        shiftIndex: 0,
        matches: [...matches],
        badCharTable: { ...badCharTable },
        type: 'info',
        description: '',
        comparisonsCount,
        ...config
    });

    if (m === 0 || n === 0 || m > n) {
        steps.push(getSnapshot({
            description: m > n ? 'Pattern longer than text.' : 'Empty input strings.',
        }));
        return steps;
    }

    // --- Preprocessing Phase ---
    const badCharTable = {};
    steps.push(getSnapshot({
        type: 'preprocessing',
        description: 'Preprocessing: Building Bad Character Table. Initially, all characters are -1.'
    }));

    for (let i = 0; i < m; i++) {
        const char = pattern[i];
        badCharTable[char] = i;
        steps.push(getSnapshot({
            type: 'preprocessing',
            patternIndex: i,
            description: `Set last occurrence of '${char}' to index ${i}.`
        }));
    }

    steps.push(getSnapshot({
        type: 'info',
        description: 'Preprocessing complete. Starting right-to-left matching.'
    }));

    // --- Matching Phase ---
    let s = 0;
    while (s <= n - m) {
        steps.push(getSnapshot({
            type: 'align',
            shiftIndex: s,
            description: `Aligned pattern at text index ${s}. Comparing from right to left.`
        }));

        let j = m - 1;

        while (j >= 0) {
            comparisonsCount++;
            steps.push(getSnapshot({
                type: 'compare',
                shiftIndex: s,
                textIndex: s + j,
                patternIndex: j,
                description: `Compare pattern[${j}] ('${pattern[j]}') with text[${s + j}] ('${text[s + j]}').`
            }));

            if (pattern[j] === text[s + j]) {
                steps.push(getSnapshot({
                    type: 'match',
                    shiftIndex: s,
                    textIndex: s + j,
                    patternIndex: j,
                    description: `Match! '${pattern[j]}' == '${text[s + j]}'. Moving left.`
                }));
                j--;
            } else {
                break;
            }
        }

        if (j < 0) {
            // Full Match Found
            matches.push(s);
            steps.push(getSnapshot({
                type: 'found',
                shiftIndex: s,
                description: `MATCH FOUND at index ${s}!`,
                foundAt: s
            }));

            // Shift after a match
            // Using a simple shift of 1 or using next char if available
            const nextChar = s + m < n ? text[s + m] : null;
            const badCharIndex = nextChar && (badCharTable[nextChar] !== undefined) ? badCharTable[nextChar] : -1;
            const shiftAmount = s + m < n ? Math.max(1, m - badCharIndex) : 1;

            steps.push(getSnapshot({
                type: 'shift-calc',
                shiftIndex: s,
                description: `Shifting after match.`,
                shiftAmount
            }));
            s += shiftAmount;
        } else {
            // Mismatch
            const mismatchedTextChar = text[s + j];
            const lastOcc = badCharTable[mismatchedTextChar] !== undefined ? badCharTable[mismatchedTextChar] : -1;
            const shiftAmount = Math.max(1, j - lastOcc);

            steps.push(getSnapshot({
                type: 'mismatch',
                shiftIndex: s,
                textIndex: s + j,
                patternIndex: j,
                description: `MISMATCH! Pattern '${pattern[j]}' vs Text '${mismatchedTextChar}'.`
            }));

            steps.push(getSnapshot({
                type: 'shift-calc',
                shiftIndex: s,
                textIndex: s + j,
                patternIndex: j,
                description: `Bad Character Rule: shift = max(1, ${j} - ${lastOcc}).`,
                shiftAmount,
                targetBadChar: mismatchedTextChar
            }));
            s += shiftAmount;
        }
    }

    steps.push(getSnapshot({
        type: 'complete',
        shiftIndex: s > n - m ? n - m : s,
        description: `Search complete. Found ${matches.length} match(es).`
    }));

    return steps;
};
