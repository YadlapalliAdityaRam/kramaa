// Cycle Sort — Minimize writes by placing elements directly into final position
// This version generates rich visualization steps for the dedicated visualizer.

export const generateCycleSortSteps = (inputArray) => {
    const arr = [...(inputArray && inputArray.length > 0 ? inputArray : [5, 2, 8, 4, 1, 9, 3, 7])]
        .map(v => Math.max(1, Math.min(999, Math.round(Number(v) || 1))));

    const n = arr.length;
    const steps = [];
    let writes = 0;
    const sortedIndices = [];

    const getSnapshot = (type, params) => ({
        type,
        array: [...arr],
        sortedIndices: [...sortedIndices],
        writes,
        ...params
    });

    steps.push(getSnapshot('info', {
        description: "📚 Cycle Sort: This algorithm sorts by finding the correct position for each element and placing it there directly. It minimizes the total number of writes to the array.",
        heldItem: null,
        heldFrom: -1,
        currentPos: -1,
        scanningIdx: -1,
        targetPos: -1
    }));

    for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
        let item = arr[cycleStart];
        let pos = cycleStart;

        // Step: Pick up item from cycleStart
        steps.push(getSnapshot('pickup', {
            description: `🚀 Starting a new cycle at index ${cycleStart}. Picking up element ${item}.`,
            heldItem: item,
            heldFrom: cycleStart,
            currentPos: cycleStart,
            scanningIdx: -1,
            targetPos: -1
        }));

        // Step: Find correct position by counting smaller elements
        for (let i = cycleStart + 1; i < n; i++) {
            steps.push(getSnapshot('count', {
                description: `🔍 Counting elements smaller than ${item}. Checking index ${i} (${arr[i]}).`,
                heldItem: item,
                heldFrom: cycleStart,
                currentPos: cycleStart,
                scanningIdx: i,
                targetPos: pos
            }));
            if (arr[i] < item) {
                pos++;
            }
        }

        // If item is already in correct position
        if (pos === cycleStart) {
            sortedIndices.push(cycleStart);
            steps.push(getSnapshot('in-place', {
                description: `✅ Element ${item} is already in its correct position.`,
                heldItem: null,
                heldFrom: -1,
                currentPos: -1,
                scanningIdx: -1,
                targetPos: pos
            }));
            continue;
        }

        // Handle duplicates: move to next available slot
        while (item === arr[pos]) {
            pos++;
            steps.push(getSnapshot('duplicate', {
                description: `👯 Found duplicate at index ${pos - 1}. Moving to the next available slot at index ${pos}.`,
                heldItem: item,
                heldFrom: cycleStart,
                currentPos: cycleStart,
                scanningIdx: -1,
                targetPos: pos
            }));
        }

        // Step: Place item at target position
        const displacedItem = arr[pos];
        arr[pos] = item;
        writes++;

        steps.push(getSnapshot('place', {
            description: `📥 Placing ${item} at its correct position (index ${pos}). Element ${displacedItem} is now displaced.`,
            heldItem: displacedItem,
            heldFrom: pos,
            currentPos: pos,
            scanningIdx: -1,
            targetPos: pos
        }));

        item = displacedItem;

        // Keep rotating the cycle
        while (pos !== cycleStart) {
            pos = cycleStart;

            // Re-calculate target for the new held item
            steps.push(getSnapshot('rotate-start', {
                description: `🔄 Finding the correct position for the displaced element ${item}.`,
                heldItem: item,
                heldFrom: -1,
                currentPos: -1,
                scanningIdx: -1,
                targetPos: -1
            }));

            for (let i = cycleStart + 1; i < n; i++) {
                steps.push(getSnapshot('count', {
                    description: `🔍 Counting elements smaller than ${item}. Checking index ${i} (${arr[i]}).`,
                    heldItem: item,
                    heldFrom: -1,
                    currentPos: -1,
                    scanningIdx: i,
                    targetPos: pos
                }));
                if (arr[i] < item) pos++;
            }

            while (item === arr[pos]) {
                pos++;
                steps.push(getSnapshot('duplicate', {
                    description: `👯 Found duplicate at index ${pos - 1}. Moving to the next available slot.`,
                    heldItem: item,
                    heldFrom: -1,
                    currentPos: -1,
                    scanningIdx: -1,
                    targetPos: pos
                }));
            }

            // Place next item in cycle
            const nextDisplaced = arr[pos];
            arr[pos] = item;
            writes++;

            steps.push(getSnapshot('place', {
                description: `📥 Placing ${item} at its correct position (index ${pos}). ${pos === cycleStart ? 'The cycle is now closed!' : `Element ${nextDisplaced} is now displaced.`}`,
                heldItem: pos === cycleStart ? null : nextDisplaced,
                heldFrom: pos,
                currentPos: pos,
                scanningIdx: -1,
                targetPos: pos
            }));

            item = nextDisplaced;
        }

        sortedIndices.push(cycleStart);
    }

    // Mark remaining as sorted
    for (let i = 0; i < n; i++) {
        if (!sortedIndices.includes(i)) sortedIndices.push(i);
    }

    steps.push(getSnapshot('completed', {
        description: `🎯 Sorting complete! Used exactly ${writes} writes. Every element is now in its proper home.`,
        heldItem: null,
        heldFrom: -1,
        currentPos: -1,
        scanningIdx: -1,
        targetPos: -1
    }));

    return steps;
};
