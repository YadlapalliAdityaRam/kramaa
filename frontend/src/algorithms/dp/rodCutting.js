export const generateRodCuttingSteps = (pricesInput) => {
    // Default prices if empty
    const prices = (pricesInput && pricesInput.length > 0) ? pricesInput : [2, 5, 7, 8];
    const n = prices.length;
    
    // We add a dummy 0 at start for 1-based indexing for prices to match length
    const p = [0, ...prices]; 
    const dp = new Array(n + 1).fill(0);
    const cutChoice = new Array(n + 1).fill(0);
    const steps = [];

    const pushStep = (type, desc, extras = {}) => {
        steps.push({
            type,
            description: desc,
            dpTable: [...dp],
            prices: [...p],
            ...extras
        });
    };

    pushStep('info', `Rod Cutting: Find the maximum profit for a rod of length ${n}.`);

    for (let len = 1; len <= n; len++) {
        pushStep('evaluating-length', `Finding the best way to cut a rod of length ${len}.`, {
            currentLength: len
        });

        let bestProfit = -1;
        let bestCut = -1;

        for (let cut = 1; cut <= len; cut++) {
            const remainder = len - cut;
            const profit = p[cut] + dp[remainder];

            pushStep('evaluating-cut', `Evaluating first cut of length ${cut}. Profit = Price(${cut}) + DP[${remainder}] = ${p[cut]} + ${dp[remainder]} = ${profit}`, {
                currentLength: len,
                cutChoice: cut,
                remainder: remainder,
                evalProfit: profit,
                currentBest: bestProfit !== -1 ? bestProfit : 0
            });

            if (profit > bestProfit) {
                bestProfit = profit;
                bestCut = cut;

                pushStep('new-best-cut', `New best profit for length ${len} is ${bestProfit} (by making a cut of length ${cut}).`, {
                    currentLength: len,
                    cutChoice: cut,
                    remainder: remainder,
                    evalProfit: profit,
                    currentBest: bestProfit
                });
            }
        }
        
        dp[len] = bestProfit;
        cutChoice[len] = bestCut;

        pushStep('length-computed', `Optimal profit for rod length ${len} is ${dp[len]}. Updating DP table.`, {
            currentLength: len,
            bestCut: bestCut
        });
    }

    // Reconstruct optimal cuts
    let remaining = n;
    const optimalCuts = [];
    while (remaining > 0) {
        optimalCuts.push(cutChoice[remaining]);
        remaining -= cutChoice[remaining];
    }

    pushStep('completed', `Maximum profit for rod of length ${n} is ${dp[n]}. Optimal cuts: ${optimalCuts.join(' + ')}`, {
        optimalCuts,
        finalProfit: dp[n]
    });

    return steps;
};
