const DEFAULT_ARRAY = [2, 1, 5, 1, 3, 2];
const DEFAULT_K = 3;

const sanitizeArray = (inputArray) => {
    if (!Array.isArray(inputArray) || inputArray.length === 0) return [...DEFAULT_ARRAY];

    const values = inputArray
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .slice(0, 12);

    return values.length > 0 ? values : [...DEFAULT_ARRAY];
};

export const generateSlidingWindowSteps = (inputArray, kValue) => {
    const arr = sanitizeArray(inputArray);
    const k = Number.isFinite(Number(kValue)) ? Math.max(1, Math.min(arr.length, Math.round(Number(kValue)))) : Math.min(DEFAULT_K, arr.length);
    const steps = [];

    const buildWindowIndices = (left, right) => {
        if (left < 0 || right < left) return [];
        return Array.from({ length: right - left + 1 }, (_, index) => left + index);
    };

    const buildStep = ({
        type,
        description,
        windowLeft = -1,
        windowRight = -1,
        windowSum = 0,
        bestSum = null,
        bestLeft = -1,
        bestRight = -1,
        incomingIndex = -1,
        outgoingIndex = -1,
        decision = '',
        highlightBestWindow = false
    }) => ({
        type,
        description,
        arraySnapshot: [...arr],
        indices: [incomingIndex, outgoingIndex].filter((index) => index >= 0),
        windowLeft,
        windowRight,
        windowSum,
        bestSum,
        bestLeft,
        bestRight,
        currentWindowIndices: buildWindowIndices(windowLeft, windowRight),
        bestWindowIndices: buildWindowIndices(bestLeft, bestRight),
        incomingIndex,
        outgoingIndex,
        decision,
        k,
        highlightBestWindow
    });

    if (k <= 0 || k > arr.length) {
        return [buildStep({
            type: 'invalid',
            description: `Window size ${k} is invalid for an array of length ${arr.length}.`,
            decision: 'Choose a window size between 1 and the array length.'
        })];
    }

    let left = 0;
    let windowSum = 0;
    let bestSum = -Infinity;
    let bestLeft = -1;
    let bestRight = -1;

    steps.push(buildStep({
        type: 'info',
        description: 'Sliding Window keeps a running total for the current group instead of recalculating every subarray from scratch.',
        windowLeft: 0,
        windowRight: -1,
        bestSum: null,
        decision: `Goal: find the maximum sum of any subarray of size ${k}.`
    }));

    steps.push(buildStep({
        type: 'init',
        description: `Initialize the window on array [${arr.join(', ')}] with Left = 0 and Right = 0.`,
        windowLeft: 0,
        windowRight: -1,
        bestSum: null,
        decision: 'Start expanding the window one element at a time.'
    }));

    for (let right = 0; right < arr.length; right += 1) {
        windowSum += arr[right];

        steps.push(buildStep({
            type: 'expand',
            description: `Expand the window by including arr[${right}] = ${arr[right]}. Running sum becomes ${windowSum}.`,
            windowLeft: left,
            windowRight: right,
            windowSum,
            bestSum: Number.isFinite(bestSum) ? bestSum : null,
            bestLeft,
            bestRight,
            incomingIndex: right,
            decision: `Window size is now ${right - left + 1}.`
        }));

        if (right - left + 1 < k) {
            steps.push(buildStep({
                type: 'check-window',
                description: `The window has ${right - left + 1} element${right - left + 1 === 1 ? '' : 's'}, so keep expanding until it reaches size ${k}.`,
                windowLeft: left,
                windowRight: right,
                windowSum,
                bestSum: Number.isFinite(bestSum) ? bestSum : null,
                bestLeft,
                bestRight,
                decision: 'No result is checked until the window size becomes k.'
            }));
            continue;
        }

        const currentWindowText = `[${arr.slice(left, right + 1).join(', ')}]`;
        if (windowSum > bestSum) {
            bestSum = windowSum;
            bestLeft = left;
            bestRight = right;

            steps.push(buildStep({
                type: 'best-update',
                description: `Window ${currentWindowText} has sum ${windowSum}. This is the best sum seen so far.`,
                windowLeft: left,
                windowRight: right,
                windowSum,
                bestSum,
                bestLeft,
                bestRight,
                decision: `Update maximum sum to ${bestSum}.`,
                highlightBestWindow: true
            }));
        } else {
            steps.push(buildStep({
                type: 'check-window',
                description: `Window ${currentWindowText} has sum ${windowSum}. The best sum still remains ${bestSum}.`,
                windowLeft: left,
                windowRight: right,
                windowSum,
                bestSum,
                bestLeft,
                bestRight,
                decision: 'Record the result, then slide the window forward.'
            }));
        }

        if (right < arr.length - 1) {
            steps.push(buildStep({
                type: 'shrink',
                description: `Slide the window forward by removing arr[${left}] = ${arr[left]} before moving Left.`,
                windowLeft: left,
                windowRight: right,
                windowSum,
                bestSum,
                bestLeft,
                bestRight,
                outgoingIndex: left,
                decision: `Subtract ${arr[left]} so the next window can reuse the current sum.`
            }));
        }

        windowSum -= arr[left];
        left += 1;
    }

    steps.push(buildStep({
        type: 'completed',
        description: `Sliding Window complete. Best window is [${arr.slice(bestLeft, bestRight + 1).join(', ')}] with maximum sum ${bestSum}.`,
        windowLeft: bestLeft,
        windowRight: bestRight,
        windowSum: bestSum,
        bestSum,
        bestLeft,
        bestRight,
        decision: 'Each element entered and left the window once, so the algorithm stays O(n).',
        highlightBestWindow: true
    }));

    return steps;
};
