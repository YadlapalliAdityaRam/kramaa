export const generateBucketSortSteps = (array, bucketCount = 5, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;

    // Find min and max to normalize values if they aren't [0, 1)
    let min = Math.min(...arr);
    let max = Math.max(...arr);

    // If all values are between 0 and 1 (exclusive), we can use them directly
    const isNormalized = arr.every(x => x >= 0 && x < 1);

    if (isNormalized) {
        min = 0;
        max = 1;
    } else if (min === max) {
        max = min + 1; // Prevent division by zero
    }

    // Number of buckets
    const k = bucketCount > 0 ? bucketCount : Math.max(1, Math.floor(n / 2));

    // Initialize empty buckets
    const buckets = Array.from({ length: k }, () => []);
    const sortedIndices = [];

    steps.push({
        type: 'init',
        description: `Created ${k} empty buckets. Mapping values based on min=${min.toFixed(2)}, max=${max.toFixed(2)}.`,
        arraySnapshot: [...arr],
        bucketsSnapshot: [...buckets],
        activeIndices: [],
        activeBuckets: []
    });

    // 1. Scatter Phase
    for (let i = 0; i < n; i++) {
        const val = arr[i];
        // Calculate bucket index
        let bucketIdx;
        if (isNormalized) {
            bucketIdx = Math.floor(k * val);
        } else {
            bucketIdx = Math.floor(k * ((val - min) / (max - min)));
        }

        // Edge case: if val === max, it might fall into k-th bucket (out of bounds)
        if (bucketIdx === k) {
            bucketIdx = k - 1;
        }

        // Add to bucket
        buckets[bucketIdx].push(val);

        steps.push({
            type: 'scatter',
            description: `Scatter Phase: value ${val} -> Bucket ${bucketIdx}.`,
            arraySnapshot: arr.map((v, idx) => idx > i ? v : null), // null out elements that have moved
            bucketsSnapshot: buckets.map(b => [...b]),
            activeIndices: [i],
            activeBuckets: [bucketIdx]
        });
    }

    // 2. Sort Buckets Phase (Insertion Sort internal)
    const compare = (a, b) => ascending ? a > b : a < b;

    for (let i = 0; i < k; i++) {
        if (buckets[i].length <= 1) {
            if (buckets[i].length === 1) {
                steps.push({
                    type: 'bucket-sorted',
                    description: `Bucket ${i} has 1 element. It is already sorted.`,
                    arraySnapshot: Array(n).fill(null),
                    bucketsSnapshot: buckets.map(b => [...b]),
                    activeIndices: [],
                    activeBuckets: [i]
                });
            }
            continue;
        }

        steps.push({
            type: 'sort-bucket-start',
            description: `Sorting Bucket ${i} internally using Insertion Sort.`,
            arraySnapshot: Array(n).fill(null),
            bucketsSnapshot: buckets.map(b => [...b]),
            activeIndices: [],
            activeBuckets: [i]
        });

        const bucket = buckets[i];
        for (let j = 1; j < bucket.length; j++) {
            let key = bucket[j];
            let p = j - 1;

            steps.push({
                type: 'compare',
                description: `Sorting Bucket ${i}: comparing ${key}.`,
                arraySnapshot: Array(n).fill(null),
                bucketsSnapshot: buckets.map(b => [...b]),
                activeIndices: [],
                activeBuckets: [i],
                activeBucketItems: [j]
            });

            while (p >= 0 && compare(bucket[p], key)) {
                bucket[p + 1] = bucket[p];
                p--;

                steps.push({
                    type: 'swap',
                    description: `Sorting Bucket ${i}: shifting ${bucket[p + 1]} right.`,
                    arraySnapshot: Array(n).fill(null),
                    bucketsSnapshot: buckets.map(b => [...b]),
                    activeIndices: [],
                    activeBuckets: [i],
                    activeBucketItems: [p + 1, p + 2]
                });
            }
            bucket[p + 1] = key;
        }

        steps.push({
            type: 'bucket-sorted',
            description: `Bucket ${i} is now sorted!`,
            arraySnapshot: Array(n).fill(null),
            bucketsSnapshot: buckets.map(b => [...b]),
            activeIndices: [],
            activeBuckets: [i]
        });
    }

    // 3. Gather Phase (Concatenate)
    let sortedArr = [];
    let currentIndex = 0;

    for (let i = 0; i < k; i++) {
        if (buckets[i].length === 0) continue;

        steps.push({
            type: 'gather-start',
            description: `Gather Phase: Retrieving sorted elements from Bucket ${i}.`,
            arraySnapshot: [...sortedArr, ...Array(n - sortedArr.length).fill(null)],
            bucketsSnapshot: buckets.map(b => [...b]),
            activeIndices: [],
            activeBuckets: [i]
        });

        // Drain the bucket one by one for animation
        while (buckets[i].length > 0) {
            const val = buckets[i].shift();
            sortedArr.push(val);
            sortedIndices.push(currentIndex);

            steps.push({
                type: 'gather',
                description: `Gathered ${val} from Bucket ${i} into final sorted array.`,
                arraySnapshot: [...sortedArr, ...Array(n - sortedArr.length).fill(null)],
                bucketsSnapshot: buckets.map(b => [...b]),
                activeIndices: [currentIndex],
                activeBuckets: [i],
                sortedIndices: [...sortedIndices]
            });
            currentIndex++;
        }
    }

    steps.push({
        type: 'completed',
        description: 'Bucket Sort Complete! All buckets have been concatenated.',
        arraySnapshot: [...sortedArr],
        bucketsSnapshot: buckets.map(b => [...b]), // Should be all empty now
        activeIndices: [],
        activeBuckets: [],
        sortedIndices: [...sortedIndices]
    });

    return steps;
};
