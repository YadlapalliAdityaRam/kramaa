export const generateHeapSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    const compare = (a, b) => ascending ? a < b : a > b;

    const heapify = (size, rootIdx) => {
        let largest = rootIdx;
        const left = 2 * rootIdx + 1;
        const right = 2 * rootIdx + 2;

        if (left < size) {
            steps.push({
                type: 'compare',
                indices: [largest, left],
                sortedIndices: [...sortedIndices],
                description: `Comparing parent ${arr[largest]} (idx ${largest}) with left child ${arr[left]} (idx ${left}).`,
                arraySnapshot: [...arr]
            });

            if (compare(arr[largest], arr[left])) {
                largest = left;
            }
        }

        if (right < size) {
            steps.push({
                type: 'compare',
                indices: [largest, right],
                sortedIndices: [...sortedIndices],
                description: `Comparing ${arr[largest]} (idx ${largest}) with right child ${arr[right]} (idx ${right}).`,
                arraySnapshot: [...arr]
            });

            if (compare(arr[largest], arr[right])) {
                largest = right;
            }
        }

        if (largest !== rootIdx) {
            steps.push({
                type: 'swap',
                indices: [rootIdx, largest],
                sortedIndices: [...sortedIndices],
                description: `Swapping ${arr[rootIdx]} and ${arr[largest]} to maintain heap property.`,
                arraySnapshot: [...arr]
            });

            [arr[rootIdx], arr[largest]] = [arr[largest], arr[rootIdx]];

            steps.push({
                type: 'swap',
                indices: [rootIdx, largest],
                sortedIndices: [...sortedIndices],
                description: `After swap. Now heapifying subtree rooted at index ${largest}.`,
                arraySnapshot: [...arr]
            });

            heapify(size, largest);
        }
    };

    // Phase 1: Build max-heap
    steps.push({
        type: 'info',
        indices: [],
        sortedIndices: [],
        description: `Phase 1: Building a ${ascending ? 'max' : 'min'}-heap from the array.`,
        arraySnapshot: [...arr]
    });

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        steps.push({
            type: 'compare',
            indices: [i],
            sortedIndices: [...sortedIndices],
            description: `Heapifying subtree rooted at index ${i} (value ${arr[i]}).`,
            arraySnapshot: [...arr]
        });
        heapify(n, i);
    }

    steps.push({
        type: 'info',
        indices: [],
        sortedIndices: [...sortedIndices],
        description: `${ascending ? 'Max' : 'Min'}-heap built. Phase 2: Extracting elements one by one.`,
        arraySnapshot: [...arr]
    });

    // Phase 2: Extract elements
    for (let i = n - 1; i > 0; i--) {
        steps.push({
            type: 'swap',
            indices: [0, i],
            sortedIndices: [...sortedIndices],
            description: `Swapping root ${arr[0]} with last unsorted element ${arr[i]}.`,
            arraySnapshot: [...arr]
        });

        [arr[0], arr[i]] = [arr[i], arr[0]];
        sortedIndices.push(i);

        steps.push({
            type: 'sorted',
            indices: [i],
            sortedIndices: [...sortedIndices],
            description: `Element ${arr[i]} is now in its correct sorted position.`,
            arraySnapshot: [...arr]
        });

        heapify(i, 0);
    }

    sortedIndices.push(0);
    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: [...sortedIndices],
        description: 'Array is fully sorted using Heap Sort!',
        arraySnapshot: [...arr]
    });

    return steps;
};
