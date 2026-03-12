export const generateInsertionSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    
    // Sort logic based on direction
    const compare = (a, b) => ascending ? a < b : a > b;
    const compareDirection = ascending ? '<' : '>';

    steps.push({
        type: 'info',
        description: `📚 Insertion Sort: Builds the sorted array one element at a time. The first element is assumed to be sorted.`,
        arraySnapshot: [...arr],
        sortedIndices: [0],
        currentIndex: null,
        compareIndex: null,
        shiftIndices: []
    });

    const sortedIndices = [0];

    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        const shiftIndices = [];

        steps.push({
            type: 'select',
            description: `👉 Selecting arr[${i}] = ${key}. We need to insert this into the sorted section on the left.`,
            arraySnapshot: [...arr],
            sortedIndices: [...sortedIndices],
            currentIndex: i,
            compareIndex: null,
            shiftIndices: [...shiftIndices],
            keyValue: key
        });

        while (j >= 0) {
            steps.push({
                type: 'compare',
                description: `🔍 Comparing key ${key} with sorted element arr[${j}] = ${arr[j]}. Is ${key} ${compareDirection} ${arr[j]}?`,
                arraySnapshot: [...arr],
                sortedIndices: [...sortedIndices],
                currentIndex: j + 1, // Where the empty slot currently is conceptually
                compareIndex: j,
                shiftIndices: [...shiftIndices],
                keyValue: key
            });

            if (compare(key, arr[j])) {
                arr[j + 1] = arr[j];
                shiftIndices.push(j + 1);
                
                steps.push({
                    type: 'shift',
                    description: `➡️ Yes, ${key} ${compareDirection} ${arr[j]}. Shifting ${arr[j]} to the right.`,
                    arraySnapshot: [...arr],
                    sortedIndices: [...sortedIndices],
                    currentIndex: j, // Hole moved left
                    compareIndex: null,
                    shiftIndices: [...shiftIndices],
                    keyValue: key
                });
                j--;
            } else {
                steps.push({
                    type: 'no-shift',
                    description: `🛑 No, ${key} is in the correct order relative to ${arr[j]}. Stopping backward scan.`,
                    arraySnapshot: [...arr],
                    sortedIndices: [...sortedIndices],
                    currentIndex: j + 1,
                    compareIndex: j,
                    shiftIndices: [...shiftIndices],
                    keyValue: key
                });
                break;
            }
        }

        arr[j + 1] = key;
        sortedIndices.push(i); // Add the newly processed index to the generic sorted pile

        steps.push({
            type: 'insert',
            description: `📥 Dropping key ${key} into index ${j + 1}.`,
            arraySnapshot: [...arr],
            sortedIndices: [...sortedIndices],
            currentIndex: j + 1,
            compareIndex: null,
            shiftIndices: [],
            keyValue: null
        });
    }

    steps.push({
        type: 'completed',
        description: `🎉 Array is fully sorted!`,
        arraySnapshot: [...arr],
        sortedIndices: [...Array(n).keys()],
        currentIndex: null,
        compareIndex: null,
        shiftIndices: [],
        keyValue: null
    });

    return steps;
};
