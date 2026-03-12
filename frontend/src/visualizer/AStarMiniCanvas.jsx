import React from 'react';

const COLOR_MAP = {
    empty: 'rgba(148,163,184,0.2)',
    wall: '#0b1020',
    open: '#2563eb',
    closed: '#94a3b8',
    current: '#facc15',
    path: '#22c55e',
    start: '#22c55e',
    goal: '#ef4444'
};

const AStarMiniCanvas = ({ gridSnapshot = [], stats = null }) => {
    const rows = Array.isArray(gridSnapshot) ? gridSnapshot.length : 0;
    const cols = rows > 0 && Array.isArray(gridSnapshot[0]) ? gridSnapshot[0].length : 0;
    if (!rows || !cols) {
        return <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No A* grid data</div>;
    }

    const cell = 12;
    const width = cols * cell;
    const height = rows * cell;

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ flex: 1, overflow: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ display: 'block', background: 'rgba(2,6,23,0.35)' }}
                >
                    {gridSnapshot.map((row, rowIndex) =>
                        row.map((cellState, colIndex) => (
                            <rect
                                key={`${rowIndex}-${colIndex}`}
                                x={colIndex * cell}
                                y={rowIndex * cell}
                                width={cell - 1}
                                height={cell - 1}
                                fill={COLOR_MAP[cellState] || COLOR_MAP.empty}
                            />
                        ))
                    )}
                </svg>
            </div>
            {stats && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px 8px' }}>
                    <span>Open: {stats.openSize ?? 0}</span>
                    <span>Closed: {stats.closedSize ?? 0}</span>
                    <span>g: {Number.isFinite(stats.g) ? Number(stats.g).toFixed(2) : '-'}</span>
                    <span>h: {Number.isFinite(stats.h) ? Number(stats.h).toFixed(2) : '-'}</span>
                    <span>f: {Number.isFinite(stats.f) ? Number(stats.f).toFixed(2) : '-'}</span>
                    <span>{stats.heuristic || 'Heuristic'}</span>
                </div>
            )}
        </div>
    );
};

export default AStarMiniCanvas;
