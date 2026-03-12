export const generateHeapSortSteps = (array, ascending = true) => {
    const steps = [];
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    const compare = (a, b) => ascending ? a < b : a > b;

    const pushStep = (type, desc, extras = {}) => {
        steps.push({
            type,
            description: desc,
            arraySnapshot: [...arr],
            sortedIndices: [...sortedIndices],
            ...extras
        });
    };

    const heapify = (size, rootIdx, depthDesc = "") => {
        let largest = rootIdx;
        const left = 2 * rootIdx + 1;
        const right = 2 * rootIdx + 2;

        pushStep('heapify-start', `${depthDesc}Checking subtree at root index ${rootIdx} (value ${arr[rootIdx]}).`, {
            heapSize: size, activeNode: rootIdx
        });

        // Check Left Child
        if (left < size) {
            pushStep('compare', `Comparing parent ${arr[largest]} with left child ${arr[left]}.`, {
                heapSize: size, activeNode: rootIdx, compareNodes: [largest, left]
            });
            if (compare(arr[largest], arr[left])) {
                largest = left;
                pushStep('compare-result', `Left child ${arr[left]} is larger. Updating largest to index ${left}.`, {
                    heapSize: size, activeNode: rootIdx, compareNodes: [largest]
                });
            }
        }

        // Check Right Child
        if (right < size) {
            pushStep('compare', `Comparing current largest ${arr[largest]} with right child ${arr[right]}.`, {
                heapSize: size, activeNode: rootIdx, compareNodes: [largest, right]
            });
            if (compare(arr[largest], arr[right])) {
                largest = right;
                pushStep('compare-result', `Right child ${arr[right]} is larger. Updating largest to index ${right}.`, {
                    heapSize: size, activeNode: rootIdx, compareNodes: [largest]
                });
            }
        }

        // If largest is not root
        if (largest !== rootIdx) {
            pushStep('swap', `Largest is not the root. Swapping ${arr[rootIdx]} and ${arr[largest]} to maintain heap property.`, {
                heapSize: size, activeNode: rootIdx, swapNodes: [rootIdx, largest]
            });

            [arr[rootIdx], arr[largest]] = [arr[largest], arr[rootIdx]];

            pushStep('swap-done', `Swap complete. We must now heapify the affected subtree at index ${largest}.`, {
                heapSize: size, activeNode: largest
            });

            heapify(size, largest, depthDesc + "↳ ");
        } else {
            pushStep('heapify-done', `Subtree at index ${rootIdx} already satisfies heap property.`, {
                heapSize: size, activeNode: rootIdx
            });
        }
    };

    // Phase 1: Build max-heap
    pushStep('info', `Phase 1: Build a ${ascending ? 'Max' : 'Min'} Heap. We start from the last non-leaf node (index ${Math.floor(n / 2) - 1}) and heapify upwards.`, { heapSize: n });

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(n, i);
    }

    pushStep('build-done', `${ascending ? 'Max' : 'Min'} Heap construction complete. The largest element (${arr[0]}) is now guaranteed to be at the root (index 0).`, { heapSize: n });

    // Phase 2: Extract elements
    pushStep('info', `Phase 2: Repeatedly swap the root (largest element) with the last unsorted element, reduce the heap size, and re-heapify.`, { heapSize: n });

    for (let i = n - 1; i > 0; i--) {
        pushStep('swap-root', `Swap root ${arr[0]} with the last unsorted element ${arr[i]}.`, {
            heapSize: i + 1, rootNode: 0, lastNode: i, swapNodes: [0, i]
        });

        [arr[0], arr[i]] = [arr[i], arr[0]];
        sortedIndices.push(i);

        pushStep('reduce-heap', `Element ${arr[i]} is now sorted at the end. Reduce active heap size from ${i + 1} to ${i}.`, {
            heapSize: i
        });

        pushStep('info', `The new root ${arr[0]} might violate the heap property. Heapifying the new root.`, {
            heapSize: i, activeNode: 0
        });

        heapify(i, 0);
    }

    sortedIndices.push(0);
    pushStep('completed', 'Array is fully sorted! The Heap Sort algorithm finishes in O(n log n) time.', { heapSize: 0 });

    return steps;
};
