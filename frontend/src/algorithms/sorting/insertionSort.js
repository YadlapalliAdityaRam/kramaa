export const generateInsertionSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    // Initially, the first element is considered sorted
    const sortedIndices = [0];

    const shouldShift = (val, key) => ascending ? val > key : val < key;

    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;

        steps.push({
            type: 'compare',
            indices: [i],
            sortedIndices: [...sortedIndices],
            description: `Selected element ${key} at index ${i} to insert into the sorted portion.`,
            arraySnapshot: [...arr]
        });

        while (j >= 0 && shouldShift(arr[j], key)) {
            steps.push({
                type: 'compare',
                indices: [j, j + 1],
                sortedIndices: [...sortedIndices],
                description: `${arr[j]} is ${ascending ? 'greater' : 'smaller'} than ${key}, shifting ${arr[j]} to the right.`,
                arraySnapshot: [...arr]
            });

            arr[j + 1] = arr[j];

            steps.push({
                type: 'swap', // Visualizing shift as swap/overwrite
                indices: [j, j + 1],
                sortedIndices: [...sortedIndices],
                description: `Moved ${arr[j]} to index ${j + 1}.`,
                arraySnapshot: [...arr]
            });

            j = j - 1;
        }

        arr[j + 1] = key;
        sortedIndices.push(i); // This simplistic tracking works because 0..i are sorted after this loop

        steps.push({
            type: 'swap',
            indices: [j + 1],
            sortedIndices: Array.from({ length: i + 1 }, (_, k) => k), // 0 to i are sorted
            description: `Inserted ${key} at index ${j + 1}.`,
            arraySnapshot: [...arr]
        });
    }

    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: Array.from({ length: n }, (_, k) => k),
        description: 'Array is fully sorted.',
        arraySnapshot: [...arr]
    });

    return steps;
};
