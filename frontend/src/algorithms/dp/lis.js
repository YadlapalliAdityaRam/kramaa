// LIS — Longest Increasing Subsequence
// Educational: shows dp[] array, comparisons, and final subsequence path

export const generateLISSteps = (inputArray) => {
    const arr = inputArray && inputArray.length > 0
        ? [...inputArray]
        : [10, 9, 2, 5, 3, 7, 101, 18];
    const steps = [];
    const n = arr.length;
    const dp = new Array(n).fill(1);
    const parent = new Array(n).fill(-1); // Track predecessors for path reconstruction

    steps.push({
        type: 'info',
        description: `📚 Longest Increasing Subsequence: Find the longest subsequence where each element is strictly greater than the previous one.`,
        arraySnapshot: [...arr],
        dpArray: [...dp],
        currentI: null,
        currentJ: null,
        comparisonResult: null,
        lisIndices: [],
        lisLength: 0
    });

    steps.push({
        type: 'init',
        description: `📊 Array: [${arr.join(', ')}]. Initializing dp[i] = 1 for all indices (each element alone is a subsequence of length 1).`,
        arraySnapshot: [...arr],
        dpArray: [...dp],
        currentI: null,
        currentJ: null,
        comparisonResult: null,
        lisIndices: [],
        lisLength: 0
    });

    for (let i = 1; i < n; i++) {
        steps.push({
            type: 'select-i',
            description: `🔍 Examining element arr[${i}] = ${arr[i]}. Comparing with all previous elements to find extendable subsequences.`,
            arraySnapshot: [...arr],
            dpArray: [...dp],
            currentI: i,
            currentJ: null,
            comparisonResult: null,
            lisIndices: [],
            lisLength: Math.max(...dp)
        });

        for (let j = 0; j < i; j++) {
            if (arr[j] < arr[i]) {
                const newLen = dp[j] + 1;
                const willUpdate = newLen > dp[i];

                steps.push({
                    type: 'compare-valid',
                    description: `✅ arr[${j}]=${arr[j]} < arr[${i}]=${arr[i]}. ${willUpdate ? `Updating dp[${i}] from ${dp[i]} to ${newLen}.` : `dp[${j}]+1=${newLen} ≤ dp[${i}]=${dp[i]}. No update needed.`}`,
                    arraySnapshot: [...arr],
                    dpArray: [...dp],
                    currentI: i,
                    currentJ: j,
                    comparisonResult: willUpdate ? 'update' : 'no-update',
                    lisIndices: [],
                    lisLength: Math.max(...dp)
                });

                if (willUpdate) {
                    dp[i] = newLen;
                    parent[i] = j;
                }
            } else {
                steps.push({
                    type: 'compare-invalid',
                    description: `❌ arr[${j}]=${arr[j]} ≥ arr[${i}]=${arr[i]}. Cannot extend subsequence.`,
                    arraySnapshot: [...arr],
                    dpArray: [...dp],
                    currentI: i,
                    currentJ: j,
                    comparisonResult: 'invalid',
                    lisIndices: [],
                    lisLength: Math.max(...dp)
                });
            }
        }

        steps.push({
            type: 'dp-set',
            description: `📝 dp[${i}] finalized as ${dp[i]}. The longest increasing subsequence ending at index ${i} has length ${dp[i]}.`,
            arraySnapshot: [...arr],
            dpArray: [...dp],
            currentI: i,
            currentJ: null,
            comparisonResult: null,
            lisIndices: [],
            lisLength: Math.max(...dp)
        });
    }

    // Reconstruct the LIS path
    const maxLen = Math.max(...dp);
    let endIdx = dp.indexOf(maxLen);
    const lisIndices = [];
    let k = endIdx;
    while (k !== -1) {
        lisIndices.unshift(k);
        k = parent[k];
    }

    steps.push({
        type: 'completed',
        description: `🎯 LIS length = ${maxLen}. The longest increasing subsequence is: [${lisIndices.map(i => arr[i]).join(' → ')}].`,
        arraySnapshot: [...arr],
        dpArray: [...dp],
        currentI: null,
        currentJ: null,
        comparisonResult: null,
        lisIndices: lisIndices,
        lisLength: maxLen
    });

    return steps;
};
