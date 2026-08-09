import { algorithmCodes } from './algorithmCodes.js';
import { buildAlgorithmOverview } from '../visualizer/algorithmOverview.js';

const codeKeysByPath = {
    '/algorithms/sorting/bubble': 'bubbleSort',
    '/algorithms/sorting/insertion': 'insertionSort',
    '/algorithms/sorting/selection': 'selectionSort',
    '/algorithms/sorting/shell': 'shellSort',
    '/algorithms/sorting/merge': 'mergeSort',
    '/algorithms/sorting/quick': 'quickSort',
    '/algorithms/sorting/heap': 'heapSort',
    '/algorithms/sorting/bucket': 'bucketSort',
    '/algorithms/sorting/radix': 'radixSort',
    '/algorithms/sorting/cocktail-shaker': 'cocktailShakerSort',
    '/algorithms/sorting/comb': 'combSort',
    '/algorithms/sorting/counting': 'countingSort',
    '/algorithms/sorting/tim': 'timSort',
    '/algorithms/searching/linear': 'linearSearch',
    '/algorithms/searching/sentinel-linear': 'sentinelLinearSearch',
    '/algorithms/searching/binary': 'binarySearch',
    '/algorithms/searching/jump-search': 'jumpSearch',
    '/algorithms/searching/interpolation-search': 'interpolationSearch',
    '/algorithms/searching/exponential-search': 'exponentialSearch',
    '/algorithms/searching/fibonacci-search': 'fibonacciSearch',
    '/algorithms/searching/two-pointers': 'twoPointers',
    '/algorithms/searching/sliding-window': 'slidingWindow',
    '/algorithms/graphs/bfs': 'bfs',
    '/algorithms/graphs/dijkstra': 'dijkstra',
    '/algorithms/graphs/dfs': 'dfs',
    '/algorithms/graphs/bellman-ford': 'bellmanFord',
    '/algorithms/graphs/prims': 'prims',
    '/algorithms/graphs/kosaraju': 'kosaraju',
    '/algorithms/graphs/topological-sort': 'topologicalSort',
    '/algorithms/graphs/floyd-cycle': 'floydCycle',
    '/algorithms/trees/traversals': 'binaryTree',
    '/algorithms/trees/avl-tree': 'avlTree',
    '/algorithms/trees/red-black-tree': 'redBlackTree',
    '/algorithms/trees/priority-queue': 'heap',
    '/algorithms/trees/splay': 'splayTree',
    '/algorithms/trees/trie': 'trie',
    '/algorithms/dp/knapsack': 'knapsack',
    '/algorithms/dp/lcs': 'lcs',
    '/algorithms/dp/edit-distance': 'editDistance',
    '/algorithms/dp/coin-change': 'coinChange',
    '/algorithms/dp/coin-change-ways': 'coinChangeWays',
    '/algorithms/dp/egg-drop': 'eggDrop',
    '/algorithms/dp/matrix-chain': 'matrixChain',
    '/algorithms/dp/rod-cutting': 'rodCutting',
    '/algorithms/dp/palindrome-partitioning': 'palindromePartitioning',
    '/algorithms/greedy/activity-selection': 'activitySelection',
    '/algorithms/greedy/huffman': 'huffmanCoding',
    '/algorithms/greedy/job-sequencing': 'jobSequencing',
    '/algorithms/string/kmp': 'kmp',
    '/algorithms/string/rabin-karp': 'rabinKarp',
    '/algorithms/string/z-algorithm': 'zAlgorithm',
    '/algorithms/string/boyer-moore': 'boyerMoore',
    '/algorithms/string/manacher': 'manacher',
    '/algorithms/backtracking/n-queens': 'nQueens',
    '/algorithms/math/bit-manipulation': 'bitManipulation',
    '/algorithms/math/fast-exponentiation': 'fastExponentiation'
};

