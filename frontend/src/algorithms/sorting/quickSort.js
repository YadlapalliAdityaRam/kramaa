const partition = (arr, low, high, steps, ascending) => {
    const pivot = arr[high];
    let i = low - 1;

    steps.push({
        type: 'select-pivot',
        pivotIndex: high,
        indices: [high],
        range: { low, high },
        description: `Partitioning range [${low}, ${high}]. Selected pivot element ${pivot} at index ${high}.`,
        arraySnapshot: [...arr]
    });

    const shouldSwap = (val, pivotVal) => ascending ? val < pivotVal : val > pivotVal;

    for (let j = low; j < high; j++) {
        steps.push({
            type: 'compare',
            indices: [j, high],
            pivotIndex: high,
            pointers: { i: i === low - 1 ? null : i, j },
            range: { low, high },
            description: `Comparing element ${arr[j]} with pivot ${pivot}.`,
            arraySnapshot: [...arr]
        });

        if (shouldSwap(arr[j], pivot)) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];

            steps.push({
                type: 'swap',
                indices: [i, j],
                pivotIndex: high,
                pointers: { i, j },
                range: { low, high },
                description: `${arr[i]} is ${ascending ? 'less' : 'greater'} than pivot, moving it to the left side (index ${i}).`,
                arraySnapshot: [...arr]
            });
        }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];

    steps.push({
        type: 'place-pivot',
        indices: [i + 1, high],
        pivotIndex: i + 1,
        range: { low, high },
        description: `Placing pivot ${pivot} in its correct sorted position at index ${i + 1}.`,
        arraySnapshot: [...arr]
    });

    steps.push({
        type: 'sorted',
        indices: [i + 1],
        description: `Pivot ${pivot} is now at its final sorted position.`,
        arraySnapshot: [...arr]
    });

    return i + 1;
};

const quickSortHelper = (arr, low, high, steps, ascending) => {
    if (low < high) {
        const pi = partition(arr, low, high, steps, ascending);
        quickSortHelper(arr, low, pi - 1, steps, ascending);
        quickSortHelper(arr, pi + 1, high, steps, ascending);
    } else if (low === high) {
        steps.push({
            type: 'sorted',
            indices: [low],
            description: `Single element at index ${low} is trivially sorted.`,
            arraySnapshot: [...arr]
        });
    }
};

export const generateQuickSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];

    if (arr.length === 0) return [];

    quickSortHelper(arr, 0, arr.length - 1, steps, ascending);

    steps.push({
        type: 'completed',
        indices: [],
        description: 'Quick Sort algorithm complete. Array is fully sorted.',
        arraySnapshot: [...arr]
    });

    return steps;
};
