const getDiscardedIndices = (length, low, high) => {
    const discarded = [];
    for (let index = 0; index < length; index++) {
        if (low === null || high === null || index < low || index > high) {
            discarded.push(index);
        }
    }
    return discarded;
};

const getRangeIndices = (low, high) => {
    if (!Number.isInteger(low) || !Number.isInteger(high) || low > high) return [];
    return Array.from({ length: high - low + 1 }, (_, offset) => low + offset);
};

export const generateInterpolationSearchSteps = (array, target) => {
    const arr = [...array].sort((a, b) => a - b);
    const steps = [];
    let low = 0;
    let high = arr.length - 1;

    const createStep = ({
        type,
        description,
        lowIndex = low,
        highIndex = high,
        posIndex = null,
        comparedIndex = null,
        formula = null,
        decision = '',
        comparison = '',
        foundIndex = null
    }) => ({
        type,
        description,
        arraySnapshot: [...arr],
        low: lowIndex,
        high: highIndex,
        pos: posIndex,
        comparedIndex,
        foundIndex,
        target,
        formula,
        decision,
        comparison,
        searchRangeIndices: getRangeIndices(lowIndex, highIndex),
        discardedIndices: getDiscardedIndices(arr.length, lowIndex, highIndex)
    });

    steps.push(createStep({
        type: 'info',
        lowIndex: null,
        highIndex: null,
        description: 'Interpolation Search predicts where the target should be in a sorted array. It works especially well when values are evenly spaced.',
        decision: 'Estimate first, then shrink the search range.'
    }));

    steps.push(createStep({
        type: 'initial-bounds',
        description: `Start with the full sorted array. low = 0 (value ${arr[0]}), high = ${high} (value ${arr[high]}).`,
        decision: 'The active search range is highlighted.'
    }));

    while (low <= high && target >= arr[low] && target <= arr[high]) {
        if (arr[low] === arr[high]) {
            const singleMatch = arr[low] === target;
            steps.push(createStep({
                type: 'compare-single',
                lowIndex: low,
                highIndex: high,
                posIndex: low,
                comparedIndex: low,
                description: `All values in the current range are ${arr[low]}, so probe index ${low} directly.`,
                comparison: `${arr[low]} ${singleMatch ? '=' : '≠'} ${target}`,
                decision: singleMatch ? 'The target matches the only possible value.' : 'The target is not in this range.'
            }));

            if (singleMatch) {
                steps.push(createStep({
                    type: 'found',
                    lowIndex: low,
                    highIndex: high,
                    posIndex: low,
                    comparedIndex: low,
                    foundIndex: low,
                    description: `Found target ${target} at index ${low}.`,
                    comparison: `${arr[low]} = ${target}`,
                    decision: 'Search complete.'
                }));
            } else {
                steps.push(createStep({
                    type: 'not-found',
                    lowIndex: null,
                    highIndex: null,
                    description: `Target ${target} is not in the array.`,
                    decision: 'The search range became invalid.'
                }));
            }
            return steps;
        }

        const numerator = (target - arr[low]) * (high - low);
        const denominator = arr[high] - arr[low];
        const pos = low + Math.floor(numerator / denominator);

        steps.push(createStep({
            type: 'estimate',
            lowIndex: low,
            highIndex: high,
            posIndex: pos,
            description: `Estimate the target index using the interpolation formula. Because ${target} is closer to ${arr[high]}, the probe shifts toward the right side of the range.`,
            formula: {
                low,
                high,
                lowValue: arr[low],
                highValue: arr[high],
                numerator,
                denominator,
                pos
            },
            decision: `Estimated probe index = ${pos}.`
        }));

        const comparison = `${arr[pos]} ${arr[pos] === target ? '=' : arr[pos] < target ? '<' : '>'} ${target}`;
        steps.push(createStep({
            type: 'compare',
            lowIndex: low,
            highIndex: high,
            posIndex: pos,
            comparedIndex: pos,
            description: `Compare the estimated value arr[${pos}] = ${arr[pos]} with target ${target}.`,
            formula: {
                low,
                high,
                lowValue: arr[low],
                highValue: arr[high],
                numerator,
                denominator,
                pos
            },
            comparison,
            decision: arr[pos] === target
                ? 'Target found at the estimated position.'
                : arr[pos] < target
                    ? 'The target must be to the right of the probe.'
                    : 'The target must be to the left of the probe.'
        }));

        if (arr[pos] === target) {
            steps.push(createStep({
                type: 'found',
                lowIndex: low,
                highIndex: high,
                posIndex: pos,
                comparedIndex: pos,
                foundIndex: pos,
                description: `Found target ${target} at index ${pos}.`,
                comparison,
                decision: 'Search complete.'
            }));
            return steps;
        }

        if (arr[pos] < target) {
            low = pos + 1;
            steps.push(createStep({
                type: 'move-left',
                lowIndex: low,
                highIndex: high,
                posIndex: pos,
                description: `${arr[pos]} is less than ${target}, so discard the left part including index ${pos} and move low to ${low}.`,
                comparison,
                decision: `New search range = [${low}, ${high}].`
            }));
        } else {
            high = pos - 1;
            steps.push(createStep({
                type: 'move-right',
                lowIndex: low,
                highIndex: high,
                posIndex: pos,
                description: `${arr[pos]} is greater than ${target}, so discard the right part including index ${pos} and move high to ${high}.`,
                comparison,
                decision: `New search range = [${low}, ${high}].`
            }));
        }
    }

    steps.push(createStep({
        type: 'not-found',
        lowIndex: null,
        highIndex: null,
        description: `Target ${target} is not in the array.`,
        decision: 'The search range became invalid or the target fell outside the active bounds.'
    }));

    return steps;
};
