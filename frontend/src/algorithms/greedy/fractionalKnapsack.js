// Fractional Knapsack — Greedy ratio-based fill
// Generates rich visualization steps for the dedicated visualizer

const COLORS = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export const generateFractionalKnapsackSteps = (items, capacity) => {
    const steps = [];

    // Build items with ratio and original index
    const enriched = items.map((item, i) => ({
        weight: item.weight,
        value: item.value,
        ratio: item.value / item.weight,
        originalIndex: i,
        color: COLORS[i % COLORS.length],
        label: `I${i + 1}`
    }));

    // ── Step 1: Init ──
    steps.push({
        type: 'init',
        items: enriched.map(it => ({ ...it, state: 'pending' })),
        knapsackItems: [],
        remainingCapacity: capacity,
        totalValue: 0,
        currentIndex: -1,
        description: `📦 Fractional Knapsack: ${items.length} items, capacity = ${capacity}. We can take fractions of items! Strategy: sort by value/weight ratio and greedily pick the best.`
    });

    // ── Step 2: Sort by ratio ──
    const sorted = [...enriched].sort((a, b) => b.ratio - a.ratio);

    steps.push({
        type: 'sort',
        items: sorted.map(it => ({ ...it, state: 'pending' })),
        knapsackItems: [],
        remainingCapacity: capacity,
        totalValue: 0,
        currentIndex: -1,
        description: `📊 Sorted items by value/weight ratio (descending): ${sorted.map(it => `${it.label}(${it.ratio.toFixed(2)})`).join(' > ')}.`
    });

    // ── Greedy fill ──
    let remaining = capacity;
    let totalValue = 0;
    const knapsackItems = [];

    for (let i = 0; i < sorted.length; i++) {
        const it = sorted[i];

        if (remaining <= 0) {
            // Skip — bag is full
            steps.push({
                type: 'skip',
                items: sorted.map((s, idx) => ({
                    ...s,
                    state: idx < i ? (knapsackItems.find(k => k.originalIndex === s.originalIndex)?.fraction === 1 ? 'taken' : 'partial') : idx === i ? 'skipped' : 'pending'
                })),
                knapsackItems: [...knapsackItems],
                remainingCapacity: remaining,
                totalValue,
                currentIndex: i,
                description: `⏭️ Skipping ${it.label} — knapsack is already full.`
            });
            continue;
        }

        // Consider step
        steps.push({
            type: 'consider',
            items: sorted.map((s, idx) => ({
                ...s,
                state: idx < i ? (knapsackItems.find(k => k.originalIndex === s.originalIndex)?.fraction === 1 ? 'taken' : 'partial') : idx === i ? 'considering' : 'pending'
            })),
            knapsackItems: [...knapsackItems],
            remainingCapacity: remaining,
            totalValue,
            currentIndex: i,
            description: `🔍 Considering ${it.label}: weight=${it.weight}, value=$${it.value}, ratio=${it.ratio.toFixed(2)}. Remaining capacity: ${remaining.toFixed(1)}.`
        });

        if (remaining >= it.weight) {
            // Take full item
            remaining -= it.weight;
            totalValue += it.value;
            knapsackItems.push({
                ...it,
                fraction: 1,
                weightTaken: it.weight,
                valueTaken: it.value
            });

            steps.push({
                type: 'take-full',
                items: sorted.map((s, idx) => ({
                    ...s,
                    state: idx <= i ? (knapsackItems.find(k => k.originalIndex === s.originalIndex) ? (knapsackItems.find(k => k.originalIndex === s.originalIndex).fraction === 1 ? 'taken' : 'partial') : 'pending') : 'pending'
                })),
                knapsackItems: [...knapsackItems],
                remainingCapacity: remaining,
                totalValue,
                currentIndex: i,
                description: `✅ Take ALL of ${it.label} (${it.weight}kg → $${it.value}). Remaining capacity: ${remaining.toFixed(1)}kg. Total value: $${totalValue.toFixed(1)}.`
            });
        } else {
            // Take fraction
            const fraction = remaining / it.weight;
            const valueTaken = fraction * it.value;
            totalValue += valueTaken;
            knapsackItems.push({
                ...it,
                fraction,
                weightTaken: remaining,
                valueTaken
            });

            steps.push({
                type: 'take-fraction',
                items: sorted.map((s, idx) => ({
                    ...s,
                    state: idx <= i ? (knapsackItems.find(k => k.originalIndex === s.originalIndex) ? (knapsackItems.find(k => k.originalIndex === s.originalIndex).fraction === 1 ? 'taken' : 'partial') : 'pending') : 'pending'
                })),
                knapsackItems: [...knapsackItems],
                remainingCapacity: 0,
                totalValue,
                currentIndex: i,
                description: `✂️ Take ${(fraction * 100).toFixed(0)}% of ${it.label} (${remaining.toFixed(1)}kg of ${it.weight}kg → $${valueTaken.toFixed(1)}). Knapsack full! Total value: $${totalValue.toFixed(1)}.`
            });

            remaining = 0;
        }
    }

    // ── Final step ──
    steps.push({
        type: 'completed',
        items: sorted.map(s => ({
            ...s,
            state: knapsackItems.find(k => k.originalIndex === s.originalIndex) ? (knapsackItems.find(k => k.originalIndex === s.originalIndex).fraction === 1 ? 'taken' : 'partial') : 'skipped'
        })),
        knapsackItems: [...knapsackItems],
        remainingCapacity: remaining,
        totalValue,
        currentIndex: -1,
        description: `🎯 Done! Maximum value = $${totalValue.toFixed(1)} using ${capacity}kg capacity. ${knapsackItems.length} item(s) selected${knapsackItems.some(k => k.fraction < 1) ? ' (including partial)' : ''}.`
    });

    return steps;
};
