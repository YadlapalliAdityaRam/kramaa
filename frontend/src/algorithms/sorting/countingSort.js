/**
 * Generates steps for the Counting Sort algorithm.
 * 
 * Step Types:
 * - 'start': Initialization
 * - 'count': Incrementing a bucket in the frequency table
 * - 'prefix-sum-start': Transition to prefix sum calculation
 * - 'prefix-sum': Cumulative addition in the count array
 * - 'output-start': Transition to building the output array
 * - 'output-place': Placing an element into the output array
 * - 'final': Sorting complete
 */
export const generateCountingSortSteps = (arr) => {
    const steps = [];
    if (arr.length === 0) return steps;

    const n = arr.length;
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const range = max - min + 1;

    // Initial State
    const initialCount = Array(range).fill(0);
    const initialOutput = Array(n).fill(null);

    steps.push({
        type: 'start',
        arraySnapshot: [...arr],
        countArray: [...initialCount],
        outputArray: [...initialOutput],
        activeIndices: [],
        countActiveIndex: null,
        outputActiveIndex: null,
        description: `Starting Counting Sort. Range of values is ${min} to ${max}.`,
        stats: { comparisons: 0, swaps: 0, phase: 'Initializing' }
    });

    // 1. Counting Phase
    const counts = Array(range).fill(0);
    for (let i = 0; i < n; i++) {
        const value = arr[i];
        const countIdx = value - min;

        steps.push({
            type: 'count',
            arraySnapshot: [...arr],
            countArray: [...counts],
            outputArray: [...initialOutput],
            activeIndices: [i],
            countActiveIndex: countIdx,
            description: `Element ${value} found. Incrementing Count[${value}].`,
            stats: { comparisons: 0, swaps: 0, phase: 'Counting' }
        });

        counts[countIdx]++;

        steps.push({
            type: 'count',
            arraySnapshot: [...arr],
            countArray: [...counts],
            outputArray: [...initialOutput],
            activeIndices: [i],
            countActiveIndex: countIdx,
            description: `Count[${value}] is now ${counts[countIdx]}.`,
            stats: { comparisons: 0, swaps: 0, phase: 'Counting' }
        });
    }

    // 2. Prefix Sum Phase
    steps.push({
        type: 'prefix-sum-start',
        arraySnapshot: [...arr],
        countArray: [...counts],
        outputArray: [...initialOutput],
        activeIndices: [],
        description: "Transforming count array into position array (Prefix Sum).",
        stats: { comparisons: 0, swaps: 0, phase: 'Prefix Sum' }
    });

    for (let i = 1; i < range; i++) {
        const prevValue = counts[i - 1];
        const currValue = counts[i];

        steps.push({
            type: 'prefix-sum',
            arraySnapshot: [...arr],
            countArray: [...counts],
            outputArray: [...initialOutput],
            activeIndices: [],
            countActiveIndex: i, // Highlight current and previous for addition
            description: `Adding Count[${i - 1 + min}] (${prevValue}) to Count[${i + min}] (${currValue}).`,
            stats: { comparisons: 0, swaps: 0, phase: 'Prefix Sum' }
        });

        counts[i] += counts[i - 1];

        steps.push({
            type: 'prefix-sum',
            arraySnapshot: [...arr],
            countArray: [...counts],
            outputArray: [...initialOutput],
            activeIndices: [],
            countActiveIndex: i,
            description: `Count[${i + min}] is now ${counts[i]}.`,
            stats: { comparisons: 0, swaps: 0, phase: 'Prefix Sum' }
        });
    }

    // 3. Output Building Phase
    steps.push({
        type: 'output-start',
        arraySnapshot: [...arr],
        countArray: [...counts],
        outputArray: [...initialOutput],
        activeIndices: [],
        description: "Building the output array using the position array.",
        stats: { comparisons: 0, swaps: 0, phase: 'Building Output' }
    });

    const output = Array(n).fill(null);
    // Iterate backwards to maintain stability
    for (let i = n - 1; i >= 0; i--) {
        const value = arr[i];
        const countIdx = value - min;
        const targetPos = counts[countIdx] - 1;

        steps.push({
            type: 'output-place',
            arraySnapshot: [...arr],
            countArray: [...counts],
            outputArray: [...output],
            activeIndices: [i],
            countActiveIndex: countIdx,
            outputActiveIndex: targetPos,
            description: `Value ${value} goes to index ${targetPos} in output.`,
            stats: { comparisons: 0, swaps: 0, phase: 'Building Output' }
        });

        output[targetPos] = value;
        counts[countIdx]--;

        steps.push({
            type: 'output-place',
            arraySnapshot: [...arr],
            countArray: [...counts],
            outputArray: [...output],
            activeIndices: [i],
            countActiveIndex: countIdx,
            outputActiveIndex: targetPos,
            description: `Placed ${value} and decremented Count[${value}] to ${counts[countIdx]}.`,
            stats: { comparisons: 0, swaps: 0, phase: 'Building Output' }
        });
    }

    steps.push({
        type: 'final',
        arraySnapshot: [...arr],
        countArray: [...counts],
        outputArray: [...output],
        activeIndices: [],
        countActiveIndex: null,
        outputActiveIndex: null,
        description: "Counting Sort complete!",
        stats: { comparisons: 0, swaps: 0, phase: 'Finished' }
    });

    return steps;
};
