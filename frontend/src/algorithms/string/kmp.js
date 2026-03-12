// KMP Algorithm — Pattern matching with LPS table
export const generateKMPSteps = (textInput, patternInput) => {
    const text = typeof textInput === 'string' && textInput.length ? textInput.slice(0, 30) : (Array.isArray(textInput) ? textInput.join('').slice(0, 30) : 'AABAACAADAABAABA');
    const pattern = typeof patternInput === 'string' && patternInput.length ? patternInput.slice(0, 10) : 'AABA';

    const steps = [];
    const n = text.length;
    const m = pattern.length;
    const matches = [];

    if (m === 0 || n === 0 || m > n) {
        steps.push({
            type: 'info',
            description: m > n ? 'Pattern longer than text.' : 'Empty input strings.',
            shiftIndex: 0,
            textIndex: -1,
            patternIndex: -1,
            matches: [],
            lps: []
        });
        return steps;
    }

    steps.push({
        type: 'info',
        description: `Starting KMP algorithm. Searching for "${pattern}" in "${text}". Phase 1: Build LPS table.`,
        shiftIndex: 0,
        textIndex: -1,
        patternIndex: -1,
        matches: [],
        lps: []
    });

    const lps = new Array(m).fill(0);
    let len = 0;
    let i = 1;

    while (i < m) {
        if (pattern[i] === pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len !== 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }

    steps.push({
        type: 'info',
        description: `LPS table built: [${lps.join(', ')}]. Now matching pattern against text.`,
        shiftIndex: 0,
        textIndex: -1,
        patternIndex: -1,
        matches: [],
        lps
    });

    i = 0; // index for text
    let j = 0; // index for pattern

    while (i < n) {
        let shiftIndex = i - j;
        steps.push({
            type: 'align',
            description: `Aligned pattern at shift ${shiftIndex}.`,
            shiftIndex,
            textIndex: -1,
            patternIndex: -1,
            matches: [...matches],
            lps
        });

        // compare
        steps.push({
            type: 'compare',
            description: `Comparing text[${i}] ('${text[i]}') with pattern[${j}] ('${pattern[j]}').`,
            shiftIndex,
            textIndex: i,
            patternIndex: j,
            matches: [...matches],
            lps
        });

        if (pattern[j] === text[i]) {
            steps.push({
                type: 'match',
                description: `'${text[i]}' matches pattern character. Proceeding to next character.`,
                shiftIndex,
                textIndex: i,
                patternIndex: j,
                matches: [...matches],
                lps
            });
            j++;
            i++;
        }

        if (j === m) {
            matches.push(i - j);
            steps.push({
                type: 'found',
                description: `Full pattern matched at index ${i - j}. Using lps[${j - 1}] (${lps[j - 1]}) to find next shift.`,
                shiftIndex: i - j,
                textIndex: -1,
                patternIndex: -1,
                matches: [...matches],
                foundAt: i - j,
                lps
            });
            j = lps[j - 1];
        } else if (i < n && pattern[j] !== text[i]) {
            steps.push({
                type: 'mismatch',
                description: `Mismatch: '${text[i]}' != '${pattern[j]}'.`,
                shiftIndex: i - j,
                textIndex: i,
                patternIndex: j,
                matches: [...matches],
                lps
            });

            if (j !== 0) {
                steps.push({
                    type: 'shift-calc',
                    description: `Mismatch at pattern[${j}]. Next check using lps[${j - 1}] (${lps[j - 1]}). New shift = ${i - lps[j - 1]}.`,
                    shiftIndex: i - lps[j - 1],
                    textIndex: -1,
                    patternIndex: -1,
                    matches: [...matches],
                    lps
                });
                j = lps[j - 1];
            } else {
                steps.push({
                    type: 'shift-calc',
                    description: `Mismatch at pattern[0]. Moving to next character in text.`,
                    shiftIndex: i + 1,
                    textIndex: -1,
                    patternIndex: -1,
                    matches: [...matches],
                    lps
                });
                i++;
            }
        }
    }

    steps.push({
        type: 'complete',
        description: `Search complete. Found ${matches.length} matches. ${matches.length > 0 ? `Indices: ${matches.join(', ')}` : ''}`,
        shiftIndex: i - j >= n - m ? n - m : i - j,
        textIndex: -1,
        patternIndex: -1,
        matches: [...matches],
        lps
    });

    return steps;
};
