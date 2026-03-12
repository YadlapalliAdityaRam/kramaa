const CATEGORY_CANVAS_MAP = {
    sorting: 'array',
    searching: 'array',
    string: 'array',
    backtracking: 'array',
    math: 'array',
    graphs: 'graph',
    trees: 'tree',
    dp: 'dp',
    greedy: 'activity'
};

const DEFAULT_ARRAY = [48, 15, 72, 9, 64, 27, 83, 31, 56, 20];

export const normalizeCategoryKey = (value) => String(value || '').trim().toLowerCase();

export const getCanvasTypeForCategory = (categoryKey) => {
    const normalized = normalizeCategoryKey(categoryKey);
    return CATEGORY_CANVAS_MAP[normalized] || 'array';
};

export const getDefaultArrayData = () => [...DEFAULT_ARRAY];

export const sanitizeArrayInput = (input, fallback = DEFAULT_ARRAY) => {
    if (!Array.isArray(input) || input.length === 0) return [...fallback];
    return input.slice(0, 10).map((value, index) => {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) return Math.max(1, Math.min(999, Math.round(numeric)));
        return fallback[index % fallback.length];
    });
};

export const resolveDefaultTarget = (array) => {
    if (!Array.isArray(array) || array.length === 0) return 0;
    return array[Math.floor(array.length / 2)];
};

export const resolveAlgorithmTargetDefault = (algorithmName, array, fallback) => {
    if (Number.isFinite(Number(fallback))) return Math.round(Number(fallback));
    const source = Array.isArray(array) && array.length ? array : DEFAULT_ARRAY;
    if (algorithmName === 'Sliding Window Technique') {
        return Math.max(1, Math.min(3, source.length));
    }
    return resolveDefaultTarget(source);
};

export const clampAlgorithmTarget = (algorithmName, array, candidate) => {
    const source = Array.isArray(array) && array.length ? array : DEFAULT_ARRAY;
    if (algorithmName === 'Sliding Window Technique') {
        const base = Number.isFinite(Number(candidate))
            ? Math.round(Number(candidate))
            : resolveAlgorithmTargetDefault(algorithmName, source);
        return Math.max(1, Math.min(source.length, base));
    }
    if (Number.isFinite(Number(candidate))) return Math.round(Number(candidate));
    return resolveAlgorithmTargetDefault(algorithmName, source);
};

export const getTargetFieldMeta = (algorithmName, canvasType = 'array') => {
    if (canvasType === 'string') {
        return { label: 'Pattern', placeholder: 'Pattern' };
    }
    if (algorithmName === 'Sliding Window Technique') {
        return { label: 'Window Size', placeholder: 'k' };
    }
    if (algorithmName === 'Two Pointers Technique') {
        return { label: 'Target Sum', placeholder: 'Target sum' };
    }
    return { label: 'Search Target', placeholder: 'Target' };
};

export const pathToSlug = (path) => String(path || '').replace(/^\/algorithms\//, '').replace(/^\/+/, '');

const buildSortingFallbackSteps = (array, name) => {
    const arr = sanitizeArrayInput(array);
    const steps = [{
        type: 'info',
        indices: [],
        sortedIndices: [],
        description: `${name}: start with unsorted input.`,
        arraySnapshot: [...arr]
    }];

    const sorted = [];
    for (let i = 0; i < arr.length - 1; i++) {
        let swapped = false;
        for (let j = 0; j < arr.length - i - 1; j++) {
            steps.push({
                type: 'compare',
                indices: [j, j + 1],
                sortedIndices: [...sorted],
                description: `Compare ${arr[j]} and ${arr[j + 1]}.`,
                arraySnapshot: [...arr]
            });

            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapped = true;
                steps.push({
                    type: 'swap',
                    indices: [j, j + 1],
                    sortedIndices: [...sorted],
                    description: `Swap to keep larger value to the right.`,
                    arraySnapshot: [...arr]
                });
            }
        }

        const sortedIndex = arr.length - i - 1;
        sorted.push(sortedIndex);
        steps.push({
            type: 'sorted',
            indices: [sortedIndex],
            sortedIndices: [...sorted],
            description: `Position ${sortedIndex} is fixed.`,
            arraySnapshot: [...arr]
        });

        if (!swapped) break;
    }

    if (!sorted.includes(0)) sorted.push(0);
    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: [...sorted],
        description: `${name}: visualization complete.`,
        arraySnapshot: [...arr]
    });

    return steps;
};

