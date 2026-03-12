/**
 * Egg Drop Problem - Strategy & Simulation Logic
 * This version provides both the DP table calculation and a simulation-friendly 
 * strategy for visualization.
 */

export const generateEggDropSteps = (eggsInput, floorsInput) => {
    const eggs = Math.min(Math.max(Number(eggsInput) || 2, 1), 10);
    const floors = Math.min(Math.max(Number(floorsInput) || 10, 1), 30);
    const steps = [];

    // 1. Calculate the DP table for the optimal strategy
    // dp[e][f] = min trials needed for e eggs and f floors
    const dp = Array.from({ length: eggs + 1 }, () => Array(floors + 1).fill(0));
    // choices[e][f] = the best floor to drop from for (e eggs, f floors)
    const choices = Array.from({ length: eggs + 1 }, () => Array(floors + 1).fill(0));

    // Base cases
    for (let i = 1; i <= eggs; i++) {
        dp[i][1] = 1;
        choices[i][1] = 1;
    }
    for (let j = 1; j <= floors; j++) {
        dp[1][j] = j;
        choices[1][j] = 1; // For 1 egg, you always start at floor 1
    }

    for (let i = 2; i <= eggs; i++) {
        for (let j = 2; j <= floors; j++) {
            dp[i][j] = Infinity;
            for (let x = 1; x <= j; x++) {
                const res = 1 + Math.max(dp[i - 1][x - 1], dp[i][j - x]);
                if (res <= dp[i][j]) {
                    dp[i][j] = res;
                    choices[i][j] = x;
                }
            }
        }
    }

    // 2. Generate steps for the DP Table Construction phase
    steps.push({
        type: 'intro',
        description: `📚 Goal: Find the highest floor an egg can drop from without breaking. 
        With ${eggs} eggs and ${floors} floors, we use Dynamic Programming to find the optimal strategy.`,
        dpTable: dp.map(row => [...row]),
        eggs,
        floors,
        config: { eggs, floors }
    });

    // We'll skip detailed DP cell-by-cell steps to focus on the Simulation/Strategy
    // but we provide the full table for the "advanced" view.

    // 3. Generate a "Strategy Trace" (Simulation)
    // This simulates the optimal path to find the critical floor K.
    // For visualization, we'll assume the critical floor is somewhere interesting, 
    // or just show the "Decision Tree" branches.

    const simulateStrategy = (e, low, high, dropCount) => {
        if (low > high || e === 0) return;

        const currentFloors = high - low + 1;
        const bestRelativeFloor = choices[e][currentFloors];
        const actualFloor = low + bestRelativeFloor - 1;

        const description = `🥚 Step ${dropCount}: Drops = ${dropCount}, Remaining Eggs = ${e}. 
        Current range: Floors ${low}–${high}.
        Optimal choice: Drop from floor ${actualFloor}.`;

        // We push a 'decision' step
        steps.push({
            type: 'decision',
            description,
            low,
            high,
            currentFloor: actualFloor,
            eggsLeft: e,
            totalDrops: dropCount,
            outcome: null, // To be decided by user or auto-sim
            dpTable: dp.map(row => [...row])
        });

        // The visualizer will handle "Broken" or "Survived" branches based on user interaction
        // or we can generate a default "Worst Case Path" trace.
    };

    // For the "Auto-Play" animation, we'll just show the logic of a single search path
    // where the egg survives until the very top - 1.
    let currE = eggs;
    let currLow = 1;
    let currHigh = floors;
    let drops = 1;

    while (currLow <= currHigh && currE > 0) {
        const currentFloors = currHigh - currLow + 1;
        const bestRelativeFloor = choices[currE][currentFloors];
        const actualFloor = currLow + bestRelativeFloor - 1;

        steps.push({
            type: 'drop',
            description: `🧪 Attempt ${drops}: Dropping egg from floor ${actualFloor}. Range: [${currLow}, ${currHigh}].`,
            low: currLow,
            high: currHigh,
            currentFloor: actualFloor,
            eggsLeft: currE,
            totalDrops: drops,
            outcome: 'pending'
        });

        // Simulating survival for a few steps, then a break for education
        if (drops === 1 && currHigh - currLow > 5) {
            steps.push({
                type: 'result',
                description: `✅ Egg survived! We now know the critical floor is ABOVE ${actualFloor}.`,
                low: actualFloor + 1,
                high: currHigh,
                currentFloor: actualFloor,
                eggsLeft: currE,
                totalDrops: drops,
                outcome: 'survived'
            });
            currLow = actualFloor + 1;
        } else {
            steps.push({
                type: 'result',
                description: `🍳 Egg broken! We now know the critical floor is BELOW ${actualFloor}.`,
                low: currLow,
                high: actualFloor - 1,
                currentFloor: actualFloor,
                eggsLeft: currE - 1,
                totalDrops: drops,
                outcome: 'broken'
            });
            currHigh = actualFloor - 1;
            currE--;
        }
        drops++;
    }

    steps.push({
        type: 'final',
        description: `🎯 Strategy Complete! We found the highest safe floor using the optimal path. 
        Worst-case trials required: ${dp[eggs][floors]}.`,
        dpTable: dp.map(row => [...row]),
        config: { eggs, floors }
    });

    return steps;
};
