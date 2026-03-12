export const algorithmCodes = {
    // ── SORTING ───────────────────────────────────────────
    bubbleSort: {
        javascript: `function bubbleSort(arr) {
    let n = arr.length;
    let swapped;
    do {
        swapped = false;
        for (let i = 0; i < n - 1; i++) {
            if (arr[i] > arr[i + 1]) {
                let temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }
        n--;
    } while (swapped);
    return arr;
}`,
        python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
        cpp: `void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    bool swapped;
    for (int i = 0; i < n - 1; i++) {
        swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped)
            break;
    }
}`,
        java: `public void bubbleSort(int[] arr) {
    int n = arr.length;
    boolean swapped;
    for (int i = 0; i < n - 1; i++) {
        swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped)
            break;
    }
}`
    },

    insertionSort: {
        javascript: `function insertionSort(arr) {
    for (let i = 1; i < arr.length; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
    return arr;
}`,
        python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
        cpp: `void insertionSort(vector<int>& arr) {
    for (int i = 1; i < arr.size(); i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
        java: `public void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`
    },

    selectionSort: {
        javascript: `function selectionSort(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    return arr;
}`
    },

    mergeSort: {
        javascript: `function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) result.push(left[i++]);
        else result.push(right[j++]);
    }
    return [...result, ...left.slice(i), ...right.slice(j)];
}`,
        python: `def merge_sort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    result, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
        cpp: `void merge(vector<int>& arr, int left, int mid, int right) {
    vector<int> temp(right - left + 1);
    int i = left, j = mid + 1, k = 0;
    
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else temp[k++] = arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    
    for (int p = 0; p < k; p++) arr[left + p] = temp[p];
}

void mergeSort(vector<int>& arr, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}`,
        java: `public void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;
    
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else temp[k++] = arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    
    for (int p = 0; p < k; p++) arr[left + p] = temp[p];
}

public void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}`
    },

    quickSort: {
        javascript: `function quickSort(arr, lo = 0, hi = arr.length - 1) {
    if (lo < hi) {
        const pivot = partition(arr, lo, hi);
        quickSort(arr, lo, pivot - 1);
        quickSort(arr, pivot + 1, hi);
    }
    return arr;
}

function partition(arr, lo, hi) {
    const pivot = arr[hi];
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    [arr[i + 1], arr[hi]] = [arr[hi], arr[i + 1]];
    return i + 1;
}`,
        python: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)
    return arr`,
        cpp: `int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
        java: `public int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}

public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`
    },

    heapSort: {
        javascript: `function heapSort(arr) {
    const n = arr.length;
    // Build max-heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--)
        heapify(arr, n, i);
    // Extract elements
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        heapify(arr, i, 0);
    }
    return arr;
}

function heapify(arr, size, root) {
    let largest = root;
    const left = 2 * root + 1, right = 2 * root + 2;
    if (left < size && arr[left] > arr[largest]) largest = left;
    if (right < size && arr[right] > arr[largest]) largest = right;
    if (largest !== root) {
        [arr[root], arr[largest]] = [arr[largest], arr[root]];
        heapify(arr, size, largest);
    }
}`,
        python: `def heapify(arr, n, i):
    largest = i
    l = 2 * i + 1
    r = 2 * i + 2
    if l < n and arr[l] > arr[largest]: largest = l
    if r < n and arr[r] > arr[largest]: largest = r
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)

def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)
    return arr`,
        cpp: `void heapify(vector<int>& arr, int n, int i) {
    int largest = i;
    int l = 2 * i + 1;
    int r = 2 * i + 2;
    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest != i) {
        swap(arr[i], arr[largest]);
        heapify(arr, n, largest);
    }
}

void heapSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = n / 2 - 1; i >= 0; i--)
        heapify(arr, n, i);
    for (int i = n - 1; i > 0; i--) {
        swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}`,
        java: `public void heapify(int[] arr, int n, int i) {
    int largest = i;
    int l = 2 * i + 1;
    int r = 2 * i + 2;
    if (l < n && arr[l] > arr[largest]) largest = l;
    if (r < n && arr[r] > arr[largest]) largest = r;
    if (largest != i) {
        int temp = arr[i];
        arr[i] = arr[largest];
        arr[largest] = temp;
        heapify(arr, n, largest);
    }
}

public void heapSort(int[] arr) {
    int n = arr.length;
    for (int i = n / 2 - 1; i >= 0; i--)
        heapify(arr, n, i);
    for (int i = n - 1; i > 0; i--) {
        int temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
        heapify(arr, i, 0);
    }
}`
    },

    bucketSort: {
        javascript: `function bucketSort(arr) {
    const n = arr.length;
    const max = Math.max(...arr), min = Math.min(...arr);
    const bucketCount = Math.floor(Math.sqrt(n));
    const range = (max - min + 1) / bucketCount;
    const buckets = Array.from({length: bucketCount}, () => []);

    arr.forEach(val => {
        const idx = Math.min(Math.floor((val - min) / range), bucketCount - 1);
        buckets[idx].push(val);
    });

    buckets.forEach(b => b.sort((a, b) => a - b));
    return buckets.flat();
}`,
        python: `def bucket_sort(arr):
    if len(arr) == 0: return arr
    max_val, min_val = max(arr), min(arr)
    bucket_cnt = int(len(arr) ** 0.5)
    rng = (max_val - min_val + 1) / bucket_cnt
    buckets = [[] for _ in range(bucket_cnt)]

    for val in arr:
        idx = min(int((val - min_val) / rng), bucket_cnt - 1)
        buckets[idx].append(val)

    for b in buckets:
        b.sort()
    
    result = []
    for b in buckets:
        result.extend(b)
    return result`,
        cpp: `vector<int> bucketSort(vector<int>& arr) {
    if (arr.empty()) return arr;
    int n = arr.size();
    int min_val = *min_element(arr.begin(), arr.end());
    int max_val = *max_element(arr.begin(), arr.end());
    int bucket_cnt = sqrt(n);
    double range = (max_val - min_val + 1.0) / bucket_cnt;
    vector<vector<int>> buckets(bucket_cnt);

    for (int val : arr) {
        int idx = min((int)((val - min_val) / range), bucket_cnt - 1);
        buckets[idx].push_back(val);
    }

    vector<int> result;
    for (auto& b : buckets) {
        sort(b.begin(), b.end());
        result.insert(result.end(), b.begin(), b.end());
    }
    return result;
}`,
        java: `public int[] bucketSort(int[] arr) {
    if (arr.length == 0) return arr;
    int n = arr.length;
    int min = arr[0], max = arr[0];
    for (int val : arr) {
        min = Math.min(min, val);
        max = Math.max(max, val);
    }
    int bucketCount = (int) Math.sqrt(n);
    double range = (double) (max - min + 1) / bucketCount;
    List<List<Integer>> buckets = new ArrayList<>(bucketCount);
    for (int i = 0; i < bucketCount; i++) buckets.add(new ArrayList<>());

    for (int val : arr) {
        int idx = Math.min((int) ((val - min) / range), bucketCount - 1);
        buckets.get(idx).add(val);
    }

    int k = 0;
    for (List<Integer> b : buckets) {
        Collections.sort(b);
        for (int val : b) arr[k++] = val;
    }
    return arr;
}`
    },

    radixSort: {
        javascript: `function radixSort(arr) {
    const max = Math.max(...arr);
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        countingSortByDigit(arr, exp);
    }
    return arr;
}

function countingSortByDigit(arr, exp) {
    const output = new Array(arr.length);
    const count = new Array(10).fill(0);

    arr.forEach(val => count[Math.floor(val / exp) % 10]++);
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];

    for (let i = arr.length - 1; i >= 0; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }
    arr.forEach((_, i) => arr[i] = output[i]);
}`,
        python: `def counting_sort_by_digit(arr, exp):
    n = len(arr)
    output = [0] * n
    count = [0] * 10
    
    for i in range(n):
        index = arr[i] // exp
        count[index % 10] += 1
        
    for i in range(1, 10):
        count[i] += count[i - 1]
        
    for i in range(n - 1, -1, -1):
        index = arr[i] // exp
        output[count[index % 10] - 1] = arr[i]
        count[index % 10] -= 1
        
    for i in range(n):
        arr[i] = output[i]

def radix_sort(arr):
    if not arr: return arr
    max_val = max(arr)
    exp = 1
    while max_val // exp > 0:
        counting_sort_by_digit(arr, exp)
        exp *= 10
    return arr`,
        cpp: `void countingSortByDigit(vector<int>& arr, int exp) {
    int n = arr.size();
    vector<int> output(n);
    vector<int> count(10, 0);
    
    for (int i = 0; i < n; i++)
        count[(arr[i] / exp) % 10]++;
        
    for (int i = 1; i < 10; i++)
        count[i] += count[i - 1];
        
    for (int i = n - 1; i >= 0; i--) {
        output[count[(arr[i] / exp) % 10] - 1] = arr[i];
        count[(arr[i] / exp) % 10]--;
    }
    
    for (int i = 0; i < n; i++)
        arr[i] = output[i];
}

void radixSort(vector<int>& arr) {
    if (arr.empty()) return;
    int max_val = *max_element(arr.begin(), arr.end());
    for (int exp = 1; max_val / exp > 0; exp *= 10)
        countingSortByDigit(arr, exp);
}`,
        java: `public void countingSortByDigit(int[] arr, int exp) {
    int n = arr.length;
    int[] output = new int[n];
    int[] count = new int[10];
    
    for (int i = 0; i < n; i++)
        count[(arr[i] / exp) % 10]++;
        
    for (int i = 1; i < 10; i++)
        count[i] += count[i - 1];
        
    for (int i = n - 1; i >= 0; i--) {
        output[count[(arr[i] / exp) % 10] - 1] = arr[i];
        count[(arr[i] / exp) % 10]--;
    }
    
    for (int i = 0; i < n; i++)
        arr[i] = output[i];
}

public void radixSort(int[] arr) {
    if (arr.length == 0) return;
    int max = arr[0];
    for (int val : arr) if (val > max) max = val;
    for (int exp = 1; max / exp > 0; exp *= 10)
        countingSortByDigit(arr, exp);
}`
    },

    // ── SEARCHING ─────────────────────────────────────────
    linearSearch: {
        javascript: `function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) return i;
    }
    return -1;
}`
    },

    binarySearch: {
        javascript: `function binarySearch(arr, target) {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
        python: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target: return mid
        if arr[mid] < target: left = mid + 1
        else: right = mid - 1
    return -1`,
        cpp: `int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
        java: `public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
    },



    jumpSearch: {
        javascript: `function jumpSearch(arr, target) {
    const n = arr.length;
    const jump = Math.floor(Math.sqrt(n));
    let prev = 0, curr = jump;

    while (curr < n && arr[curr] < target) {
        prev = curr;
        curr += jump;
    }

    for (let i = prev; i <= Math.min(curr, n - 1); i++) {
        if (arr[i] === target) return i;
    }
    return -1;
}`,
        python: `import math

def jump_search(arr, target):
    n = len(arr)
    jump = int(math.sqrt(n))
    prev = 0
    curr = jump
    
    while curr < n and arr[curr] < target:
        prev = curr
        curr += jump
        
    for i in range(prev, min(curr, n)):
        if arr[i] == target:
            return i
            
    return -1`,
        cpp: `int jumpSearch(vector<int>& arr, int target) {
    int n = arr.size();
    int jump = sqrt(n);
    int prev = 0, curr = jump;
    
    while (curr < n && arr[curr] < target) {
        prev = curr;
        curr += jump;
    }
    
    for (int i = prev; i <= min(curr, n - 1); i++) {
        if (arr[i] == target) return i;
    }
    
    return -1;
}`,
        java: `public int jumpSearch(int[] arr, int target) {
    int n = arr.length;
    int jump = (int) Math.sqrt(n);
    int prev = 0, curr = jump;
    
    while (curr < n && arr[curr] < target) {
        prev = curr;
        curr += jump;
    }
    
    for (int i = prev; i <= Math.min(curr, n - 1); i++) {
        if (arr[i] == target) return i;
    }
    
    return -1;
}`
    },

    interpolationSearch: {
        javascript: `function interpolationSearch(arr, target) {
    let lo = 0, hi = arr.length - 1;
    while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
        const pos = lo + Math.floor(
            ((target - arr[lo]) * (hi - lo)) / (arr[hi] - arr[lo])
        );
        if (arr[pos] === target) return pos;
        if (arr[pos] < target) lo = pos + 1;
        else hi = pos - 1;
    }
    return -1;
}`,
        python: `def interpolation_search(arr, target):
    lo, hi = 0, len(arr) - 1
    
    while lo <= hi and target >= arr[lo] and target <= arr[hi]:
        if lo == hi:
            if arr[lo] == target: return lo
            return -1
            
        pos = lo + int(((float(hi - lo) / (arr[hi] - arr[lo])) * (target - arr[lo])))
        
        if arr[pos] == target: return pos
        if arr[pos] < target: lo = pos + 1
        else: hi = pos - 1
        
    return -1`,
        cpp: `int interpolationSearch(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    
    while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
        if (lo == hi) {
            if (arr[lo] == target) return lo;
            return -1;
        }
        
        int pos = lo + (((double)(hi - lo) / (arr[hi] - arr[lo])) * (target - arr[lo]));
        
        if (arr[pos] == target) return pos;
        if (arr[pos] < target) lo = pos + 1;
        else hi = pos - 1;
    }
    
    return -1;
}`,
        java: `public int interpolationSearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    
    while (lo <= hi && target >= arr[lo] && target <= arr[hi]) {
        if (lo == hi) {
            if (arr[lo] == target) return lo;
            return -1;
        }
        
        int pos = lo + (int) (((double)(hi - lo) / (arr[hi] - arr[lo])) * (target - arr[lo]));
        
        if (arr[pos] == target) return pos;
        if (arr[pos] < target) lo = pos + 1;
        else hi = pos - 1;
    }
    
    return -1;
}`
    },

    exponentialSearch: {
        javascript: `function exponentialSearch(arr, target) {
    if (arr[0] === target) return 0;
    let bound = 1;
    while (bound < arr.length && arr[bound] <= target)
        bound *= 2;

    // Binary search in range
    let lo = bound / 2, hi = Math.min(bound, arr.length - 1);
    while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
        python: `def binary_search(arr, l, r, x):
    if r >= l:
        mid = l + (r - l) // 2
        if arr[mid] == x: return mid
        if arr[mid] > x: return binary_search(arr, l, mid - 1, x)
        return binary_search(arr, mid + 1, r, x)
    return -1

def exponential_search(arr, target):
    n = len(arr)
    if n == 0: return -1
    if arr[0] == target: return 0
    
    bound = 1
    while bound < n and arr[bound] <= target:
        bound *= 2
        
    return binary_search(arr, bound // 2, min(bound, n - 1), target)`,
        cpp: `int binarySearchExt(vector<int>& arr, int l, int r, int x) {
    if (r >= l) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == x) return mid;
        if (arr[mid] > x) return binarySearchExt(arr, l, mid - 1, x);
        return binarySearchExt(arr, mid + 1, r, x);
    }
    return -1;
}

int exponentialSearch(vector<int>& arr, int target) {
    int n = arr.size();
    if (n == 0) return -1;
    if (arr[0] == target) return 0;
    
    int bound = 1;
    while (bound < n && arr[bound] <= target)
        bound *= 2;
        
    return binarySearchExt(arr, bound / 2, min(bound, n - 1), target);
}`,
        java: `private int binarySearchExt(int[] arr, int l, int r, int x) {
    if (r >= l) {
        int mid = l + (r - l) / 2;
        if (arr[mid] == x) return mid;
        if (arr[mid] > x) return binarySearchExt(arr, l, mid - 1, x);
        return binarySearchExt(arr, mid + 1, r, x);
    }
    return -1;
}

public int exponentialSearch(int[] arr, int target) {
    int n = arr.length;
    if (n == 0) return -1;
    if (arr[0] == target) return 0;
    
    int bound = 1;
    while (bound < n && arr[bound] <= target)
        bound *= 2;
        
    return binarySearchExt(arr, bound / 2, Math.min(bound, n - 1), target);
}`
    },

    // ── GRAPHS ────────────────────────────────────────────
    bfs: {
        javascript: `function bfs(graph, start) {
    const visited = new Set([start]);
    const queue = [start];
    const result = [];

    while (queue.length > 0) {
        const node = queue.shift();
        result.push(node);
        for (const neighbor of graph[node]) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return result;
}`,
        python: `def bfs(graph, start):
    visited = {start}
    queue = [start]
    result = []
    
    while queue:
        node = queue.pop(0)
        result.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                
    return result`,
        cpp: `vector<int> bfs(vector<vector<int>>& graph, int start) {
    unordered_set<int> visited = {start};
    queue<int> q;
    q.push(start);
    vector<int> result;
    
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        result.push_back(node);
        for (int neighbor : graph[node]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }
    return result;
}`,
        java: `public List<Integer> bfs(List<List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    List<Integer> result = new ArrayList<>();
    
    visited.add(start);
    queue.offer(start);
    
    while (!queue.isEmpty()) {
        int node = queue.poll();
        result.add(node);
        for (int neighbor : graph.get(node)) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }
    return result;
}`
    },

    dfs: {
        javascript: `function dfs(graph, start) {
    const visited = new Set();
    const stack = [start];
    const result = [];

    while (stack.length > 0) {
        const node = stack.pop();
        if (visited.has(node)) continue;
        visited.add(node);
        result.push(node);
        for (const neighbor of graph[node]) {
            if (!visited.has(neighbor))
                stack.push(neighbor);
        }
    }
    return result;
}`
    },

    dijkstra: {
        javascript: `function dijkstra(graph, start) {
    const dist = {};
    const visited = new Set();
    for (const node of Object.keys(graph))
        dist[node] = Infinity;
    dist[start] = 0;

    while (visited.size < Object.keys(graph).length) {
        // Pick unvisited node with min distance
        let current = null;
        for (const n of Object.keys(dist))
            if (!visited.has(n) && (!current || dist[n] < dist[current]))
                current = n;
        if (!current) break;

        visited.add(current);
        for (const {node, weight} of graph[current]) {
            const newDist = dist[current] + weight;
            if (newDist < dist[node])
                dist[node] = newDist;
        }
    }
    return dist;
}`,
        python: `import heapq

def dijkstra(graph, start):
    dist = {node: float('inf') for node in graph}
    dist[start] = 0
    pq = [(0, start)]
    visited = set()
    
    while pq:
        d, current = heapq.heappop(pq)
        if current in visited: continue
        visited.add(current)
        
        for neighbor, weight in graph[current]:
            new_dist = dist[current] + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(pq, (new_dist, neighbor))
                
    return dist`,
        cpp: `vector<int> dijkstra(vector<vector<pair<int, int>>>& graph, int start) {
    vector<int> dist(graph.size(), INT_MAX);
    dist[start] = 0;
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
    pq.push({0, start});
    
    while (!pq.empty()) {
        auto [d, current] = pq.top();
        pq.pop();
        if (d > dist[current]) continue;
        
        for (auto& edge : graph[current]) {
            int neighbor = edge.first, weight = edge.second;
            int newDist = dist[current] + weight;
            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                pq.push({newDist, neighbor});
            }
        }
    }
    return dist;
}`,
        java: `public int[] dijkstra(List<List<int[]>> graph, int start) {
    int[] dist = new int[graph.size()];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, start});
    
    while (!pq.isEmpty()) {
        int[] current = pq.poll();
        int d = current[0], node = current[1];
        if (d > dist[node]) continue;
        
        for (int[] edge : graph.get(node)) {
            int neighbor = edge[0], weight = edge[1];
            int newDist = dist[node] + weight;
            if (newDist < dist[neighbor]) {
                dist[neighbor] = newDist;
                pq.offer(new int[]{newDist, neighbor});
            }
        }
    }
    return dist;
}`
    },

    bellmanFord: {
        javascript: `function bellmanFord(edges, V, start) {
    const dist = new Array(V).fill(Infinity);
    dist[start] = 0;

    for (let i = 0; i < V - 1; i++) {
        for (const {from, to, weight} of edges) {
            if (dist[from] !== Infinity &&
                dist[from] + weight < dist[to])
                dist[to] = dist[from] + weight;
        }
    }
    return dist;
}`,
        python: `def bellman_ford(edges, V, start):
    dist = [float('inf')] * V
    dist[start] = 0
    
    for _ in range(V - 1):
        for u, v, w in edges:
            if dist[u] != float('inf') and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                
    return dist`,
        cpp: `vector<int> bellmanFord(vector<vector<int>>& edges, int V, int start) {
    vector<int> dist(V, INT_MAX);
    dist[start] = 0;
    
    for (int i = 0; i < V - 1; i++) {
        for (auto& edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != INT_MAX && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }
    return dist;
}`,
        java: `public int[] bellmanFord(int[][] edges, int V, int start) {
    int[] dist = new int[V];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[start] = 0;
    
    for (int i = 0; i < V - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (dist[u] != Integer.MAX_VALUE && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
            }
        }
    }
    return dist;
}`
    },

    prims: {
        javascript: `function prims(graph, start) {
    const inMST = new Set();
    const key = {};
    for (const n of Object.keys(graph)) key[n] = Infinity;
    key[start] = 0;

    while (inMST.size < Object.keys(graph).length) {
        let minNode = null;
        for (const n of Object.keys(key))
            if (!inMST.has(n) && (!minNode || key[n] < key[minNode]))
                minNode = n;
        if (!minNode) break;

        inMST.add(minNode);
        for (const {node, weight} of graph[minNode])
            if (!inMST.has(node) && weight < key[node])
                key[node] = weight;
    }
    return key;
}`,
        python: `def prims(graph, start):
    in_mst = set()
    key = {n: float('inf') for n in graph}
    key[start] = 0
    
    while len(in_mst) < len(graph):
        min_node = min((n for n in key if n not in in_mst), key=key.get, default=None)
        if not min_node: break
        
        in_mst.add(min_node)
        for neighbor, weight in graph[min_node]:
            if neighbor not in in_mst and weight < key[neighbor]:
                key[neighbor] = weight
                
    return key`,
        cpp: `vector<int> prims(vector<vector<pair<int, int>>>& graph, int start) {
    int V = graph.size();
    vector<int> key(V, INT_MAX);
    vector<bool> inMST(V, false);
    key[start] = 0;
    
    for (int count = 0; count < V - 1; count++) {
        int u = -1;
        for (int i = 0; i < V; i++)
            if (!inMST[i] && (u == -1 || key[i] < key[u]))
                u = i;
                
        if (u == -1) break;
        inMST[u] = true;
        
        for (auto& edge : graph[u]) {
            int v = edge.first, weight = edge.second;
            if (!inMST[v] && weight < key[v])
                key[v] = weight;
        }
    }
    return key;
}`,
        java: `public int[] prims(List<List<int[]>> graph, int start) {
    int V = graph.size();
    int[] key = new int[V];
    boolean[] inMST = new boolean[V];
    Arrays.fill(key, Integer.MAX_VALUE);
    key[start] = 0;
    
    for (int count = 0; count < V - 1; count++) {
        int u = -1;
        for (int i = 0; i < V; i++)
            if (!inMST[i] && (u == -1 || key[i] < key[u]))
                u = i;
                
        if (u == -1) break;
        inMST[u] = true;
        
        for (int[] edge : graph.get(u)) {
            int v = edge[0], weight = edge[1];
            if (!inMST[v] && weight < key[v])
                key[v] = weight;
        }
    }
    return key;
}`
    },

    kosaraju: {
        javascript: `function kosaraju(graph, V) {
    const stack = [];
    const visited = new Set();

    function fillOrder(u) {
        visited.add(u);
        for (const v of graph[u])
            if (!visited.has(v)) fillOrder(v);
        stack.push(u);
    }

    for (let i = 0; i < V; i++)
        if (!visited.has(i)) fillOrder(i);

    const reversedGraph = Array.from({ length: V }, () => []);
    for (let u = 0; u < V; u++)
        for (const v of graph[u]) reversedGraph[v].push(u);

    visited.clear();
    const sccs = [];

    function dfs(u, component) {
        visited.add(u);
        component.push(u);
        for (const v of reversedGraph[u])
            if (!visited.has(v)) dfs(v, component);
    }

    while (stack.length > 0) {
        const u = stack.pop();
        if (!visited.has(u)) {
            const component = [];
            dfs(u, component);
            sccs.push(component);
        }
    }
    return sccs;
}`,
        python: `def kosaraju(graph, V):
    stack = []
    visited = set()

    def fill_order(u):
        visited.add(u)
        for v in graph[u]:
            if v not in visited:
                fill_order(v)
        stack.append(u)

    for i in range(V):
        if i not in visited:
            fill_order(i)

    rev_graph = [[] for _ in range(V)]
    for u in range(V):
        for v in graph[u]:
            rev_graph[v].append(u)

    visited.clear()
    sccs = []

    def dfs(u, component):
        visited.add(u)
        component.append(u)
        for v in rev_graph[u]:
            if v not in visited:
                dfs(v, component)

    while stack:
        u = stack.pop()
        if u not in visited:
            comp = []
            dfs(u, comp)
            sccs.append(comp)
    return sccs`,
        cpp: `void fillOrder(int u, vector<vector<int>>& adj, vector<bool>& visited, stack<int>& st) {
    visited[u] = true;
    for (int v : adj[u])
        if (!visited[v]) fillOrder(v, adj, visited, st);
    st.push(u);
}

void dfs(int u, vector<vector<int>>& revAdj, vector<bool>& visited, vector<int>& component) {
    visited[u] = true;
    component.push_back(u);
    for (int v : revAdj[u])
        if (!visited[v]) dfs(v, revAdj, visited, component);
}

vector<vector<int>> kosaraju(vector<vector<int>>& adj, int V) {
    stack<int> st;
    vector<bool> visited(V, false);
    for (int i = 0; i < V; i++)
        if (!visited[i]) fillOrder(i, adj, visited, st);

    vector<vector<int>> revAdj(V);
    for (int u = 0; u < V; u++)
        for (int v : adj[u]) revAdj[v].push_back(u);

    fill(visited.begin(), visited.end(), false);
    vector<vector<int>> sccs;

    while (!st.empty()) {
        int u = st.top();
        st.pop();
        if (!visited[u]) {
            vector<int> component;
            dfs(u, revAdj, visited, component);
            sccs.push_back(component);
        }
    }
    return sccs;
}`,
        java: `public void fillOrder(int u, List<List<Integer>> adj, boolean[] visited, Stack<Integer> stack) {
    visited[u] = true;
    for (int v : adj.get(u))
        if (!visited[v]) fillOrder(v, adj, visited, stack);
    stack.push(u);
}

public void dfs(int u, List<List<Integer>> revAdj, boolean[] visited, List<Integer> component) {
    visited[u] = true;
    component.add(u);
    for (int v : revAdj.get(u))
        if (!visited[v]) dfs(v, revAdj, visited, component);
}

public List<List<Integer>> kosaraju(List<List<Integer>> adj, int V) {
    Stack<Integer> stack = new Stack<>();
    boolean[] visited = new boolean[V];
    for (int i = 0; i < V; i++)
        if (!visited[i]) fillOrder(i, adj, visited, stack);

    List<List<Integer>> revAdj = new ArrayList<>();
    for (int i = 0; i < V; i++) revAdj.add(new ArrayList<>());
    for (int u = 0; u < V; u++)
        for (int v : adj.get(u)) revAdj.get(v).add(u);

    Arrays.fill(visited, false);
    List<List<Integer>> sccs = new ArrayList<>();

    while (!stack.isEmpty()) {
        int u = stack.pop();
        if (!visited[u]) {
            List<Integer> component = new ArrayList<>();
            dfs(u, revAdj, visited, component);
            sccs.add(component);
        }
    }
    return sccs;
}`
    },

    bitManipulation: {
        javascript: `// Common Bit Manipulation Tricks

// 1. Check if a number is even or odd
function isEven(n) {
    return (n & 1) === 0;
}

// 2. Multiply or divide by 2
function multiplyByTwo(n) { return n << 1; }
function divideByTwo(n) { return n >> 1; }

// 3. Clear the lowest set bit
function clearLowestSetBit(n) {
    return n & (n - 1);
}

// 4. Check if a number is a power of 2
function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

// 5. Swap two numbers without a temp variable
function swap(a, b) {
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
    return [a, b];
}`,
        python: `# Common Bit Manipulation Tricks

# 1. Check if a number is even or odd
def is_even(n):
    return (n & 1) == 0

# 2. Multiply or divide by 2
def multiply_by_two(n): return n << 1
def divide_by_two(n): return n >> 1

# 3. Clear the lowest set bit
def clear_lowest_set_bit(n):
    return n & (n - 1)

# 4. Check if a number is a power of 2
def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0

# 5. Swap two numbers without a temp variable
def swap(a, b):
    a = a ^ b
    b = a ^ b
    a = a ^ b
    return a, b`,
        cpp: `// Common Bit Manipulation Tricks

// 1. Check if a number is even or odd
bool isEven(int n) {
    return (n & 1) == 0;
}

// 2. Multiply or divide by 2
int multiplyByTwo(int n) { return n << 1; }
int divideByTwo(int n) { return n >> 1; }

// 3. Clear the lowest set bit
int clearLowestSetBit(int n) {
    return n & (n - 1);
}

// 4. Check if a number is a power of 2
bool isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// 5. Swap two numbers without a temp variable
void swap(int& a, int& b) {
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
}`,
        java: `// Common Bit Manipulation Tricks

// 1. Check if a number is even or odd
public boolean isEven(int n) {
    return (n & 1) == 0;
}

// 2. Multiply or divide by 2
public int multiplyByTwo(int n) { return n << 1; }
public int divideByTwo(int n) { return n >> 1; }

// 3. Clear the lowest set bit
public int clearLowestSetBit(int n) {
    return n & (n - 1);
}

// 4. Check if a number is a power of 2
public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
}

// 5. Swap two numbers without a temp variable
public void swap(int a, int b) {
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
}`
    },

    // ── TREES ─────────────────────────────────────────────
    binaryTree: {
        javascript: `// Inorder Traversal (Left → Root → Right)
function inorder(node) {
    if (!node) return [];
    return [
        ...inorder(node.left),
        node.value,
        ...inorder(node.right)
    ];
}

// Preorder (Root → Left → Right)
function preorder(node) {
    if (!node) return [];
    return [
        node.value,
        ...preorder(node.left),
        ...preorder(node.right)
    ];
}

// Postorder (Left → Right → Root)
function postorder(node) {
    if (!node) return [];
    return [
        ...postorder(node.left),
        ...postorder(node.right),
        node.value
    ];
}`,
        python: `# Inorder Traversal (Left → Root → Right)
def inorder(node):
    if not node: return []
    return inorder(node.left) + [node.value] + inorder(node.right)

# Preorder (Root → Left → Right)
def preorder(node):
    if not node: return []
    return [node.value] + preorder(node.left) + preorder(node.right)

# Postorder (Left → Right → Root)
def postorder(node):
    if not node: return []
    return postorder(node.left) + postorder(node.right) + [node.value]`,
        cpp: `// Inorder Traversal (Left → Root → Right)
void inorder(Node* node, vector<int>& res) {
    if (!node) return;
    inorder(node->left, res);
    res.push_back(node->value);
    inorder(node->right, res);
}

// Preorder (Root → Left → Right)
void preorder(Node* node, vector<int>& res) {
    if (!node) return;
    res.push_back(node->value);
    preorder(node->left, res);
    preorder(node->right, res);
}

// Postorder (Left → Right → Root)
void postorder(Node* node, vector<int>& res) {
    if (!node) return;
    postorder(node->left, res);
    postorder(node->right, res);
    res.push_back(node->value);
}`,
        java: `// Inorder Traversal (Left → Root → Right)
public void inorder(Node node, List<Integer> res) {
    if (node == null) return;
    inorder(node.left, res);
    res.add(node.value);
    inorder(node.right, res);
}

// Preorder (Root → Left → Right)
public void preorder(Node node, List<Integer> res) {
    if (node == null) return;
    res.add(node.value);
    preorder(node.left, res);
    preorder(node.right, res);
}

// Postorder (Left → Right → Root)
public void postorder(Node node, List<Integer> res) {
    if (node == null) return;
    postorder(node.left, res);
    postorder(node.right, res);
    res.add(node.value);
}`
    },

    avlTree: {
        javascript: `function insert(node, val) {
    if (!node) return { val, left: null, right: null, height: 1 };
    if (val < node.val) node.left = insert(node.left, val);
    else node.right = insert(node.right, val);

    node.height = 1 + Math.max(height(node.left), height(node.right));
    const bf = balanceFactor(node);

    // LL → Right Rotate
    if (bf > 1 && val < node.left.val) return rightRotate(node);
    // RR → Left Rotate
    if (bf < -1 && val > node.right.val) return leftRotate(node);
    // LR → Left-Right Rotate
    if (bf > 1 && val > node.left.val) {
        node.left = leftRotate(node.left);
        return rightRotate(node);
    }
    // RL → Right-Left Rotate
    if (bf < -1 && val < node.right.val) {
        node.right = rightRotate(node.right);
        return leftRotate(node);
    }
    return node;
}`,
        python: `def insert(node, val):
    if not node:
        return Node(val, 1)
    if val < node.val:
        node.left = insert(node.left, val)
    else:
        node.right = insert(node.right, val)

    node.height = 1 + max(get_height(node.left), get_height(node.right))
    bf = get_balance(node)

    # LL -> Right Rotate
    if bf > 1 and val < node.left.val: return right_rotate(node)
    # RR -> Left Rotate
    if bf < -1 and val > node.right.val: return left_rotate(node)
    # LR -> Left-Right Rotate
    if bf > 1 and val > node.left.val:
        node.left = left_rotate(node.left)
        return right_rotate(node)
    # RL -> Right-Left Rotate
    if bf < -1 and val < node.right.val:
        node.right = right_rotate(node.right)
        return left_rotate(node)
        
    return node`,
        cpp: `Node* insert(Node* node, int val) {
    if (!node) return new Node(val);
    if (val < node->val)
        node->left = insert(node->left, val);
    else if (val > node->val)
        node->right = insert(node->right, val);
    else return node;

    node->height = 1 + max(height(node->left), height(node->right));
    int bf = getBalance(node);

    // LL -> Right Rotate
    if (bf > 1 && val < node->left->val) return rightRotate(node);
    // RR -> Left Rotate
    if (bf < -1 && val > node->right->val) return leftRotate(node);
    // LR -> Left-Right Rotate
    if (bf > 1 && val > node->left->val) {
        node->left = leftRotate(node->left);
        return rightRotate(node);
    }
    // RL -> Right-Left Rotate
    if (bf < -1 && val < node->right->val) {
        node->right = rightRotate(node->right);
        return leftRotate(node);
    }
    return node;
}`,
        java: `public Node insert(Node node, int val) {
    if (node == null) return new Node(val);
    if (val < node.val)
        node.left = insert(node.left, val);
    else if (val > node.val)
        node.right = insert(node.right, val);
    else return node;

    node.height = 1 + Math.max(height(node.left), height(node.right));
    int bf = getBalance(node);

    // LL -> Right Rotate
    if (bf > 1 && val < node.left.val) return rightRotate(node);
    // RR -> Left Rotate
    if (bf < -1 && val > node.right.val) return leftRotate(node);
    // LR -> Left-Right Rotate
    if (bf > 1 && val > node.left.val) {
        node.left = leftRotate(node.left);
        return rightRotate(node);
    }
    // RL -> Right-Left Rotate
    if (bf < -1 && val < node.right.val) {
        node.right = rightRotate(node.right);
        return leftRotate(node);
    }
    return node;
}`
    },

    redBlackTree: {
        javascript: `// Red-Black Tree Insert (LLRB variant)
function insert(node, val) {
    if (!node) return { val, color: 'RED', left: null, right: null };

    if (val < node.val) node.left = insert(node.left, val);
    else if (val > node.val) node.right = insert(node.right, val);

    // Fix-up rules:
    if (isRed(node.right) && !isRed(node.left))
        node = leftRotate(node);
    if (isRed(node.left) && isRed(node.left?.left))
        node = rightRotate(node);
    if (isRed(node.left) && isRed(node.right))
        flipColors(node);

    return node;
}`,
        python: `# Red-Black Tree Insert (LLRB variant)
def insert(node, val):
    if not node:
        return Node(val, color='RED')

    if val < node.val:
        node.left = insert(node.left, val)
    elif val > node.val:
        node.right = insert(node.right, val)

    # Fix-up rules:
    if is_red(node.right) and not is_red(node.left):
        node = left_rotate(node)
    if is_red(node.left) and is_red(node.left.left):
        node = right_rotate(node)
    if is_red(node.left) and is_red(node.right):
        flip_colors(node)

    return node`,
        cpp: `// Red-Black Tree Insert (LLRB variant)
Node* insert(Node* node, int val) {
    if (!node) return new Node(val, RED);

    if (val < node->val)
        node->left = insert(node->left, val);
    else if (val > node->val)
        node->right = insert(node->right, val);

    // Fix-up rules:
    if (isRed(node->right) && !isRed(node->left))
        node = leftRotate(node);
    if (isRed(node->left) && isRed(node->left->left))
        node = rightRotate(node);
    if (isRed(node->left) && isRed(node->right))
        flipColors(node);

    return node;
}`,
        java: `// Red-Black Tree Insert (LLRB variant)
public Node insert(Node node, int val) {
    if (node == null) return new Node(val, RED);

    if (val < node.val)
        node.left = insert(node.left, val);
    else if (val > node.val)
        node.right = insert(node.right, val);

    // Fix-up rules:
    if (isRed(node.right) && !isRed(node.left))
        node = leftRotate(node);
    if (isRed(node.left) && isRed(node.left.left))
        node = rightRotate(node);
    if (isRed(node.left) && isRed(node.right))
        flipColors(node);

    return node;
}`
    },

    // ── DP ────────────────────────────────────────────────
    knapsack: {
        javascript: `function knapsack(W, weights, values) {
    const n = weights.length;
    const dp = Array.from({length: n + 1},
        () => Array(W + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let w = 0; w <= W; w++) {
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(
                    dp[i-1][w],
                    values[i-1] + dp[i-1][w - weights[i-1]]
                );
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }
    return dp[n][W];
}`,
        python: `def knapsack(W, weights, values):
    n = len(weights)
    dp = [[0 for _ in range(W + 1)] for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(W + 1):
            if weights[i-1] <= w:
                dp[i][w] = max(
                    dp[i-1][w],
                    values[i-1] + dp[i-1][w - weights[i-1]]
                )
            else:
                dp[i][w] = dp[i-1][w]
                
    return dp[n][W]`,
        cpp: `int knapsack(int W, vector<int>& weights, vector<int>& values) {
    int n = weights.size();
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (weights[i-1] <= w) {
                dp[i][w] = max(
                    dp[i-1][w],
                    values[i-1] + dp[i-1][w - weights[i-1]]
                );
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }
    return dp[n][W];
}`,
        java: `public int knapsack(int W, int[] weights, int[] values) {
    int n = weights.length;
    int[][] dp = new int[n + 1][W + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(
                    dp[i-1][w],
                    values[i-1] + dp[i-1][w - weights[i-1]]
                );
            } else {
                dp[i][w] = dp[i-1][w];
            }
        }
    }
    return dp[n][W];
}`
    },

    lcs: {
        javascript: `function lcs(s1, s2) {
    const m = s1.length, n = s2.length;
    const dp = Array.from({length: m + 1},
        () => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s1[i-1] === s2[j-1])
                dp[i][j] = dp[i-1][j-1] + 1;
            else
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m][n];
}`,
        python: `def lcs(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
                
    return dp[m][n]`,
        cpp: `int lcs(string s1, string s2) {
    int m = s1.length(), n = s2.length();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1[i-1] == s2[j-1])
                dp[i][j] = dp[i-1][j-1] + 1;
            else
                dp[i][j] = max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m][n];
}`,
        java: `public int lcs(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i-1) == s2.charAt(j-1))
                dp[i][j] = dp[i-1][j-1] + 1;
            else
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m][n];
}`
    },

    coinChange: {
        javascript: `function coinChange(coins, amount) {
    const dp = Array(amount + 1).fill(Infinity);
    dp[0] = 0;

    for (let i = 1; i <= amount; i++) {
        for (const coin of coins) {
            if (coin <= i && dp[i - coin] + 1 < dp[i])
                dp[i] = dp[i - coin] + 1;
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
}`,
        python: `def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0

    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i and dp[i - coin] + 1 < dp[i]:
                dp[i] = dp[i - coin] + 1
                
    return -1 if dp[amount] == float('inf') else dp[amount]`,
        cpp: `int coinChange(vector<int>& coins, int amount) {
    vector<long long> dp(amount + 1, INT_MAX);
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i && dp[i - coin] + 1 < dp[i])
                dp[i] = dp[i - coin] + 1;
        }
    }
    return dp[amount] == INT_MAX ? -1 : dp[amount];
}`,
        java: `public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, Integer.MAX_VALUE - 1); // Avoid overflow
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i && dp[i - coin] + 1 < dp[i])
                dp[i] = dp[i - coin] + 1;
        }
    }
    return dp[amount] == Integer.MAX_VALUE - 1 ? -1 : dp[amount];
}`
    },

    // ── GREEDY ────────────────────────────────────────────
    activitySelection: {
        javascript: `function activitySelection(activities) {
    // Sort by finish time
    activities.sort((a, b) => a.end - b.end);
    const selected = [activities[0]];
    let lastEnd = activities[0].end;

    for (let i = 1; i < activities.length; i++) {
        if (activities[i].start >= lastEnd) {
            selected.push(activities[i]);
            lastEnd = activities[i].end;
        }
    }
    return selected;
}`,
        python: `def activity_selection(activities):
    activities.sort(key=lambda x: x.end)
    selected = [activities[0]]
    last_end = activities[0].end

    for i in range(1, len(activities)):
        if activities[i].start >= last_end:
            selected.append(activities[i])
            last_end = activities[i].end
            
    return selected`,
        cpp: `struct Activity { int start, end; };

bool compareActivities(Activity a, Activity b) {
    return (a.end < b.end);
}

vector<Activity> activitySelection(vector<Activity>& activities) {
    sort(activities.begin(), activities.end(), compareActivities);
    vector<Activity> selected;
    selected.push_back(activities[0]);
    int lastEnd = activities[0].end;

    for (int i = 1; i < activities.size(); i++) {
        if (activities[i].start >= lastEnd) {
            selected.push_back(activities[i]);
            lastEnd = activities[i].end;
        }
    }
    return selected;
}`,
        java: `static class Activity { int start, end; }

public List<Activity> activitySelection(Activity[] activities) {
    Arrays.sort(activities, Comparator.comparingInt(a -> a.end));
    List<Activity> selected = new ArrayList<>();
    selected.add(activities[0]);
    int lastEnd = activities[0].end;

    for (int i = 1; i < activities.length; i++) {
        if (activities[i].start >= lastEnd) {
            selected.add(activities[i]);
            lastEnd = activities[i].end;
        }
    }
    return selected;
}`
    },

    huffmanCoding: {
        javascript: `function huffmanCoding(text) {
    // Count frequencies
    const freq = {};
    for (const ch of text) freq[ch] = (freq[ch] || 0) + 1;

    // Create priority queue of leaf nodes
    let nodes = Object.entries(freq)
        .map(([ch, f]) => ({ch, freq: f, left: null, right: null}))
        .sort((a, b) => a.freq - b.freq);

    // Build tree by merging smallest nodes
    while (nodes.length > 1) {
        const left = nodes.shift();
        const right = nodes.shift();
        const merged = {
            ch: null, freq: left.freq + right.freq,
            left, right
        };
        // Insert in sorted position
        const idx = nodes.findIndex(n => n.freq > merged.freq);
        nodes.splice(idx === -1 ? nodes.length : idx, 0, merged);
    }
    return nodes[0]; // Root of Huffman tree
}`,
        python: `import heapq

def huffman_coding(text):
    freq = {}
    for ch in text: freq[ch] = freq.get(ch, 0) + 1
        
    pq = [[weight, [char, ""]] for char, weight in freq.items()]
    heapq.heapify(pq)
    
    while len(pq) > 1:
        lo = heapq.heappop(pq)
        hi = heapq.heappop(pq)
        for pair in lo[1:]: pair[1] = '0' + pair[1]
        for pair in hi[1:]: pair[1] = '1' + pair[1]
        heapq.heappush(pq, [lo[0] + hi[0]] + lo[1:] + hi[1:])
        
    return sorted(heapq.heappop(pq)[1:], key=lambda p: (len(p[-1]), p))`,
        cpp: `struct Node {
    char data;
    unsigned freq;
    Node *left, *right;
    Node(char data, unsigned freq) : data(data), freq(freq), left(NULL), right(NULL) {}
};

struct compare {
    bool operator()(Node* l, Node* r) { return (l->freq > r->freq); }
};

Node* huffmanCoding(string text) {
    unordered_map<char, int> freq;
    for (char ch : text) freq[ch]++;
    
    priority_queue<Node*, vector<Node*>, compare> pq;
    for (auto pair : freq)
        pq.push(new Node(pair.first, pair.second));
        
    while (pq.size() != 1) {
        Node *left = pq.top(); pq.pop();
        Node *right = pq.top(); pq.pop();
        Node *top = new Node('$', left->freq + right->freq);
        top->left = left;
        top->right = right;
        pq.push(top);
    }
    return pq.top();
}`,
        java: `static class Node {
    char data;
    int freq;
    Node left, right;
    Node(char data, int freq) {
        this.data = data;
        this.freq = freq;
        this.left = this.right = null;
    }
}

public Node huffmanCoding(String text) {
    Map<Character, Integer> freq = new HashMap<>();
    for (char c : text.toCharArray())
        freq.put(c, freq.getOrDefault(c, 0) + 1);
        
    PriorityQueue<Node> pq = new PriorityQueue<>((l, r) -> l.freq - r.freq);
    for (Map.Entry<Character, Integer> entry : freq.entrySet())
        pq.add(new Node(entry.getKey(), entry.getValue()));
        
    while (pq.size() > 1) {
        Node left = pq.poll(), right = pq.poll();
        Node top = new Node('$', left.freq + right.freq);
        top.left = left;
        top.right = right;
        pq.add(top);
    }
    return pq.poll();
}`
    },
    palindromePartitioning: {
        javascript: `function partition(s) {
    const res = [];
    const path = [];
    
    function isPalindrome(str, l, r) {
        while (l < r) {
            if (str[l++] !== str[r--]) return false;
        }
        return true;
    }
    
    function backtrack(start) {
        if (start >= s.length) {
            res.push([...path]);
            return;
        }
        for (let end = start + 1; end <= s.length; end++) {
            if (isPalindrome(s, start, end - 1)) {
                path.push(s.slice(start, end));
                backtrack(end);
                path.pop();
            }
        }
    }
    
    backtrack(0);
    return res;
}`,
        python: `def partition(s):
    res = []
    path = []
    
    def is_palindrome(str, l, r):
        while l < r:
            if str[l] != str[r]: return False
            l += 1
            r -= 1
        return True
        
    def backtrack(start):
        if start >= len(s):
            res.append(list(path))
            return
        for end in range(start + 1, len(s) + 1):
            if is_palindrome(s, start, end - 1):
                path.append(s[start:end])
                backtrack(end)
                path.pop()
                
    backtrack(0)
    return res`,
        cpp: `class Solution {
public:
    vector<vector<string>> partition(string s) {
        vector<vector<string>> res;
        vector<string> path;
        backtrack(s, 0, path, res);
        return res;
    }
    
    void backtrack(string& s, int start, vector<string>& path, vector<vector<string>>& res) {
        if (start >= s.length()) {
            res.push_back(path);
            return;
        }
        for (int end = start + 1; end <= s.length(); end++) {
            if (isPalindrome(s, start, end - 1)) {
                path.push_back(s.substr(start, end - start));
                backtrack(s, end, path, res);
                path.pop_back();
            }
        }
    }
    
    bool isPalindrome(string& s, int l, int r) {
        while (l < r) {
            if (s[l++] != s[r--]) return false;
        }
        return true;
    }
};`,
        java: `class Solution {
    public List<List<String>> partition(String s) {
        List<List<String>> res = new ArrayList<>();
        backtrack(s, 0, new ArrayList<>(), res);
        return res;
    }
    
    private void backtrack(String s, int start, List<String> path, List<List<String>> res) {
        if (start >= s.length()) {
            res.add(new ArrayList<>(path));
            return;
        }
        for (int end = start + 1; end <= s.length(); end++) {
            if (isPalindrome(s, start, end - 1)) {
                path.add(s.substring(start, end));
                backtrack(s, end, path, res);
                path.remove(path.size() - 1);
            }
        }
    }
    
    private boolean isPalindrome(String s, int l, int r) {
        while (l < r) {
            if (s.charAt(l++) != s.charAt(r--)) return false;
        }
        return true;
    }
}`
    },
    nQueens: {
        javascript: `function solveNQueens(n) {
    const board = Array(n).fill(-1);
    const cols = new Set();
    const diag1 = new Set();
    const diag2 = new Set();
    const solutions = [];

    function backtrack(row) {
        if (row === n) {
            solutions.push([...board]);
            return;
        }

        for (let col = 0; col < n; col++) {
            const d1 = row - col;
            const d2 = row + col;
            if (cols.has(col) || diag1.has(d1) || diag2.has(d2)) continue;

            board[row] = col;
            cols.add(col);
            diag1.add(d1);
            diag2.add(d2);

            backtrack(row + 1);

            board[row] = -1;
            cols.delete(col);
            diag1.delete(d1);
            diag2.delete(d2);
        }
    }

    backtrack(0);
    return solutions;
}`,
        python: `def solve_n_queens(n):
    board = [-1] * n
    cols = set()
    diag1 = set()
    diag2 = set()
    solutions = []

    def backtrack(row):
        if row == n:
            solutions.append(board[:])
            return

        for col in range(n):
            d1 = row - col
            d2 = row + col
            if col in cols or d1 in diag1 or d2 in diag2:
                continue

            board[row] = col
            cols.add(col)
            diag1.add(d1)
            diag2.add(d2)

            backtrack(row + 1)

            board[row] = -1
            cols.remove(col)
            diag1.remove(d1)
            diag2.remove(d2)

    backtrack(0)
    return solutions`,
        cpp: `vector<vector<int>> solveNQueens(int n) {
    vector<vector<int>> solutions;
    vector<int> board(n, -1);
    vector<bool> cols(n, false);
    vector<bool> diag1(2 * n - 1, false);
    vector<bool> diag2(2 * n - 1, false);

    function<void(int)> backtrack = [&](int row) {
        if (row == n) {
            solutions.push_back(board);
            return;
        }

        for (int col = 0; col < n; col++) {
            int d1 = row - col + n - 1;
            int d2 = row + col;
            if (cols[col] || diag1[d1] || diag2[d2]) continue;

            board[row] = col;
            cols[col] = diag1[d1] = diag2[d2] = true;

            backtrack(row + 1);

            board[row] = -1;
            cols[col] = diag1[d1] = diag2[d2] = false;
        }
    };

    backtrack(0);
    return solutions;
}`,
        java: `public List<List<Integer>> solveNQueens(int n) {
    List<List<Integer>> solutions = new ArrayList<>();
    int[] board = new int[n];
    Arrays.fill(board, -1);
    boolean[] cols = new boolean[n];
    boolean[] diag1 = new boolean[2 * n - 1];
    boolean[] diag2 = new boolean[2 * n - 1];

    backtrack(0, n, board, cols, diag1, diag2, solutions);
    return solutions;
}

private void backtrack(int row, int n, int[] board, boolean[] cols,
        boolean[] diag1, boolean[] diag2, List<List<Integer>> solutions) {
    if (row == n) {
        List<Integer> placement = new ArrayList<>();
        for (int col : board) placement.add(col);
        solutions.add(placement);
        return;
    }

    for (int col = 0; col < n; col++) {
        int d1 = row - col + n - 1;
        int d2 = row + col;
        if (cols[col] || diag1[d1] || diag2[d2]) continue;

        board[row] = col;
        cols[col] = diag1[d1] = diag2[d2] = true;

        backtrack(row + 1, n, board, cols, diag1, diag2, solutions);

        board[row] = -1;
        cols[col] = diag1[d1] = diag2[d2] = false;
    }
}`
    },
    fibonacciSearch: {
        javascript: `function fibonacciSearch(arr, x, n) {
    let fib2 = 0;
    let fib1 = 1;
    let fibM = fib2 + fib1;
    while (fibM < n) {
        fib2 = fib1;
        fib1 = fibM;
        fibM = fib2 + fib1;
    }
    let offset = -1;
    while (fibM > 1) {
        let i = Math.min(offset + fib2, n - 1);
        if (arr[i] < x) {
            fibM = fib1;
            fib1 = fib2;
            fib2 = fibM - fib1;
            offset = i;
        } else if (arr[i] > x) {
            fibM = fib2;
            fib1 = fib1 - fib2;
            fib2 = fibM - fib1;
        } else return i;
    }
    if (fib1 && arr[offset + 1] === x) return offset + 1;
    return -1;
}`,
        python: `def fibonacci_search(arr, x, n):
    fib2 = 0
    fib1 = 1
    fib_m = fib2 + fib1
    while fib_m < n:
        fib2 = fib1
        fib1 = fib_m
        fib_m = fib2 + fib1
    offset = -1
    while fib_m > 1:
        i = min(offset + fib2, n - 1)
        if arr[i] < x:
            fib_m = fib1
            fib1 = fib2
            fib2 = fib_m - fib1
            offset = i
        elif arr[i] > x:
            fib_m = fib2
            fib1 = fib1 - fib2
            fib2 = fib_m - fib1
        else:
            return i
    if fib1 and arr[offset + 1] == x:
        return offset + 1
    return -1`,
        cpp: `int fibonacciSearch(int arr[], int x, int n) {
    int fibMMm2 = 0;
    int fibMMm1 = 1;
    int fibM = fibMMm2 + fibMMm1;
    while (fibM < n) {
        fibMMm2 = fibMMm1;
        fibMMm1 = fibM;
        fibM = fibMMm2 + fibMMm1;
    }
    int offset = -1;
    while (fibM > 1) {
        int i = min(offset + fibMMm2, n - 1);
        if (arr[i] < x) {
            fibM = fibMMm1;
            fibMMm1 = fibMMm2;
            fibMMm2 = fibM - fibMMm1;
            offset = i;
        } else if (arr[i] > x) {
            fibM = fibMMm2;
            fibMMm1 = fibMMm1 - fibMMm2;
            fibMMm2 = fibM - fibMMm1;
        } else return i;
    }
    if (fibMMm1 && arr[offset + 1] == x) return offset + 1;
    return -1;
}`,
        java: `public int fibonacciSearch(int arr[], int x, int n) {
    int fibMMm2 = 0;
    int fibMMm1 = 1;
    int fibM = fibMMm2 + fibMMm1;
    while (fibM < n) {
        fibMMm2 = fibMMm1;
        fibMMm1 = fibM;
        fibM = fibMMm2 + fibMMm1;
    }
    int offset = -1;
    while (fibM > 1) {
        int i = Math.min(offset + fibMMm2, n - 1);
        if (arr[i] < x) {
            fibM = fibMMm1;
            fibMMm1 = fibMMm2;
            fibMMm2 = fibM - fibMMm1;
            offset = i;
        } else if (arr[i] > x) {
            fibM = fibMMm2;
            fibMMm1 = fibMMm1 - fibMMm2;
            fibMMm2 = fibM - fibMMm1;
        } else return i;
    }
    if (fibMMm1 != 0 && arr[offset + 1] == x) return offset + 1;
    return -1;
}`
    },
    heap: {
        javascript: `// Min-Heap Implementation
function insert(heap, val) {
    heap.push(val);
    bubbleUp(heap, heap.length - 1);
}

function bubbleUp(heap, i) {
    while (i > 0) {
        let p = Math.floor((i - 1) / 2);
        if (heap[p] <= heap[i]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
    }
}

function extractMin(heap) {
    if (heap.length === 0) return null;
    let min = heap[0];
    let last = heap.pop();
    if (heap.length > 0) {
        heap[0] = last;
        sinkDown(heap, 0);
    }
    return min;
}

function sinkDown(heap, i) {
    while (true) {
        let smallest = i, l = 2*i + 1, r = 2*i + 2;
        if (l < heap.length && heap[l] < heap[smallest]) smallest = l;
        if (r < heap.length && heap[r] < heap[smallest]) smallest = r;
        if (smallest === i) break;
        [heap[i], heap[smallest]] = [heap[smallest], heap[i]];
        i = smallest;
    }
}`,
        python: `class MinHeap:
    def __init__(self):
        self.heap = []

    def insert(self, val):
        self.heap.append(val)
        self._bubble_up(len(self.heap) - 1)

    def _bubble_up(self, i):
        while i > 0:
            p = (i - 1) // 2
            if self.heap[p] <= self.heap[i]: break
            self.heap[p], self.heap[i] = self.heap[i], self.heap[p]
            i = p

    def extract_min(self):
        if not self.heap: return None
        min_val = self.heap[0]
        last = self.heap.pop()
        if self.heap:
            self.heap[0] = last
            self._sink_down(0)
        return min_val

    def _sink_down(self, i):
        while True:
            smallest, l, r = i, 2*i + 1, 2*i + 2
            if l < len(self.heap) and self.heap[l] < self.heap[smallest]: smallest = l
            if r < len(self.heap) and self.heap[r] < self.heap[smallest]: smallest = r
            if smallest == i: break
            self.heap[i], self.heap[smallest] = self.heap[smallest], self.heap[i]
            i = smallest`,
        cpp: `class MinHeap {
    vector<int> heap;
    void bubbleUp(int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (heap[p] <= heap[i]) break;
            swap(heap[p], heap[i]);
            i = p;
        }
    }
    void sinkDown(int i) {
        while (true) {
            int smallest = i, l = 2*i + 1, r = 2*i + 2;
            if (l < heap.size() && heap[l] < heap[smallest]) smallest = l;
            if (r < heap.size() && heap[r] < heap[smallest]) smallest = r;
            if (smallest == i) break;
            swap(heap[i], heap[smallest]);
            i = smallest;
        }
    }
public:
    void insert(int val) {
        heap.push_back(val);
        bubbleUp(heap.size() - 1);
    }
    int extractMin() {
        int minVal = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        if (!heap.empty()) sinkDown(0);
        return minVal;
    }
};`,
        java: `class MinHeap {
    private List<Integer> heap = new ArrayList<>();

    public void insert(int val) {
        heap.add(val);
        bubbleUp(heap.size() - 1);
    }

    private void bubbleUp(int i) {
        while (i > 0) {
            int p = (i - 1) / 2;
            if (heap.get(p) <= heap.get(i)) break;
            Collections.swap(heap, p, i);
            i = p;
        }
    }

    public int extractMin() {
        int min = heap.get(0);
        heap.set(0, heap.get(heap.size() - 1));
        heap.remove(heap.size() - 1);
        if (!heap.isEmpty()) sinkDown(0);
        return min;
    }

    private void sinkDown(int i) {
        while (true) {
            int small = i, l = 2*i + 1, r = 2*i + 2;
            if (l < heap.size() && heap.get(l) < heap.get(small)) small = l;
            if (r < heap.size() && heap.get(r) < heap.get(small)) small = r;
            if (small == i) break;
            Collections.swap(heap, i, small);
            i = small;
        }
    }
}`
    },
    splayTree: {
        javascript: `class Node {
    constructor(key) {
        this.key = key;
        this.left = this.right = null;
    }
}

function rightRotate(x) {
    let y = x.left;
    x.left = y.right;
    y.right = x;
    return y;
}

function leftRotate(x) {
    let y = x.right;
    x.right = y.left;
    y.left = x;
    return y;
}

function splay(root, key) {
    if (root === null || root.key === key) return root;
    if (root.key > key) {
        if (root.left === null) return root;
        if (root.left.key > key) {
            root.left.left = splay(root.left.left, key);
            root = rightRotate(root);
        } else if (root.left.key < key) {
            root.left.right = splay(root.left.right, key);
            if (root.left.right !== null) root.left = leftRotate(root.left);
        }
        return (root.left === null) ? root : rightRotate(root);
    } else {
        if (root.right === null) return root;
        if (root.right.key > key) {
            root.right.left = splay(root.right.left, key);
            if (root.right.left !== null) root.right = rightRotate(root.right);
        } else if (root.right.key < key) {
            root.right.right = splay(root.right.right, key);
            root = leftRotate(root);
        }
        return (root.right === null) ? root : leftRotate(root);
    }
}`,
        python: `class Node:
    def __init__(self, key):
        self.key = key
        self.left = self.right = None

def right_rotate(x):
    y = x.left
    x.left = y.right
    y.right = x
    return y

def left_rotate(x):
    y = x.right
    x.right = y.left
    y.left = x
    return y

def splay(root, key):
    if root is None or root.key == key:
        return root
    if root.key > key:
        if root.left is None: return root
        if root.left.key > key:
            root.left.left = splay(root.left.left, key)
            root = right_rotate(root)
        elif root.left.key < key:
            root.left.right = splay(root.left.right, key)
            if root.left.right is not None:
                root.left = left_rotate(root.left)
        return root if root.left is None else right_rotate(root)
    else:
        if root.right is None: return root
        if root.right.key > key:
            root.right.left = splay(root.right.left, key)
            if root.right.left is not None:
                root.right = right_rotate(root.right)
        elif root.right.key < key:
            root.right.right = splay(root.right.right, key)
            root = left_rotate(root)
        return root if root.right is None else left_rotate(root)`,
        cpp: `struct Node {
    int key;
    Node *left, *right;
};

Node* rightRotate(Node* x) {
    Node* y = x->left;
    x->left = y->right;
    y->right = x;
    return y;
}

Node* leftRotate(Node* x) {
    Node* y = x->right;
    x->right = y->left;
    y->left = x;
    return y;
}

Node* splay(Node* root, int key) {
    if (!root || root->key == key) return root;
    if (root->key > key) {
        if (!root->left) return root;
        if (root->left->key > key) {
            root->left->left = splay(root->left->left, key);
            root = rightRotate(root);
        } else if (root->left->key < key) {
            root->left->right = splay(root->left->right, key);
            if (root->left->right) root->left = leftRotate(root->left);
        }
        return (!root->left) ? root : rightRotate(root);
    } else {
        if (!root->right) return root;
        if (root->right->key > key) {
            root->right->left = splay(root->right->left, key);
            if (root->right->left) root->right = rightRotate(root->right);
        } else if (root->right->key < key) {
            root->right->right = splay(root->right->right, key);
            root = leftRotate(root);
        }
        return (!root->right) ? root : leftRotate(root);
    }
}`,
        java: `class Node {
    int key;
    Node left, right;
}

public class SplayTree {
    Node rightRotate(Node x) {
        Node y = x.left;
        x.left = y.right;
        y.right = x;
        return y;
    }

    Node leftRotate(Node x) {
        Node y = x.right;
        x.right = y.left;
        y.left = x;
        return y;
    }

    Node splay(Node root, int key) {
        if (root == null || root.key == key) return root;
        if (root.key > key) {
            if (root.left == null) return root;
            if (root.left.key > key) {
                root.left.left = splay(root.left.left, key);
                root = rightRotate(root);
            } else if (root.left.key < key) {
                root.left.right = splay(root.left.right, key);
                if (root.left.right != null) root.left = leftRotate(root.left);
            }
            return (root.left == null) ? root : rightRotate(root);
        } else {
            if (root.right == null) return root;
            if (root.right.key > key) {
                root.right.left = splay(root.right.left, key);
                if (root.right.left != null) root.right = rightRotate(root.right);
            } else if (root.right.key < key) {
                root.right.right = splay(root.right.right, key);
                root = leftRotate(root);
            }
            return (root.right == null) ? root : leftRotate(root);
        }
    }
}`
    },
    trie: {
        javascript: `class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }

    search(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) return false;
            node = node.children[char];
        }
        return node.isEndOfWord;
    }
}`,
        python: `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        self.is_end_of_word = True

    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word`,
        cpp: `struct TrieNode {
    unordered_map<char, TrieNode*> children;
    bool isEndOfWord = false;
};

class Trie {
    TrieNode* root;
public:
    Trie() { root = new TrieNode(); }
    void insert(string word) {
        TrieNode* node = root;
        for (char ch : word) {
            if (!node->children.count(ch)) node->children[ch] = new TrieNode();
            node = node->children[ch];
        }
        node->isEndOfWord = true;
    }
};`,
        java: `class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord = false;
}

public class Trie {
    private TrieNode root = new TrieNode();
    public void insert(String word) {
        TrieNode node = root;
        for (char ch : word.toCharArray()) {
            node.children.putIfAbsent(ch, new TrieNode());
            node = node.children.get(ch);
        }
        node.isEndOfWord = true;
    }
}`
    },
    topologicalSort: {
        javascript: `function topologicalSort(n, edges) {
    let inDegree = new Array(n).fill(0);
    let adj = Array.from({ length: n }, () => []);
    
    for (let [u, v] of edges) {
        adj[u].push(v);
        inDegree[v]++;
    }

    let queue = [];
    for (let i = 0; i < n; i++) {
        if (inDegree[i] === 0) queue.push(i);
    }

    let result = [];
    while (queue.length > 0) {
        let u = queue.shift();
        result.push(u);
        for (let v of adj[u]) {
            inDegree[v]--;
            if (inDegree[v] === 0) queue.push(v);
        }
    }

    return result.length === n ? result : "Cycle Detected";
}`,
        python: `def topological_sort(n, edges):
    in_degree = [0] * n
    adj = [[] for _ in range(n)]
    
    for u, v in edges:
        adj[u].append(v)
        in_degree[v] += 1

    queue = [i for i in range(n) if in_degree[i] == 0]
    result = []

    while queue:
        u = queue.pop(0)
        result.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    return result if len(result) == n else "Cycle Detected"`,
        cpp: `vector<int> topologicalSort(int n, vector<pair<int, int>>& edges) {
    vector<int> inDegree(n, 0);
    vector<vector<int>> adj(n);
    
    for (auto& edge : edges) {
        adj[edge.first].push_back(edge.second);
        inDegree[edge.second]++;
    }

    queue<int> q;
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) q.push(i);
    }

    vector<int> result;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        result.push_back(u);
        for (int v : adj[u]) {
            if (--inDegree[v] == 0) q.push(v);
        }
    }

    return result.size() == n ? result : vector<int>();
}`,
        java: `public List<Integer> topologicalSort(int n, int[][] edges) {
    int[] inDegree = new int[n];
    List<List<Integer>> adj = new ArrayList<>();
    for (int i = 0; i < n; i++) adj.add(new ArrayList<>());

    for (int[] edge : edges) {
        adj.get(edge[0]).add(edge[1]);
        inDegree[edge[1]]++;
    }

    Queue<Integer> q = new LinkedList<>();
    for (int i = 0; i < n; i++) {
        if (inDegree[i] == 0) q.add(i);
    }

    List<Integer> result = new ArrayList<>();
    while (!q.isEmpty()) {
        int u = q.poll();
        result.add(u);
        for (int v : adj.get(u)) {
            if (--inDegree[v] == 0) q.add(v);
        }
    }

    return result.size() == n ? result : new ArrayList<>();
}`
    }
};
