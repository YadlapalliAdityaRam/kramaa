export const generateCoinChangeWaysSteps = (coins, amount) => {
    const steps = [];
    const n = coins.length;

    // dp[i][j] will store the number of ways to make amount j using the first i coins
    const dp = Array(n + 1).fill(0).map(() => Array(amount + 1).fill(0));

    // Base Case: 1 way to make amount 0 (use 0 coins)
    for (let i = 0; i <= n; i++) {
        dp[i][0] = 1;
    }

    steps.push({
        type: 'init',
        dp: JSON.parse(JSON.stringify(dp)),
        activeRow: -1,
        activeCol: -1,
        description: 'Initialize a 2D table where dp[i][j] represents the number of ways to make amount j using the first i coins. Base case: 1 way to make amount 0.'
    });

    for (let i = 1; i <= n; i++) {
        const coin = coins[i - 1];

        for (let j = 1; j <= amount; j++) {
            // Highlight checking dependencies
            const dependencies = [];
            // We always depend on the row above (excluding this coin)
            dependencies.push({ r: i - 1, c: j, label: 'exclude' });

            let includeWays = 0;
            // If the coin can be part of the sum
            if (coin <= j) {
                dependencies.push({ r: i, c: j - coin, label: 'include' });
                includeWays = dp[i][j - coin];
            }

            const excludeWays = dp[i - 1][j];

            steps.push({
                type: 'checking',
                dp: JSON.parse(JSON.stringify(dp)),
                activeRow: i,
                activeCol: j,
                coin,
                currentAmount: j,
                dependencies,
                excludeWays,
                includeWays,
                description: `Checking ways to make amount ${j} using coin ${coin}.`
            });

            // Calculate current cell
            dp[i][j] = excludeWays + includeWays;

            steps.push({
                type: 'updated',
                dp: JSON.parse(JSON.stringify(dp)),
                activeRow: i,
                activeCol: j,
                coin,
                currentAmount: j,
                dependencies,
                excludeWays,
                includeWays,
                cellValue: dp[i][j],
                description: `Ways to make ${j}: (excluding ${coin}) ${excludeWays} + (including ${coin}) ${includeWays} = ${dp[i][j]} ways.`
            });
        }
    }

    steps.push({
        type: 'complete',
        dp: JSON.parse(JSON.stringify(dp)),
        activeRow: -1,
        activeCol: -1,
        result: dp[n][amount],
        description: `Complete! There are ${dp[n][amount]} ways to make amount ${amount}.`
    });

    return steps;
};
