export const generateBinarySearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b); // Binary search requires sorted array
    let low = 0;
    let high = arr.length - 1;

    steps.push({
        type: 'info',
        indices: [],
        description: `Binary search initiated for target ${target}. Array must be sorted.`,
        arraySnapshot: [...arr]
    });

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        steps.push({
            type: 'compare',
            indices: [low, high, mid], // Highlight bounds and mid
            description: `Searching between index ${low} and ${high}. Middle element is ${arr[mid]}.`,
            arraySnapshot: [...arr]
        });

        if (arr[mid] === target) {
            steps.push({
                type: 'found',
                indices: [mid],
                description: `Found target ${target} at index ${mid}.`,
                arraySnapshot: [...arr]
            });
            return steps;
        }

        if (arr[mid] < target) {
            steps.push({
                type: 'move',
                indices: [mid],
                description: `${arr[mid]} is less than ${target}, ignoring left half. Moving low to ${mid + 1}.`,
                arraySnapshot: [...arr]
            });
            low = mid + 1;
        } else {
            steps.push({
                type: 'move',
                indices: [mid],
                description: `${arr[mid]} is greater than ${target}, ignoring right half. Moving high to ${mid - 1}.`,
                arraySnapshot: [...arr]
            });
            high = mid - 1;
        }
    }

    steps.push({
        type: 'not-found',
        indices: [],
        description: `Target ${target} not found in the array.`,
        arraySnapshot: [...arr]
    });

    return steps;
};
