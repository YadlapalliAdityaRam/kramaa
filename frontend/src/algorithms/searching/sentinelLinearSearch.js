// Sentinel Linear Search
// Educational: highlights the appending of the target to the array end to skip boundary checks

export const generateSentinelLinearSearchSteps = (inputArray, target) => {
    const steps = [];
    const arr = [...(inputArray || [4, 8, 15, 16, 23, 42])];
    const n = arr.length;
    const lastElement = arr[n - 1];

    steps.push({
        type: 'info',
        description: `📚 Sentinel Linear Search: Normal linear search checks if 'i < length' every step. Sentinel search temporarily places the target variable at the very end of the array to skip that boundary check.`,
        arraySnapshot: [...arr],
        target: target,
        currentIndex: null,
        sentinelIndex: null,
        foundIndex: null
    });

    // Step 1: Assign Sentinel
    const modifiedArr = [...arr];
    modifiedArr[n - 1] = target;

    steps.push({
        type: 'sentinel-placed',
        description: `🛡️ Optimization: We temporarily replace the last element (which was ${lastElement}) with our target ${target}. This guarantees the loop will find the target eventually.`,
        arraySnapshot: [...modifiedArr],
        target: target,
        currentIndex: null,
        sentinelIndex: n - 1,
        foundIndex: null
    });

    let i = 0;

    // Step 2 & 3: Scan without boundary condition
    while (modifiedArr[i] !== target) {
        steps.push({
            type: 'scan',
            description: `🔍 Fast scanning: array[${i}] is ${modifiedArr[i]}. Not target, keep going.`,
            arraySnapshot: [...modifiedArr],
            target: target,
            currentIndex: i,
            sentinelIndex: n - 1,
            foundIndex: null
        });
        i++;
    }

    steps.push({
        type: 'loop-stopped',
        description: `🛑 Loop stopped at index ${i}. Value is ${target}. Now we must check if this is the actual target or just our injected sentinel.`,
        arraySnapshot: [...modifiedArr],
        target: target,
        currentIndex: i,
        sentinelIndex: n - 1,
        foundIndex: null
    });

    // Step 4: Verification
    modifiedArr[n - 1] = lastElement;

    if (i < n - 1 || modifiedArr[n - 1] === target) {
        steps.push({
            type: 'found',
            description: `🎯 The loop stopped before the sentinel (or the actual last element matched). Target ${target} found at index ${i}!`,
            arraySnapshot: [...modifiedArr], // Restore original
            target: target,
            currentIndex: i,
            sentinelIndex: null,
            foundIndex: i
        });
    } else {
        steps.push({
            type: 'not-found',
            description: `🚫 The loop hit the sentinel at index ${n - 1}. Original element restored. Target ${target} does not exist in the array.`,
            arraySnapshot: [...modifiedArr], // Restore original
            target: target,
            currentIndex: i,
            sentinelIndex: null,
            foundIndex: null
        });
    }

    return steps;
};
