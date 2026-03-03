export const generateRadixSortSteps = (array, ascending = true) => {
    const steps = [];
    let arr = [...array];
    const n = arr.length;

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
    const maxDigits = maxVal.toString().length;

    steps.push({
        type: 'info',
        indices: [],
        sortedIndices: [],
        description: `Radix Sort: Maximum value is ${maxVal} with ${maxDigits} digit(s). Will process ${maxDigits} passes.`,
        arraySnapshot: [...arr]
    });

    for (let digitPos = 0; digitPos < maxDigits; digitPos++) {
        const divisor = Math.pow(10, digitPos);
        const placeName = digitPos === 0 ? 'ones' : digitPos === 1 ? 'tens' : digitPos === 2 ? 'hundreds' : `10^${digitPos}`;

        steps.push({
            type: 'info',
            indices: [],
            sortedIndices: [],
            description: `Pass ${digitPos + 1}: Sorting by ${placeName} digit.`,
            arraySnapshot: [...arr]
        });

        // Counting sort by current digit
        const buckets = Array.from({ length: 10 }, () => []);

        for (let i = 0; i < n; i++) {
            const digit = Math.floor(arr[i] / divisor) % 10;

            steps.push({
                type: 'compare',
                indices: [i],
                sortedIndices: [],
                description: `${arr[i]} → ${placeName} digit is ${digit}. Placing into bucket ${digit}.`,
                arraySnapshot: [...arr]
            });

            buckets[digit].push(arr[i]);
        }

        // Collect from buckets
        let idx = 0;
        const bucketOrder = ascending ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

        for (const b of bucketOrder) {
            for (const val of buckets[b]) {
                arr[idx] = val;

                steps.push({
                    type: 'swap',
                    indices: [idx],
                    sortedIndices: [],
                    description: `Collecting ${val} from bucket ${b} → position ${idx}.`,
                    arraySnapshot: [...arr]
                });

                idx++;
            }
        }

        steps.push({
            type: 'info',
            indices: [],
            sortedIndices: [],
            description: `After pass ${digitPos + 1} (${placeName}): [${arr.join(', ')}]`,
            arraySnapshot: [...arr]
        });
    }

    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: Array.from({ length: n }, (_, k) => k),
        description: 'All digit passes complete. Array is fully sorted!',
        arraySnapshot: [...arr]
    });

    return steps;
};
