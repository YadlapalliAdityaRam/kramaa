// Floyd's Cycle Detection — Tortoise and Hare on linked list
// Generates linked-list-aware animation steps

export const generateFloydCycleSteps = (listValues, cycleBackIndex) => {
    // Default linked list: 1→2→3→4→5→6, with 6 cycling back to node at index 2 (value 3)
    const values = listValues || [1, 2, 3, 4, 5, 6];
    const cycleBack = cycleBackIndex !== undefined ? cycleBackIndex : 2;

    const steps = [];

    // Build node list with next pointers
    const nodes = values.map((v, i) => ({
        id: i,
        value: v,
        next: i < values.length - 1 ? i + 1 : (cycleBack >= 0 ? cycleBack : null)
    }));

    const hasCycle = cycleBack >= 0 && cycleBack < values.length;

    // ── Phase 1: Build the linked list visually ──
    for (let i = 0; i < nodes.length; i++) {
        steps.push({
            type: 'build',
            phase: 'build',
            description: `Building linked list… Node ${nodes[i].value} appears.`,
            nodes: nodes.slice(0, i + 1).map(n => ({ ...n })),
            slow: -1,
            fast: -1,
            met: false,
            meetNode: -1,
            cycleBack: i === nodes.length - 1 ? cycleBack : -1
        });
    }

    if (hasCycle) {
        steps.push({
            type: 'build',
            phase: 'build',
            description: `🔄 Last node (${nodes[nodes.length - 1].value}) connects back to node ${nodes[cycleBack].value}. This linked list contains a loop!`,
            nodes: nodes.map(n => ({ ...n })),
            slow: -1,
            fast: -1,
            met: false,
            meetNode: -1,
            cycleBack
        });
    } else {
        steps.push({
            type: 'build',
            phase: 'build',
            description: `Last node (${nodes[nodes.length - 1].value}) points to NULL. No cycle in this list.`,
            nodes: nodes.map(n => ({ ...n })),
            slow: -1,
            fast: -1,
            met: false,
            meetNode: -1,
            cycleBack: -1
        });
    }

    // ── Phase 2: Place pointers at head ──
    steps.push({
        type: 'init',
        phase: 'init',
        description: `🐢 Tortoise (slow, 1 step) and 🐇 Hare (fast, 2 steps) both start at head node ${nodes[0].value}.`,
        nodes: nodes.map(n => ({ ...n })),
        slow: 0,
        fast: 0,
        met: false,
        meetNode: -1,
        cycleBack
    });

    // ── Phase 3: Movement ──
    let slow = 0;
    let fast = 0;
    let detected = false;
    const maxIter = nodes.length * 3;

    for (let iter = 0; iter < maxIter; iter++) {
        const slowNext = nodes[slow].next;
        const fastNext1 = nodes[fast].next;

        if (slowNext === null || fastNext1 === null) {
            steps.push({
                type: 'move',
                phase: 'move',
                description: `🛑 Pointer reached NULL — no cycle exists! Algorithm complete.`,
                nodes: nodes.map(n => ({ ...n })),
                slow,
                fast,
                met: false,
                meetNode: -1,
                cycleBack,
                noCycle: true
            });
            break;
        }

        const fastNext2 = nodes[fastNext1].next;
        if (fastNext2 === null) {
            steps.push({
                type: 'move',
                phase: 'move',
                description: `🛑 Hare reached NULL — no cycle exists! Algorithm complete.`,
                nodes: nodes.map(n => ({ ...n })),
                slow,
                fast: fastNext1,
                met: false,
                meetNode: -1,
                cycleBack,
                noCycle: true
            });
            break;
        }

        slow = slowNext;
        fast = fastNext2;

        if (slow === fast) {
            detected = true;
            steps.push({
                type: 'meet',
                phase: 'meet',
                description: `💥 Tortoise (${nodes[slow].value}) and Hare (${nodes[fast].value}) meet at node ${nodes[slow].value}! CYCLE DETECTED!`,
                nodes: nodes.map(n => ({ ...n })),
                slow,
                fast,
                met: true,
                meetNode: slow,
                cycleBack
            });
            break;
        } else {
            steps.push({
                type: 'move',
                phase: 'move',
                description: `🐢 Tortoise → ${nodes[slow].value}  |  🐇 Hare → ${nodes[fast].value}`,
                nodes: nodes.map(n => ({ ...n })),
                slow,
                fast,
                met: false,
                meetNode: -1,
                cycleBack
            });
        }
    }

    // ── Phase 4: Conclusion ──
    steps.push({
        type: 'done',
        phase: 'done',
        description: detected
            ? `✅ Cycle confirmed at node ${nodes[slow].value}. Floyd's algorithm runs in O(N) time and O(1) space.`
            : `✅ No cycle found. The linked list is acyclic. Floyd's algorithm runs in O(N) time and O(1) space.`,
        nodes: nodes.map(n => ({ ...n })),
        slow,
        fast,
        met: detected,
        meetNode: detected ? slow : -1,
        cycleBack
    });

    return steps;
};
