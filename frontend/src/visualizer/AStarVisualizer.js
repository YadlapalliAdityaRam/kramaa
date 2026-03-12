import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './AStarVisualizer.css';

const DEFAULT_ROWS = 30;
const DEFAULT_COLS = 50;
const LIMITS = { maxRows: 70, maxCols: 90, maxCells: 5000 };
const SPEED_MS = { slow: 460, normal: 220, fast: 90 };
const TOOLS = ['wall', 'erase', 'start', 'goal'];

const DIR4 = [
    { dr: -1, dc: 0, cost: 1 }, { dr: 1, dc: 0, cost: 1 },
    { dr: 0, dc: -1, cost: 1 }, { dr: 0, dc: 1, cost: 1 }
];
const DIR8 = [...DIR4, { dr: -1, dc: -1, cost: Math.SQRT2 }, { dr: -1, dc: 1, cost: Math.SQRT2 }, { dr: 1, dc: -1, cost: Math.SQRT2 }, { dr: 1, dc: 1, cost: Math.SQRT2 }];
const keyFor = (r, c) => `${r},${c}`;

const makeCell = (row, col, isWall = false) => ({
    row, col, isWall,
    gCost: Number.POSITIVE_INFINITY, hCost: 0, fCost: Number.POSITIVE_INFINITY,
    isOpen: false, isClosed: false, isCurrent: false, isPath: false, isVisited: false, pulse: 0, parent: null
});
const cloneGrid = (grid) => grid.map((row) => row.map((c) => ({ ...c })));
const resetGridState = (grid) => grid.map((row) => row.map((c) => ({ ...c, gCost: Number.POSITIVE_INFINITY, hCost: 0, fCost: Number.POSITIVE_INFINITY, isOpen: false, isClosed: false, isCurrent: false, isPath: false, isVisited: false, pulse: 0, parent: null })));

const buildGrid = ({ rows, cols, start, goal, wallSet }) => {
    const out = [];
    for (let r = 0; r < rows; r += 1) {
        const line = [];
        for (let c = 0; c < cols; c += 1) {
            const isWall = wallSet?.has(keyFor(r, c)) && !(r === start.row && c === start.col) && !(r === goal.row && c === goal.col);
            line.push(makeCell(r, c, Boolean(isWall)));
        }
        out.push(line);
    }
    return out;
};

const parseCoord = (text) => {
    const m = String(text || '').trim().match(/-?\d+/g);
    if (!m || m.length < 2) return null;
    const row = Number.parseInt(m[0], 10);
    const col = Number.parseInt(m[1], 10);
    return Number.isInteger(row) && Number.isInteger(col) ? { row, col } : null;
};
const parseObstacles = (text) => {
    const rows = String(text || '').split(/\n|;/).map((s) => s.trim()).filter(Boolean);
    const points = [];
    for (const row of rows) {
        const p = parseCoord(row);
        if (!p) return { error: `Invalid obstacle coordinate: "${row}"`, points: [] };
        points.push(p);
    }
    return { error: null, points };
};
const fmt = (v) => (Number.isFinite(v) ? Number(v).toFixed(2) : 'INF');

