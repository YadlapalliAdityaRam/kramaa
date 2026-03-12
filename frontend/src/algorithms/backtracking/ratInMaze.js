// Rat in a Maze — Grid path exploration with backtracking
export const generateRatInMazeSteps = (customMaze) => {
    // If customMaze is provided and is a 2D array, use it. Otherwise use default.
    let maze;
    if (Array.isArray(customMaze) && Array.isArray(customMaze[0])) {
        maze = customMaze;
    } else {
        const n = 4;
        maze = Array.from({ length: n }, () => Array(n).fill(1));
        maze[1][1] = 0; maze[2][2] = 0; maze[0][3] = 0;
        maze[0][0] = 1; maze[n - 1][n - 1] = 1;
    }

    const n = maze.length;
    const steps = [];
    const sol = Array.from({ length: n }, () => Array(n).fill(0));

    const getSnapshot = (type, r, c, description) => ({
        type,
        r, c, // current rat position
        grid: maze.map((row, ri) =>
            row.map((cell, ci) => ({
                value: cell,
                isPath: sol[ri][ci] === 1,
                isBacktrack: false // Will be set specifically
            }))
        ),
        description
    });

    steps.push({
        ...getSnapshot('info', 0, 0, `📚 Rat in a Maze: Find a path from (0,0) to (${n - 1},${n - 1}). Dark cells are walls.`),
        isInitial: true
    });

    let solved = false;

    const solve = (r, c) => {
        if (solved) return;

        // Check bounds and constraints
        if (r < 0 || c < 0 || r >= n || c >= n || maze[r][c] === 0 || sol[r][c] === 1) return;

        // Mark cell in solution path
        sol[r][c] = 1;

        let step = getSnapshot('compare', r, c, `🐀 Move to (${r},${c}). Exploring...`);
        steps.push(step);

        // Destination check
        if (r === n - 1 && c === n - 1) {
            solved = true;
            steps.push(getSnapshot('completed', r, c, `🎯 Reached destination! Path found!`));
            return;
        }

        // Move Down
        solve(r + 1, c);

        // Move Right
        if (!solved) solve(r, c + 1);

        // Move Up
        if (!solved) solve(r - 1, c);

        // Move Left
        if (!solved) solve(r, c - 1);

        if (!solved) {
            // Backtrack
            sol[r][c] = 0;
            let backtrackStep = getSnapshot('swap', r, c, `🔙 Dead end at (${r},${c}). Backtracking...`);
            // Specifically mark this cell as backtracking for UI feedback
            backtrackStep.grid[r][c].isBacktrack = true;
            steps.push(backtrackStep);
        }
    };

    solve(0, 0);

    if (!solved) {
        steps.push(getSnapshot('completed', 0, 0, `❌ No path found from (0,0) to (${n - 1},${n - 1}).`));
    }

    return steps;
};
