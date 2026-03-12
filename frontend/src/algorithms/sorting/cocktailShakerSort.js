/**
 * Generates step-by-step visualization data for Cocktail Shaker Sort.
 * 
 * Each step contains:
 * - arraySnapshot: current state of the array
 * - activeIndices: indices being compared or swapped
 * - sortedIndices: indices that are confirmed to be in their final positions
 * - type: 'compare', 'swap', 'sorted', 'forward-start', 'backward-start', 'cycle-complete'
 * - description: human-readable explanation of the step
 * - direction: 'forward' or 'backward'
 * - stats: { comparisons, swaps, cycle, direction }
 */
export const generateCocktailShakerSortSteps = (inputArray) => {
    const arr = [...inputArray];
    const steps = [];
    const n = arr.length;
    let comparisons = 0;
    let swaps = 0;
    let cycle = 0;

    let start = 0;
    let end = n - 1;
    let swapped = true;

    const sortedIndices = [];

    const getSnapshot = (config) => ({
        arraySnapshot: [...arr],
        activeIndices: [],
        sortedIndices: [...sortedIndices],
        type: 'info',
        description: '',
        direction: 'forward',
        stats: {
            comparisons,
            swaps,
            cycle,
            passDirection: 'forward'
        },
        ...config
    });

    // Initial state
    steps.push(getSnapshot({
        description: 'Starting Cocktail Shaker Sort. The unsorted region is the entire array.',
        type: 'info'
    }));

    while (swapped) {
        swapped = false;
        cycle++;

        // Forward Pass (Left to Right)
        steps.push(getSnapshot({
            type: 'forward-start',
            description: `Cycle ${cycle}: Starting forward pass (Left → Right).`,
            stats: { comparisons, swaps, cycle, passDirection: 'forward' }
        }));

        for (let i = start; i < end; i++) {
            comparisons++;
            steps.push(getSnapshot({
                type: 'compare',
                activeIndices: [i, i + 1],
                description: `Forward: Comparing elements at index ${i} and ${i + 1}.`,
                stats: { comparisons, swaps, cycle, passDirection: 'forward' }
            }));

            if (arr[i] > arr[i + 1]) {
                // Swap
                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                swaps++;
                swapped = true;
                steps.push(getSnapshot({
                    type: 'swap',
                    activeIndices: [i, i + 1],
                    description: `Swap: ${arr[i + 1]} > ${arr[i]}. Swapping elements.`,
                    stats: { comparisons, swaps, cycle, passDirection: 'forward' }
                }));
            }
        }

        // The last element is now sorted
        sortedIndices.push(end);
        end--;

        if (!swapped) break;

        swapped = false;

        // Backward Pass (Right to Left)
        steps.push(getSnapshot({
            type: 'backward-start',
            description: `Cycle ${cycle}: Starting backward pass (Right ← Left).`,
            stats: { comparisons, swaps, cycle, passDirection: 'backward' }
        }));

        for (let i = end - 1; i >= start; i--) {
            comparisons++;
            steps.push(getSnapshot({
                type: 'compare',
                activeIndices: [i, i + 1],
                description: `Backward: Comparing elements at index ${i} and ${i + 1}.`,
                stats: { comparisons, swaps, cycle, passDirection: 'backward' }
            }));

            if (arr[i] > arr[i + 1]) {
                // Swap
                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                swaps++;
                swapped = true;
                steps.push(getSnapshot({
                    type: 'swap',
                    activeIndices: [i, i + 1],
                    description: `Swap: ${arr[i + 1]} < ${arr[i]}. Swapping elements.`,
                    stats: { comparisons, swaps, cycle, passDirection: 'backward' }
                }));
            }
        }

        // The first element is now sorted
        sortedIndices.push(start);
        start++;

        steps.push(getSnapshot({
            type: 'cycle-complete',
            description: `Cycle ${cycle} complete. Smallest moved to start, largest moved to end.`,
            stats: { comparisons, swaps, cycle, passDirection: 'none' }
        }));
    }

    // Mark remaining elements as sorted if any
    for (let i = 0; i < n; i++) {
        if (!sortedIndices.includes(i)) sortedIndices.push(i);
    }

    steps.push(getSnapshot({
        type: 'final',
        description: 'Sorting complete! All elements are in their correct positions.',
        activeIndices: [],
        sortedIndices: [...Array(n).keys()],
        stats: { comparisons, swaps, cycle, passDirection: 'complete' }
    }));

    return steps;
};