const supplementalCodeByPath = {
    '/algorithms/sorting/cycle': `function cycleSort(values) {
    const array = [...values];

    for (let cycleStart = 0; cycleStart < array.length - 1; cycleStart += 1) {
        let item = array[cycleStart];
        let position = cycleStart;

        for (let index = cycleStart + 1; index < array.length; index += 1) {
            if (array[index] < item) position += 1;
        }

        if (position === cycleStart) continue;
        while (item === array[position]) position += 1;
        [array[position], item] = [item, array[position]];

        while (position !== cycleStart) {
            position = cycleStart;
            for (let index = cycleStart + 1; index < array.length; index += 1) {
                if (array[index] < item) position += 1;
            }
            while (item === array[position]) position += 1;
            [array[position], item] = [item, array[position]];
        }
    }

    return array;
}`,
    '/algorithms/graphs/floyd-warshall': `function floydWarshall(vertexCount, edges) {
    const distance = Array.from(
        { length: vertexCount },
        () => Array(vertexCount).fill(Infinity)
    );

    for (let vertex = 0; vertex < vertexCount; vertex += 1) {
        distance[vertex][vertex] = 0;
    }

    for (const { from, to, weight } of edges) {
        distance[from][to] = Math.min(distance[from][to], weight);
    }

    for (let via = 0; via < vertexCount; via += 1) {
        for (let from = 0; from < vertexCount; from += 1) {
            for (let to = 0; to < vertexCount; to += 1) {
                const throughVia = distance[from][via] + distance[via][to];
                if (throughVia < distance[from][to]) distance[from][to] = throughVia;
            }
        }
    }

    return distance;
}`,
    '/algorithms/graphs/kruskals-mst': `function kruskalMst(vertexCount, edges) {
    const parent = Array.from({ length: vertexCount }, (_, index) => index);
    const rank = Array(vertexCount).fill(0);
    const find = (vertex) => {
        if (parent[vertex] !== vertex) parent[vertex] = find(parent[vertex]);
        return parent[vertex];
    };
    const join = (first, second) => {
        const firstRoot = find(first);
        const secondRoot = find(second);
        if (firstRoot === secondRoot) return false;
        if (rank[firstRoot] < rank[secondRoot]) parent[firstRoot] = secondRoot;
        else if (rank[firstRoot] > rank[secondRoot]) parent[secondRoot] = firstRoot;
        else {
            parent[secondRoot] = firstRoot;
            rank[firstRoot] += 1;
        }
        return true;
    };

    const selected = [];
    for (const edge of [...edges].sort((left, right) => left.weight - right.weight)) {
        if (join(edge.from, edge.to)) selected.push(edge);
        if (selected.length === vertexCount - 1) break;
    }
    return selected;
}`,
    '/algorithms/graphs/a-star': `function aStar(graph, start, goal, heuristic) {
    const open = new Set([start]);
    const cameFrom = new Map();
    const cost = new Map([[start, 0]]);

    while (open.size) {
        const current = [...open].reduce((best, node) => (
            cost.get(node) + heuristic(node, goal) < cost.get(best) + heuristic(best, goal)
                ? node
                : best
        ));

        if (current === goal) {
            const path = [goal];
            while (cameFrom.has(path[0])) path.unshift(cameFrom.get(path[0]));
            return path;
        }

        open.delete(current);
        for (const { to, weight } of graph[current] || []) {
            const nextCost = cost.get(current) + weight;
            if (nextCost < (cost.get(to) ?? Infinity)) {
                cameFrom.set(to, current);
                cost.set(to, nextCost);
                open.add(to);
            }
        }
    }

    return [];
}`,
    '/algorithms/trees/segment-tree': `class SegmentTree {
    constructor(values) {
        this.size = values.length;
        this.tree = Array(this.size * 2).fill(0);
        for (let index = 0; index < this.size; index += 1) this.tree[this.size + index] = values[index];
        for (let index = this.size - 1; index > 0; index -= 1) {
            this.tree[index] = this.tree[index * 2] + this.tree[index * 2 + 1];
        }
    }

    rangeSum(left, right) {
        let total = 0;
        for (left += this.size, right += this.size; left <= right; left >>= 1, right >>= 1) {
            if (left & 1) total += this.tree[left++];
            if (!(right & 1)) total += this.tree[right--];
        }
        return total;
    }
}`,
    '/algorithms/trees/fenwick': `class FenwickTree {
    constructor(size) {
        this.tree = Array(size + 1).fill(0);
    }

    add(index, value) {
        for (let position = index + 1; position < this.tree.length; position += position & -position) {
            this.tree[position] += value;
        }
    }

    prefixSum(index) {
        let sum = 0;
        for (let position = index + 1; position > 0; position -= position & -position) {
            sum += this.tree[position];
        }
        return sum;
    }
}`,
    '/algorithms/trees/nary-dfs': `function naryDfs(root) {
    const order = [];
    const visit = (node) => {
        if (!node) return;
        order.push(node.value);
        for (const child of node.children || []) visit(child);
    };
    visit(root);
    return order;
}`,
    '/algorithms/trees/nary-bfs': `function naryBfs(root) {
    if (!root) return [];
    const order = [];
    const queue = [root];
    for (let head = 0; head < queue.length; head += 1) {
        const node = queue[head];
        order.push(node.value);
        queue.push(...(node.children || []));
    }
    return order;
}`,
    '/algorithms/trees/nary-height': `function naryHeight(root) {
    if (!root) return 0;
    let tallestChild = 0;
    for (const child of root.children || []) {
        tallestChild = Math.max(tallestChild, naryHeight(child));
    }
    return 1 + tallestChild;
}`,
    '/algorithms/dp/lis': `function longestIncreasingSubsequence(values) {
    const tails = [];
    for (const value of values) {
        let left = 0;
        let right = tails.length;
        while (left < right) {
            const middle = Math.floor((left + right) / 2);
            if (tails[middle] < value) left = middle + 1;
            else right = middle;
        }
        tails[left] = value;
    }
    return tails.length;
}`,
    '/algorithms/dp/subset-sum': `function subsetSum(values, target) {
    const possible = Array(target + 1).fill(false);
    possible[0] = true;
    for (const value of values) {
        for (let sum = target; sum >= value; sum -= 1) {
            possible[sum] = possible[sum] || possible[sum - value];
        }
    }
    return possible[target];
}`,
    '/algorithms/greedy/fractional-knapsack': `function fractionalKnapsack(items, capacity) {
    let remaining = capacity;
    let totalValue = 0;
    for (const item of [...items].sort((left, right) => right.value / right.weight - left.value / left.weight)) {
        if (!remaining) break;
        const amount = Math.min(remaining, item.weight);
        totalValue += amount * (item.value / item.weight);
        remaining -= amount;
    }
    return totalValue;
}`,
    '/algorithms/backtracking/rat-in-maze': `function ratInMaze(maze) {
    const size = maze.length;
    const path = Array.from({ length: size }, () => Array(size).fill(0));
    const visit = (row, column) => {
        if (row < 0 || column < 0 || row >= size || column >= size || !maze[row][column] || path[row][column]) return false;
        path[row][column] = 1;
        if (row === size - 1 && column === size - 1) return true;
        if (visit(row + 1, column) || visit(row, column + 1) || visit(row - 1, column) || visit(row, column - 1)) return true;
        path[row][column] = 0;
        return false;
    };
    return visit(0, 0) ? path : [];
}`,
    '/algorithms/math/sieve': `function sieveOfEratosthenes(limit) {
    const isPrime = Array(limit + 1).fill(true);
    isPrime[0] = isPrime[1] = false;
    for (let candidate = 2; candidate * candidate <= limit; candidate += 1) {
        if (!isPrime[candidate]) continue;
        for (let multiple = candidate * candidate; multiple <= limit; multiple += candidate) {
            isPrime[multiple] = false;
        }
    }
    return isPrime.reduce((primes, value, number) => (value ? [...primes, number] : primes), []);
}`,
    '/algorithms/math/euclidean-gcd': `function euclideanGcd(first, second) {
    let a = Math.abs(first);
    let b = Math.abs(second);
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
}`
};