export default function AStarVisualizer() {
    const [mode, setMode] = useState('grid');
    const [gridSize, setGridSize] = useState({ rows: DEFAULT_ROWS, cols: DEFAULT_COLS });
    const [startPos, setStartPos] = useState({ row: 5, col: 5 });
    const [goalPos, setGoalPos] = useState({ row: 24, col: 44 });
    const [grid, setGrid] = useState(() => buildGrid({ rows: DEFAULT_ROWS, cols: DEFAULT_COLS, start: { row: 5, col: 5 }, goal: { row: 24, col: 44 }, wallSet: new Set() }));
    const [movement, setMovement] = useState('4');
    const [heuristic, setHeuristic] = useState('manhattan');
    const [speed, setSpeed] = useState('normal');
    const [stepMode, setStepMode] = useState(false);
    const [tool, setTool] = useState('wall');
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState('Set start/goal and draw walls, then run A*.');
    const [error, setError] = useState('');
    const [stepCount, setStepCount] = useState(0);
    const [vw, setVw] = useState(() => window.innerWidth || 1200);
    const [panel, setPanel] = useState({ current: null, open: 0, closed: 0, g: null, h: null, f: null, hText: 'h(n) shown for current node.' });
    const [custom, setCustom] = useState({ rows: '5', cols: '5', start: '(0,0)', goal: '(4,4)', obstacles: '(1,2)\n(2,2)\n(3,1)', movement: '4', heuristic: 'manhattan' });

    const dragRef = useRef(false);
    const dragToolRef = useRef('wall');
    const tickRef = useRef(null);
    const engineRef = useRef({ init: false, finished: false, found: false, phase: 'search', grid: [], openList: [], openMap: new Map(), closed: new Set(), start: null, goal: null, movement: '4', heuristic: 'manhattan', currentKey: null, path: [], pathIdx: 0 });
    const cellSize = vw < 760 ? 14 : 18;

    const heur = useCallback((row, col, goal, kind) => {
        const dr = Math.abs(row - goal.row), dc = Math.abs(col - goal.col);
        if (kind === 'euclidean') return Math.hypot(dr, dc);
        if (kind === 'diagonal') return Math.max(dr, dc);
        return dr + dc;
    }, []);
    const hText = useCallback((row, col, goal, kind) => {
        const dr = Math.abs(row - goal.row), dc = Math.abs(col - goal.col);
        if (kind === 'euclidean') return `h = sqrt((${dr})^2 + (${dc})^2) = ${fmt(Math.hypot(dr, dc))}`;
        if (kind === 'diagonal') return `h = max(${dr}, ${dc}) = ${Math.max(dr, dc)}`;
        return `h = |${row}-${goal.row}| + |${col}-${goal.col}| = ${dr + dc}`;
    }, []);

    const stopLoop = useCallback(() => {
        if (tickRef.current) {
            window.clearInterval(tickRef.current);
            tickRef.current = null;
        }
    }, []);

    const resetEngine = useCallback((nextGrid) => {
        engineRef.current = { init: false, finished: false, found: false, phase: 'search', grid: nextGrid ? cloneGrid(nextGrid) : [], openList: [], openMap: new Map(), closed: new Set(), start: null, goal: null, movement, heuristic, currentKey: null, path: [], pathIdx: 0 };
        setStepCount(0);
        setPanel({ current: null, open: 0, closed: 0, g: null, h: null, f: null, hText: 'h(n) shown for current node.' });
    }, [heuristic, movement]);

    const initSearch = useCallback(() => {
        setError('');
        const rows = grid.length, cols = grid[0]?.length || 0;
        if (!rows || !cols) return setError('Grid is empty.'), false;
        if (startPos.row < 0 || startPos.col < 0 || startPos.row >= rows || startPos.col >= cols || goalPos.row < 0 || goalPos.col < 0 || goalPos.row >= rows || goalPos.col >= cols) return setError('Start or goal outside grid.'), false;
        const base = resetGridState(grid);
        if (base[startPos.row][startPos.col].isWall) return setError('Start cannot be a wall.'), false;
        if (base[goalPos.row][goalPos.col].isWall) return setError('Goal cannot be a wall.'), false;

        const eng = engineRef.current;
        eng.init = true; eng.finished = false; eng.found = false; eng.phase = 'search';
        eng.grid = base; eng.openList = []; eng.openMap = new Map(); eng.closed = new Set();
        eng.start = { ...startPos }; eng.goal = { ...goalPos }; eng.movement = movement; eng.heuristic = heuristic; eng.currentKey = null; eng.path = []; eng.pathIdx = 0;
        setStepCount(0);

        if (startPos.row === goalPos.row && startPos.col === goalPos.col) {
            const s = eng.grid[startPos.row][startPos.col];
            s.gCost = 0; s.hCost = 0; s.fCost = 0; s.isPath = true;
            eng.finished = true; eng.found = true; eng.phase = 'done';
            setGrid(cloneGrid(eng.grid));
            setPanel({ current: { ...startPos }, open: 0, closed: 0, g: 0, h: 0, f: 0, hText: 'Start equals goal, shortest path length is 0.' });
            setStatus('Start equals goal. Path found immediately.');
            return true;
        }

        const s = eng.grid[startPos.row][startPos.col];
        s.gCost = 0; s.hCost = heur(startPos.row, startPos.col, eng.goal, heuristic); s.fCost = s.hCost; s.isOpen = true; s.pulse += 1;
        eng.openList.push(s); eng.openMap.set(keyFor(startPos.row, startPos.col), s);
        setGrid(cloneGrid(eng.grid));
        setPanel({ current: { ...startPos }, open: 1, closed: 0, g: 0, h: s.hCost, f: s.fCost, hText: hText(startPos.row, startPos.col, eng.goal, heuristic) });
        setStatus('A* initialized. Start node added to open set.');
        return true;
    }, [goalPos.col, goalPos.row, grid, hText, heur, heuristic, movement, startPos.col, startPos.row]);

    const stepOnce = useCallback(() => {
        const eng = engineRef.current;
        if (!eng.init || eng.finished) return;
        if (eng.phase === 'path') {
            if (eng.pathIdx < eng.path.length) {
                const p = eng.path[eng.pathIdx];
                if (!(p.row === eng.start.row && p.col === eng.start.col)) eng.grid[p.row][p.col].isPath = true;
                eng.pathIdx += 1; setGrid(cloneGrid(eng.grid));
                if (eng.pathIdx >= eng.path.length) { eng.phase = 'done'; eng.finished = true; eng.found = true; setStatus(`Shortest path found with ${eng.path.length} steps.`); }
                return;
            }
            eng.phase = 'done'; eng.finished = true; eng.found = true; return;
        }
        if (eng.openList.length === 0) { eng.phase = 'done'; eng.finished = true; eng.found = false; setError('No path available between start and goal.'); setStatus('No path available. Open set exhausted.'); return; }

        let best = 0;
        for (let i = 1; i < eng.openList.length; i += 1) {
            const a = eng.openList[i], b = eng.openList[best];
            if (a.fCost < b.fCost || (a.fCost === b.fCost && a.hCost < b.hCost) || (a.fCost === b.fCost && a.hCost === b.hCost && a.gCost < b.gCost)) best = i;
        }
        const cur = eng.openList[best];
        eng.openList.splice(best, 1); eng.openMap.delete(keyFor(cur.row, cur.col));
        if (eng.currentKey) {
            const [pr, pc] = eng.currentKey.split(',').map((x) => Number.parseInt(x, 10));
            if (eng.grid[pr]?.[pc]) eng.grid[pr][pc].isCurrent = false;
        }
        cur.isOpen = false; cur.isClosed = true; cur.isVisited = true; cur.isCurrent = true; cur.pulse += 1;
        eng.currentKey = keyFor(cur.row, cur.col); eng.closed.add(eng.currentKey);

        if (cur.row === eng.goal.row && cur.col === eng.goal.col) {
            const rev = []; let ptr = cur;
            while (ptr) { rev.push({ row: ptr.row, col: ptr.col }); if (!ptr.parent) break; ptr = eng.grid[ptr.parent.row][ptr.parent.col]; }
            eng.path = rev.reverse(); eng.pathIdx = 0; eng.phase = 'path';
            setPanel({ current: { row: cur.row, col: cur.col }, open: eng.openList.length, closed: eng.closed.size, g: cur.gCost, h: cur.hCost, f: cur.fCost, hText: hText(cur.row, cur.col, eng.goal, eng.heuristic) });
            setGrid(cloneGrid(eng.grid)); setStepCount((s) => s + 1); setStatus('Goal reached. Reconstructing shortest path...'); return;
        }

        const dirs = eng.movement === '8' ? DIR8 : DIR4;
        for (const d of dirs) {
            const nr = cur.row + d.dr, nc = cur.col + d.dc;
            if (nr < 0 || nc < 0 || nr >= eng.grid.length || nc >= eng.grid[0].length) continue;
            const n = eng.grid[nr][nc], k = keyFor(nr, nc);
            if (n.isWall || eng.closed.has(k)) continue;
            const nextG = cur.gCost + d.cost;
            const isNew = !eng.openMap.has(k);
            if (isNew || nextG < n.gCost) {
                n.parent = { row: cur.row, col: cur.col }; n.gCost = nextG; n.hCost = heur(nr, nc, eng.goal, eng.heuristic); n.fCost = n.gCost + n.hCost; n.pulse += 1;
                if (isNew) { n.isOpen = true; eng.openMap.set(k, n); eng.openList.push(n); }
            }
        }
        setPanel({ current: { row: cur.row, col: cur.col }, open: eng.openList.length, closed: eng.closed.size, g: cur.gCost, h: cur.hCost, f: cur.fCost, hText: hText(cur.row, cur.col, eng.goal, eng.heuristic) });
        setGrid(cloneGrid(eng.grid)); setStepCount((s) => s + 1); setStatus(`Expanded node (${cur.row}, ${cur.col}).`);
    }, [hText, heur]);

    const run = useCallback(() => {
        if (!engineRef.current.init || engineRef.current.finished) { const ok = initSearch(); if (!ok) return; }
        if (stepMode) { setStatus('Step mode enabled. Use Step button.'); setIsRunning(false); return; }
        setError(''); setIsRunning(true);
    }, [initSearch, stepMode]);
    const pause = useCallback(() => { setIsRunning(false); setStatus('Paused.'); }, []);
    const step = useCallback(() => { if (!engineRef.current.init || engineRef.current.finished) { const ok = initSearch(); if (!ok) return; } setIsRunning(false); stepOnce(); }, [initSearch, stepOnce]);
    const resetViz = useCallback(() => { stopLoop(); setIsRunning(false); setError(''); const cleaned = resetGridState(grid); setGrid(cleaned); resetEngine(cleaned); setStatus('Visualization reset.'); }, [grid, resetEngine, stopLoop]);
    const restart = useCallback(() => { resetViz(); const ok = initSearch(); if (!ok) return; if (!stepMode) setIsRunning(true); }, [initSearch, resetViz, stepMode]);
    const clearGrid = useCallback(() => { stopLoop(); setIsRunning(false); setError(''); const clean = buildGrid({ rows: gridSize.rows, cols: gridSize.cols, start: startPos, goal: goalPos, wallSet: new Set() }); setGrid(clean); resetEngine(clean); setStatus('Grid cleared.'); }, [goalPos, gridSize.cols, gridSize.rows, resetEngine, startPos, stopLoop]);
    const randomMaze = useCallback(() => {
        stopLoop(); setIsRunning(false); setError('');
        const wallSet = new Set();
        for (let r = 0; r < gridSize.rows; r += 1) for (let c = 0; c < gridSize.cols; c += 1) if (!(r === startPos.row && c === startPos.col) && !(r === goalPos.row && c === goalPos.col) && Math.random() < 0.26) wallSet.add(keyFor(r, c));
        const next = buildGrid({ rows: gridSize.rows, cols: gridSize.cols, start: startPos, goal: goalPos, wallSet });
        setGrid(next); resetEngine(next); setStatus('Random maze generated.');
    }, [goalPos.col, goalPos.row, gridSize.cols, gridSize.rows, resetEngine, startPos.col, startPos.row, stopLoop]);

    const applyCellTool = useCallback((r, c, forcedTool = null) => {
        const action = forcedTool || tool;
        setGrid((prev) => {
            if (!prev[r]?.[c]) return prev;
            const next = cloneGrid(prev);
            const isStart = r === startPos.row && c === startPos.col;
            const isGoal = r === goalPos.row && c === goalPos.col;
            if (action === 'wall') { if (!isStart && !isGoal) next[r][c].isWall = true; }
            else if (action === 'erase') next[r][c].isWall = false;
            else if (action === 'start') { if (!isGoal) { next[r][c].isWall = false; setStartPos({ row: r, col: c }); } }
            else if (action === 'goal') { if (!isStart) { next[r][c].isWall = false; setGoalPos({ row: r, col: c }); } }
            return next;
        });
    }, [goalPos.col, goalPos.row, startPos.col, startPos.row, tool]);

    const runCustom = useCallback(() => {
        stopLoop(); setIsRunning(false); setError('');
        const rows = Number.parseInt(custom.rows, 10), cols = Number.parseInt(custom.cols, 10);
        if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows <= 0 || cols <= 0) return setError('Rows and columns must be positive integers.');
        if (rows > LIMITS.maxRows || cols > LIMITS.maxCols || rows * cols > LIMITS.maxCells) return setError(`Grid too large. Max is ${LIMITS.maxRows}x${LIMITS.maxCols} and ${LIMITS.maxCells} cells.`);
        const start = parseCoord(custom.start), goal = parseCoord(custom.goal);
        if (!start || !goal) return setError('Start and goal must be valid coordinates like (0,0).');
        if (start.row < 0 || start.col < 0 || start.row >= rows || start.col >= cols) return setError('Start coordinate outside grid.');
        if (goal.row < 0 || goal.col < 0 || goal.row >= rows || goal.col >= cols) return setError('Goal coordinate outside grid.');
        const obsParsed = parseObstacles(custom.obstacles); if (obsParsed.error) return setError(obsParsed.error);
        const walls = new Set();
        for (const p of obsParsed.points) { if (p.row < 0 || p.col < 0 || p.row >= rows || p.col >= cols) return setError(`Obstacle (${p.row},${p.col}) outside grid.`); walls.add(keyFor(p.row, p.col)); }
        if (walls.has(keyFor(start.row, start.col))) return setError('Start is blocked by obstacle.');
        if (walls.has(keyFor(goal.row, goal.col))) return setError('Goal is blocked by obstacle.');
        const next = buildGrid({ rows, cols, start, goal, wallSet: walls });
        setGridSize({ rows, cols }); setStartPos(start); setGoalPos(goal);
        setMovement(custom.movement === '8' ? '8' : '4');
        setHeuristic(['manhattan', 'euclidean', 'diagonal'].includes(custom.heuristic) ? custom.heuristic : 'manhattan');
        setGrid(next); resetEngine(next); setMode('grid'); setStatus('Custom input loaded. Running A*...');
        window.setTimeout(() => { const ok = initSearch(); if (!ok) return; if (!stepMode) setIsRunning(true); else setStatus('Custom input loaded. Step mode enabled, use Step.'); }, 20);
    }, [custom.cols, custom.goal, custom.heuristic, custom.movement, custom.obstacles, custom.rows, custom.start, initSearch, resetEngine, stepMode, stopLoop]);

    useEffect(() => { const onResize = () => setVw(window.innerWidth || 1200); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, []);
    useEffect(() => { stopLoop(); if (!isRunning) return undefined; tickRef.current = window.setInterval(() => { stepOnce(); if (engineRef.current.finished) setIsRunning(false); }, SPEED_MS[speed] || SPEED_MS.normal); return () => stopLoop(); }, [isRunning, speed, stepOnce, stopLoop]);
    useEffect(() => { if (stepMode && isRunning) setIsRunning(false); }, [isRunning, stepMode]);
    useEffect(() => () => stopLoop(), [stopLoop]);

    const onDown = (r, c) => { dragRef.current = true; dragToolRef.current = tool; applyCellTool(r, c, tool); };
    const onEnter = (r, c) => { if (!dragRef.current) return; if (dragToolRef.current === 'start' || dragToolRef.current === 'goal') return; applyCellTool(r, c, dragToolRef.current); };
    const release = () => { dragRef.current = false; };

    const cellClass = (cell, r, c) => {
        if (r === startPos.row && c === startPos.col) return 'cell cell-start';
        if (r === goalPos.row && c === goalPos.col) return 'cell cell-goal';
        if (cell.isWall) return 'cell cell-wall';
        if (cell.isPath) return 'cell cell-path';
        if (cell.isCurrent) return 'cell cell-current';
        if (cell.isOpen) return 'cell cell-open';
        if (cell.isClosed) return 'cell cell-closed';
        return 'cell cell-empty';
    };

    return (
        <div className="astar-visualizer visualizer-ui">
            <div className="astar-surface">
                <div className="astar-toolbar">
                    <div className="group"><label htmlFor="mode">Mode:</label><select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}><option value="grid">Visual Grid</option><option value="custom">Custom Input</option></select></div>
                    <div className="group"><label htmlFor="movement">Movement:</label><select id="movement" value={movement} onChange={(e) => setMovement(e.target.value)}><option value="4">4-direction</option><option value="8">8-direction</option></select></div>
                    <div className="group"><label htmlFor="heuristic">Heuristic:</label><select id="heuristic" value={heuristic} onChange={(e) => setHeuristic(e.target.value)}><option value="manhattan">Manhattan</option><option value="euclidean">Euclidean</option><option value="diagonal">Diagonal</option></select></div>
                    <div className="group"><label htmlFor="speed">Speed:</label><select id="speed" value={speed} onChange={(e) => setSpeed(e.target.value)}><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select></div>
                    <div className="group"><label htmlFor="stepMode">Step Mode</label><input id="stepMode" type="checkbox" checked={stepMode} onChange={(e) => setStepMode(e.target.checked)} /></div>
                </div>
            </div>

            {mode === 'custom' ? (
                <div className="astar-surface">
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Custom Input Mode</div>
                    <div className="astar-custom-grid">
                        <div><label htmlFor="cr">Rows</label><input id="cr" type="number" min="1" max={LIMITS.maxRows} value={custom.rows} onChange={(e) => setCustom((p) => ({ ...p, rows: e.target.value }))} /></div>
                        <div><label htmlFor="cc">Columns</label><input id="cc" type="number" min="1" max={LIMITS.maxCols} value={custom.cols} onChange={(e) => setCustom((p) => ({ ...p, cols: e.target.value }))} /></div>
                        <div><label htmlFor="cs">Start (row,col)</label><input id="cs" value={custom.start} onChange={(e) => setCustom((p) => ({ ...p, start: e.target.value }))} placeholder="(0,0)" /></div>
                        <div><label htmlFor="cg">Goal (row,col)</label><input id="cg" value={custom.goal} onChange={(e) => setCustom((p) => ({ ...p, goal: e.target.value }))} placeholder="(4,4)" /></div>
                        <div><label htmlFor="cm">Movement</label><select id="cm" value={custom.movement} onChange={(e) => setCustom((p) => ({ ...p, movement: e.target.value }))}><option value="4">4-direction</option><option value="8">8-direction</option></select></div>
                        <div><label htmlFor="ch">Heuristic</label><select id="ch" value={custom.heuristic} onChange={(e) => setCustom((p) => ({ ...p, heuristic: e.target.value }))}><option value="manhattan">Manhattan</option><option value="euclidean">Euclidean</option><option value="diagonal">Diagonal</option></select></div>
                        <div className="full"><label htmlFor="co">Obstacle Coordinates (one per line)</label><textarea id="co" value={custom.obstacles} onChange={(e) => setCustom((p) => ({ ...p, obstacles: e.target.value }))} placeholder={'(1,2)\n(2,2)\n(3,1)'} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                        <button className="astar-btn primary" type="button" onClick={runCustom}>Run Algorithm</button>
                        <button className="astar-btn" type="button" onClick={() => setMode('grid')}>Back to Grid</button>
                    </div>
                </div>
            ) : (
                <div className="astar-layout">
                    <div className="astar-surface">
                        <div className="astar-toolbar" style={{ marginBottom: 10 }}>
                            <div className="group"><label>Tool:</label>{TOOLS.map((name) => <button key={name} type="button" className={`astar-btn ${tool === name ? 'active-tool' : ''}`} onClick={() => setTool(name)}>{name.charAt(0).toUpperCase() + name.slice(1)}</button>)}</div>
                        </div>
                        <div className="astar-toolbar" style={{ marginBottom: 12 }}>
                            <button type="button" className="astar-btn success" onClick={run}>Start Visualization</button>
                            <button type="button" className="astar-btn warning" onClick={pause} disabled={!isRunning}>Pause</button>
                            <button type="button" className="astar-btn primary" onClick={step}>Step</button>
                            <button type="button" className="astar-btn" onClick={restart}>Restart</button>
                            <button type="button" className="astar-btn" onClick={resetViz}>Reset Visualization</button>
                            <button type="button" className="astar-btn danger" onClick={clearGrid}>Clear Grid</button>
                            <button type="button" className="astar-btn" onClick={randomMaze}>Generate Maze</button>
                        </div>
                        <div className="astar-grid-wrap" onMouseLeave={release}>
                            <svg className="astar-svg" width={gridSize.cols * cellSize} height={gridSize.rows * cellSize} onMouseUp={release} onTouchEnd={release}>
                                {grid.map((row, r) => row.map((cell, c) => (
                                    <g key={`${r}-${c}`}>
                                        <rect x={c * cellSize} y={r * cellSize} width={cellSize - 1} height={cellSize - 1} className={`${cellClass(cell, r, c)} ${cell.pulse > 0 ? 'cell-ripple' : ''}`} onMouseDown={() => onDown(r, c)} onMouseEnter={() => onEnter(r, c)}>
                                            <title>{`(${r},${c}) g=${fmt(cell.gCost)} h=${fmt(cell.hCost)} f=${fmt(cell.fCost)}`}</title>
                                        </rect>
                                    </g>
                                )))}
                            </svg>
                        </div>
                        <div style={{ marginTop: 10 }} className="astar-legend">
                            {[['Start', '#22c55e'], ['Goal', '#ef4444'], ['Wall', '#0b1020'], ['Open Set', '#2563eb'], ['Closed Set', '#94a3b8'], ['Current', '#facc15'], ['Shortest Path', '#22c55e']].map(([label, color]) => (
                                <span key={label} className="astar-legend-item"><span className="astar-chip" style={{ background: color }} />{label}</span>
                            ))}
                        </div>
                    </div>
                    <div className="astar-surface astar-panel">
                        <h3>Learning Panel</h3>
                        <div className="metric"><span>Current Node</span><strong>{panel.current ? `(${panel.current.row}, ${panel.current.col})` : '-'}</strong></div>
                        <div className="metric"><span>Open Set Size</span><strong>{panel.open}</strong></div>
                        <div className="metric"><span>Closed Set Size</span><strong>{panel.closed}</strong></div>
                        <div className="metric"><span>Step Count</span><strong>{stepCount}</strong></div>
                        <div className="metric"><span>g(n)</span><strong>{panel.g == null ? '-' : fmt(panel.g)}</strong></div>
                        <div className="metric"><span>h(n)</span><strong>{panel.h == null ? '-' : fmt(panel.h)}</strong></div>
                        <div className="metric"><span>f(n)</span><strong>{panel.f == null ? '-' : fmt(panel.f)}</strong></div>
                        <div className="formula"><div><strong>Formula:</strong> f(n) = g(n) + h(n)</div><div style={{ marginTop: 8 }}>{panel.hText}</div></div>
                    </div>
                </div>
            )}

            <div className="astar-surface">
                <div className="astar-status">{status}</div>
                {error && <div className="astar-status astar-error">{error}</div>}
            </div>
        </div>
    );
}
