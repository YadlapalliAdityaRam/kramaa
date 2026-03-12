// Tim Sort — Hybrid insertion sort + merge sort on runs
// Educational: shows small runs sorted with insertion, then merged

const MIN_RUN = 4; // Kept small for visualization

export const generateTimSortSteps = (inputArray) => {
    const arr = [...(inputArray && inputArray.length > 0 ? inputArray.slice(0, 15) : [5, 8, 9, 3, 4, 7, 1, 2])].map(Number);
    const steps = [];
    const n = arr.length;

    const pushStep = (type, desc, extras = {}) => {
        steps.push({
            type,
            description: desc,
            arraySnapshot: [...arr],
            ...extras
        });
    };

    pushStep('info', `Tim Sort: A hybrid stable sort. First, we identify small segments called "Runs" (size up to ${MIN_RUN}) and sort them using Insertion Sort.`);

    // --- Phase 1: Identify and Insertion Sort Runs ---
    const runs = [];
    for (let start = 0; start < n; start += MIN_RUN) {
        const end = Math.min(start + MIN_RUN - 1, n - 1);
        runs.push([start, end]);

        pushStep('identify-run', `Identify Run ${runs.length}: Indices [${start}..${end}]. Now applying Insertion Sort to this run.`, {
            activeRun: [start, end]
        });

        // Insertion Sort on the run
        for (let i = start + 1; i <= end; i++) {
            const key = arr[i];
            let j = i - 1;

            pushStep('compare', `Comparing ${key} with elements to its left in the active run.`, {
                activeRun: [start, end],
                compareIndices: [i, j]
            });

            while (j >= start && arr[j] > key) {
                pushStep('shift', `${arr[j]} is > ${key}. Shifting ${arr[j]} to the right.`, {
                    activeRun: [start, end],
                    compareIndices: [j, j + 1]
                });
                
                arr[j + 1] = arr[j];
                j--;
            }
            
            arr[j + 1] = key;

            if (j + 1 !== i) {
                pushStep('insert-complete', `Inserted ${key} into correct sorted position within the run.`, {
                    activeRun: [start, end],
                    sortedElements: Array.from({length: i - start + 1}, (_, idx) => start + idx)
                });
            }
        }

        pushStep('run-sorted', `Run ${runs.length} [${start}..${end}] is now fully sorted.`, {
            activeRun: [start, end],
            isRunComplete: true
        });
    }

    pushStep('phase-2', `Phase 1 Complete. All ${runs.length} Runs are individually sorted. Now for Phase 2: Merging runs together (like Merge Sort).`);

    // --- Phase 2: Merge Runs ---
    for (let size = MIN_RUN; size < n; size *= 2) {
        for (let left = 0; left < n; left += 2 * size) {
            const mid = Math.min(left + size - 1, n - 1);
            const right = Math.min(left + 2 * size - 1, n - 1);
            
            if (mid < right) {
                pushStep('merge-start', `Ready to Merge adjacent runs: Left [${left}..${mid}] and Right [${mid + 1}..${right}].`, {
                    leftRun: [left, mid],
                    rightRun: [mid + 1, right],
                    mergeTarget: [left, right]
                });

                // Standard Merge logic copying elements
                const leftArr = arr.slice(left, mid + 1);
                const rightArr = arr.slice(mid + 1, right + 1);
                let i = 0, j = 0, k = left;
                
                while (i < leftArr.length && j < rightArr.length) {
                    pushStep('merge-compare', `Comparing Left Run element ${leftArr[i]} with Right Run element ${rightArr[j]}.`, {
                        leftRun: [left, mid],
                        rightRun: [mid + 1, right],
                        mergeTarget: [left, right],
                        compareIndices: [left + i, mid + 1 + j]
                    });

                    if (leftArr[i] <= rightArr[j]) {
                        arr[k] = leftArr[i];
                        pushStep('merge-copy', `${leftArr[i]} ≤ ${rightArr[j]}. Copied ${leftArr[i]} into position ${k}.`, {
                            leftRun: [left, mid],
                            rightRun: [mid + 1, right],
                            mergeTarget: [left, right],
                            copiedIndex: k
                        });
                        i++;
                    } else {
                        arr[k] = rightArr[j];
                        pushStep('merge-copy', `${rightArr[j]} < ${leftArr[i]}. Copied ${rightArr[j]} into position ${k}.`, {
                            leftRun: [left, mid],
                            rightRun: [mid + 1, right],
                            mergeTarget: [left, right],
                            copiedIndex: k
                        });
                        j++;
                    }
                    k++;
                }

                while (i < leftArr.length) {
                    arr[k] = leftArr[i];
                    pushStep('merge-copy', `Right Run exhausted. Copying remaining Left element ${leftArr[i]} into position ${k}.`, {
                        leftRun: [left, mid],
                        rightRun: [mid + 1, right],
                        mergeTarget: [left, right],
                        copiedIndex: k
                    });
                    i++; k++;
                }

                while (j < rightArr.length) {
                    arr[k] = rightArr[j];
                    pushStep('merge-copy', `Left Run exhausted. Copying remaining Right element ${rightArr[j]} into position ${k}.`, {
                        leftRun: [left, mid],
                        rightRun: [mid + 1, right],
                        mergeTarget: [left, right],
                        copiedIndex: k
                    });
                    j++; k++;
                }

                pushStep('merge-complete', `Merge complete for segment [${left}..${right}].`, {
                    completedSegment: [left, right]
                });
            }
        }
    }

    pushStep('completed', `Tim Sort complete! Final Array: [${arr.join(', ')}].`, {
        sortedIndices: Array.from({ length: n }, (_, i) => i)
    });

    return steps;
};