const categoryKey = (category) => String(category || '').toLowerCase() === 'dynamic programming'
    ? 'dp'
    : String(category || '').toLowerCase();

const routeAliases = {
    '/algorithms/searching/jump': '/algorithms/searching/jump-search',
    '/algorithms/searching/interpolation': '/algorithms/searching/interpolation-search',
    '/algorithms/trees/avl': '/algorithms/trees/avl-tree'
};

const requirementsByName = {
    'Binary Search': 'The input must be sorted before you begin.',
    'Jump Search': 'The input must be sorted before you begin.',
    'Interpolation Search': 'The input must be sorted and works best when values are spread evenly.',
    'Exponential Search': 'The input must be sorted before you begin.',
    'Fibonacci Search': 'The input must be sorted before you begin.',
    "Dijkstra's Algorithm": 'Edge weights must be zero or positive. Use Bellman-Ford when negative edges exist.',
    'Counting Sort': 'Use it only when integer values have a reasonably small range.',
    'Radix Sort': 'Use it for integers or fixed-width keys with a stable digit sort.',
    'Bucket Sort': 'It performs best when values are spread fairly evenly across a known range.',
    'A* Search': 'An admissible heuristic never overestimates the remaining distance, which keeps A* optimal.',
    'Topological Sort': 'The graph must be directed and acyclic. A cycle means there is no valid ordering.'
};

