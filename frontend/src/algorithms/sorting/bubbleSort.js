export const generateBubbleSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    // Keep track of indices that are known to be sorted
    const sortedIndices = [];

    const compare = (a, b) => ascending ? a > b : a < b;
    const compareSymbol = ascending ? '>' : '<';
    const sortParams = ascending ? 'ascending' : 'descending';

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            // Comparison Step
            steps.push({
                type: 'compare',
                indices: [j, j + 1],
                sortedIndices: [...sortedIndices],
                description: `Comparing ${arr[j]} and ${arr[j + 1]}. ${arr[j]} ${compare(arr[j], arr[j + 1]) ? compareSymbol : (ascending ? '<=' : '>=')} ${arr[j + 1]}?`,
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
                    description: `Swapping to correct order (${sortParams}).`,
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
            description: `Element ${arr[sortedIdx]} is now in its correct sorted position.`,
            arraySnapshot: [...arr]
        });

        // Optimization: If no swaps occurred, the array is sorted
        if (!swapped) {
            // Mark all remaining elements as sorted
            for (let k = 0; k < sortedIdx; k++) {
                if (!sortedIndices.includes(k)) sortedIndices.push(k);
            }
            steps.push({
                type: 'completed',
                indices: [],
                sortedIndices: [...sortedIndices],
                description: 'No swaps needed in this pass. Array is fully sorted!',
                arraySnapshot: [...arr]
            });
            return steps;
        }
    }

    // Ensure the first element (index 0) is marked sorted at the end if not already
    if (!sortedIndices.includes(0)) sortedIndices.push(0);

    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: [...sortedIndices],
        description: 'Array is fully sorted.',
        arraySnapshot: [...arr]
    });

    return steps;
};
