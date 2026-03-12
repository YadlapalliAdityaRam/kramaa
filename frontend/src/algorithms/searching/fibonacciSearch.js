/**
 * Fibonacci Search Algorithm
 * 
 * Searches for a target in a sorted array using Fibonacci numbers.
 * Time Complexity: O(log n)
 * Space Complexity: O(1)
 */

export const generateFibonacciSearchSteps = (inputArray, target) => {
    // Ensure array is sorted and values are numeric
    const arr = [...inputArray].sort((a, b) => a - b);
    const n = arr.length;
    const searchTarget = Number(target);

    const steps = [];

    // Helper to get state snapshot
    const getSnapshot = (type, probeIdx, fib, fib1, fib2, offset, low, high, description) => ({
        type,
        probeIdx,
        fib,
        fib1,
        fib2,
        offset,
        low,
        high,
        arraySnapshot: [...arr],
        description
    });

    steps.push(getSnapshot('info', null, null, null, null, -1, 0, n - 1,
        `📚 Fibonacci Search: Searching for ${searchTarget} in a sorted array of size ${n}.`
    ));

    // Initialize Fibonacci numbers
    let fib2 = 0; // (m-2)-th Fibonacci number
    let fib1 = 1; // (m-1)-th Fibonacci number
    let fib = fib2 + fib1; // m-th Fibonacci number

    // fib will store the smallest Fibonacci number greater than or equal to n
    while (fib < n) {
        fib2 = fib1;
        fib1 = fib;
        fib = fib2 + fib1;
    }

    steps.push(getSnapshot('info', null, fib, fib1, fib2, -1, 0, n - 1,
        `🔢 Smallest Fibonacci number >= ${n} is ${fib}. Initializing: fib=${fib}, fib1=${fib1}, fib2=${fib2}.`
    ));

    let offset = -1;
    let low = 0;
    let high = n - 1;

    while (fib > 1) {
        // Check if fib2 is a valid index
        const i = Math.min(offset + fib2, n - 1);

        steps.push(getSnapshot('check', i, fib, fib1, fib2, offset, low, high,
            `🔍 Probing index ${i} (offset ${offset} + fib2 ${fib2}). Value: ${arr[i]}.`
        ));

        if (arr[i] < searchTarget) {
            // Target is greater than arr[i], cut the left portion
            const oldLow = low;
            low = i + 1;
            steps.push(getSnapshot('narrow', i, fib, fib1, fib2, offset, low, high,
                `➡️ ${arr[i]} < ${searchTarget}. The target must be in the right portion. Eliminating indices ${oldLow} to ${i}.`
            ));

            fib = fib1;
            fib1 = fib2;
            fib2 = fib - fib1;
            offset = i;
        } else if (arr[i] > searchTarget) {
            // Target is smaller than arr[i], cut the right portion
            const oldHigh = high;
            high = i - 1;
            steps.push(getSnapshot('narrow', i, fib, fib1, fib2, offset, low, high,
                `⬅️ ${arr[i]} > ${searchTarget}. The target must be in the left portion. Eliminating indices ${i} to ${oldHigh}.`
            ));

            fib = fib2;
            fib1 = fib1 - fib2;
            fib2 = fib - fib1;
        } else {
            // Found the element
            steps.push(getSnapshot('found', i, fib, fib1, fib2, offset, i, i,
                `🎯 Found ${searchTarget} at index ${i}!`
            ));
            return steps;
        }
    }

    // Checking the last element if it exists
    if (fib1 === 1 && offset + 1 < n && arr[offset + 1] === searchTarget) {
        steps.push(getSnapshot('found', offset + 1, fib, fib1, fib2, offset, offset + 1, offset + 1,
            `🎯 Found ${searchTarget} at index ${offset + 1} during final check!`
        ));
        return steps;
    }

    steps.push(getSnapshot('not-found', null, fib, fib1, fib2, offset, low, high,
        `❌ Target ${searchTarget} not found in the array.`
    ));

    return steps;
};