const categoryExamples = {
    sorting: {
        input: '[5, 1, 4, 2]',
        output: '[1, 2, 4, 5]',
        trace: [
            'Start with the numbers in their original order.',
            'Apply the algorithm’s comparison or placement rule to improve the order.',
            'Keep repeating until every earlier value is less than or equal to the next one.',
            'The final ordered list is [1, 2, 4, 5].'
        ]
    },
    searching: {
        input: 'values = [2, 4, 6, 8, 10], target = 8',
        output: 'index 3',
        trace: [
            'Start with the candidate values that could contain 8.',
            'Use the search rule to rule out values that cannot match.',
            'The remaining candidate is 8 at zero-based index 3.',
            'Return index 3.'
        ]
    },
    graphs: {
        input: 'edges: A–B, A–C, B–D; start = A',
        output: 'a valid visit or path result',
        trace: [
            'Begin at A and record that it has been reached.',
            'Inspect connected nodes without losing the algorithm’s ordering rule.',
            'Update the visited set, path cost, or chosen edge when the rule allows it.',
            'Finish when no useful node or edge remains.'
        ]
    },
    trees: {
        input: 'root = 2 with children 1 and 3',
        output: 'a traversal, query result, or balanced tree state',
        trace: [
            'Start at the root and follow the tree rule for the current operation.',
            'Use child pointers or stored summaries instead of scanning unrelated nodes.',
            'Continue until the requested node, range, or traversal is complete.',
            'Return the collected order or query answer.'
        ]
    },
    dp: {
        input: 'a small input with one clear optimal answer',
        output: 'the best answer stored in the final table cell',
        trace: [
            'Write down the smallest subproblems first.',
            'Reuse earlier table values instead of solving the same subproblem again.',
            'Fill each new state from the choices that are valid there.',
            'Read the final answer from the completed table.'
        ]
    },
    greedy: {
        input: 'a short list of choices with a clear priority',
        output: 'the best valid set or value',
        trace: [
            'Rank choices using the rule that matters for this problem.',
            'Take the best available choice that is still valid.',
            'Discard choices that now conflict with the selection.',
            'Continue until no valid choice remains.'
        ]
    },
    string: {
        input: 'text = "ABABAC", pattern = "ABA"',
        output: 'match at index 0',
        trace: [
            'Prepare the pattern information needed to skip unnecessary comparisons.',
            'Compare the pattern with the current text position.',
            'Use the mismatch rule to move forward efficiently.',
            'The first full match starts at index 0.'
        ]
    },
    backtracking: {
        input: 'a small board or grid with a valid solution',
        output: 'one or more valid arrangements',
        trace: [
            'Try one legal choice and move to the next decision.',
            'Reject a choice immediately when it breaks a rule.',
            'Undo rejected choices and try the next option.',
            'Keep the path only when every requirement is satisfied.'
        ]
    },
    math: {
        input: 'two or more small numbers',
        output: 'the value computed by the repeated numeric rule',
        trace: [
            'Start from the given values.',
            'Apply the mathematical identity that reduces the problem.',
            'Keep only the state needed for the next repetition.',
            'Stop at the base condition and return the result.'
        ]
    }
};

