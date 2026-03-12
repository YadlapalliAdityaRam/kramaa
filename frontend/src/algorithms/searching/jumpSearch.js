export const generateJumpSearchSteps = (array, target) => {
    const steps = [];
    const arr = [...array].sort((a, b) => a - b);
    const n = arr.length;
    const jumpSize = Math.floor(Math.sqrt(n));

    steps.push({
        type: 'info',
        description: `📚 Jump Search: For target ${target}. The array is sorted. Jump size = √${n} = ${jumpSize}.`,
        arraySnapshot: [...arr],
        jumpSize: jumpSize,
        prev: 0,
        curr: 0,
        scanIndex: null
    });

    let prev = 0;
    let curr = jumpSize;

    steps.push({
        type: 'jumping',
        description: `🚀 Starting jumps from index 0. We will jump by ${jumpSize} blocks until we pass the target.`,
        arraySnapshot: [...arr],
        jumpSize: jumpSize,
        prev: prev,
        curr: Math.min(curr, n - 1),
        scanIndex: null
    });

    // Jump phase
    while (curr < n && arr[curr] <= target) {
        if (arr[curr] === target) {
            steps.push({
               type: 'found',
               description: `🎯 Target ${target} found perfectly on a jump boundary at index ${curr}!`,
               arraySnapshot: [...arr],
               jumpSize: jumpSize,
               prev: prev,
               curr: curr,
               scanIndex: curr
            });
            return steps;
        }

        steps.push({
            type: 'jumping',
            description: `🦘 Jump check: arr[${curr}] is ${arr[curr]}. ${arr[curr]} < ${target}. Jumping ahead by ${jumpSize}.`,
            arraySnapshot: [...arr],
            jumpSize: jumpSize,
            prev: prev,
            curr: curr,
            scanIndex: null
        });
        prev = curr;
        curr += jumpSize;
    }

    // Adjust curr if we overshot the array
    if (curr >= n) {
        curr = n;
    }

    steps.push({
        type: 'jump-stop',
        description: `🛑 Stopped jumping. The target ${target} must be between index ${prev} and ${curr - 1}. Starting linear scan.`,
        arraySnapshot: [...arr],
        jumpSize: jumpSize,
        prev: prev,
        curr: curr - 1,
        scanIndex: prev
    });

    // Linear scan phase
    for (let i = prev; i < curr; i++) {
        steps.push({
            type: 'linear-scan',
            description: `🔍 Linear scan: checking index ${i} (value ${arr[i]}) against target ${target}.`,
            arraySnapshot: [...arr],
            jumpSize: jumpSize,
            prev: prev,
            curr: curr - 1,
            scanIndex: i
        });

        if (arr[i] === target) {
            steps.push({
                type: 'found',
                description: `🎯 Found target ${target} at index ${i}!`,
                arraySnapshot: [...arr],
                jumpSize: jumpSize,
                prev: prev,
                curr: curr - 1,
                scanIndex: i
            });
            return steps;
        }

        if (arr[i] > target) {
            break;
        }
    }

    steps.push({
        type: 'not-found',
        description: `🚫 Target ${target} not found in the identified block. It does not exist in the array.`,
        arraySnapshot: [...arr],
        jumpSize: jumpSize,
        prev: prev,
        curr: curr - 1,
        scanIndex: null
    });

    return steps;
};
