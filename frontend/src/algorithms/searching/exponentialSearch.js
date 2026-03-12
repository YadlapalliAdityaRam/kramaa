/**
 * Exponential Search Algorithm
 * 
 * 1. Find range where element is present
 * 2. Do Binary Search in above found range
 */

export const generateExponentialSearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b);
    const n = arr.length;

    const getSnapshot = (type, phase, indices, low, high, mid, description) => ({
        type,
        phase, // 'exponential' or 'binary'
        indices,
        low,
        high,
        mid,
        description,
        arraySnapshot: [...arr]
    });

    steps.push(getSnapshot('info', 'start', [], null, null, null,
        `📚 Searching for ${target} in a sorted array using Exponential Search. 
        First, we check if the target is at the very beginning.`
    ));

    // Check first element
    if (arr[0] === target) {
        steps.push(getSnapshot('found', 'start', [0], 0, 0, 0,
            `🎯 Found target ${target} at index 0!`
        ));
        return steps;
    }

    steps.push(getSnapshot('compare', 'exponential', [0], 0, 0, null,
        `🔍 arr[0] is ${arr[0]}. Not our target. 
        Now we start doubling our search range (1, 2, 4, 8...) until we go past ${target}.`
    ));

    // Find range by repeated doubling
    let bound = 1;
    let prevBound = 0;

    while (bound < n && arr[bound] <= target) {
        steps.push(getSnapshot('leap', 'exponential', [bound], prevBound, bound, null,
            `🚀 Leap! Checking index ${bound}. 
            arr[${bound}] = ${arr[bound]}, which is ≤ ${target}. 
            Doubling the range to ${bound * 2}.`
        ));
        prevBound = bound;
        bound *= 2;
    }

    // Range identified
    const low = prevBound;
    const high = Math.min(bound, n - 1);

    steps.push(getSnapshot('range-found', 'exponential', [low, high], low, high, null,
        `📍 Range identified! arr[${high}] is ${arr[high] > target ? arr[high] : 'beyond array'}. 
        The target ${target} must be between index ${low} and ${high}. 
        Switching to Binary Search inside this box.`
    ));

    // Binary search in the range
    let lo = low, hi = high;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);

        steps.push(getSnapshot('compare', 'binary', [mid], lo, hi, mid,
            `⚖️ Binary Search: Checking midpoint ${mid} in range [${lo}, ${hi}]. 
            arr[${mid}] = ${arr[mid]}.`
        ));

        if (arr[mid] === target) {
            steps.push(getSnapshot('found', 'binary', [mid], lo, hi, mid,
                `🎯 Found target ${target} at index ${mid}!`
            ));
            return steps;
        }

        if (arr[mid] < target) {
            steps.push(getSnapshot('move', 'binary', [mid], lo, hi, mid,
                `➡️ ${arr[mid]} < ${target}. The target must be in the right half. 
                Moving low to ${mid + 1}.`
            ));
            lo = mid + 1;
        } else {
            steps.push(getSnapshot('move', 'binary', [mid], lo, hi, mid,
                `⬅️ ${arr[mid]} > ${target}. The target must be in the left half. 
                Moving high to ${mid - 1}.`
            ));
            hi = mid - 1;
        }
    }

    steps.push(getSnapshot('not-found', 'binary', [], null, null, null,
        `❌ Target ${target} not found in the array.`
    ));

    return steps;
};