const specificExamples = {
    "Dijkstra's Algorithm": {
        input: 'A→B (4), A→C (1), C→B (2); start = A',
        output: 'shortest distance to B = 3',
        trace: ['Set A to 0 and every other distance to infinity.', 'Choose A first and discover B = 4 and C = 1.', 'Choose C next because 1 is smallest; C→B gives 1 + 2 = 3.', 'Distance 3 improves B, so the shortest path to B is A→C→B.']
    },
    'Bellman-Ford': {
        input: 'A→B (4), A→C (5), B→C (-2); start = A',
        output: 'shortest distance to C = 2',
        trace: ['Set A to 0 and all other distances to infinity.', 'Relax A→B to make B = 4.', 'Relax B→C to make C = 2.', 'A final pass finds no further improvement, so 2 is the shortest distance.']
    },
    "Prim's MST": {
        input: 'A–B (4), A–C (1), C–B (2)',
        output: 'MST edges A–C and C–B; total cost = 3',
        trace: ['Start at A and choose its cheapest edge, A–C (1).', 'The frontier now includes A–B (4) and C–B (2).', 'Choose C–B (2) because it is the cheapest edge reaching a new node.', 'All vertices are connected with total cost 3.']
    },
    "Kruskal's MST": {
        input: 'A–C (1), C–B (2), A–B (4)',
        output: 'MST edges A–C and C–B',
        trace: ['Sort edges by weight: 1, 2, then 4.', 'Take A–C because it joins two separate groups.', 'Take C–B because it joins B without creating a cycle.', 'Skip A–B because all vertices are already connected.']
    },
    'Floyd-Warshall': {
        input: 'A→B = 4, A→C = 10, B→C = 3',
        output: 'shortest A→C distance = 7',
        trace: ['Start with direct edge weights in a distance table.', 'Try B as an intermediate stop between every pair.', 'A→B→C costs 4 + 3 = 7, which beats the direct cost 10.', 'Store 7 as the best A→C distance.']
    },
    'A* Search': {
        input: 'start A, goal G, with a distance heuristic to G',
        output: 'the lowest-cost route from A to G',
        trace: ['Place A in the open set with cost 0.', 'Choose the node with the best cost-so-far plus heuristic estimate.', 'Update a neighbor only when the new route is cheaper.', 'When G is chosen, rebuild the path by following parent links backward.']
    },
    'Binary Tree Traversals': {
        input: 'tree: 2 with left 1 and right 3; inorder',
        output: '[1, 2, 3]',
        trace: ['For inorder, visit the left child before the current node.', 'Visit node 1, then return to node 2.', 'Visit the right child, node 3.', 'The recorded order is [1, 2, 3].']
    },
    'AVL Tree': {
        input: 'insert 30, then 20, then 10',
        output: '20 becomes the root after one right rotation',
        trace: ['Insert 30, 20, and 10 like a normal binary search tree.', 'Node 30 becomes too left-heavy.', 'Rotate right around 30.', 'The balanced tree has 20 at the root with 10 and 30 as children.']
    },
    'Heap / Priority Queue': {
        input: 'insert 5, 2, 8 into a min-heap',
        output: 'extractMin() returns 2',
        trace: ['Insert each value while bubbling a smaller value upward.', 'The heap root becomes 2 because it is the smallest.', 'extractMin removes 2 and moves the last item to the root.', 'Heapify downward restores the min-heap rule.']
    },
    'Trie (Prefix Tree)': {
        input: 'insert "car", "cat", "dog"; search prefix "ca"',
        output: '"ca" exists as a shared prefix',
        trace: ['Insert c then a once for both car and cat.', 'Branch to r for car and t for cat.', 'Read c then a while checking the prefix.', 'The prefix exists because that node is present in the trie.']
    },
    'Knapsack Problem (0/1)': {
        input: 'weights [2, 3], values [4, 5], capacity 3',
        output: 'maximum value = 5',
        trace: ['Consider capacity 0 through 3 for each item.', 'The item of weight 2 gives value 4.', 'At capacity 3, the item of weight 3 gives value 5.', 'The best allowed value is 5.']
    },
    'Coin Change (Min Coins)': {
        input: 'coins [1, 3, 4], amount 6',
        output: '2 coins: 3 + 3',
        trace: ['Set amount 0 to need 0 coins.', 'Build answers for amounts 1 through 6.', 'At amount 6, using coin 3 leaves amount 3, which needs one coin.', 'So 6 needs 1 + 1 = 2 coins.']
    },
    'Longest Common Subsequence': {
        input: 'first = "ABC", second = "AC"',
        output: 'LCS length = 2',
        trace: ['Compare prefixes of both strings in a table.', 'A matches A, so the table records 1.', 'B does not match C, so keep the better nearby result.', 'C matches C, raising the final result to 2.']
    },
    'Edit Distance (Levenshtein)': {
        input: '"cat" → "cut"',
        output: 'distance = 1',
        trace: ['c matches c and a matches u only after one replacement.', 'Replace a with u.', 't already matches t.', 'Only one edit is required.']
    },
    'Activity Selection': {
        input: 'activities (1,2), (2,4), (3,5)',
        output: '(1,2) and (2,4)',
        trace: ['Sort by finishing time.', 'Choose (1,2) because it finishes first.', 'Choose (2,4) because it starts when the first ends.', 'Skip (3,5) because it overlaps with (2,4).']
    },
    'Fractional Knapsack': {
        input: 'capacity 5; items (value 10, weight 2), (value 12, weight 3)',
        output: 'total value = 22',
        trace: ['Rank items by value per unit weight.', 'Take the weight-2 item first.', 'The remaining capacity is exactly 3, so take the second item too.', 'The total value is 10 + 12 = 22.']
    },
    'N-Queens Problem': {
        input: 'n = 4',
        output: 'one valid placement: [2, 4, 1, 3]',
        trace: ['Place one queen in a safe column of the first row.', 'Try a safe column in the next row.', 'Backtrack immediately when a diagonal or column conflicts.', 'A complete safe placement is [2, 4, 1, 3].']
    },
    'Rat in a Maze': {
        input: 'a grid with open cells from top-left to bottom-right',
        output: 'one valid route through open cells',
        trace: ['Start at the top-left open cell.', 'Move only to open, unvisited neighboring cells.', 'If a route reaches a wall or dead end, undo that move.', 'Stop when the bottom-right cell is reached.']
    },
    'Sieve of Eratosthenes': {
        input: 'limit = 10',
        output: '[2, 3, 5, 7]',
        trace: ['Mark every number from 2 to 10 as potentially prime.', 'Keep 2 and mark its multiples 4, 6, 8, 10.', 'Keep 3 and mark 6 and 9.', 'The unmarked numbers are 2, 3, 5, and 7.']
    },
    'Euclidean GCD': {
        input: '48 and 18',
        output: 'GCD = 6',
        trace: ['48 mod 18 is 12, so replace (48,18) with (18,12).', '18 mod 12 is 6, so replace with (12,6).', '12 mod 6 is 0.', 'When the remainder is 0, the other number, 6, is the GCD.']
    },
    'Fast Exponentiation': {
        input: '2^10',
        output: '1024',
        trace: ['Square 2 to get 4, then square to get 16, then 256.', 'Read the binary exponent 10 as 8 + 2.', 'Multiply the matching powers: 256 × 4.', 'The result is 1024.']
    }
};

