export const generateShellSortSteps = (inputArray) => {
    const arr = [...(inputArray && inputArray.length > 0 ? inputArray : [23, 12, 1, 8, 34, 54, 2, 3])];
    const steps = [];
    let n = arr.length;

    steps.push({
        type: 'info',
        description: `📚 Shell Sort: Sorts elements far apart first, then gradually shrinks the gap until gap = 1 (Insertion Sort).`,
        arraySnapshot: [...arr],
        gap: n,
        comparingIndices: [],
        swapIndices: [],
        currentGroup: []
    });

    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        steps.push({
            type: 'gap-change',
            description: `📉 New Pass: Setting gap to ${gap}. Comparing elements ${gap} positions apart.`,
            arraySnapshot: [...arr],
            gap: gap,
            comparingIndices: [],
            swapIndices: [],
            currentGroup: []
        });

        for (let i = gap; i < n; i++) {
            let temp = arr[i];
            let j;

            // Build the current group for visualization highlighting
            let group = [];
            for (let k = i % gap; k <= i; k += gap) {
                group.push(k);
            }

            steps.push({
                type: 'compare',
                description: `🔍 Looking at index ${i} (value ${temp}). Comparing with previous elements in its gap group.`,
                arraySnapshot: [...arr],
                gap: gap,
                comparingIndices: [i, i - gap],
                swapIndices: [],
                currentGroup: group
            });

            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                steps.push({
                    type: 'swap',
                    description: `🔄 ${arr[j - gap]} is greater than ${temp}. Shifting ${arr[j - gap]} to the right by ${gap}.`,
                    arraySnapshot: [...arr],
                    gap: gap,
                    comparingIndices: [],
                    swapIndices: [j, j - gap],
                    currentGroup: group
                });
                arr[j] = arr[j - gap];
            }

            if (j !== i) {
                steps.push({
                    type: 'placed',
                    description: `✅ Inserted ${temp} into its correct position within this gap group.`,
                    arraySnapshot: [...arr],
                    gap: gap,
                    comparingIndices: [],
                    swapIndices: [j],
                    currentGroup: group
                });
            }

            arr[j] = temp;
        }
    }

    steps.push({
        type: 'completed',
        description: `🎯 Shell Sort complete! The gap reached 1 and the array is now fully sorted.`,
        arraySnapshot: [...arr],
        gap: 0,
        comparingIndices: [],
        swapIndices: [],
        currentGroup: []
    });

    return steps;
};
