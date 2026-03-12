const keyFor = (row, col) => `${row},${col}`;

const DIRECTIONS_4 = [
    { dr: -1, dc: 0, cost: 1 },
    { dr: 1, dc: 0, cost: 1 },
    { dr: 0, dc: -1, cost: 1 },
    { dr: 0, dc: 1, cost: 1 }
];

const DIRECTIONS_8 = [
    ...DIRECTIONS_4,
    { dr: -1, dc: -1, cost: Math.SQRT2 },
    { dr: -1, dc: 1, cost: Math.SQRT2 },
    { dr: 1, dc: -1, cost: Math.SQRT2 },
    { dr: 1, dc: 1, cost: Math.SQRT2 }
];

const heuristic = (row, col, goal, kind) => {
    const dr = Math.abs(row - goal.row);
    const dc = Math.abs(col - goal.col);
    if (kind === 'euclidean') return Math.hypot(dr, dc);
    if (kind === 'diagonal') return Math.max(dr, dc);
    return dr + dc;
};

const heuristicText = (row, col, goal, kind) => {
    const dr = Math.abs(row - goal.row);
    const dc = Math.abs(col - goal.col);
    if (kind === 'euclidean') return `h = sqrt((${dr})^2 + (${dc})^2)`;
    if (kind === 'diagonal') return `h = max(${dr}, ${dc})`;
    return `h = |${row}-${goal.row}| + |${col}-${goal.col}|`;
};

const buildGrid = (rows, cols, wallSet) => {
    const grid = [];
    for (let row = 0; row < rows; row += 1) {
        const line = [];
        for (let col = 0; col < cols; col += 1) {
            line.push({
                row,
                col,
                isWall: wallSet.has(keyFor(row, col)),
                isOpen: false,
                isClosed: false,
                isPath: false,
                isCurrent: false,
                gCost: Number.POSITIVE_INFINITY,
                hCost: 0,
                fCost: Number.POSITIVE_INFINITY,
                parent: null
            });
        }
        grid.push(line);
    }
    return grid;
};

const snapshotGrid = (grid, start, goal) =>
    grid.map((row) =>
        row.map((cell) => {
            if (cell.row === start.row && cell.col === start.col) return 'start';
            if (cell.row === goal.row && cell.col === goal.col) return 'goal';
            if (cell.isWall) return 'wall';
            if (cell.isPath) return 'path';
            if (cell.isCurrent) return 'current';
            if (cell.isOpen) return 'open';
            if (cell.isClosed) return 'closed';
            return 'empty';
        })
    );

const buildWallsFromData = (data, rows, cols, start, goal) => {
    const wallSet = new Set();
    const totalCells = rows * cols;
    const maxWalls = Math.floor(totalCells * 0.22);

    for (let i = 0; i < data.length; i += 1) {
        const value = Math.abs(Math.round(Number(data[i]) || 0));
        const primary = (value * 37 + i * 53 + 17) % totalCells;
        const secondary = (value * 19 + i * 29 + 7) % totalCells;
        const points = [primary, secondary];
        for (const point of points) {
            const row = Math.floor(point / cols);
            const col = point % cols;
            if ((row === start.row && col === start.col) || (row === goal.row && col === goal.col)) {
                continue;
            }
            wallSet.add(keyFor(row, col));
            if (wallSet.size >= maxWalls) return wallSet;
        }
    }
    return wallSet;
};

const pickBestOpenIndex = (openList) => {
    let best = 0;
    for (let i = 1; i < openList.length; i += 1) {
        const a = openList[i];
        const b = openList[best];
        if (
            a.fCost < b.fCost
            || (a.fCost === b.fCost && a.hCost < b.hCost)
            || (a.fCost === b.fCost && a.hCost === b.hCost && a.gCost < b.gCost)
        ) {
            best = i;
        }
    }
    return best;
};

const pushStep = (steps, grid, start, goal, description, openSize, closedSize, current, options) => {
    steps.push({
        type: 'astar',
        description,
        gridSnapshot: snapshotGrid(grid, start, goal),
        stats: {
            openSize,
            closedSize,
            current: current ? { row: current.row, col: current.col } : null,
            g: current ? current.gCost : null,
            h: current ? current.hCost : null,
            f: current ? current.fCost : null,
            movement: options.movementLabel,
            heuristic: options.heuristicLabel,
            heuristicFormula: current ? heuristicText(current.row, current.col, goal, options.heuristicKind) : options.heuristicFormula
        }
    });
};