const realWorldContexts = {
    sorting: 'A shopping or school system can put a long list into a useful order, such as lowest price or earliest due date.',
    searching: 'A phone or website can locate one item in a collection instead of making a person scan the whole list.',
    graphs: 'Maps, delivery routes, social connections, and network links can all be represented as connected points.',
    trees: 'Folders, autocomplete suggestions, and database indexes organize information as parent-child paths.',
    dp: 'Planning a budget or choosing a best sequence becomes practical when repeated smaller decisions are saved.',
    greedy: 'Scheduling rooms, packing a delivery vehicle, and compressing files all need quick choices with clear priorities.',
    string: 'Search boxes, plagiarism checks, DNA comparisons, and text editors all need efficient pattern handling.',
    backtracking: 'Puzzle solvers, route planners, and configuration tools can try possibilities while safely undoing dead ends.',
    math: 'Security, graphics, and everyday number tools use small repeated mathematical rules to avoid unnecessary work.'
};

const edgeCasesByCategory = {
    sorting: ['Empty input should stay empty.', 'An already sorted list should keep its order.', 'Repeated values should remain correctly ordered.'],
    searching: ['Check a target at the first position.', 'Check a target at the last position.', 'Check a missing target and an empty input.'],
    graphs: ['Check one isolated node.', 'Check disconnected nodes.', 'Check cycles or invalid edge weights when the algorithm has restrictions.'],
    trees: ['Check an empty tree.', 'Check a tree with one node.', 'Check a skewed tree as well as a balanced tree.'],
    dp: ['Check the smallest valid target.', 'Check impossible states.', 'Check repeated values or equal-cost choices.'],
    greedy: ['Check no available choices.', 'Check ties in the priority rule.', 'Check choices that overlap or exactly touch.'],
    string: ['Check an empty pattern.', 'Check a pattern longer than the text.', 'Check repeated characters and no match.'],
    backtracking: ['Check a board with no solution.', 'Check the smallest solvable input.', 'Check that rejected choices are fully undone.'],
    math: ['Check zero and one.', 'Check equal values.', 'Check large values without changing the mathematical rule.']
};

