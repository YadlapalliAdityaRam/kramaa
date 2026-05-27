const DEFAULT_ARRAY = [1, 2, 4, 6, 8, 10];
const DEFAULT_TARGET = 10;

const sanitizeArray = (inputArray) => {
    if (!Array.isArray(inputArray) || inputArray.length === 0) return [...DEFAULT_ARRAY];

    const values = inputArray
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .slice(0, 12);

    return values.length > 0 ? values.sort((a, b) => a - b) : [...DEFAULT_ARRAY];
};

export const generateTwoPointersSteps = (inputArray, target) => {
    const arr = sanitizeArray(inputArray);
    const tgt = Number.isFinite(Number(target)) ? Number(target) : DEFAULT_TARGET;
    const steps = [];
    const discarded = new Set();

    const getDiscardedIndices = () => Array.from(discarded).sort((a, b) => a - b);
    const buildStep = ({
        type,
        description,
        leftPointer = -1,
        rightPointer = -1,
        indices = [],
        discardedIndices = [],
        foundPair = [],
        decision = '',
        sum = null
    }) => ({
        type,
        description,
        arraySnapshot: [...arr],
        indices,
        sortedIndices: discardedIndices,
        leftPointer,
        rightPointer,
        leftValue: leftPointer >= 0 && leftPointer < arr.length ? arr[leftPointer] : null,
        rightValue: rightPointer >= 0 && rightPointer < arr.length ? arr[rightPointer] : null,
        sum,
        target: tgt,
        discardedIndices,
        foundPair,
        decision
    });

    let left = 0;
    let right = arr.length - 1;
    let found = false;

    steps.push(buildStep({
        type: 'info',
        description: 'Two pointers use one index from the left and one from the right to avoid checking every pair.',
        leftPointer: left,
        rightPointer: right,
        decision: 'Begin with the outermost pair.'
    }));

    steps.push(buildStep({
        type: 'init',
        description: `Initialize Left at ${arr[left]} and Right at ${arr[right]} in the sorted array [${arr.join(', ')}].`,
        leftPointer: left,
        rightPointer: right,
        indices: [left, right],
        decision: 'Compare the two ends first.'
    }));

    while (left < right) {
        const sum = arr[left] + arr[right];
        const discardedIndices = getDiscardedIndices();

        steps.push(buildStep({
            type: 'compare',
            description: `Compare ${arr[left]} + ${arr[right]} = ${sum} with target ${tgt}.`,
            leftPointer: left,
            rightPointer: right,
            indices: [left, right],
            discardedIndices,
            sum,
            decision: sum === tgt
                ? 'The pair matches the target.'
                : sum < tgt
                    ? 'The sum is too small, so move Left right.'
                    : 'The sum is too large, so move Right left.'
        }));

        if (sum === tgt) {
            found = true;
            steps.push(buildStep({
                type: 'found',
                description: `Found the pair ${arr[left]} and ${arr[right]}.`,
                leftPointer: left,
                rightPointer: right,
                indices: [left, right],
                discardedIndices,
                foundPair: [left, right],
                sum,
                decision: 'Stop because the target sum is reached.'
            }));
            break;
        }

        if (sum < tgt) {
            discarded.add(left);
            left += 1;
            steps.push(buildStep({
                type: 'move-left',
                description: `Because ${sum} is smaller than ${tgt}, discard ${arr[left - 1]} and move Left to ${arr[left]}.`,
                leftPointer: left,
                rightPointer: right,
                indices: [left, right],
                discardedIndices: getDiscardedIndices(),
                sum,
                decision: 'Moving Left right increases the sum in a sorted array.'
            }));
        } else {
            discarded.add(right);
            right -= 1;
            steps.push(buildStep({
                type: 'move-right',
                description: `Because ${sum} is larger than ${tgt}, discard ${arr[right + 1]} and move Right to ${arr[right]}.`,
                leftPointer: left,
                rightPointer: right,
                indices: [left, right],
                discardedIndices: getDiscardedIndices(),
                sum,
                decision: 'Moving Right left decreases the sum in a sorted array.'
            }));
        }
    }

    if (!found) {
        steps.push(buildStep({
            type: 'not-found',
            description: 'No valid pair remains because the pointers have met or crossed.',
            leftPointer: left,
            rightPointer: right,
            discardedIndices: getDiscardedIndices(),
            decision: 'All impossible pairs were removed one by one.'
        }));
    }

    steps.push(buildStep({
        type: 'completed',
        description: 'Two Pointers complete. Each pointer only moves in one direction, so the scan stays linear.',
        leftPointer: found ? left : -1,
        rightPointer: found ? right : -1,
        discardedIndices: getDiscardedIndices(),
        foundPair: found ? [left, right] : [],
        decision: 'Time Complexity: O(n) | Space Complexity: O(1).'
    }));

    return steps;
};
