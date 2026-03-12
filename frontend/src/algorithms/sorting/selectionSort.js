export const generateSelectionSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];
    
    const extremeLabel = ascending ? 'minimum' : 'maximum';

    steps.push({
        type: 'info',
        description: `📚 Selection Sort: Repeatedly find the ${extremeLabel} element from the unsorted part and put it at the beginning.`,
        arraySnapshot: [...arr],
        sortedIndices: [...sortedIndices],
        sortedBoundary: 0,
        currentMin: null,
        activeScan: null
    });

    for (let i = 0; i < n; i++) {
        let extremeIdx = i;

        steps.push({
            type: 'start-pass',
            description: `Starting pass ${i + 1}. The unsorted section begins at index ${i}. Assuming ${arr[i]} at index ${i} is the ${extremeLabel}.`,
            arraySnapshot: [...arr],
            sortedIndices: [...sortedIndices],
            sortedBoundary: i,
            currentMin: extremeIdx,
            activeScan: null
        });

        for (let j = i + 1; j < n; j++) {
            steps.push({
                type: 'compare',
                description: `Comparing current ${extremeLabel} ${arr[extremeIdx]} with element ${arr[j]} at index ${j}.`,
                arraySnapshot: [...arr],
                sortedIndices: [...sortedIndices],
                sortedBoundary: i,
                currentMin: extremeIdx,
                activeScan: j
            });

            const condition = ascending ? arr[j] < arr[extremeIdx] : arr[j] > arr[extremeIdx];

            if (condition) {
                extremeIdx = j;
                steps.push({
                    type: 'new-min',
                    description: `Found new ${extremeLabel}: ${arr[extremeIdx]} at index ${extremeIdx}. Updating tracking pointer.`,
                    arraySnapshot: [...arr],
                    sortedIndices: [...sortedIndices],
                    sortedBoundary: i,
                    currentMin: extremeIdx,
                    activeScan: j
                });
            }
        }

        if (extremeIdx !== i) {
            steps.push({
                type: 'swap-start',
                description: `Pass complete. Swapping the found ${extremeLabel} ${arr[extremeIdx]} with the first unsorted element ${arr[i]}.`,
                arraySnapshot: [...arr],
                sortedIndices: [...sortedIndices],
                sortedBoundary: i,
                currentMin: extremeIdx,
                activeScan: null,
                swapTargets: [i, extremeIdx]
            });

            let temp = arr[i];
            arr[i] = arr[extremeIdx];
            arr[extremeIdx] = temp;

            steps.push({
                type: 'swap',
                description: `Swapped! ${arr[i]} is now in its correct sorted position.`,
                arraySnapshot: [...arr],
                sortedIndices: [...sortedIndices],
                sortedBoundary: i + 1,
                currentMin: null,
                activeScan: null,
                swapTargets: null
            });
        } else {
            steps.push({
                type: 'sorted',
                description: `${arr[i]} is already the ${extremeLabel} element in the unsorted section. No swap needed.`,
                arraySnapshot: [...arr],
                sortedIndices: [...sortedIndices],
                sortedBoundary: i + 1,
                currentMin: null,
                activeScan: null
            });
        }

        sortedIndices.push(i);
    }

    steps.push({
        type: 'completed',
        description: 'Array is fully sorted.',
        arraySnapshot: [...arr],
        sortedIndices: [...sortedIndices],
        sortedBoundary: n,
        currentMin: null,
        activeScan: null
    });

    return steps;
};