export const generateAStarGridSteps = (data = [], _target, params = []) => {
    const rows = 14;
    const cols = 24;
    const start = { row: 0, col: 0 };
    const goal = { row: rows - 1, col: cols - 1 };

    const movementMode = Number(params?.[0]) === 2 ? '8' : '4';
    const heuristicMode = Number(params?.[1]) === 2 ? 'euclidean' : (Number(params?.[1]) === 3 ? 'diagonal' : 'manhattan');
    const directions = movementMode === '8' ? DIRECTIONS_8 : DIRECTIONS_4;
    const movementLabel = movementMode === '8' ? '8-direction' : '4-direction';
    const heuristicLabel = heuristicMode.charAt(0).toUpperCase() + heuristicMode.slice(1);

    const cleanData = Array.isArray(data) ? data : [];
    const wallSet = buildWallsFromData(cleanData, rows, cols, start, goal);
    const grid = buildGrid(rows, cols, wallSet);

    const steps = [];
    const openList = [];
    const openMap = new Map();
    const closedSet = new Set();

    const startNode = grid[start.row][start.col];
    startNode.isWall = false;
    startNode.gCost = 0;
    startNode.hCost = heuristic(start.row, start.col, goal, heuristicMode);
    startNode.fCost = startNode.hCost;
    startNode.isOpen = true;
    openList.push(startNode);
    openMap.set(keyFor(start.row, start.col), startNode);

    pushStep(
        steps,
        grid,
        start,
        goal,
        `Initialize A* with ${movementLabel} movement and ${heuristicLabel} heuristic. Start added to open set.`,
        openList.length,
        closedSet.size,
        startNode,
        {
            movementLabel,
            heuristicLabel,
            heuristicKind: heuristicMode,
            heuristicFormula: `f(n)=g(n)+h(n), h(n) from ${heuristicLabel}`
        }
    );

    let guard = 0;
    while (openList.length && guard < rows * cols * 5) {
        guard += 1;
        const currentIndex = pickBestOpenIndex(openList);
        const current = openList[currentIndex];
        openList.splice(currentIndex, 1);
        openMap.delete(keyFor(current.row, current.col));

        for (const row of grid) {
            for (const cell of row) {
                cell.isCurrent = false;
            }
        }

        current.isCurrent = true;
        current.isOpen = false;
        current.isClosed = true;
        closedSet.add(keyFor(current.row, current.col));

        pushStep(
            steps,
            grid,
            start,
            goal,
            `Selected node (${current.row}, ${current.col}) with lowest f=${current.fCost.toFixed(2)} from open set.`,
            openList.length,
            closedSet.size,
            current,
            {
                movementLabel,
                heuristicLabel,
                heuristicKind: heuristicMode,
                heuristicFormula: `f(n)=g(n)+h(n), h(n) from ${heuristicLabel}`
            }
        );

        if (current.row === goal.row && current.col === goal.col) {
            const path = [];
            let cursor = current;
            while (cursor) {
                path.push(cursor);
                if (!cursor.parent) break;
                cursor = grid[cursor.parent.row][cursor.parent.col];
            }
            path.reverse();

            for (let i = 1; i < path.length - 1; i += 1) {
                path[i].isPath = true;
                pushStep(
                    steps,
                    grid,
                    start,
                    goal,
                    `Reconstruct path step ${i}/${Math.max(1, path.length - 2)}.`,
                    openList.length,
                    closedSet.size,
                    current,
                    {
                        movementLabel,
                        heuristicLabel,
                        heuristicKind: heuristicMode,
                        heuristicFormula: `f(n)=g(n)+h(n), h(n) from ${heuristicLabel}`
                    }
                );
            }

            steps.push({
                type: 'astar-complete',
                description: `Path found. Nodes expanded: ${closedSet.size}. Path length: ${Math.max(path.length - 1, 0)}.`,
                gridSnapshot: snapshotGrid(grid, start, goal),
                stats: {
                    openSize: openList.length,
                    closedSize: closedSet.size,
                    current: { row: current.row, col: current.col },
                    g: current.gCost,
                    h: current.hCost,
                    f: current.fCost,
                    movement: movementLabel,
                    heuristic: heuristicLabel,
                    heuristicFormula: `Goal reached, final f=${current.fCost.toFixed(2)}`
                }
            });
            return steps;
        }

        for (const direction of directions) {
            const nextRow = current.row + direction.dr;
            const nextCol = current.col + direction.dc;
            if (nextRow < 0 || nextCol < 0 || nextRow >= rows || nextCol >= cols) continue;

            const neighbor = grid[nextRow][nextCol];
            const neighborKey = keyFor(nextRow, nextCol);
            if (neighbor.isWall || closedSet.has(neighborKey)) continue;

            const tentativeG = current.gCost + direction.cost;
            const isNewNode = !openMap.has(neighborKey);
            if (isNewNode || tentativeG < neighbor.gCost) {
                neighbor.parent = { row: current.row, col: current.col };
                neighbor.gCost = tentativeG;
                neighbor.hCost = heuristic(nextRow, nextCol, goal, heuristicMode);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;
                if (isNewNode) {
                    neighbor.isOpen = true;
                    openMap.set(neighborKey, neighbor);
                    openList.push(neighbor);
                }
            }
        }

        pushStep(
            steps,
            grid,
            start,
            goal,
            `Expanded neighbors of (${current.row}, ${current.col}). Open set now has ${openList.length} nodes.`,
            openList.length,
            closedSet.size,
            current,
            {
                movementLabel,
                heuristicLabel,
                heuristicKind: heuristicMode,
                heuristicFormula: `f(n)=g(n)+h(n), h(n) from ${heuristicLabel}`
            }
        );
    }

    steps.push({
        type: 'astar-complete',
        description: `No path found with current walls. Expanded ${closedSet.size} nodes.`,
        gridSnapshot: snapshotGrid(grid, start, goal),
        stats: {
            openSize: openList.length,
            closedSize: closedSet.size,
            current: null,
            g: null,
            h: null,
            f: null,
            movement: movementLabel,
            heuristic: heuristicLabel,
            heuristicFormula: 'Open set exhausted, no route to goal.'
        }
    });

    return steps;
};
