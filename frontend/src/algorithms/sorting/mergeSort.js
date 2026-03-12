const merge = (arr, l, m, r, level, steps, ascending) => {
    const n1 = m - l + 1;
    const n2 = r - m;

    const L = new Array(n1);
    const R = new Array(n2);

    for (let i = 0; i < n1; i++) L[i] = arr[l + i];
    for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j];

    let i = 0, j = 0, k = l;

    steps.push({
        type: 'merge_start',
        indices: [l, r],
        range: { left: l, mid: m, right: r },
        level,
        description: `Merging subarrays [${l}...${m}] and [${m + 1}...${r}].`,
        arraySnapshot: [...arr]
    });

    const shouldPickLeft = (leftVal, rightVal) => ascending ? leftVal <= rightVal : leftVal >= rightVal;

    while (i < n1 && j < n2) {
        steps.push({
            type: 'compare',
            indices: [l + i, m + 1 + j],
            range: { left: l, mid: m, right: r },
            level,
            description: `Comparing ${L[i]} (left) and ${R[j]} (right).`,
            arraySnapshot: [...arr]
        });

        if (shouldPickLeft(L[i], R[j])) {
            arr[k] = L[i];
            steps.push({
                type: 'overwrite',
                indices: [k],
                range: { left: l, mid: m, right: r },
                level,
                description: `Placing ${L[i]} back into main array at index ${k}.`,
                arraySnapshot: [...arr]
            });
            i++;
        } else {
            arr[k] = R[j];
            steps.push({
                type: 'overwrite',
                indices: [k],
                range: { left: l, mid: m, right: r },
                level,
                description: `Placing ${R[j]} back into main array at index ${k}.`,
                arraySnapshot: [...arr]
            });
            j++;
        }
        k++;
    }

    while (i < n1) {
        arr[k] = L[i];
        steps.push({
            type: 'overwrite',
            indices: [k],
            range: { left: l, mid: m, right: r },
            level,
            description: `Copying remaining element ${L[i]} to index ${k}.`,
            arraySnapshot: [...arr]
        });
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = R[j];
        steps.push({
            type: 'overwrite',
            indices: [k],
            range: { left: l, mid: m, right: r },
            level,
            description: `Copying remaining element ${R[j]} to index ${k}.`,
            arraySnapshot: [...arr]
        });
        j++;
        k++;
    }
};

const mergeSortHelper = (arr, l, r, level, steps, ascending) => {
    if (l >= r) return;

    const m = l + Math.floor((r - l) / 2);

    steps.push({
        type: 'split',
        indices: [l, r],
        range: { left: l, mid: m, right: r },
        level,
        description: `Splitting array [${l}...${r}] into two halves.`,
        arraySnapshot: [...arr]
    });

    mergeSortHelper(arr, l, m, level + 1, steps, ascending);
    mergeSortHelper(arr, m + 1, r, level + 1, steps, ascending);
    merge(arr, l, m, r, level, steps, ascending);
};

export const generateMergeSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    mergeSortHelper(arr, 0, arr.length - 1, 0, steps, ascending);

    steps.push({
        type: 'completed',
        indices: [],
        description: 'Array is fully sorted.',
        arraySnapshot: [...arr]
    });

    return steps;
};