const formatTime = (complexity = {}) => `Best ${complexity.best || 'N/A'} · Average ${complexity.average || complexity.avg || 'N/A'} · Worst ${complexity.worst || 'N/A'}`;

const addTeachingComments = (code, algorithm, overview) => {
    const lines = String(code || '').split('\n');
    const openingLine = lines.findIndex((line) => line.includes('{'));
    const steps = overview.howItWorks.slice(0, 3);
    const comments = steps.map((step, index) => `    // Step ${index + 1}: ${step}`);

    if (openingLine >= 0) lines.splice(openingLine + 1, 0, ...comments, '');

    return [
        `// ${algorithm.name} — reference implementation`,
        `// Goal: ${algorithm.description}`,
        `// Time: ${formatTime(algorithm.timeComplexity)}. Space: ${algorithm.spaceComplexity}.`,
        '',
        ...lines
    ].join('\n');
};

export const normalizeAlgorithmPath = (pathname) => routeAliases[pathname] || pathname;

export const buildAlgorithmLesson = (algorithm) => {
    const category = categoryKey(algorithm.category);
    const overview = buildAlgorithmOverview({
        name: algorithm.name,
        category: algorithm.category,
        description: algorithm.description,
        useCases: algorithm.useCases,
        timeComplexity: algorithm.timeComplexity,
        spaceComplexity: algorithm.spaceComplexity
    });
    const codeKey = codeKeysByPath[algorithm.path];
    const code = supplementalCodeByPath[algorithm.path]
        || algorithmCodes[codeKey]?.javascript
        || `function ${algorithm.name.replace(/[^a-z0-9]/gi, '')}(input) {\n    return input;\n}`;
    const example = specificExamples[algorithm.name] || categoryExamples[category] || categoryExamples.sorting;
    const requirements = requirementsByName[algorithm.name]
        || 'Use the input form shown in the visualizer and follow the highlighted state step by step.';
    const realWorldUses = (algorithm.useCases || []).slice(0, 3).map((useCase) => ({
        label: useCase,
        detail: realWorldContexts[category] || realWorldContexts.sorting
    }));

    return {
        overview,
        example,
        requirements,
        realWorldUses,
        edgeCases: edgeCasesByCategory[category] || edgeCasesByCategory.sorting,
        code: addTeachingComments(code, algorithm, overview),
        time: formatTime(algorithm.timeComplexity),
        space: algorithm.spaceComplexity || 'N/A'
    };
};
