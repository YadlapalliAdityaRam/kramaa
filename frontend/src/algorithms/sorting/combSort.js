/**
 * Generates step-by-step visualization data for Comb Sort.
 * 
 * Each step contains:
 * - arraySnapshot: current state of the array
 * - activeIndices: indices being compared or swapped
 * - type: 'gap-update', 'compare', 'swap', 'sorted'
 * - description: human-readable explanation of the step
 * - stats: { gap, comparisons, swaps, iteration }
 */
export const generateCombSortSteps = (inputArray) => {
    const arr = [...inputArray];
    const n = arr.length;
    const steps = [];
    const shrinkFactor = 1.3;

    let gap = n;
    let swapped = true;
    let comparisons = 0;
    let swaps = 0;
    let iteration = 0;

    const getSnapshot = (config) => ({
        arraySnapshot: [...arr],
        activeIndices: [],
        type: 'info',
        description: '',
        stats: {
            gap: gap === 0 ? 1 : Math.floor(gap),
            comparisons,
            swaps,
            iteration
        },
        ...config
    });

    // Initial state
    steps.push(getSnapshot({
        description: `Starting Comb Sort. Initial gap is set to array length (${n}).`,
        type: 'info'
    }));

    while (gap > 1 || swapped) {
        iteration++;

        // Update gap
        gap = Math.floor(gap / shrinkFactor);
        if (gap < 1) gap = 1;

        steps.push(getSnapshot({
            type: 'gap-update',
            description: `New iteration. Reducing gap to ${gap} using shrink factor 1.3.`,
        }));

        swapped = false;

        // Perform a pass over the array with current gap
        for (let i = 0; i < n - gap; i++) {
            comparisons++;

            steps.push(getSnapshot({
                type: 'compare',
                activeIndices: [i, i + gap],
                description: `Comparing arr[${i}] and arr[${i + gap}] (gap: ${gap}).`,
            }));

            if (arr[i] > arr[i + gap]) {
                // Swap
                [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
                swaps++;
                swapped = true;

                steps.push(getSnapshot({
                    type: 'swap',
                    activeIndices: [i, i + gap],
                    description: `Swap: ${arr[i + gap]} < ${arr[i]}. Swapping elements.`,
                }));
            }
        }
    }

    // Final state
    steps.push(getSnapshot({
        type: 'final',
        description: 'Array successfully sorted using Comb Sort.',
        activeIndices: []
    }));

    return steps;
};
