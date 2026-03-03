export const generateJumpSearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b);
    const n = arr.length;
    const jumpSize = Math.floor(Math.sqrt(n));

    steps.push({
        type: 'info',
        indices: [],
        description: `Jump Search for target ${target}. Array is sorted. Jump size = √${n} = ${jumpSize}.`,
        arraySnapshot: [...arr]
    });

    let prev = 0;
    let curr = jumpSize;

    // Jump phase
    while (curr < n && arr[curr] < target) {
        steps.push({
            type: 'compare',
            indices: [prev, curr],
            description: `Jumping: arr[${curr}] = ${arr[curr]} < ${target}. Jump ahead by ${jumpSize}.`,
            arraySnapshot: [...arr]
        });
        prev = curr;
        curr += jumpSize;
    }

    if (curr >= n) {
        curr = n - 1;
    }

    steps.push({
        type: 'compare',
        indices: [prev, curr],
        description: `Stopped jumping at index ${curr} (value ${arr[curr]}). Linear scan from ${prev} to ${curr}.`,
        arraySnapshot: [...arr]
    });

    // Linear scan phase
    for (let i = prev; i <= curr && i < n; i++) {
        steps.push({
            type: 'compare',
            indices: [i],
            description: `Linear scan: comparing arr[${i}] = ${arr[i]} with target ${target}.`,
            arraySnapshot: [...arr]
        });

        if (arr[i] === target) {
            steps.push({
                type: 'found',
                indices: [i],
                description: `Found target ${target} at index ${i}!`,
                arraySnapshot: [...arr]
            });
            return steps;
        }

        if (arr[i] > target) {
            break;
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
