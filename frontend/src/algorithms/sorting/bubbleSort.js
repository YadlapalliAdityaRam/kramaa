export const generateBubbleSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    const compare = (a, b) => ascending ? a > b : a < b;
    const compareSymbol = ascending ? '>' : '<';
    const sortParams = ascending ? 'ascending' : 'descending';

    steps.push({
        type: 'info',
        description: `📚 Bubble Sort: Each pass compares adjacent elements and swaps them if they are in the wrong order. The largest elements "bubble up" to the end.`,
        arraySnapshot: [...arr],
        indices: [],
        sortedIndices: [...sortedIndices]
    });

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        
        steps.push({
            type: 'pass-start',
            description: `🔄 Starting Pass ${i + 1}. We will compare up to index ${n - 1 - i}.`,
            arraySnapshot: [...arr],
            indices: [],
            sortedIndices: [...sortedIndices]
        });

        for (let j = 0; j < n - i - 1; j++) {
            // Comparison Step
            steps.push({
                type: 'compare',
                indices: [j, j + 1],
                sortedIndices: [...sortedIndices],
                description: `🔍 Comparing ${arr[j]} and ${arr[j + 1]}. Is ${arr[j]} ${compareSymbol} ${arr[j + 1]}?`,
                arraySnapshot: [...arr]
            });

            if (compare(arr[j], arr[j + 1])) {
                // Swap Step
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;

                steps.push({
                    type: 'swap',
                    indices: [j, j + 1],
                    sortedIndices: [...sortedIndices],
                    description: `🔄 Yes, they are out of order. Swapping ${arr[j + 1]} and ${arr[j]}.`,
                    arraySnapshot: [...arr]
                });
            } else {
                steps.push({
                    type: 'no-swap',
                    indices: [j, j + 1],
                    sortedIndices: [...sortedIndices],
                    description: `✅ No, they are in the correct order. Moving forward.`,
                    arraySnapshot: [...arr]
                });
            }
        }

        // Mark last processed element as sorted
        const sortedIdx = n - 1 - i;
        if (!sortedIndices.includes(sortedIdx)) {
            sortedIndices.push(sortedIdx);
        }

        steps.push({
            type: 'sorted',
            indices: [sortedIdx],
            sortedIndices: [...sortedIndices],
            description: `🔒 Pass complete. Element ${arr[sortedIdx]} has bubbled to its final sorted position.`,
            arraySnapshot: [...arr]
        });

        // Optimization: If no swaps occurred, the array is sorted
        if (!swapped) {
            for (let k = 0; k < sortedIdx; k++) {
                if (!sortedIndices.includes(k)) sortedIndices.push(k);
            }
            steps.push({
                type: 'completed',
                indices: [],
                sortedIndices: [...sortedIndices],
                description: `✨ No swaps occurred in the last pass. The array is fully sorted early!`,
                arraySnapshot: [...arr]
            });
            return steps;
        }
    }

    if (!sortedIndices.includes(0)) sortedIndices.push(0);

    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: [...sortedIndices],
        description: `🎉 Array is fully sorted.`,
        arraySnapshot: [...arr]
    });

    return steps;
};
