const rangeInclusive = (start, end) => {
    if (start > end) return [];
    return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
};

const buildBlocks = (length, jumpSize) => {
    const size = Math.max(1, jumpSize);
    const blocks = [];

    for (let start = 0; start < length; start += size) {
        const end = Math.min(start + size - 1, length - 1);
        blocks.push({
            start,
            end,
            indices: rangeInclusive(start, end)
        });
    }

    return blocks;
};

const resolveBlockIndex = (blocks, activeBlock) => {
    if (!activeBlock) return -1;
    return blocks.findIndex(
        (block) => block.start === activeBlock.start && block.end === activeBlock.end
    );
};

const makeStep = ({
    type,
    description,
    arr,
    jumpSize,
    blocks,
    phase,
    comparison,
    decision,
    activeBlock = null,
    jumpIndex = null,
    linearIndex = null,
    foundIndex = null,
    checkedBoundaryIndices = [],
    discardedIndices = []
}) => ({
    type,
    description,
    arraySnapshot: [...arr],
    jumpSize,
    blocks,
    phase,
    comparison,
    decision,
    activeBlock,
    activeBlockIndex: resolveBlockIndex(blocks, activeBlock),
    jumpIndex,
    linearIndex,
    foundIndex,
    checkedBoundaryIndices,
    discardedIndices
});

