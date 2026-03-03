export const generateExponentialSearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b);
    const n = arr.length;

    steps.push({
        type: 'info',
        indices: [],
        description: `Exponential Search for target ${target}. Doubling range, then binary search.`,
        arraySnapshot: [...arr]
    });

    // Check first element
    if (arr[0] === target) {
        steps.push({
            type: 'found',
            indices: [0],
            description: `Found target ${target} at index 0!`,
            arraySnapshot: [...arr]
        });
        return steps;
    }

    // Find range by repeated doubling
    let bound = 1;
    while (bound < n && arr[bound] <= target) {
        steps.push({
            type: 'compare',
            indices: [bound],
            description: `Doubling: arr[${bound}] = ${arr[bound]} ${arr[bound] <= target ? '≤' : '>'} ${target}. Expanding range to ${Math.min(bound * 2, n - 1)}.`,
            arraySnapshot: [...arr]
        });
        bound *= 2;
    }

    const low = Math.floor(bound / 2);
    const high = Math.min(bound, n - 1);

    steps.push({
        type: 'info',
        indices: [low, high],
        description: `Range found: [${low}, ${high}]. Now performing binary search in this range.`,
        arraySnapshot: [...arr]
    });

    // Binary search in the range
    let lo = low, hi = high;
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);

        steps.push({
            type: 'compare',
            indices: [lo, hi, mid],
            description: `Binary search: low=${lo}, high=${hi}, mid=${mid}. arr[${mid}] = ${arr[mid]}.`,
            arraySnapshot: [...arr]
        });

        if (arr[mid] === target) {
            steps.push({
                type: 'found',
                indices: [mid],
                description: `Found target ${target} at index ${mid}!`,
                arraySnapshot: [...arr]
            });
            return steps;
        }

        if (arr[mid] < target) {
            steps.push({
                type: 'move',
                indices: [mid],
                description: `${arr[mid]} < ${target}. Moving low to ${mid + 1}.`,
                arraySnapshot: [...arr]
            });
            lo = mid + 1;
        } else {
            steps.push({
                type: 'move',
                indices: [mid],
                description: `${arr[mid]} > ${target}. Moving high to ${mid - 1}.`,
                arraySnapshot: [...arr]
            });
            hi = mid - 1;
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
