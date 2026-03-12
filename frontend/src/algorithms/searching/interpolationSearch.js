export const generateInterpolationSearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b);
    let low = 0;
    let high = arr.length - 1;

    steps.push({
        type: 'info',
        description: `📚 Interpolation Search: Unlike Binary Search which always checks the middle, this algorithm estimates the target's position based on its value. Best for uniformly distributed data.`,
        arraySnapshot: [...arr],
        low: null,
        high: null,
        pos: null,
        target: target
    });

    steps.push({
        type: 'initial-bounds',
        description: `Setting search range: low = ${low}, high = ${high}. Searching for target ${target}.`,
        arraySnapshot: [...arr],
        low: low,
        high: high,
        pos: null,
        target: target
    });

    while (low <= high && target >= arr[low] && target <= arr[high]) {
        if (low === high) {
            steps.push({
                type: 'compare-single',
                description: `Search range narrowed to a single element at index ${low}. Checking if arr[${low}] == ${target}.`,
                arraySnapshot: [...arr],
                low: low,
                high: high,
                pos: low,
                target: target
            });

            if (arr[low] === target) {
                steps.push({
                    type: 'found',
                    description: `🎯 Found target ${target} at index ${low}!`,
                    arraySnapshot: [...arr],
                    low: low,
                    high: high,
                    pos: low,
                    target: target
                });
                return steps;
            } else {
                break;
            }
        }

        // Emit calculation step
        const pos = low + Math.floor(((target - arr[low]) * (high - low)) / (arr[high] - arr[low]));
        steps.push({
            type: 'calculate',
            description: `🧮 Estimating position: pos = ${low} + ((${target} - ${arr[low]}) × (${high} - ${low})) / (${arr[high]} - ${arr[low]}) = ${pos}`,
            arraySnapshot: [...arr],
            low: low,
            high: high,
            pos: pos,
            target: target
        });

        steps.push({
            type: 'compare',
            description: `🔍 Probing index ${pos}. arr[${pos}] is ${arr[pos]}. Comparing ${arr[pos]} with target ${target}.`,
            arraySnapshot: [...arr],
            low: low,
            high: high,
            pos: pos,
            target: target
        });

        if (arr[pos] === target) {
            steps.push({
                type: 'found',
                description: `🎯 Target ${target} matches estimated position arr[${pos}]! Found!`,
                arraySnapshot: [...arr],
                low: low,
                high: high,
                pos: pos,
                target: target
            });
            return steps;
        }

        if (arr[pos] < target) {
            low = pos + 1;
            steps.push({
                type: 'narrow',
                description: `📈 ${arr[pos]} is less than ${target}. Target must be to the right. Adjusting low = ${low}.`,
                arraySnapshot: [...arr],
                low: low,
                high: high,
                pos: null,
                target: target
            });
        } else {
            high = pos - 1;
            steps.push({
                type: 'narrow',
                description: `📉 ${arr[pos]} is greater than ${target}. Target must be to the left. Adjusting high = ${high}.`,
                arraySnapshot: [...arr],
                low: low,
                high: high,
                pos: null,
                target: target
            });
        }
    }

    steps.push({
        type: 'not-found',
        description: `🚫 Target ${target} is not in the array. Search exhausted.`,
        arraySnapshot: [...arr],
        low: null,
        high: null,
        pos: null,
        target: target
    });

    return steps;
};
