export const generateKnapsackSteps = (capacity, weights, values) => {
    const steps = [];
    const W = capacity || 7;
    const w = weights || [1, 3, 4, 5];
    const v = values || [1, 4, 5, 7];
    const n = w.length;

    // Create DP table
    const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
    const cellStates = {};

    const rowLabels = ['∅', ...w.map((wt, i) => `w=${wt},v=${v[i]}`)];
    const colLabels = Array.from({ length: W + 1 }, (_, i) => `${i}`);

    steps.push({
        type: 'dp',
        description: `0/1 Knapsack: ${n} items, capacity ${W}. Items: ${w.map((wt, i) => `(w=${wt}, v=${v[i]})`).join(', ')}.`,
        table: dp.map(r => [...r]),
        cellStates: { ...cellStates },
        rowLabels,
        colLabels
    });

    for (let i = 1; i <= n; i++) {
        for (let j = 0; j <= W; j++) {
            const key = `${i}-${j}`;
            cellStates[key] = 'computing';

            if (w[i - 1] <= j) {
                const include = v[i - 1] + dp[i - 1][j - w[i - 1]];
                const exclude = dp[i - 1][j];

                steps.push({
                    type: 'dp',
                    description: `Item ${i} (w=${w[i - 1]}, v=${v[i - 1]}), capacity ${j}: Include = ${v[i - 1]} + dp[${i - 1}][${j - w[i - 1]}] = ${include}, Exclude = ${exclude}.`,
                    table: dp.map(r => [...r]),
                    cellStates: { ...cellStates },
                    rowLabels,
                    colLabels
                });

                dp[i][j] = Math.max(include, exclude);

                cellStates[key] = dp[i][j] === include ? 'filled' : 'filled';
                steps.push({
                    type: 'dp',
                    description: `dp[${i}][${j}] = max(${include}, ${exclude}) = ${dp[i][j]}.${dp[i][j] === include ? ' Item included!' : ' Item excluded.'}`,
                    table: dp.map(r => [...r]),
                    cellStates: { ...cellStates },
                    rowLabels,
                    colLabels
                });
            } else {
                dp[i][j] = dp[i - 1][j];
                cellStates[key] = 'filled';

                steps.push({
                    type: 'dp',
                    description: `Item ${i} (w=${w[i - 1]}) doesn't fit in capacity ${j}. dp[${i}][${j}] = dp[${i - 1}][${j}] = ${dp[i][j]}.`,
                    table: dp.map(r => [...r]),
                    cellStates: { ...cellStates },
                    rowLabels,
                    colLabels
                });
            }
        }
    }

    // Traceback for optimal items
    const highlightCells = [];
    let i = n, j = W;
    const selectedItems = [];
    while (i > 0 && j > 0) {
        if (dp[i][j] !== dp[i - 1][j]) {
            selectedItems.push(i);
            highlightCells.push([i, j]);
            cellStates[`${i}-${j}`] = 'optimal-path';
            j -= w[i - 1];
        }
        i--;
    }

    steps.push({
        type: 'dp-complete',
        description: `Knapsack complete! Maximum value = ${dp[n][W]}. Selected items: ${selectedItems.reverse().map(k => `(w=${w[k - 1]}, v=${v[k - 1]})`).join(', ')}.`,
        table: dp.map(r => [...r]),
        cellStates: { ...cellStates },
        rowLabels,
        colLabels,
        highlightCells
    });

    return steps;
};
