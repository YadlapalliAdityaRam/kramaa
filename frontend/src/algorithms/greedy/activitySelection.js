export const generateActivitySelectionSteps = (activities) => {
    const steps = [];
    const acts = activities || [
        { id: 1, start: 1, end: 3 },
        { id: 2, start: 2, end: 5 },
        { id: 3, start: 4, end: 7 },
        { id: 4, start: 1, end: 8 },
        { id: 5, start: 5, end: 9 },
        { id: 6, start: 8, end: 10 },
        { id: 7, start: 9, end: 11 },
        { id: 8, start: 11, end: 14 },
        { id: 9, start: 13, end: 16 }
    ];

    // Sort by finish time (greedy property)
    const sorted = [...acts].sort((a, b) => a.end - b.end);
    const selected = [];
    const actStates = {};
    sorted.forEach(a => { actStates[a.id] = 'default'; });

    steps.push({
        type: 'activity',
        description: `Activity Selection: ${sorted.length} activities sorted by finish time. Using greedy approach.`,
        activities: sorted.map(a => ({ ...a })),
        actStates: { ...actStates },
        selected: [...selected]
    });

    // Always select the first activity
    selected.push(sorted[0]);
    actStates[sorted[0].id] = 'selected';
    let lastEnd = sorted[0].end;

    steps.push({
        type: 'activity',
        description: `Selected activity ${sorted[0].id} [${sorted[0].start}, ${sorted[0].end}). First activity always selected.`,
        activities: sorted.map(a => ({ ...a })),
        actStates: { ...actStates },
        selected: selected.map(a => ({ ...a }))
    });

    for (let i = 1; i < sorted.length; i++) {
        const act = sorted[i];
        actStates[act.id] = 'comparing';

        if (act.start >= lastEnd) {
            selected.push(act);
            actStates[act.id] = 'selected';
            lastEnd = act.end;

            steps.push({
                type: 'activity',
                description: `Activity ${act.id} [${act.start}, ${act.end}): start ${act.start} ≥ last end ${lastEnd - (act.end - lastEnd)}. Compatible! Selected.`,
                activities: sorted.map(a => ({ ...a })),
                actStates: { ...actStates },
                selected: selected.map(a => ({ ...a }))
            });
        } else {
            actStates[act.id] = 'rejected';

            steps.push({
                type: 'activity',
                description: `Activity ${act.id} [${act.start}, ${act.end}): start ${act.start} < last end ${lastEnd}. Overlaps! Skipped.`,
                activities: sorted.map(a => ({ ...a })),
                actStates: { ...actStates },
                selected: selected.map(a => ({ ...a }))
            });
        }
    }

    steps.push({
        type: 'activity-complete',
        description: `Activity Selection complete! Selected ${selected.length} out of ${sorted.length} activities: [${selected.map(a => a.id).join(', ')}].`,
        activities: sorted.map(a => ({ ...a })),
        actStates: { ...actStates },
        selected: selected.map(a => ({ ...a }))
    });

    return steps;
};
