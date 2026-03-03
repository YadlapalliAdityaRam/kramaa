export const generateInterpolationSearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b);
    let low = 0;
    let high = arr.length - 1;

    steps.push({
        type: 'info',
        indices: [],
        description: `Interpolation Search for target ${target}. Uses value distribution to estimate position.`,
        arraySnapshot: [...arr]
    });

    while (low <= high && target >= arr[low] && target <= arr[high]) {
        if (low === high) {
            if (arr[low] === target) {
                steps.push({
                    type: 'found',
                    indices: [low],
                    description: `Found target ${target} at index ${low}!`,
                    arraySnapshot: [...arr]
                });
                return steps;
            }
            break;
        }

        // Interpolation formula
        const pos = low + Math.floor(
            ((target - arr[low]) * (high - low)) / (arr[high] - arr[low])
        );

        steps.push({
            type: 'compare',
            indices: [low, high, pos],
            description: `Probe position = ${low} + ((${target} - ${arr[low]}) × (${high} - ${low})) / (${arr[high]} - ${arr[low]}) = ${pos}. arr[${pos}] = ${arr[pos]}.`,
            arraySnapshot: [...arr]
        });

        if (arr[pos] === target) {
            steps.push({
                type: 'found',
                indices: [pos],
                description: `Found target ${target} at index ${pos}!`,
                arraySnapshot: [...arr]
            });
            return steps;
        }

        if (arr[pos] < target) {
            steps.push({
                type: 'move',
                indices: [pos],
                description: `${arr[pos]} < ${target}. Searching right half: low = ${pos + 1}.`,
                arraySnapshot: [...arr]
            });
            low = pos + 1;
        } else {
            steps.push({
                type: 'move',
                indices: [pos],
                description: `${arr[pos]} > ${target}. Searching left half: high = ${pos - 1}.`,
                arraySnapshot: [...arr]
            });
            high = pos - 1;
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
