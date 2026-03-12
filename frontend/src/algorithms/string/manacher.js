// Manacher's Algorithm — Longest Palindromic Substring in O(n)
// This version generates rich visualization steps for the dedicated visualizer.

export const generateManacherSteps = (stringInput) => {
    const s = (typeof stringInput === 'string' && stringInput.length) ? stringInput.toLowerCase() : 'babad';

    // Transform: "abc" → "#a#b#c#"
    const t = '#' + s.split('').join('#') + '#';
    const n = t.length;
    const p = new Array(n).fill(0);
    const steps = [];

    const getSnapshot = (type, c, r, i, description = '') => ({
        type,
        s,
        transformed: t.split(''),
        p: [...p],
        center: c,
        right: r,
        current: i,
        mirror: (2 * c - i >= 0) ? (2 * c - i) : -1,
        description
    });

    // Initial state
    steps.push(getSnapshot('init', 0, 0, -1,
        `📚 Manacher's Algorithm: Find the longest palindromic substring in linear time. We transform "${s}" to "${t}" to handle even lengths uniformly.`
    ));

    let c = 0; // Current Center
    let r = 0; // Current Right Boundary

    for (let i = 0; i < n; i++) {
        const mirror = 2 * c - i;

        steps.push(getSnapshot('move', c, r, i,
            `🔍 Processing index ${i} ('${t[i]}'). Current Z-box (palindrome center) at ${c} with range [${2 * c - r}, ${r}].`
        ));

        if (i < r) {
            p[i] = Math.min(r - i, p[mirror]);
            steps.push(getSnapshot('mirror', c, r, i,
                `📦 Index ${i} is inside the current boundary R=${r}. Mirror of ${i} is ${mirror} with P[${mirror}]=${p[mirror]}. Initializing P[${i}] = ${p[i]}.`
            ));
        }

        // Attempt to expand around i
        let expanded = false;
        while (i + p[i] + 1 < n && i - p[i] - 1 >= 0 && t[i + p[i] + 1] === t[i - p[i] - 1]) {
            p[i]++;
            expanded = true;
            steps.push(getSnapshot('expand', c, r, i,
                `🚀 Expanding around ${i}: '${t[i - p[i]]}' matches '${t[i + p[i]]}'. New radius P[${i}] = ${p[i]}.`
            ));
        }

        if (expanded && i + p[i] + 1 < n && i - p[i] - 1 >= 0) {
            steps.push(getSnapshot('mismatch', c, r, i,
                `❌ Characters '${t[i - p[i] - 1]}' and '${t[i + p[i] + 1]}' don't match. Expansion stopped.`
            ));
        }

        // Update boundary
        if (i + p[i] > r) {
            c = i;
            r = i + p[i];
            steps.push(getSnapshot('update', c, r, i,
                `✨ Boundary updated! New center C=${c}, new right R=${r}.`
            ));
        }
    }

    // Find the longest
    const maxR = Math.max(...p);
    const maxI = p.indexOf(maxR);
    const start = Math.floor((maxI - maxR) / 2);
    const longest = s.substring(start, start + maxR);

    steps.push({
        ...getSnapshot('completed', c, r, -1,
            `🎯 Algorithm complete! Longest palindromic substring is "${longest}" (length ${maxR}).`
        ),
        longestInfo: { start, length: maxR, text: longest, centerIdx: maxI }
    });

    return steps;
};
