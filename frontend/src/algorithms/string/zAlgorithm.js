// Z-Algorithm — Z-array for pattern matching
// This generates detailed visualization steps for the dedicated visualizer.

export const generateZAlgorithmSteps = (textInput, patternInput) => {
    const text = typeof textInput === 'string' && textInput.length ? textInput : 'aabcaab';
    const pattern = typeof patternInput === 'string' && patternInput.length ? patternInput : 'aab';
    const concat = pattern + '$' + text;
    const n = concat.length;
    const steps = [];
    const z = new Array(n).fill(0);

    const getSnapshot = (type, l, r, currentIdx, kIdx = -1, description = '') => ({
        type,
        concat: concat.split(''),
        z: [...z],
        l,
        r,
        currentIdx,
        kIdx,
        patternLen: pattern.length,
        description
    });

    // Initial Step
    steps.push(getSnapshot(
        'init', -1, -1, -1, -1,
        `📚 Z-Algorithm: Constructing Z-array for "${concat}". Z[i] is the length of the longest common prefix between S and S[i...].`
    ));

    let l = 0, r = 0;
    for (let i = 1; i < n; i++) {
        if (i > r) {
            // Case 1: Outside of a Z-box
            l = r = i;
            steps.push(getSnapshot(
                'box-range', l, r, i, -1,
                `🔍 Index ${i} is outside current Z-box (R=${r}). Starting new comparisons from index 0.`
            ));

            while (r < n && concat[r - l] === concat[r]) {
                steps.push(getSnapshot(
                    'compare', l, r, i, r - l,
                    `✅ Match! "${concat[r - l]}" at index ${r - l} matches "${concat[r]}" at index ${r}.`
                ));
                r++;
            }
            z[i] = r - l;
            r--;

            steps.push(getSnapshot(
                'mismatch', l, r, i, r - l + 1 < n ? r - l + 1 : -1,
                `❌ Mismatch or End: Z[${i}] = ${z[i]}. ${z[i] > 0 ? `New Z-box: [L=${l}, R=${r}].` : 'No match found.'}`
            ));

        } else {
            // Case 2: Inside a Z-box
            const i1 = i - l; // Index in prefix
            steps.push(getSnapshot(
                'inside-box', l, r, i, i1,
                `📦 Index ${i} is inside Z-box [L=${l}, R=${r}]. Corresponding prefix index is ${i1}.`
            ));

            if (z[i1] < r - i + 1) {
                // Case 2a: Z[i1] stays within bounds
                z[i] = z[i1];
                steps.push(getSnapshot(
                    'copy-existing', l, r, i, i1,
                    `📋 Z[${i1}] (${z[i1]}) is less than remaining box length (${r - i + 1}). Copying Z[${i}] = Z[${i1}].`
                ));
            } else {
                // Case 2b: Z[i1] hits or exceeds bounds, need more comparisons
                l = i;
                steps.push(getSnapshot(
                    'box-extension', l, r, i, r - l,
                    `🚀 Z[${i1}] hits or exceeds Z-box boundary. Starting more comparisons from R=${r + 1}.`
                ));

                r++;
                while (r < n && concat[r - l] === concat[r]) {
                    steps.push(getSnapshot(
                        'compare', l, r, i, r - l,
                        `✅ Match! "${concat[r - l]}" at index ${r - l} matches "${concat[r]}" at index ${r}.`
                    ));
                    r++;
                }
                z[i] = r - l;
                r--;

                steps.push(getSnapshot(
                    'mismatch', l, r, i, r - l + 1 < n ? r - l + 1 : -1,
                    `❌ Mismatch or End: Z[${i}] = ${z[i]}. Updated Z-box: [L=${l}, R=${r}].`
                ));
            }
        }

        // Finalize Z value for this index
        if (z[i] === pattern.length) {
            steps.push(getSnapshot(
                'found', l, r, i, -1,
                `🎯 Match! Z[${i}] = ${z[i]}, which equals the pattern length. Pattern found starting at text index ${i - pattern.length - 1}.`
            ));
        }
    }

    const found = [];
    z.forEach((v, i) => { if (v === pattern.length) found.push(i - pattern.length - 1); });

    steps.push({
        ...getSnapshot('completed', l, r, -1, -1,
            `✨ Z-Algorithm complete! Pattern "${pattern}" found ${found.length} time(s).`),
        foundIndices: found
    });

    return steps;
};
