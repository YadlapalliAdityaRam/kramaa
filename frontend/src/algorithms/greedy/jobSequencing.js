// Job Sequencing with Deadlines — Greedy slot filling
// Generates rich visualization steps for the dedicated visualizer

const COLORS = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export const generateJobSequencingSteps = (jobs) => {
    const steps = [];

    // Enrich jobs with color and label
    const enriched = jobs.map((job, i) => ({
        ...job,
        label: job.id || `J${i + 1}`,
        color: COLORS[i % COLORS.length],
        originalIndex: i
    }));

    const maxDeadline = Math.max(...enriched.map(j => j.deadline));
    const slots = new Array(maxDeadline).fill(null);

    // ── Step 1: Init ──
    steps.push({
        type: 'init',
        jobs: enriched.map(j => ({ ...j, state: 'pending' })),
        slots: [...slots],
        maxDeadline,
        totalProfit: 0,
        currentJobIndex: -1,
        currentSlot: -1,
        description: `📋 Job Sequencing: ${jobs.length} jobs, ${maxDeadline} time slots. Goal: maximize profit by scheduling each job before its deadline. Strategy: sort by profit descending, assign to latest available slot.`
    });

    // ── Step 2: Sort ──
    const sorted = [...enriched].sort((a, b) => b.profit - a.profit);

    steps.push({
        type: 'sort',
        jobs: sorted.map(j => ({ ...j, state: 'pending' })),
        slots: [...slots],
        maxDeadline,
        totalProfit: 0,
        currentJobIndex: -1,
        currentSlot: -1,
        description: `📊 Sorted by profit (descending): ${sorted.map(j => `${j.label}($${j.profit})`).join(' > ')}.`
    });

    // ── Greedy assignment ──
    let totalProfit = 0;
    const jobStates = {};
    sorted.forEach(j => { jobStates[j.originalIndex] = 'pending'; });

    for (let i = 0; i < sorted.length; i++) {
        const job = sorted[i];

        // Consider step
        jobStates[job.originalIndex] = 'considering';
        steps.push({
            type: 'consider',
            jobs: sorted.map(j => ({ ...j, state: jobStates[j.originalIndex] })),
            slots: slots.map(s => s ? { ...s } : null),
            maxDeadline,
            totalProfit,
            currentJobIndex: i,
            currentSlot: -1,
            description: `🔍 Considering ${job.label}: profit=$${job.profit}, deadline=${job.deadline}. Looking for latest available slot ≤ ${job.deadline}...`
        });

        let placed = false;
        // Try to place in latest available slot before deadline
        for (let s = Math.min(job.deadline, maxDeadline) - 1; s >= 0; s--) {
            if (!slots[s]) {
                // Searching step
                steps.push({
                    type: 'search-slot',
                    jobs: sorted.map(j => ({ ...j, state: jobStates[j.originalIndex] })),
                    slots: slots.map(sl => sl ? { ...sl } : null),
                    maxDeadline,
                    totalProfit,
                    currentJobIndex: i,
                    currentSlot: s,
                    description: `📌 Slot ${s + 1} is free! Assigning ${job.label} ($${job.profit}) to slot ${s + 1}.`
                });

                slots[s] = { ...job };
                totalProfit += job.profit;
                jobStates[job.originalIndex] = 'scheduled';
                placed = true;

                steps.push({
                    type: 'placed',
                    jobs: sorted.map(j => ({ ...j, state: jobStates[j.originalIndex] })),
                    slots: slots.map(sl => sl ? { ...sl } : null),
                    maxDeadline,
                    totalProfit,
                    currentJobIndex: i,
                    currentSlot: s,
                    description: `✅ ${job.label} placed in slot ${s + 1}. Total profit: $${totalProfit}. Slots: [${slots.map((sl, idx) => sl ? sl.label : '—').join(', ')}].`
                });
                break;
            }
        }

        if (!placed) {
            jobStates[job.originalIndex] = 'rejected';
            steps.push({
                type: 'rejected',
                jobs: sorted.map(j => ({ ...j, state: jobStates[j.originalIndex] })),
                slots: slots.map(sl => sl ? { ...sl } : null),
                maxDeadline,
                totalProfit,
                currentJobIndex: i,
                currentSlot: -1,
                description: `❌ ${job.label} ($${job.profit}): No available slot before deadline ${job.deadline}. Skipped.`
            });
        }
    }

    // ── Final step ──
    const scheduledCount = slots.filter(s => s !== null).length;
    steps.push({
        type: 'completed',
        jobs: sorted.map(j => ({ ...j, state: jobStates[j.originalIndex] })),
        slots: slots.map(sl => sl ? { ...sl } : null),
        maxDeadline,
        totalProfit,
        currentJobIndex: -1,
        currentSlot: -1,
        description: `🎯 Done! ${scheduledCount}/${sorted.length} jobs scheduled. Maximum profit = $${totalProfit}. Schedule: [${slots.map((sl, idx) => sl ? `T${idx + 1}:${sl.label}` : '').filter(Boolean).join(', ')}].`
    });

    return steps;
};