const buildSearchingFallbackSteps = (array, target, name) => {
    const arr = sanitizeArrayInput(array);
    const searchTarget = Number.isFinite(Number(target)) ? Number(target) : resolveDefaultTarget(arr);
    const steps = [{
        type: 'info',
        indices: [],
        sortedIndices: [],
        description: `${name}: searching for target ${searchTarget}.`,
        arraySnapshot: [...arr]
    }];

    for (let i = 0; i < arr.length; i++) {
        steps.push({
            type: 'compare',
            indices: [i],
            sortedIndices: [],
            description: `Check index ${i} (${arr[i]}) against ${searchTarget}.`,
            arraySnapshot: [...arr]
        });
        if (arr[i] === searchTarget) {
            steps.push({
                type: 'found',
                indices: [i],
                sortedIndices: [i],
                description: `Target ${searchTarget} found at index ${i}.`,
                arraySnapshot: [...arr]
            });
            return steps;
        }
    }

    steps.push({
        type: 'not-found',
        indices: [],
        sortedIndices: [],
        description: `Target ${searchTarget} not found in this input.`,
        arraySnapshot: [...arr]
    });
    return steps;
};

const buildConceptFallbackSteps = (array, name, categoryLabel) => {
    const arr = sanitizeArrayInput(array);
    const steps = [{
        type: 'info',
        indices: [],
        sortedIndices: [],
        description: `${name} (${categoryLabel}): walkthrough mode.`,
        arraySnapshot: [...arr]
    }];

    const highlighted = [];
    for (let i = 0; i < arr.length; i++) {
        const pair = i < arr.length - 1 ? [i, i + 1] : [i];
        steps.push({
            type: 'compare',
            indices: pair,
            sortedIndices: [...highlighted],
            description: `Analyze element ${arr[i]} at index ${i}.`,
            arraySnapshot: [...arr]
        });
        highlighted.push(i);
    }

    steps.push({
        type: 'completed',
        indices: [],
        sortedIndices: [...highlighted],
        description: `${name}: conceptual animation complete.`,
        arraySnapshot: [...arr]
    });
    return steps;
};

export const generateFallbackArraySteps = ({ categoryKey, name, array, target }) => {
    const normalized = normalizeCategoryKey(categoryKey);
    if (normalized === 'sorting') return buildSortingFallbackSteps(array, name);
    if (normalized === 'searching') return buildSearchingFallbackSteps(array, target, name);
    return buildConceptFallbackSteps(array, name, normalized || 'general');
};

