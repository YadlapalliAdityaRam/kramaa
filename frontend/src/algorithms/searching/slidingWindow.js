/**
 * Sliding Window Technique — Maximum sum of subarray of size k
 * 
 * Step types: init, expand, slide, shrink, complete
 * Each step includes: array snapshot, window boundaries, current / best sums
 */

export const generateSlidingWindowSteps = (inputArray, kValue) => {
    const steps = [];

    // Use defaults if not provided
    const arr = (inputArray && inputArray.length > 0) ? [...inputArray] : [2, 1, 5, 1, 3, 2];
    const k = kValue ?? Math.min(3, arr.length);

    if (k > arr.length || k <= 0) {
        steps.push({
            type: 'info',
            description: `❌ Window size k=${k} is invalid for array of length ${arr.length}.`,
            array: [...arr],
            indices: [],
            sortedIndices: [],
            windowLeft: -1,
            windowRight: -1,
            windowSum: 0,
            bestSum: 0,
            bestLeft: -1,
            bestRight: -1
        });
        return steps;
    }

    const makeStep = (type, desc, wLeft, wRight, windowSum, bestSum, bestL, bestR, indices, sortedIndices) => ({
        type,
        description: desc,
        array: [...arr],
        indices: indices || [],
        sortedIndices: sortedIndices || [],
        windowLeft: wLeft,
        windowRight: wRight,
        windowSum,
        bestSum,
        bestLeft: bestL,
        bestRight: bestR,
        k
    });

    // Intro
    steps.push(makeStep(
        'info',
        `📚 Sliding Window Technique: Find the maximum sum of any subarray of size k=${k}. Array: [${arr.join(', ')}].`,
        -1, -1, 0, -Infinity, -1, -1, [], []
    ));

    steps.push(makeStep(
        'info',
        `📋 Strategy: Build initial window of size ${k}, then slide it right by adding the incoming element and removing the outgoing element. Track the maximum sum.`,
        -1, -1, 0, -Infinity, -1, -1, [], []
    ));

    // Phase 1: Build initial window
    let windowSum = 0;
    for (let i = 0; i < k; i++) {
        windowSum += arr[i];
        const windowIndices = [];
        for (let j = 0; j <= i; j++) windowIndices.push(j);

        steps.push(makeStep(
            'compare',
            `🔧 Building window: Adding arr[${i}]=${arr[i]}. Window sum = ${windowSum}. (${i + 1}/${k} elements)`,
            0, i, windowSum, -Infinity, -1, -1, [i], windowIndices
        ));
    }

    let bestSum = windowSum;
    let bestLeft = 0;
    let bestRight = k - 1;

    const windowIndices = [];
    for (let j = 0; j < k; j++) windowIndices.push(j);

    steps.push(makeStep(
        'swap', // green highlight for initial best
        `✅ Initial window [0..${k - 1}] built. Sum = ${windowSum}. This is our current best!`,
        0, k - 1, windowSum, bestSum, bestLeft, bestRight, [], windowIndices
    ));

    // Phase 2: Slide window
    for (let i = k; i < arr.length; i++) {
        const outgoing = arr[i - k];
        const incoming = arr[i];

        // Show incoming
        steps.push(makeStep(
            'compare',
            `➡️ Sliding window: Remove outgoing arr[${i - k}]=${outgoing}, add incoming arr[${i}]=${incoming}.`,
            i - k, i, windowSum, bestSum, bestLeft, bestRight, [i - k, i], []
        ));

        windowSum = windowSum - outgoing + incoming;
        const wLeft = i - k + 1;
        const wRight = i;

        const currentWindowIndices = [];
        for (let j = wLeft; j <= wRight; j++) currentWindowIndices.push(j);

        if (windowSum > bestSum) {
            bestSum = windowSum;
            bestLeft = wLeft;
            bestRight = wRight;

            steps.push(makeStep(
                'swap', // green highlight for new best
                `⭐ New maximum! Window [${wLeft}..${wRight}] sum = ${windowSum} > previous best. Updated best sum = ${bestSum}!`,
                wLeft, wRight, windowSum, bestSum, bestLeft, bestRight, [], currentWindowIndices
            ));
        } else {
            steps.push(makeStep(
                'compare',
                `📊 Window [${wLeft}..${wRight}] sum = ${windowSum}. Best remains ${bestSum} at [${bestLeft}..${bestRight}].`,
                wLeft, wRight, windowSum, bestSum, bestLeft, bestRight, [], currentWindowIndices
            ));
        }
    }

    // Final
    const bestIndices = [];
    for (let j = bestLeft; j <= bestRight; j++) bestIndices.push(j);

    steps.push(makeStep(
        'info',
        `🎯 Sliding Window complete! Maximum sum = ${bestSum} at subarray [${bestLeft}..${bestRight}] = [${arr.slice(bestLeft, bestRight + 1).join(', ')}]. Time: O(n), Space: O(1).`,
        bestLeft, bestRight, bestSum, bestSum, bestLeft, bestRight, [], bestIndices
    ));

    return steps;
};
