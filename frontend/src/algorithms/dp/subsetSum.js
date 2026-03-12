export const generateSubsetSumSteps = (arr, targetSum) => {
    const steps = [];
    const n = arr.length;

    // dp[i][j] will be true if sum j is possible with first i elements
    const dp = Array(n + 1).fill(false).map(() => Array(targetSum + 1).fill(false));
    const cellStates = {};
    const rowLabels = ['∅', ...arr.map((val, i) => `[${i}] val:${val}`)];
    const colLabels = Array.from({ length: targetSum + 1 }, (_, i) => `${i}`);

    // Base Case 1: Sum 0 is always possible (empty subset)
    for (let i = 0; i <= n; i++) {
        dp[i][0] = true;
        cellStates[`${i}-0`] = 'filled';
    }

    const getSnapshot = (type, desc, activeRow = -1, activeCol = -1) => ({
        type,
        description: desc,
        table: dp.map(r => r.map(c => c ? 'T' : 'F')),
        cellStates: { ...cellStates },
        rowLabels,
        colLabels,
        activeRow,
        activeCol
    });

    steps.push(getSnapshot(
        'init',
        'Initialize a boolean 2D table. Base Case: Target sum of 0 is always possible with an empty subset.'
    ));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= targetSum; j++) {
            const key = `${i}-${j}`;
            cellStates[key] = 'computing';

            const item = arr[i - 1];
            const excludePossible = dp[i - 1][j];
            let includePossible = false;

            if (item <= j) {
                includePossible = dp[i - 1][j - item];
            }

            steps.push(getSnapshot(
                'checking',
                `Checking if sum ${j} is possible using item ${item}. (Exclude: ${excludePossible}, Include: ${includePossible})`,
                i, j
            ));

            dp[i][j] = excludePossible || includePossible;
            cellStates[key] = dp[i][j] ? 'filled' : 'filled';

            steps.push(getSnapshot(
                'updated',
                `dp[${i}][${j}] = ${dp[i][j] ? 'True' : 'False'}.`,
                i, j
            ));
        }
    }

    // Traceback
    const highlightCells = [];
    const subsetPath = [];
    const chosenItems = [];
    let r = n;
    let c = targetSum;

    if (dp[n][targetSum]) {
        steps.push(getSnapshot('traceback_start', 'A valid subset exists! Tracing back...'));

        while (r > 0 && c > 0) {
            subsetPath.push({ r, c });
            const key = `${r}-${c}`;
            highlightCells.push([r, c]);
            cellStates[key] = 'optimal-path';

            if (dp[r - 1][c]) {
                steps.push({
                    ...getSnapshot('traceback_step', `Sum ${c} is possible without item ${arr[r - 1]}. Moving up.`, r, c),
                    highlightCells: [...highlightCells],
                    subsetPath: [...subsetPath],
                    chosenItems: [...chosenItems]
                });
                r--;
            } else {
                chosenItems.push({ index: r - 1, val: arr[r - 1] });
                const prevC = c;
                c -= arr[r - 1];
                steps.push({
                    ...getSnapshot('traceback_step', `Must include item ${arr[r - 1]}. New target: ${prevC} - ${arr[r - 1]} = ${c}.`, r, c),
                    highlightCells: [...highlightCells],
                    subsetPath: [...subsetPath],
                    chosenItems: [...chosenItems]
                });
                r--;
            }
        }
    }

    steps.push({
        ...getSnapshot('complete', dp[n][targetSum] ? `Found subset summing to ${targetSum}: [${chosenItems.map(x => x.val).join(', ')}]` : `No subset sums to ${targetSum}.`),
        highlightCells: [...highlightCells],
        subsetPath: [...subsetPath],
        chosenItems: [...chosenItems]
    });

    return steps;
};

