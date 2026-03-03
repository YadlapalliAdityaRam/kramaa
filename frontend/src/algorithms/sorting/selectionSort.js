export const generateSelectionSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    const shouldUpdate = (current, candidate) => ascending ? candidate < current : candidate > current;
    const extremeLabel = ascending ? 'minimum' : 'maximum';

    for (let i = 0; i < n; i++) {
        let extremeIdx = i;

        // Highlight the current position we are looking to fill
        steps.push({
            type: 'compare',
            indices: [i],
            sortedIndices: [...sortedIndices],
            description: `Looking for the ${extremeLabel} element starting from index ${i}.`,
            arraySnapshot: [...arr]
        });

        for (let j = i + 1; j < n; j++) {
            steps.push({
                type: 'compare',
                indices: [extremeIdx, j],
                sortedIndices: [...sortedIndices],
                description: `Comparing current ${extremeLabel} (${arr[extremeIdx]}) with element at index ${j} (${arr[j]}).`,
                arraySnapshot: [...arr]
            });

            if (shouldUpdate(arr[extremeIdx], arr[j])) {
                extremeIdx = j;
                steps.push({
                    type: 'compare',
                    indices: [extremeIdx],
                    sortedIndices: [...sortedIndices],
                    description: `Found new ${extremeLabel} element ${arr[extremeIdx]} at index ${extremeIdx}.`,
                    arraySnapshot: [...arr]
                });
            }
        }

        if (extremeIdx !== i) {
            let temp = arr[i];
            arr[i] = arr[extremeIdx];
            arr[extremeIdx] = temp;

            steps.push({
                type: 'swap',
                indices: [i, extremeIdx],
                sortedIndices: [...sortedIndices],
                description: `Swapping ${extremeLabel} element ${arr[i]} with element at index ${i}.`,
                arraySnapshot: [...arr]
            });
        }

        sortedIndices.push(i);
        steps.push({
            type: 'sorted',
            indices: [i],
            sortedIndices: [...sortedIndices],
            description: `Element ${arr[i]} is now at its correct sorted position.`,
            arraySnapshot: [...arr]
        });
    }

    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: [...sortedIndices],
        description: 'Array is fully sorted.',
        arraySnapshot: [...arr]
    });

    return steps;
};