export const generateJumpSearchSteps = (array, target) => {
    const arr = [...array].sort((a, b) => a - b);
    const n = arr.length;

    if (n === 0) {
        return [makeStep({
            type: 'not-found',
            description: 'The array is empty, so Jump Search cannot start.',
            arr,
            jumpSize: 0,
            blocks: [],
            phase: 'Completed',
            comparison: 'No elements are available.',
            decision: 'Provide a sorted array to begin.'
        })];
    }

    const jumpSize = Math.max(1, Math.floor(Math.sqrt(n)));
    const blocks = buildBlocks(n, jumpSize);
    const steps = [];

    let start = 0;
    let end = Math.min(jumpSize, n) - 1;
    let checkedBoundaryIndices = [];

    steps.push(makeStep({
        type: 'setup',
        description: `Array length is ${n}, so jump size = floor(sqrt(${n})) = ${jumpSize}. Jump Search checks the last element of each block first.`,
        arr,
        jumpSize,
        blocks,
        phase: 'Jump Phase',
        comparison: `The first boundary to test is index ${end} with value ${arr[end]}.`,
        decision: `Start with block 1 [0..${end}].`,
        activeBlock: blocks[0],
        jumpIndex: end
    }));

    while (start < n) {
        const activeBlock = { start, end };
        const blockNumber = resolveBlockIndex(blocks, activeBlock) + 1;
        checkedBoundaryIndices = [...checkedBoundaryIndices, end];

        let jumpDecision = `Target ${target} is inside block ${blockNumber}. Switch to linear search in this block.`;
        if (arr[end] < target) {
            jumpDecision = `Block ${blockNumber} is too small. Discard it and jump to the next block.`;
        } else if (arr[end] === target) {
            jumpDecision = `The target matches the block boundary, so the search is finished.`;
        }

        steps.push(makeStep({
            type: 'jump-check',
            description: `Check the boundary of block ${blockNumber} at index ${end}. Compare ${arr[end]} with target ${target}.`,
            arr,
            jumpSize,
            blocks,
            phase: 'Jump Phase',
            comparison: `arr[${end}] = ${arr[end]} ${arr[end] < target ? '<' : arr[end] > target ? '>' : '='} ${target}`,
            decision: jumpDecision,
            activeBlock,
            jumpIndex: end,
            checkedBoundaryIndices,
            discardedIndices: rangeInclusive(0, start - 1)
        }));

        if (arr[end] === target) {
            steps.push(makeStep({
                type: 'found',
                description: `Target ${target} is found at boundary index ${end}.`,
                arr,
                jumpSize,
                blocks,
                phase: 'Completed',
                comparison: `arr[${end}] = ${target}`,
                decision: `Return index ${end}.`,
                activeBlock,
                jumpIndex: end,
                foundIndex: end,
                checkedBoundaryIndices,
                discardedIndices: rangeInclusive(0, start - 1)
            }));
            return steps;
        }

        if (arr[end] < target) {
            const discardedIndices = rangeInclusive(0, end);
            const nextStart = end + 1;

            if (nextStart >= n) break;

            const nextEnd = Math.min(nextStart + jumpSize - 1, n - 1);

            steps.push(makeStep({
                type: 'jump-forward',
                description: `Everything up to index ${end} is smaller than ${target}, so jump forward to block ${resolveBlockIndex(blocks, { start: nextStart, end: nextEnd }) + 1}.`,
                arr,
                jumpSize,
                blocks,
                phase: 'Jump Phase',
                comparison: `Indices 0..${end} are discarded because their values are too small.`,
                decision: `Move the jump pointer to boundary index ${nextEnd}.`,
                activeBlock: { start: nextStart, end: nextEnd },
                jumpIndex: nextEnd,
                checkedBoundaryIndices,
                discardedIndices
            }));

            start = nextStart;
            end = nextEnd;
            continue;
        }

        steps.push(makeStep({
            type: 'block-found',
            description: `The target must be inside block ${blockNumber}, so stop jumping and scan indices ${start} to ${end} one by one.`,
            arr,
            jumpSize,
            blocks,
            phase: 'Linear Search Phase',
            comparison: `This is the first boundary that is not smaller than ${target}.`,
            decision: `Start linear search from index ${start}.`,
            activeBlock,
            jumpIndex: end,
            checkedBoundaryIndices,
            discardedIndices: rangeInclusive(0, start - 1)
        }));

        for (let i = start; i <= end; i += 1) {
            const discardedIndices = rangeInclusive(0, i - 1);
            let linearDecision = `Move one step to the right inside block ${blockNumber}.`;

            if (arr[i] === target) {
                linearDecision = `Target found at index ${i}.`;
            } else if (arr[i] > target) {
                linearDecision = `Current value is already larger than the target, so the search stops.`;
            }

            steps.push(makeStep({
                type: 'linear-check',
                description: `Linearly scan index ${i} inside block ${blockNumber}. Compare ${arr[i]} with target ${target}.`,
                arr,
                jumpSize,
                blocks,
                phase: 'Linear Search Phase',
                comparison: `arr[${i}] = ${arr[i]} ${arr[i] < target ? '<' : arr[i] > target ? '>' : '='} ${target}`,
                decision: linearDecision,
                activeBlock,
                linearIndex: i,
                checkedBoundaryIndices,
                discardedIndices
            }));

            if (arr[i] === target) {
                steps.push(makeStep({
                    type: 'found',
                    description: `Target ${target} is found during the linear scan at index ${i}.`,
                    arr,
                    jumpSize,
                    blocks,
                    phase: 'Completed',
                    comparison: `arr[${i}] = ${target}`,
                    decision: `Return index ${i}.`,
                    activeBlock,
                    linearIndex: i,
                    foundIndex: i,
                    checkedBoundaryIndices,
                    discardedIndices
                }));
                return steps;
            }

            if (arr[i] > target) {
                steps.push(makeStep({
                    type: 'not-found',
                    description: `The scan reached ${arr[i]}, which is larger than ${target}. Because the block is sorted, the target is not present.`,
                    arr,
                    jumpSize,
                    blocks,
                    phase: 'Completed',
                    comparison: `arr[${i}] = ${arr[i]} > ${target}`,
                    decision: 'Stop and return -1.',
                    activeBlock,
                    linearIndex: i,
                    checkedBoundaryIndices,
                    discardedIndices: rangeInclusive(0, i)
                }));
                return steps;
            }
        }

        steps.push(makeStep({
            type: 'not-found',
            description: `The target block was scanned completely, but ${target} was not found.`,
            arr,
            jumpSize,
            blocks,
            phase: 'Completed',
            comparison: `All values in block ${blockNumber} were checked.`,
            decision: 'Return -1.',
            activeBlock,
            checkedBoundaryIndices,
            discardedIndices: rangeInclusive(0, end)
        }));
        return steps;
    }

    steps.push(makeStep({
        type: 'not-found',
        description: `All jump boundaries are smaller than ${target}, so the target is not in the array.`,
        arr,
        jumpSize,
        blocks,
        phase: 'Completed',
        comparison: `Largest checked boundary value is ${arr[n - 1]}.`,
        decision: 'Return -1.',
        activeBlock: blocks[blocks.length - 1],
        jumpIndex: n - 1,
        checkedBoundaryIndices,
        discardedIndices: rangeInclusive(0, n - 1)
    }));

    return steps;
};
