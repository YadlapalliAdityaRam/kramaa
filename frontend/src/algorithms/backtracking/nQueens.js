// N-Queens — Constrained Backtracking Solver
// Supports user-placed fixed queens and finds ALL valid solutions.
export const generateNQueensSteps = (nInput, fixedQueens = []) => {
    const n = Math.min(Math.max(Number(nInput) || 4, 4), 8);
    const steps = [];

    // fixedQueens: [{row, col}, ...]
    const fixedMap = new Map(); // row -> col
    let hasInitialConflict = false;

    for (let i = 0; i < fixedQueens.length; i++) {
        const { row, col } = fixedQueens[i];
        fixedMap.set(row, col);
        for (let j = i + 1; j < fixedQueens.length; j++) {
            const o = fixedQueens[j];
            if (row === o.row || col === o.col || Math.abs(row - o.row) === Math.abs(col - o.col)) {
                hasInitialConflict = true;
            }
        }
    }

    // board[row] = col  or  -1 if empty (for dynamic queens only)
    const board = Array(n).fill(-1);

    // 1D snapshot: 0=empty, 90=dynamic queen, 95=fixed queen
    const toArr = () => {
        const arr = new Array(n * n).fill(0);
        for (let r = 0; r < n; r++) {
            if (fixedMap.has(r)) arr[r * n + fixedMap.get(r)] = 95;
            else if (board[r] !== -1) arr[r * n + board[r]] = 90;
        }
        return arr;
    };

    if (hasInitialConflict) {
        steps.push({
            type: 'error', indices: [], sortedIndices: [],
            description: '❌ Invalid starting configuration. Some queens are attacking each other. Adjust placements before solving.',
            arraySnapshot: toArr()
        });
        return steps;
    }

    steps.push({
        type: 'info', indices: [], sortedIndices: [],
        description: `📚 N-Queens: Place ${n} queens on a ${n}×${n} board. ${fixedQueens.length > 0 ? fixedQueens.length + ' fixed queen(s) locked.' : 'No fixed queens.'}`,
        arraySnapshot: toArr()
    });

    const isAttackedByFixed = (row, col) => {
        for (const [fRow, fCol] of fixedMap.entries()) {
            if (fCol === col || Math.abs(fRow - row) === Math.abs(fCol - col)) {
                return { attacked: true, fRow, fCol };
            }
        }
        return { attacked: false };
    };

    const isSafe = (row, col) => {
        // Check dynamic queens placed so far
        for (let r = 0; r < n; r++) {
            if (r === row || fixedMap.has(r)) continue;
            const c = board[r];
            if (c === -1) continue;
            if (c === col || Math.abs(r - row) === Math.abs(c - col)) {
                return { safe: false, cr: r, cc: c };
            }
        }
        // Check fixed queens
        const fc = isAttackedByFixed(row, col);
        if (fc.attacked) return { safe: false, cr: fc.fRow, cc: fc.fCol };
        return { safe: true };
    };

    let solutionCount = 0;

    const solve = (row) => {
        if (row === n) {
            solutionCount++;
            steps.push({
                type: 'completed', indices: [],
                sortedIndices: toArr().map((v, i) => v > 0 ? i : -1).filter(i => i >= 0),
                description: `🎯 Solution ${solutionCount} found! All ${n} queens placed safely.`,
                arraySnapshot: toArr(),
                isSolution: true
            });
            return;
        }

        // If this row has a fixed queen, validate and skip
        if (fixedMap.has(row)) {
            const col = fixedMap.get(row);
            const idx = row * n + col;

            steps.push({
                type: 'info', indices: [idx], sortedIndices: [],
                description: `🔒 Row ${row}: Fixed queen at (${row},${col}). Skipping.`,
                arraySnapshot: toArr()
            });

            // Must check it doesn't conflict with dynamic queens already placed
            let ok = true;
            for (let r = 0; r < row; r++) {
                if (fixedMap.has(r)) continue;
                const c = board[r];
                if (c === -1) continue;
                if (c === col || Math.abs(r - row) === Math.abs(c - col)) {
                    ok = false;
                    steps.push({
                        type: 'swap', indices: [idx, r * n + c], sortedIndices: [],
                        description: `❌ Fixed queen at (${row},${col}) conflicts with (${r},${c}). Backtracking.`,
                        arraySnapshot: toArr()
                    });
                    break;
                }
            }
            if (ok) solve(row + 1);
            return;
        }

        // Explore columns
        for (let col = 0; col < n; col++) {
            const idx = row * n + col;
            const check = isSafe(row, col);

            if (check.safe) {
                board[row] = col;
                steps.push({
                    type: 'compare', indices: [idx], sortedIndices: [],
                    description: `👑 Place queen at (${row},${col}). Safe.`,
                    arraySnapshot: toArr()
                });
                solve(row + 1);
                board[row] = -1;
                steps.push({
                    type: 'swap', indices: [idx], sortedIndices: [],
                    description: `🔙 Backtrack: Remove queen from (${row},${col}).`,
                    arraySnapshot: toArr()
                });
            } else {
                steps.push({
                    type: 'swap', indices: [idx, check.cr * n + check.cc], sortedIndices: [],
                    description: `⚠️ (${row},${col}) conflicts with (${check.cr},${check.cc}). Skip.`,
                    arraySnapshot: toArr()
                });
            }
        }
    };

    solve(0);

    if (solutionCount === 0) {
        steps.push({
            type: 'info', indices: [], sortedIndices: [],
            description: '❌ No valid N-Queens solution exists with these fixed queen placements. Try removing or repositioning some queens.',
            arraySnapshot: toArr(),
            isNoSolution: true
        });
    }

    return steps;
};
