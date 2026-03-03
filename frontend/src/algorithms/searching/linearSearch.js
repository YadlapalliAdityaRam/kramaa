export const generateLinearSearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array];

    steps.push({
        type: 'info',
        indices: [],
        description: `Starting Linear Search for target ${target}.`,
        arraySnapshot: [...arr]
    });

    for (let i = 0; i < arr.length; i++) {
        steps.push({
            type: 'compare',
            indices: [i],
            description: `Checking index ${i}: Is ${arr[i]} equal to ${target}?`,
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
    }

    steps.push({
        type: 'not-found',
        indices: [],
        description: `Target ${target} not found after checking all elements.`,
        arraySnapshot: [...arr]
    });

    return steps;
};