const toIdentifier = (name) => String(name || 'algorithm')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part, index) => index === 0 ? part.toLowerCase() : `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join('') || 'algorithm';

const toSnake = (name) => String(name || 'algorithm')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .join('_') || 'algorithm';

const toPascal = (name) => String(name || 'Algorithm')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join('') || 'Algorithm';

export const generateFallbackCode = ({ name, categoryKey, language }) => {
    const normalizedCategory = normalizeCategoryKey(categoryKey);
    const id = toIdentifier(name);
    const snake = toSnake(name);
    const pascal = toPascal(name);

    const templates = {
        javascript: {
            sorting: `function ${id}(arr) {\n  for (let i = 0; i < arr.length - 1; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}`,
            searching: `function ${id}(arr, target) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}`,
            graphs: `function ${id}(graph, start) {\n  const queue = [start];\n  const visited = new Set([start]);\n  while (queue.length) {\n    const node = queue.shift();\n    for (const next of graph[node] || []) {\n      if (!visited.has(next)) {\n        visited.add(next);\n        queue.push(next);\n      }\n    }\n  }\n  return [...visited];\n}`,
            floydwarshall: `function floydWarshall(graph, V) {\n  const dist = Array.from({ length: V }, () => Array(V).fill(Infinity));\n  for (let i = 0; i < V; i++) dist[i][i] = 0;\n  \n  // add edges to dist...\n\n  for (let k = 0; k < V; k++) {\n    for (let i = 0; i < V; i++) {\n      for (let j = 0; j < V; j++) {\n        if (dist[i][k] + dist[k][j] < dist[i][j]) {\n          dist[i][j] = dist[i][k] + dist[k][j];\n        }\n      }\n    }\n  }\n  return dist;\n}`,
            bucketsort: `function ${id}(arr, k = 5) {\n  const buckets = Array.from({ length: k }, () => []);\n  // Scatter\n  for (let val of arr) {\n    let index = Math.floor(k * val);\n    buckets[index].push(val);\n  }\n  // Sort & Gather\n  const result = [];\n  for (let bucket of buckets) {\n    bucket.sort((a,b) => a - b);\n    result.push(...bucket);\n  }\n  return result;\n}`,
            trees: `function ${id}(root, out = []) {\n  if (!root) return out;\n  ${normalizedCategory === 'trees' ? 'out.push(root.value);' : ''}\n  ${normalizedCategory === 'trees' ? `${id}(root.left, out);` : ''}\n  ${normalizedCategory === 'trees' ? `${id}(root.right, out);` : ''}\n  return out;\n}`,
            dp: `function ${id}(n) {\n  const dp = new Array(n + 1).fill(0);\n  for (let i = 1; i <= n; i++) {\n    dp[i] = dp[i - 1] + 1;\n  }\n  return dp[n];\n}`,
            greedy: `function ${id}(items) {\n  const sorted = [...items].sort((a, b) => a.end - b.end);\n  const selected = [];\n  let lastEnd = -Infinity;\n  for (const item of sorted) {\n    if (item.start >= lastEnd) {\n      selected.push(item);\n      lastEnd = item.end;\n    }\n  }\n  return selected;\n}`,
            string: `function ${id}(text, pattern) {\n  for (let i = 0; i <= text.length - pattern.length; i++) {\n    if (text.slice(i, i + pattern.length) === pattern) {\n      return i;\n    }\n  }\n  return -1;\n}`,
            backtracking: `function ${id}(state, answers = []) {\n  if (state.isComplete()) {\n    answers.push(state.snapshot());\n    return answers;\n  }\n  for (const choice of state.choices()) {\n    state.apply(choice);\n    ${id}(state, answers);\n    state.undo(choice);\n  }\n  return answers;\n}`,
            math: `function ${id}(a, b) {\n  while (b !== 0) {\n    const r = a % b;\n    a = b;\n    b = r;\n  }\n  return a;\n}`,
            boyermoore: `function boyerMoore(text, pattern) {\n  const n = text.length, m = pattern.length;\n  const badChar = new Array(256).fill(-1);\n  for (let i = 0; i < m; i++) badChar[pattern.charCodeAt(i)] = i;\n  let s = 0;\n  while (s <= (n - m)) {\n    let j = m - 1;\n    while (j >= 0 && pattern[j] === text[s + j]) j--;\n    if (j < 0) {\n      return s; // found\n    } else {\n      s += Math.max(1, j - badChar[text.charCodeAt(s + j)]);\n    }\n  }\n  return -1;\n}`
        },
        python: {
            sorting: `def ${snake}(arr):\n    n = len(arr)\n    for i in range(n - 1):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr`,
            searching: `def ${snake}(arr, target):\n    for i, value in enumerate(arr):\n        if value == target:\n            return i\n    return -1`,
            graphs: `def ${snake}(graph, start):\n    queue = [start]\n    visited = {start}\n    while queue:\n        node = queue.pop(0)\n        for nxt in graph.get(node, []):\n            if nxt not in visited:\n                visited.add(nxt)\n                queue.append(nxt)\n    return list(visited)`,
            floydwarshallalgorithm: `def floyd_warshall(graph, v):\n    dist = [[float('inf')] * v for _ in range(v)]\n    for i in range(v): dist[i][i] = 0\n    # dist[u][v] = weight\n    for k in range(v):\n        for i in range(v):\n            for j in range(v):\n                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])\n    return dist`,
            bucketsort: `def ${snake}(arr, k=5):\n    buckets = [[] for _ in range(k)]\n    for val in arr:\n        index = int(k * val)\n        buckets[index].append(val)\n    result = []\n    for bucket in buckets:\n        result.extend(sorted(bucket))\n    return result`,
            trees: `def ${snake}(root, out=None):\n    if out is None:\n        out = []\n    if root is None:\n        return out\n    out.append(root.value)\n    ${snake}(root.left, out)\n    ${snake}(root.right, out)\n    return out`,
            dp: `def ${snake}(n):\n    dp = [0] * (n + 1)\n    for i in range(1, n + 1):\n        dp[i] = dp[i - 1] + 1\n    return dp[n]`,
            greedy: `def ${snake}(items):\n    items = sorted(items, key=lambda x: x['end'])\n    selected = []\n    last_end = float('-inf')\n    for item in items:\n        if item['start'] >= last_end:\n            selected.append(item)\n            last_end = item['end']\n    return selected`,
            string: `def ${snake}(text, pattern):\n    m = len(pattern)\n    for i in range(len(text) - m + 1):\n        if text[i:i + m] == pattern:\n            return i\n    return -1`,
            boyermoore: `def boyer_moore(text, pattern):\n    n, m = len(text), len(pattern)\n    bad_char = [-1] * 256\n    for i in range(m):\n        bad_char[ord(pattern[i])] = i\n    s = 0\n    while s <= (n - m):\n        j = m - 1\n        while j >= 0 and pattern[j] == text[s + j]:\n            j -= 1\n        if j < 0:\n            return s\n        else:\n            s += max(1, j - bad_char[ord(text[s + j])])\n    return -1`,
            backtracking: `def ${snake}(state, answers=None):\n    if answers is None:\n        answers = []\n    if state.is_complete():\n        answers.append(state.snapshot())\n        return answers\n    for choice in state.choices():\n        state.apply(choice)\n        ${snake}(state, answers)\n        state.undo(choice)\n    return answers`,
            math: `def ${snake}(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a`
        },
        cpp: {
            sorting: `void ${id}(vector<int>& arr) {\n    int n = (int)arr.size();\n    for (int i = 0; i < n - 1; i++) {\n        for (int j = 0; j < n - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}`,
            searching: `int ${id}(const vector<int>& arr, int target) {\n    for (int i = 0; i < (int)arr.size(); i++) {\n        if (arr[i] == target) return i;\n    }\n    return -1;\n}`,
            graphs: `vector<int> ${id}(unordered_map<int, vector<int>>& g, int start) {\n    queue<int> q;\n    unordered_set<int> vis;\n    q.push(start);\n    vis.insert(start);\n    while (!q.empty()) {\n        int node = q.front(); q.pop();\n        for (int nxt : g[node]) {\n            if (!vis.count(nxt)) {\n                vis.insert(nxt);\n                q.push(nxt);\n            }\n        }\n    }\n    return vector<int>(vis.begin(), vis.end());\n}`,
            floydwarshallalgorithm: `vector<vector<int>> floydWarshall(int V, vector<vector<int>>& edges) {\n    vector<vector<int>> dist(V, vector<int>(V, 1e9));\n    for (int i = 0; i < V; i++) dist[i][i] = 0;\n    // setup edges\n    for (int k = 0; k < V; k++) {\n        for (int i = 0; i < V; i++) {\n            for (int j = 0; j < V; j++) {\n                if (dist[i][k] + dist[k][j] < dist[i][j])\n                    dist[i][j] = dist[i][k] + dist[k][j];\n            }\n        }\n    }\n    return dist;\n}`,
            bucketsort: `void ${id}(vector<float>& arr, int k = 5) {\n    vector<vector<float>> buckets(k);\n    for(float val : arr) {\n        int index = k * val;\n        if(index >= k) index = k - 1;\n        buckets[index].push_back(val);\n    }\n    int index = 0;\n    for(auto& bucket : buckets) {\n        sort(bucket.begin(), bucket.end());\n        for(float val : bucket) arr[index++] = val;\n    }\n}`,
            trees: `void ${id}(Node* root, vector<int>& out) {\n    if (!root) return;\n    out.push_back(root->value);\n    ${id}(root->left, out);\n    ${id}(root->right, out);\n}`,
            dp: `int ${id}(int n) {\n    vector<int> dp(n + 1, 0);\n    for (int i = 1; i <= n; i++) {\n        dp[i] = dp[i - 1] + 1;\n    }\n    return dp[n];\n}`,
            greedy: `vector<Activity> ${id}(vector<Activity> items) {\n    sort(items.begin(), items.end(), [](const Activity& a, const Activity& b) {\n        return a.end < b.end;\n    });\n    vector<Activity> selected;\n    int lastEnd = INT_MIN;\n    for (const auto& item : items) {\n        if (item.start >= lastEnd) {\n            selected.push_back(item);\n            lastEnd = item.end;\n        }\n    }\n    return selected;\n}`,
            string: `int ${id}(const string& text, const string& pattern) {\n    int m = (int)pattern.size();\n    for (int i = 0; i + m <= (int)text.size(); i++) {\n        if (text.substr(i, m) == pattern) return i;\n    }\n    return -1;\n}`,
            boyermoore: `int boyerMoore(string text, string pattern) {\n    int n = text.size(), m = pattern.size();\n    vector<int> badChar(256, -1);\n    for (int i = 0; i < m; i++) badChar[(int)pattern[i]] = i;\n    int s = 0;\n    while (s <= (n - m)) {\n        int j = m - 1;\n        while (j >= 0 && pattern[j] == text[s + j]) j--;\n        if (j < 0) return s;\n        else s += max(1, j - badChar[(int)text[s + j]]);\n    }\n    return -1;\n}`,
            backtracking: `void ${id}(State& state, vector<Solution>& out) {\n    if (state.isComplete()) {\n        out.push_back(state.snapshot());\n        return;\n    }\n    for (auto choice : state.choices()) {\n        state.apply(choice);\n        ${id}(state, out);\n        state.undo(choice);\n    }\n}`,
            math: `int ${id}(int a, int b) {\n    while (b != 0) {\n        int r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}`
        },
        java: {
            sorting: `public static void ${id}(int[] arr) {\n    for (int i = 0; i < arr.length - 1; i++) {\n        for (int j = 0; j < arr.length - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                int tmp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = tmp;\n            }\n        }\n    }\n}`,
            searching: `public static int ${id}(int[] arr, int target) {\n    for (int i = 0; i < arr.length; i++) {\n        if (arr[i] == target) return i;\n    }\n    return -1;\n}`,
            graphs: `public static List<Integer> ${id}(Map<Integer, List<Integer>> g, int start) {\n    Queue<Integer> q = new ArrayDeque<>();\n    Set<Integer> vis = new HashSet<>();\n    q.add(start);\n    vis.add(start);\n    while (!q.isEmpty()) {\n        int node = q.poll();\n        for (int nxt : g.getOrDefault(node, List.of())) {\n            if (!vis.contains(nxt)) {\n                vis.add(nxt);\n                q.add(nxt);\n            }\n        }\n    }\n    return new ArrayList<>(vis);\n}`,
            floydwarshallalgorithm: `public static int[][] floydWarshall(int V, int[][] edges) {\n    int[][] dist = new int[V][V];\n    for (int[] row : dist) Arrays.fill(row, (int) 1e9);\n    for (int i = 0; i < V; i++) dist[i][i] = 0;\n    // populate edges...\n    for (int k = 0; k < V; k++) {\n        for (int i = 0; i < V; i++) {\n            for (int j = 0; j < V; j++) {\n                if (dist[i][k] + dist[k][j] < dist[i][j]) {\n                    dist[i][j] = dist[i][k] + dist[k][j];\n                }\n            }\n        }\n    }\n    return dist;\n}`,
            bucketsort: `public static void ${id}(float[] arr, int k) {\n    List<Float>[] buckets = new ArrayList[k];\n    for(int i=0; i<k; i++) buckets[i] = new ArrayList<>();\n    for(float val : arr) {\n        int idx = (int)(k * val);\n        if(idx >= k) idx = k - 1;\n        buckets[idx].add(val);\n    }\n    int index = 0;\n    for(List<Float> bucket : buckets) {\n        Collections.sort(bucket);\n        for(float val : bucket) arr[index++] = val;\n    }\n}`,
            trees: `public static void ${id}(TreeNode root, List<Integer> out) {\n    if (root == null) return;\n    out.add(root.val);\n    ${id}(root.left, out);\n    ${id}(root.right, out);\n}`,
            dp: `public static int ${id}(int n) {\n    int[] dp = new int[n + 1];\n    for (int i = 1; i <= n; i++) {\n        dp[i] = dp[i - 1] + 1;\n    }\n    return dp[n];\n}`,
            greedy: `public static List<Activity> ${id}(List<Activity> items) {\n    items.sort(Comparator.comparingInt(a -> a.end));\n    List<Activity> selected = new ArrayList<>();\n    int lastEnd = Integer.MIN_VALUE;\n    for (Activity item : items) {\n        if (item.start >= lastEnd) {\n            selected.push_back(item);\n            lastEnd = item.end;\n        }\n    }\n    return selected;\n}`,
            string: `public static int ${id}(String text, String pattern) {\n    int m = pattern.length();\n    for (int i = 0; i + m <= text.length(); i++) {\n        if (text.substring(i, i + m).equals(pattern)) return i;\n    }\n    return -1;\n}`,
            boyermoore: `public static int boyerMoore(String text, String pattern) {\n    int n = text.length(), m = pattern.length();\n    int[] badChar = new int[256];\n    Arrays.fill(badChar, -1);\n    for (int i = 0; i < m; i++) badChar[pattern.charAt(i)] = i;\n    int s = 0;\n    while (s <= (n - m)) {\n        int j = m - 1;\n        while (j >= 0 && pattern.charAt(j) == text.charAt(s + j)) j--;\n        if (j < 0) return s;\n        else s += Math.max(1, j - badChar[text.charAt(s + j)]);\n    }\n    return -1;\n}`,
            backtracking: `public static void ${id}(State state, List<Solution> out) {\n    if (state.isComplete()) {\n        out.add(state.snapshot());\n        return;\n    }\n    for (Choice choice : state.choices()) {\n        state.apply(choice);\n        ${id}(state, out);\n        state.undo(choice);\n    }\n}`,
            math: `public static int ${id}(int a, int b) {\n    while (b != 0) {\n        int r = a % b;\n        a = b;\n        b = r;\n    }\n    return a;\n}`
        }
    };

    const langTemplates = templates[language] || templates.javascript;
    const specificKey = id.toLowerCase();
    return langTemplates[specificKey] || langTemplates[normalizedCategory] || langTemplates.sorting;
};

const FALLBACK_LINE_MAP = {
    sorting: { compare: 4, swap: 5, sorted: 8, completed: 10, info: 1 },
    searching: { compare: 3, found: 4, 'not-found': 6, completed: 6, info: 1 },
    graphs: { graph: 4, visit: 7, enqueue: 10, relax: 10, 'graph-complete': 15, info: 1 },
    trees: { tree: 4, visit: 5, 'tree-complete': 8, info: 1 },
    dp: { dp: 4, 'dp-complete': 7, info: 1 },
    greedy: { activity: 6, 'activity-complete': 10, info: 1 },
    string: { compare: 3, found: 4, 'not-found': 6, completed: 6, info: 1 },
    backtracking: { compare: 7, found: 3, completed: 11, info: 1 },
    math: { compare: 2, completed: 7, info: 1 },
    default: { compare: 3, completed: 6, info: 1 }
};

export const getFallbackLineMap = (categoryKey) => {
    const normalized = normalizeCategoryKey(categoryKey);
    return FALLBACK_LINE_MAP[normalized] || FALLBACK_LINE_MAP.default;
};
