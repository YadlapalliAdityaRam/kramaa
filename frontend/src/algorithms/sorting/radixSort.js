export const generateRadixSortSteps = (array, ascending = true) => {
    const steps = [];
    let arr = [...array];
    const n = arr.length;

    if (n <= 1) {
        steps.push({
            type: 'completed',
            description: 'Array has 0 or 1 element — already sorted!',
            arraySnapshot: [...arr],
            buckets: Array.from({ length: 10 }, () => []),
            sortedIndices: [0]
        });
        return steps;
    }

    const maxVal = Math.max(...arr);
    const maxDigits = maxVal.toString().length;

    const pushStep = (type, desc, extras = {}) => {
        steps.push({
            type,
            description: desc,
            arraySnapshot: [...arr],
            ...extras
        });
    };

    let emptyBuckets = Array.from({ length: 10 }, () => []);

    pushStep('info', `Radix Sort: maximum value is ${maxVal} with ${maxDigits} digit(s). We will do ${maxDigits} passes.`, {
        buckets: [...emptyBuckets]
    });

    for (let digitPos = 0; digitPos < maxDigits; digitPos++) {
        const divisor = Math.pow(10, digitPos);
        const placeName = digitPos === 0 ? 'ones' : digitPos === 1 ? 'tens' : digitPos === 2 ? 'hundreds' : `10^${digitPos}`;

        pushStep('info', `Pass ${digitPos + 1}: Sorting based on the ${placeName} digit.`, {
            buckets: [...emptyBuckets],
            activeDivisor: divisor,
            activePass: digitPos
        });

        // Copy array layout so we can "blank out" numbers as they move into buckets
        let viewingArr = [...arr];
        let currentBuckets = Array.from({ length: 10 }, () => []);

        // Distribute to buckets
        for (let i = 0; i < n; i++) {
            const val = arr[i];
            const digit = Math.floor(val / divisor) % 10;
            
            pushStep('evaluate', `Evaluate ${val}. ${placeName} digit is ${digit}. Move to Bucket ${digit}.`, {
                buckets: currentBuckets.map(b => [...b]),
                viewingArray: [...viewingArr],
                activeDivisor: divisor,
                activeIdx: i,
                targetBucket: digit,
                action: 'extracting'
            });

            // Move it
            currentBuckets[digit].push(val);
            viewingArr[i] = null; // Visually remove from input row

            pushStep('distributed', `${val} moved to Bucket ${digit}.`, {
                buckets: currentBuckets.map(b => [...b]),
                viewingArray: [...viewingArr],
                activeDivisor: divisor,
                activeBucket: digit
            });
        }

        // Collect from buckets
        let idx = 0;
        const bucketOrder = ascending ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

        for (const b of bucketOrder) {
            while (currentBuckets[b].length > 0) {
                const val = currentBuckets[b].shift();
                
                pushStep('collecting', `Collect ${val} from Bucket ${b} and place it back at position ${idx}.`, {
                    buckets: currentBuckets.map(bkt => [...bkt]),
                    viewingArray: [...viewingArr],
                    activeDivisor: divisor,
                    sourceBucket: b,
                    targetIdx: idx,
                    action: 'collecting'
                });

                viewingArr[idx] = val;
                arr[idx] = val; // update strict array

                pushStep('collected', `${val} placed at position ${idx}.`, {
                    buckets: currentBuckets.map(bkt => [...bkt]),
                    viewingArray: [...viewingArr],
                    activeDivisor: divisor,
                    activeIdx: idx
                });

                idx++;
            }
        }

        pushStep('pass-complete', `End of Pass ${digitPos + 1}. Array is sorted up to the ${placeName} place.\n[${arr.join(', ')}]`, {
            buckets: [...emptyBuckets],
            activeDivisor: divisor,
            isPassEnd: true
        });
    }

    pushStep('completed', `All ${maxDigits} passes complete. The array is fully sorted!`, {
        buckets: [...emptyBuckets],
        sortedIndices: Array.from({ length: n }, (_, k) => k)
    });

    return steps;
};
