const merge = (arr, l, m, r, steps, ascending) => {
    const n1 = m - l + 1;
    const n2 = r - m;

    const L = new Array(n1);
    const R = new Array(n2);

    for (let i = 0; i < n1; i++) L[i] = arr[l + i];
    for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

    let i = 0, j = 0, k = l;

    steps.push({
        type: 'compare',
        indices: [l, r],
        description: `Merging subarrays from index ${l} to ${m} and ${m + 1} to ${r}.`,
        arraySnapshot: [...arr]
    });

    const shouldPickLeft = (leftVal, rightVal) => ascending ? leftVal <= rightVal : leftVal >= rightVal;

    while (i < n1 && j < n2) {
        steps.push({
            type: 'compare',
            indices: [l + i, m + 1 + j],
            description: `Comparing left array value ${L[i]} and right array value ${R[j]}.`,
            arraySnapshot: [...arr]
        });

        if (shouldPickLeft(L[i], R[j])) {
            arr[k] = L[i];
            steps.push({
                type: 'swap', // Overwriting
                indices: [k],
                description: `Taking ${L[i]} from left subarray to position ${k}.`,
                arraySnapshot: [...arr]
            });
            i++;
        } else {
            arr[k] = R[j];
            steps.push({
                type: 'swap',
                indices: [k],
                description: `Taking ${R[j]} from right subarray to position ${k}.`,
                arraySnapshot: [...arr]
            });
            j++;
        }
        k++;
    }

    while (i < n1) {
        arr[k] = L[i];
        steps.push({
            type: 'swap',
            indices: [k],
            description: `Copying remaining element ${L[i]} from left subarray to position ${k}.`,
            arraySnapshot: [...arr]
        });
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = R[j];
        steps.push({
            type: 'swap',
            indices: [k],
            description: `Copying remaining element ${R[j]} from right subarray to position ${k}.`,
            arraySnapshot: [...arr]
        });
        j++;
        k++;
    }
};

const mergeSortHelper = (arr, l, r, steps, ascending) => {
    if (l >= r) return;
    const m = l + parseInt((r - l) / 2);
    mergeSortHelper(arr, l, m, steps, ascending);
    mergeSortHelper(arr, m + 1, r, steps, ascending);
    merge(arr, l, m, r, steps, ascending);
};

export const generateMergeSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    mergeSortHelper(arr, 0, arr.length - 1, steps, ascending);

    steps.push({
        type: 'completed',
        indices: [],
        description: 'Array is fully sorted.',
        arraySnapshot: [...arr]
    });

    return steps;
};
