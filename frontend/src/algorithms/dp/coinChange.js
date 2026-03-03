export const generateCoinChangeSteps = (coins, amount) => {
    const steps = [];
    const c = coins || [1, 3, 4];
    const amt = amount || 6;

    const dp = Array(amt + 1).fill(Infinity);
    dp[0] = 0;
    const cellStates = {};

    const colLabels = Array.from({ length: amt + 1 }, (_, i) => `${i}`);
    const rowLabels = ['Min coins'];

    const toTable = () => [dp.map(v => v === Infinity ? '∞' : v)];

    steps.push({
        type: 'dp',
        description: `Coin Change: coins = [${c.join(', ')}], amount = ${amt}. Find minimum coins needed.`,
        table: toTable(),
        cellStates: { ...cellStates },
        rowLabels,
        colLabels
    });

    for (let i = 1; i <= amt; i++) {
        cellStates[`0-${i}`] = 'computing';

        for (const coin of c) {
            if (coin <= i && dp[i - coin] + 1 < dp[i]) {
                dp[i] = dp[i - coin] + 1;

                steps.push({
                    type: 'dp',
                    description: `Amount ${i}: Using coin ${coin}, dp[${i}] = dp[${i - coin}] + 1 = ${dp[i]}.`,
                    table: toTable(),
                    cellStates: { ...cellStates },
                    rowLabels,
                    colLabels
                });
            }
        }

        cellStates[`0-${i}`] = dp[i] === Infinity ? 'empty' : 'filled';

        steps.push({
            type: 'dp',
            description: `dp[${i}] = ${dp[i] === Infinity ? '∞ (not possible)' : dp[i]}.`,
            table: toTable(),
            cellStates: { ...cellStates },
            rowLabels,
            colLabels
        });
    }

    // Traceback
    const highlightCells = [];
    let remaining = amt;
    const usedCoins = [];
    while (remaining > 0 && dp[remaining] !== Infinity) {
        for (const coin of c) {
            if (coin <= remaining && dp[remaining] === dp[remaining - coin] + 1) {
                usedCoins.push(coin);
                highlightCells.push([0, remaining]);
                cellStates[`0-${remaining}`] = 'optimal-path';
                remaining -= coin;
                break;
            }
        }
    }

    steps.push({
        type: 'dp-complete',
        description: `Coin Change complete! Minimum coins for ${amt} = ${dp[amt] === Infinity ? 'impossible' : dp[amt]}${usedCoins.length ? '. Coins: [' + usedCoins.join(', ') + ']' : ''}.`,
        table: toTable(),
        cellStates: { ...cellStates },
        rowLabels,
        colLabels,
        highlightCells
    });

    return steps;
};
