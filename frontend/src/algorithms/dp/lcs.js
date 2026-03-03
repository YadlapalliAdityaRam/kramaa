export const generateLCSSteps = (str1, str2) => {
    const steps = [];
    const s1 = str1 || 'ABCBDAB';
    const s2 = str2 || 'BDCAB';
    const m = s1.length;
    const n = s2.length;

    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    const cellStates = {};

    const rowLabels = ['∅', ...s1.split('')];
    const colLabels = ['∅', ...s2.split('')];

    steps.push({
        type: 'dp',
        description: `Longest Common Subsequence of "${s1}" and "${s2}". Building ${m + 1} × ${n + 1} table.`,
        table: dp.map(r => [...r]),
        cellStates: { ...cellStates },
        rowLabels,
        colLabels
    });

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const key = `${i}-${j}`;
            cellStates[key] = 'computing';

            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
                cellStates[key] = 'filled';

                steps.push({
                    type: 'dp',
                    description: `'${s1[i - 1]}' == '${s2[j - 1]}' → dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}. Match!`,
                    table: dp.map(r => [...r]),
                    cellStates: { ...cellStates },
                    rowLabels,
                    colLabels
                });
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                cellStates[key] = 'filled';

                steps.push({
                    type: 'dp',
                    description: `'${s1[i - 1]}' ≠ '${s2[j - 1]}' → dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = ${dp[i][j]}.`,
                    table: dp.map(r => [...r]),
                    cellStates: { ...cellStates },
                    rowLabels,
                    colLabels
                });
            }
        }
    }

    // Traceback
    const highlightCells = [];
    let lcs = '';
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (s1[i - 1] === s2[j - 1]) {
            lcs = s1[i - 1] + lcs;
            highlightCells.push([i, j]);
            cellStates[`${i}-${j}`] = 'optimal-path';
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    steps.push({
        type: 'dp-complete',
        description: `LCS complete! Length = ${dp[m][n]}. LCS = "${lcs}".`,
        table: dp.map(r => [...r]),
        cellStates: { ...cellStates },
        rowLabels,
        colLabels,
        highlightCells
    });

    return steps;
};
