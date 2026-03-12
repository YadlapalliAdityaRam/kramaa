export const generateBinarySearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b); // Binary search requires sorted array
    let low = 0;
    let high = arr.length - 1;

    steps.push({
        type: 'initialization',
        indices: { low, high, mid: null },
        description: `Binary search initiated for target ${target}. Array is sorted.`,
        arraySnapshot: [...arr]
    });

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        steps.push({
            type: 'compare',
            indices: { low, high, mid },
            description: `Analyzing middle element ${arr[mid]} at index ${mid}. Range: [${low}, ${high}].`,
            arraySnapshot: [...arr]
        });

        if (arr[mid] === target) {
            steps.push({
                type: 'found',
                indices: { low, high, mid },
                description: `Success! Target ${target} found at index ${mid}.`,
                arraySnapshot: [...arr]
            });
            return steps;
        }

        if (arr[mid] < target) {
            steps.push({
                type: 'move',
                indices: { low, high, mid },
                description: `${arr[mid]} is less than ${target}. Searching in the right half.`,
                arraySnapshot: [...arr]
            });
            low = mid + 1;
        } else {
            steps.push({
                type: 'move',
                indices: { low, high, mid },
                description: `${arr[mid]} is greater than ${target}. Searching in the left half.`,
                arraySnapshot: [...arr]
            });
            high = mid - 1;
        }
    }

    steps.push({
        type: 'not-found',
        indices: { low, high: high < 0 ? 0 : high, mid: null },
        description: `Target ${target} not found in the array. Search space exhausted.`,
        arraySnapshot: [...arr]
    });

    return steps;
};
