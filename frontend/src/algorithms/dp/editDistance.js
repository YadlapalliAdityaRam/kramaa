// Edit Distance (Levenshtein) — 2D table with insert/delete/replace operations

export const generateEditDistanceSteps = (str1Input, str2Input) => {
    const s1 = (typeof str1Input === 'string' && str1Input.length > 0) ? str1Input.slice(0, 8) : 'horse';
    const s2 = (typeof str2Input === 'string' && str2Input.length > 0) ? str2Input.slice(0, 8) : 'ros';
    const steps = [];
    const m = s1.length, n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    const cellStates = {};

    const rowLabels = ['∅', ...s1.split('')];
    const colLabels = ['∅', ...s2.split('')];

    // Base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    steps.push({
        type: 'dp',
        description: `📚 Edit Distance: Minimum operations (insert/delete/replace) to transform "${s1}" → "${s2}". Base cases: row 0 = deletions, col 0 = insertions.`,
        table: dp.map(r => [...r]),
        cellStates: { ...cellStates },
        rowLabels, colLabels
    });

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const key = `${i}-${j}`;
            cellStates[key] = 'computing';

            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
                cellStates[key] = 'filled';
                steps.push({
                    type: 'dp',
                    description: `✅ '${s1[i - 1]}' = '${s2[j - 1]}'. Characters match! dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}. No operation needed.`,
                    table: dp.map(r => [...r]),
                    cellStates: { ...cellStates },
                    rowLabels, colLabels
                });
            } else {
                const ins = dp[i][j - 1] + 1;
                const del = dp[i - 1][j] + 1;
                const rep = dp[i - 1][j - 1] + 1;
                dp[i][j] = Math.min(ins, del, rep);

                const chosen = dp[i][j] === rep ? 'Replace' : dp[i][j] === del ? 'Delete' : 'Insert';
                cellStates[key] = 'filled';
                steps.push({
                    type: 'dp',
                    description: `🔄 '${s1[i - 1]}' ≠ '${s2[j - 1]}'. Insert=${ins}, Delete=${del}, Replace=${rep}. Min = ${dp[i][j]} (${chosen}).`,
                    table: dp.map(r => [...r]),
                    cellStates: { ...cellStates },
                    rowLabels, colLabels
                });
            }
        }
    }

    // Traceback
    let i = m, j = n;
    while (i > 0 || j > 0) {
        cellStates[`${i}-${j}`] = 'optimal-path';
        if (i > 0 && j > 0 && s1[i - 1] === s2[j - 1]) { i--; j--; }
        else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) { i--; j--; }
        else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { i--; }
        else { j--; }
    }
    cellStates['0-0'] = 'optimal-path';

    steps.push({
        type: 'dp-complete',
        description: `🎯 Edit Distance("${s1}", "${s2}") = ${dp[m][n]}. Minimum ${dp[m][n]} operations needed.`,
        table: dp.map(r => [...r]),
        cellStates: { ...cellStates },
        rowLabels, colLabels
    });

    return steps;
};
