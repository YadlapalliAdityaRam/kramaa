export const algorithmLineMaps = {
    ratInMaze: {
        javascript: { compare: 12, backtrack: 15, completed: 21 }
    },
    rabinKarp: {
        javascript: { compare: 15, match: 23, mismatch: 20, completed: 33 }
    },
    bubbleSort: {
        javascript: { compare: 6, swap: 8, sorted: 14, completed: 16 },
        python: { compare: 5, swap: 6, sorted: 9, completed: 10 },
        cpp: { compare: 6, swap: 7, sorted: 12, completed: 14 },
        java: { compare: 6, swap: 7, sorted: 13, completed: 15 }
    },
    insertionSort: {
        javascript: { compare: 4, shift: 5, place: 7, sorted: 3, completed: 8 },
        python: { compare: 4, shift: 5, place: 7, sorted: 2, completed: 8 },
        cpp: { compare: 5, shift: 6, place: 9, sorted: 2, completed: 11 },
        java: { compare: 5, shift: 6, place: 9, sorted: 2, completed: 11 }
    },
    selectionSort: {
        javascript: { compare: 4, swap: 6, 'find-min': 4, sorted: 3, completed: 7 },
        python: { compare: 5, swap: 8, 'find-min': 5, sorted: 4, completed: 9 },
        cpp: { compare: 5, swap: 9, 'find-min': 5, sorted: 3, completed: 12 },
        java: { compare: 5, swap: 11, 'find-min': 5, sorted: 3, completed: 14 }
    },
    mergeSort: {
        javascript: { split: 3, compare: 10, merge: 9, sorted: 11, completed: 14 },
        python: { split: 4, compare: 9, merge: 8, sorted: 14, completed: 16 },
        cpp: { split: 18, compare: 6, merge: 5, sorted: 19, completed: 21 },
        java: { split: 18, compare: 6, merge: 5, sorted: 19, completed: 21 }
    },
    quickSort: {
        javascript: { partition: 10, compare: 12, swap: 14, pivot: 16, sorted: 4, completed: 17 },
        python: { partition: 15, compare: 5, swap: 7, pivot: 8, sorted: 16, completed: 18 },
        cpp: { partition: 16, compare: 4, swap: 6, pivot: 11, sorted: 17, completed: 20 },
        java: { partition: 21, compare: 4, swap: 8, pivot: 14, sorted: 22, completed: 25 }
    },
    heapSort: {
        javascript: { compare: 14, swap: 8, heapify: 12, 'build-heap': 5, extract: 8, completed: 9 },
        python: { compare: 6, swap: 8, heapify: 9, 'build-heap': 13, extract: 15, completed: 17 },
        cpp: { compare: 5, swap: 8, heapify: 9, 'build-heap': 15, extract: 18, completed: 21 },
        java: { compare: 5, swap: 10, heapify: 11, 'build-heap': 17, extract: 21, completed: 24 }
    },
    bucketSort: {
        javascript: { distribute: 7, 'sort-bucket': 10, collect: 12, completed: 12 },
        python: { distribute: 9, 'sort-bucket': 13, collect: 17, completed: 18 },
        cpp: { distribute: 10, 'sort-bucket': 16, collect: 17, completed: 19 },
        java: { distribute: 14, 'sort-bucket': 21, collect: 22, completed: 24 }
    },
    radixSort: {
        javascript: { 'count-digit': 7, distribute: 8, collect: 11, completed: 13 },
        python: { 'count-digit': 8, distribute: 14, collect: 16, completed: 27 },
        cpp: { 'count-digit': 6, distribute: 13, collect: 16, completed: 24 },
        java: { 'count-digit': 6, distribute: 13, collect: 16, completed: 24 }
    },
    linearSearch: {
        javascript: { compare: 3, found: 3, 'not-found': 5, completed: 5 },
        python: {}, cpp: {}, java: {}
    },
    binarySearch: {
        javascript: { compare: 5, 'move-left': 7, 'move-right': 6, found: 5, 'not-found': 8, completed: 8 },
        python: { compare: 4, 'move-left': 6, 'move-right': 5, found: 4, 'not-found': 7, completed: 7 },
        cpp: { compare: 5, 'move-left': 7, 'move-right': 6, found: 5, 'not-found': 9, completed: 9 },
        java: { compare: 5, 'move-left': 7, 'move-right': 6, found: 5, 'not-found': 9, completed: 9 }
    },
    twoPointers: {
        javascript: { compare: 6, found: 8, 'move-left': 12, 'move-right': 14, 'not-found': 19, completed: 19 },
        python: { compare: 6, found: 8, 'move-left': 11, 'move-right': 13, 'not-found': 16, completed: 16 },
        cpp: { compare: 6, found: 8, 'move-left': 12, 'move-right': 14, 'not-found': 18, completed: 18 },
        java: { compare: 6, found: 8, 'move-left': 12, 'move-right': 14, 'not-found': 18, completed: 18 }
    },
    slidingWindow: {
        javascript: { expand: 6, 'check-window': 8, 'best-update': 8, shrink: 10, completed: 14 },
        python: { expand: 6, 'check-window': 8, 'best-update': 8, shrink: 10, completed: 13 },
        cpp: { expand: 6, 'check-window': 8, 'best-update': 8, shrink: 10, completed: 14 },
        java: { expand: 6, 'check-window': 8, 'best-update': 8, shrink: 10, completed: 14 }
    },
    jumpSearch: {
        javascript: {
            setup: 3,
            jump: 7,
            compare: 7,
            'jump-check': 7,
            'jump-forward': 8,
            'block-found': 12,
            'linear-check': 13,
            found: 13,
            'not-found': 17,
            completed: 17
        },
        python: {
            setup: 5,
            jump: 8,
            compare: 8,
            'jump-check': 8,
            'jump-forward': 9,
            'block-found': 11,
            'linear-check': 12,
            found: 13,
            'not-found': 17,
            completed: 17
        },
        cpp: {
            setup: 4,
            jump: 7,
            compare: 7,
            'jump-check': 7,
            'jump-forward': 8,
            'block-found': 12,
            'linear-check': 13,
            found: 13,
            'not-found': 17,
            completed: 17
        },
        java: {
            setup: 4,
            jump: 7,
            compare: 7,
            'jump-check': 7,
            'jump-forward': 8,
            'block-found': 12,
            'linear-check': 13,
            found: 13,
            'not-found': 17,
            completed: 17
        }
    },
    interpolationSearch: {
        javascript: { probe: 4, compare: 7, 'move-left': 9, 'move-right': 8, found: 7, 'not-found': 10, completed: 10 },
        python: { probe: 9, compare: 12, 'move-left': 13, 'move-right': 12, found: 11, 'not-found': 15, completed: 15 },
        cpp: { probe: 10, compare: 13, 'move-left': 14, 'move-right': 13, found: 12, 'not-found': 17, completed: 17 },
        java: { probe: 10, compare: 13, 'move-left': 14, 'move-right': 13, found: 12, 'not-found': 17, completed: 17 }
    },
    exponentialSearch: {
        javascript: { 'double-range': 4, compare: 10, 'binary-step': 10, found: 11, 'not-found': 13, completed: 13 },
        python: { 'double-range': 15, compare: 10, 'binary-step': 18, found: 11, 'not-found': 11, completed: 18 },
        cpp: { 'double-range': 15, compare: 10, 'binary-step': 18, found: 11, 'not-found': 11, completed: 18 },
        java: { 'double-range': 16, compare: 11, 'binary-step': 19, found: 12, 'not-found': 12, completed: 19 }
    },
    bfs: {
        javascript: { graph: 6, 'graph-complete': 10, visit: 7, enqueue: 9, dequeue: 6, completed: 10 },
        python: { graph: 5, 'graph-complete': 8, visit: 4, enqueue: 11, dequeue: 7, completed: 13 },
        cpp: { graph: 6, 'graph-complete': 10, visit: 7, enqueue: 13, dequeue: 8, completed: 17 },
        java: { graph: 5, 'graph-complete': 9, visit: 6, enqueue: 14, dequeue: 10, completed: 18 }
    },
    dfs: {
        javascript: { graph: 6, 'graph-complete': 10, visit: 7, push: 5, pop: 6, backtrack: 8, completed: 10 },
        python: {}, cpp: {}, java: {}
    },
    dijkstra: {
        javascript: { graph: 10, 'graph-complete': 16, visit: 12, relax: 14, update: 15, completed: 16 },
        python: { graph: 6, 'graph-complete': 11, visit: 12, relax: 15, update: 17, completed: 20 },
        cpp: { graph: 7, 'graph-complete': 12, visit: 10, relax: 15, update: 17, completed: 21 },
        java: { graph: 6, 'graph-complete': 11, visit: 12, relax: 15, update: 18, completed: 23 }
    },
    bellmanFord: {
        javascript: { graph: 5, 'graph-complete': 8, relax: 6, 'no-update': 7, pass: 4, completed: 8 },
        python: { graph: 6, 'graph-complete': 8, relax: 7, 'no-update': 7, pass: 5, completed: 10 },
        cpp: { graph: 6, 'graph-complete': 12, relax: 8, 'no-update': 8, pass: 5, completed: 14 },
        java: { graph: 6, 'graph-complete': 14, relax: 9, 'no-update': 9, pass: 6, completed: 16 }
    },
    prims: {
        javascript: { graph: 8, 'graph-complete': 14, select: 10, 'update-key': 13, 'add-mst': 11, completed: 14 },
        python: { graph: 7, 'graph-complete': 12, select: 6, 'update-key': 12, 'add-mst': 9, completed: 15 },
        cpp: { graph: 13, 'graph-complete': 19, select: 9, 'update-key': 18, 'add-mst': 14, completed: 21 },
        java: { graph: 14, 'graph-complete': 21, select: 10, 'update-key': 20, 'add-mst': 15, completed: 23 }
    },
    binaryTree: {
        javascript: { tree: 3, 'tree-complete': 7 },
        python: { tree: 2, 'tree-complete': 4 },
        cpp: { tree: 2, 'tree-complete': 6 },
        java: { tree: 2, 'tree-complete': 5 }
    },
    avlTree: {
        javascript: { tree: 2, 'tree-complete': 14 },
        python: { tree: 3, 'tree-complete': 19 },
        cpp: { tree: 2, 'tree-complete': 19 },
        java: { tree: 2, 'tree-complete': 19 }
    },
    redBlackTree: {
        javascript: { tree: 3, 'tree-complete': 12 },
        python: { tree: 3, 'tree-complete': 15 },
        cpp: { tree: 3, 'tree-complete': 15 },
        java: { tree: 3, 'tree-complete': 15 }
    },
    knapsack: {
        javascript: { dp: 7, 'dp-complete': 12 },
        python: { dp: 7, 'dp-complete': 12 },
        cpp: { dp: 7, 'dp-complete': 14 },
        java: { dp: 7, 'dp-complete': 14 }
    },
    lcs: {
        javascript: { dp: 7, 'dp-complete': 10 },
        python: { dp: 7, 'dp-complete': 10 },
        cpp: { dp: 7, 'dp-complete': 11 },
        java: { dp: 7, 'dp-complete': 11 }
    },
    coinChange: {
        javascript: { dp: 5, 'dp-complete': 8 },
        python: { dp: 6, 'dp-complete': 8 },
        cpp: { dp: 6, 'dp-complete': 9 },
        java: { dp: 7, 'dp-complete': 10 }
    },
    activitySelection: {
        javascript: { activity: 5, 'activity-complete': 8 },
        python: { activity: 5, 'activity-complete': 8 },
        cpp: { activity: 11, 'activity-complete': 15 },
        java: { activity: 9, 'activity-complete': 13 }
    },
    huffmanCoding: {
        javascript: { tree: 10, 'tree-complete': 15 },
        python: { tree: 9, 'tree-complete': 13 },
        cpp: { tree: 16, 'tree-complete': 23 },
        java: { tree: 17, 'tree-complete': 23 }
    },
    nQueens: {
        javascript: { compare: 17, swap: 26, backtrack: 26, completed: 10, info: 1 },
        python: { compare: 16, swap: 26, backtrack: 26, completed: 10, info: 1 },
        cpp: { compare: 17, swap: 24, backtrack: 24, completed: 10, info: 1 },
        java: { compare: 25, swap: 32, backtrack: 32, completed: 18, info: 1 }
    },
    sieve: {
        javascript: { compare: 4, mark: 8, completed: 11 }
    },
    shellSort: {
        javascript: { 'gap-change': 4, compare: 9, swap: 10, placed: 13, completed: 20 }
    },
    timSort: {
        javascript: {
            'identify-run': 33,
            compare: 6,
            shift: 7,
            'insert-complete': 11,
            'run-sorted': 35,
            'phase-2': 38,
            'merge-start': 43,
            'merge-compare': 20,
            'merge-copy': 22,
            'merge-complete': 44,
            completed: 49
        }
    },
    sentinelLinearSearch: {
        javascript: {
            'sentinel-placed': 7,
            scan: 10,
            'loop-stopped': 14,
            found: 16,
            'not-found': 19
        }
    },
    zAlgorithm: {
        javascript: {
            init: 2,
            'box-range': 12,
            'inside-box': 8,
            'copy-existing': 9,
            'box-extension': 16,
            compare: 12,
            mismatch: 16,
            found: 25,
            completed: 29
        }
    }
};
