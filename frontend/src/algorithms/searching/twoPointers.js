/**
 * Two Pointers Technique — Find pair with target sum in sorted array
 * 
 * Step types: init, compare, move-left, move-right, found, not-found, complete
 * Each step includes: array snapshot, pointer positions, description, color states
 */

export const generateTwoPointersSteps = (inputArray, target) => {
    const steps = [];
    
    // Use defaults if not provided
    let arr = (inputArray && inputArray.length > 0) ? [...inputArray] : [1, 2, 4, 6, 10];
    const tgt = target ?? 8;
    
    // Sort array for two pointers
    arr.sort((a, b) => a - b);

    const makeStep = (type, desc, left, right, indices, sortedIndices, extra = {}) => ({
        type,
        description: desc,
        array: [...arr],
        indices: indices || [],
        sortedIndices: sortedIndices || [],
        leftPointer: left,
        rightPointer: right,
        target: tgt,
        ...extra
    });

    // Intro
    steps.push(makeStep(
        'info',
        `📚 Two Pointers Technique: Use two indices moving inward from opposite ends of a sorted array to find a pair that sums to ${tgt}.`,
        -1, -1, [], []
    ));

    steps.push(makeStep(
        'info',
        `📋 Sorted Array: [${arr.join(', ')}]. Target Sum: ${tgt}. Place LEFT pointer at index 0 and RIGHT pointer at index ${arr.length - 1}.`,
        0, arr.length - 1, [0, arr.length - 1], []
    ));

    let left = 0;
    let right = arr.length - 1;
    let found = false;

    while (left < right) {
        const sum = arr[left] + arr[right];

        // Show current comparison
        steps.push(makeStep(
            'compare',
            `🔍 Comparing: arr[${left}]=${arr[left]} + arr[${right}]=${arr[right]} = ${sum}. Target = ${tgt}.`,
            left, right, [left, right], []
        ));

        if (sum === tgt) {
            // Found!
            steps.push(makeStep(
                'swap', // Use 'swap' type to get green highlight in AnimationCanvas
                `✅ Found! ${arr[left]} + ${arr[right]} = ${tgt}. Pair found at indices [${left}, ${right}].`,
                left, right, [left, right], [left, right],
                { foundPair: [left, right] }
            ));
            found = true;
            break;
        } else if (sum < tgt) {
            steps.push(makeStep(
                'compare',
                `⬆️ Sum ${sum} < Target ${tgt}. Need larger sum → move LEFT pointer right (${left} → ${left + 1}).`,
                left, right, [left], []
            ));
            left++;
        } else {
            steps.push(makeStep(
                'compare',
                `⬇️ Sum ${sum} > Target ${tgt}. Need smaller sum → move RIGHT pointer left (${right} → ${right - 1}).`,
                left, right, [right], []
            ));
            right--;
        }
    }

    if (!found) {
        steps.push(makeStep(
            'info',
            `❌ No pair found that sums to ${tgt}. Pointers have crossed.`,
            left, right, [], arr.map((_, i) => i)
        ));
    }

    // Final
    steps.push(makeStep(
        'info',
        `🎯 Two Pointers complete! Time: O(n), Space: O(1). Each element visited at most once.`,
        -1, -1, [], arr.map((_, i) => i)
    ));

    return steps;
};
