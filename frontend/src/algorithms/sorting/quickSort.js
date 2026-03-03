const partition = (arr, low, high, steps, ascending) => {
    const pivot = arr[high];
    let i = low - 1;

    steps.push({
        type: 'compare',
        indices: [high],
        description: `Selected pivot element ${pivot} at index ${high}.`,
        arraySnapshot: [...arr]
    });

    const shouldSwap = (val, pivotVal) => ascending ? val < pivotVal : val > pivotVal;

    for (let j = low; j < high; j++) {
        steps.push({
            type: 'compare',
            indices: [j, high],
            description: `Comparing element ${arr[j]} with pivot ${pivot}.`,
            arraySnapshot: [...arr]
        });

        if (shouldSwap(arr[j], pivot)) {
            i++;
            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;

            steps.push({
                type: 'swap',
                indices: [i, j],
                description: `${arr[i]} is on the wrong side of pivot, swapping.`,
                arraySnapshot: [...arr]
            });
        }
    }

    let temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;

    steps.push({
        type: 'swap',
        indices: [i + 1, high],
        description: `Placing pivot ${pivot} in its correct sorted position at index ${i + 1}.`,
        arraySnapshot: [...arr]
    });

    steps.push({
        type: 'sorted',
        indices: [i + 1],
        description: `Pivot ${pivot} is now sorted.`,
        arraySnapshot: [...arr]
    });

    return i + 1;
};

const quickSortHelper = (arr, low, high, steps, ascending) => {
    if (low < high) {
        const pi = partition(arr, low, high, steps, ascending);
        quickSortHelper(arr, low, pi - 1, steps, ascending);
        quickSortHelper(arr, pi + 1, high, steps, ascending);
    }
};

export const generateQuickSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    quickSortHelper(arr, 0, arr.length - 1, steps, ascending);

    steps.push({
        type: 'completed',
        indices: [],
        description: 'Array is fully sorted.',
        arraySnapshot: [...arr]
    });

    return steps;
};
