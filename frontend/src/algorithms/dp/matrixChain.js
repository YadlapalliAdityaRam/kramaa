export const generateMatrixChainSteps = (dimensionsInput) => {
    // Default fallback
    const dims = (dimensionsInput && dimensionsInput.length >= 3) ? dimensionsInput.slice(0, 8) : [10, 30, 5, 60];
    const n = dims.length - 1; // number of matrices
    
    // Matrices meta for visualization
    const matrices = Array.from({ length: n }, (_, i) => ({
        id: `A${i + 1}`,
        rows: dims[i],
        cols: dims[i + 1]
    }));

    const steps = [];
    const dp = Array.from({ length: n }, () => Array(n).fill(0));
    const s = Array.from({ length: n }, () => Array(n).fill(0)); // split tracking
    const cellStates = {};
    
    // Helper to format current parenthesization based on `s` table
    const getParens = (i, j) => {
        if (i === j) return `A${i + 1}`;
        const k = s[i][j];
        if (k === undefined || k === 0 && i !== 0) return `A${i+1}..A${j+1}`; // Not computed yet
        const left = getParens(i, k);
        const right = getParens(k + 1, j);
        return `(${left} × ${right})`;
    };

    const pushStep = (type, desc, extras = {}) => {
        steps.push({
            type,
            description: desc,
            matrices,
            dpTable: dp.map(r => [...r]),
            sTable: s.map(r => [...r]), // splits
            cellStates: { ...cellStates },
            ...extras
        });
    };

    // Initialize
    pushStep('info', `Phase 1: Initializing DP Table. We have ${n} matrices. Cost to multiply a single matrix is 0.`);
    
    for (let i = 0; i < n; i++) {
        dp[i][i] = 0;
        cellStates[`${i}-${i}`] = 'filled';
    }

    pushStep('base-cases', `Base cases filled. DP[i][i] = 0 since a single matrix requires no multiplications.`, {
        completedCells: Array.from({length: n}, (_, i) => [i, i])
    });

    // DP Fill
    for (let len = 2; len <= n; len++) {
        for (let i = 0; i <= n - len; i++) {
            const j = i + len - 1;
            dp[i][j] = Infinity;
            cellStates[`${i}-${j}`] = 'active';

            pushStep('evaluate-chain', `Evaluating chain size ${len} from A${i + 1} to A${j + 1}.`, {
                activeRange: [i, j]
            });

            let bestK = i;
            let minCostFound = Infinity;

            for (let k = i; k < j; k++) {
                const costLeft = dp[i][k];
                const costRight = dp[k + 1][j];
                const comboCost = dims[i] * dims[k + 1] * dims[j + 1];
                const totalCost = costLeft + costRight + comboCost;
                
                pushStep('try-split', `Split after A${k + 1}: Cost(A${i+1}..A${k+1}) + Cost(A${k+2}..A${j+1}) + (Rows(A${i+1}) × Cols(A${k+1}) × Cols(A${j+1})). \n` +
                                      `${costLeft} + ${costRight} + (${dims[i]} × ${dims[k+1]} × ${dims[j+1]}) = ${totalCost}`, {
                    activeRange: [i, j],
                    splitPoint: k,
                    testingCost: totalCost,
                    leftSub: [i, k],
                    rightSub: [k + 1, j]
                });

                if (totalCost < minCostFound) {
                    minCostFound = totalCost;
                    bestK = k;
                    pushStep('new-min', `New minimum cost found: ${minCostFound} by splitting after A${k + 1}.`, {
                        activeRange: [i, j],
                        splitPoint: k,
                        currentMinCost: minCostFound
                    });
                }
            }

            dp[i][j] = minCostFound;
            s[i][j] = bestK;
            cellStates[`${i}-${j}`] = 'filled';

            pushStep('cell-complete', `Optimal split for A${i+1}..A${j+1} is after A${bestK+1}. Minimum Cost = ${minCostFound}.`, {
                activeRange: [i, j],
                optimalSplit: bestK,
                currentOptimalParens: getParens(i, j)
            });
        }
    }

    pushStep('completed', `DP Table complete! The minimum computation cost is ${dp[0][n - 1]}.\nOptimal grouping: ${getParens(0, n - 1)}`, {
        optimalParens: getParens(0, n - 1),
        finalCost: dp[0][n - 1]
    });

    return steps;
};
