export const generateBucketSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    if (n <= 1) {
        steps.push({
            type: 'completed',
            indices: [],
            sortedIndices: [0],
            description: 'Array has 0 or 1 element — already sorted!',
            arraySnapshot: [...arr]
        });
        return steps;
    }

    const maxVal = Math.max(...arr);
    const minVal = Math.min(...arr);
    const bucketCount = Math.max(Math.floor(Math.sqrt(n)), 2);
    const range = maxVal - minVal + 1;
    const bucketSize = Math.ceil(range / bucketCount);

    // Create buckets
    const buckets = Array.from({ length: bucketCount }, () => []);

    steps.push({
        type: 'info',
        indices: [],
        sortedIndices: [],
        description: `Creating ${bucketCount} buckets for range [${minVal}, ${maxVal}]. Each bucket covers ~${bucketSize} values.`,
        arraySnapshot: [...arr]
    });

    // Distribute into buckets
    for (let i = 0; i < n; i++) {
        const bucketIdx = Math.min(Math.floor((arr[i] - minVal) / bucketSize), bucketCount - 1);
        buckets[bucketIdx].push(arr[i]);

        steps.push({
            type: 'compare',
            indices: [i],
            sortedIndices: [...sortedIndices],
            description: `Placing ${arr[i]} into bucket ${bucketIdx} (range ${minVal + bucketIdx * bucketSize}–${minVal + (bucketIdx + 1) * bucketSize - 1}).`,
            arraySnapshot: [...arr]
        });
    }

    // Sort each bucket using insertion sort & visualize
    steps.push({
        type: 'info',
        indices: [],
        sortedIndices: [],
        description: 'All elements distributed. Now sorting each bucket individually.',
        arraySnapshot: [...arr]
    });

    for (let b = 0; b < bucketCount; b++) {
        if (buckets[b].length > 1) {
            steps.push({
                type: 'info',
                indices: [],
                sortedIndices: [...sortedIndices],
                description: `Sorting bucket ${b}: [${buckets[b].join(', ')}]`,
                arraySnapshot: [...arr]
            });

            // Insertion sort within bucket
            for (let i = 1; i < buckets[b].length; i++) {
                let key = buckets[b][i];
                let j = i - 1;
                while (j >= 0 && (ascending ? buckets[b][j] > key : buckets[b][j] < key)) {
                    buckets[b][j + 1] = buckets[b][j];
                    j--;
                }
                buckets[b][j + 1] = key;
            }

            steps.push({
                type: 'info',
                indices: [],
                sortedIndices: [...sortedIndices],
                description: `Bucket ${b} sorted: [${buckets[b].join(', ')}]`,
                arraySnapshot: [...arr]
            });
        }
    }

    // Concatenate buckets
    let outIdx = 0;
    for (let b = 0; b < bucketCount; b++) {
        for (let j = 0; j < buckets[b].length; j++) {
            arr[outIdx] = buckets[b][j];
            sortedIndices.push(outIdx);

            steps.push({
                type: 'sorted',
                indices: [outIdx],
                sortedIndices: [...sortedIndices],
                description: `Placing ${arr[outIdx]} from bucket ${b} into position ${outIdx}.`,
                arraySnapshot: [...arr]
            });

            outIdx++;
        }
    }

    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: Array.from({ length: n }, (_, k) => k),
        description: 'All buckets concatenated. Array is fully sorted!',
        arraySnapshot: [...arr]
    });

    return steps;
};
