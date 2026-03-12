// Rabin-Karp — Rolling hash pattern matching
export const generateRabinKarpSteps = (textInput, patternInput) => {
    const text = typeof textInput === 'string' && textInput.length ? textInput.slice(0, 30) : 'ABCCDDAEFG';
    const pattern = typeof patternInput === 'string' && patternInput.length ? patternInput.slice(0, 10) : 'CDD';
    const steps = [];

    const d = 256; // size of alphabet
    const q = 101; // prime number
    const m = pattern.length;
    const n = text.length;

    const getSnapshot = (type, shift, textIdx = -1, patIdx = -1, found = [], hashes = {}) => ({
        type,
        textData: text.split(''),
        target: pattern,
        shiftIndex: shift,
        textIndex: textIdx,
        patternIndex: patIdx,
        matches: found,
        hashes, // Current rolling hash values
        description: ''
    });

    let patHash = 0;
    let winHash = 0;
    let h = 1;

    // The value of h would be "pow(d, m-1)%q"
    for (let i = 0; i < m - 1; i++) {
        h = (h * d) % q;
    }

    // Calculate initial hash of pattern and first window
    for (let i = 0; i < m; i++) {
        patHash = (d * patHash + pattern.charCodeAt(i)) % q;
        winHash = (d * winHash + text.charCodeAt(i)) % q;
    }

    let step = getSnapshot('info', 0, -1, -1, [], { pattern: patHash, window: winHash });
    step.description = `📚 Rabin-Karp: Rolling hash matching. Pattern "${pattern}" (hash: ${patHash}). We'll slide a window across the text and only compare characters if hashes match.`;
    steps.push(step);

    const found = [];
    for (let i = 0; i <= n - m; i++) {
        // Step showing current window hash
        let currentWindowStr = text.slice(i, i + m);
        let compareStep = getSnapshot('compare', i, -1, -1, [...found], { pattern: patHash, window: winHash });
        compareStep.description = `🔍 Window at index ${i}: "${currentWindowStr}". Hash = ${winHash}. ${winHash === patHash ? '✅ Hash Match!' : '❌ No Match.'}`;
        steps.push(compareStep);

        if (patHash === winHash) {
            // Brute force check characters
            let match = true;
            for (let j = 0; j < m; j++) {
                let charStep = getSnapshot('compare', i, i + j, j, [...found], { pattern: patHash, window: winHash });
                charStep.description = `Verifying characters: text[${i + j}]='${text[i + j]}', pattern[${j}]='${pattern[j]}'.`;
                steps.push(charStep);

                if (text[i + j] !== pattern[j]) {
                    match = false;
                    let mismatchStep = getSnapshot('mismatch', i, i + j, j, [...found], { pattern: patHash, window: winHash });
                    mismatchStep.description = `⚠️ Spurious hit! Hash matched but character at index ${j} didn't.`;
                    steps.push(mismatchStep);
                    break;
                }
            }

            if (match) {
                found.push(i);
                let foundStep = getSnapshot('match', i, -1, -1, [...found], { pattern: patHash, window: winHash });
                foundStep.description = `🎯 Full match found at index ${i}!`;
                steps.push(foundStep);
            }
        }

        // Calculate hash of next window
        if (i < n - m) {
            winHash = (d * (winHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
            if (winHash < 0) winHash += q;
        }
    }

    steps.push({
        ...getSnapshot('completed', n - m, -1, -1, [...found], { pattern: patHash }),
        description: `✨ Rabin-Karp complete! Found "${pattern}" ${found.length} time(s).`
    });

    return steps;
};
