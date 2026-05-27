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
    twoPointers: {
        javascript: `function twoPointers(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left < right) {
        const sum = arr[left] + arr[right];

        if (sum === target) {
            return [left, right];
        }

        if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return [-1, -1];
}`,
        python: `def two_pointers(arr, target):
    left = 0
    right = len(arr) - 1

    while left < right:
        current_sum = arr[left] + arr[right]

        if current_sum == target:
            return [left, right]

        if current_sum < target:
            left += 1
        else:
            right -= 1

    return [-1, -1]`,
        cpp: `vector<int> twoPointers(const vector<int>& arr, int target) {
    int left = 0;
    int right = static_cast<int>(arr.size()) - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];

        if (sum == target) {
            return {left, right};
        }

        if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return {-1, -1};
}`,
        java: `public int[] twoPointers(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];

        if (sum == target) {
            return new int[] { left, right };
        }

        if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return new int[] { -1, -1 };
}`
    },
    slidingWindow: {
        javascript: `function maxSumSubarray(arr, k) {
    let windowSum = 0;
    let maxSum = -Infinity;
    let left = 0;

    for (let right = 0; right < arr.length; right++) {
        windowSum += arr[right];

        if (right - left + 1 === k) {
            maxSum = Math.max(maxSum, windowSum);
            windowSum -= arr[left];
            left++;
        }
    }

    return maxSum;
}`,
        python: `def max_sum_subarray(arr, k):
    window_sum = 0
    max_sum = float('-inf')
    left = 0

    for right in range(len(arr)):
        window_sum += arr[right]

        if right - left + 1 == k:
            max_sum = max(max_sum, window_sum)
            window_sum -= arr[left]
            left += 1

    return max_sum`,
        cpp: `int maxSumSubarray(const vector<int>& arr, int k) {
    int windowSum = 0;
    int maxSum = INT_MIN;
    int left = 0;

    for (int right = 0; right < static_cast<int>(arr.size()); right++) {
        windowSum += arr[right];

        if (right - left + 1 == k) {
            maxSum = max(maxSum, windowSum);
            windowSum -= arr[left];
            left++;
        }
    }

    return maxSum;
}`,
        java: `public int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0;
    int maxSum = Integer.MIN_VALUE;
    int left = 0;

    for (int right = 0; right < arr.length; right++) {
        windowSum += arr[right];

        if (right - left + 1 == k) {
            maxSum = Math.max(maxSum, windowSum);
            windowSum -= arr[left];
            left++;
        }
    }

    return maxSum;
}`
    },



    jumpSearch: {
        javascript: `function jumpSearch(arr, target) {
    const n = arr.length;
    const jump = Math.floor(Math.sqrt(n));
    let start = 0;
    let end = Math.min(jump, n) - 1;

    while (end < n && arr[end] < target) {
        start = end + 1;
        end = Math.min(end + jump, n - 1);
    }

    for (let i = start; i <= end; i++) {
        if (arr[i] === target) return i;
        if (arr[i] > target) break;
    }

    return -1;
}`,
        python: `import math

def jump_search(arr, target):
    n = len(arr)
    jump = int(math.sqrt(n))
    start = 0
    end = min(jump, n) - 1

    while end < n and arr[end] < target:
        start = end + 1
        end = min(end + jump, n - 1)

    for i in range(start, end + 1):
        if arr[i] == target:
            return i
        if arr[i] > target:
            break

    return -1`,
        cpp: `int jumpSearch(vector<int>& arr, int target) {
    int n = arr.size();
    int jump = sqrt(n);
    int start = 0;
    int end = min(jump, n) - 1;

    while (end < n && arr[end] < target) {
        start = end + 1;
        end = min(end + jump, n - 1);
    }

    for (int i = start; i <= end; i++) {
        if (arr[i] == target) return i;
        if (arr[i] > target) break;
    }

    return -1;
}`,
        java: `public int jumpSearch(int[] arr, int target) {
    int n = arr.length;
    int jump = (int) Math.sqrt(n);
    int start = 0;
    int end = Math.min(jump, n) - 1;

    while (end < n && arr[end] < target) {
        start = end + 1;
        end = Math.min(end + jump, n - 1);
    }

    for (int i = start; i <= end; i++) {
        if (arr[i] == target) return i;
        if (arr[i] > target) break;
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
    },
    shellSort: {
        javascript: `function shellSort(arr) {
    let gap = Math.floor(arr.length / 2);

    while (gap > 0) {
        for (let i = gap; i < arr.length; i++) {
            const temp = arr[i];
            let j = i;

            while (j >= gap && arr[j - gap] > temp) {
                arr[j] = arr[j - gap];
                j -= gap;
            }

            arr[j] = temp;
        }

        gap = Math.floor(gap / 2);
    }

    return arr;
}`,
        python: `def shell_sort(arr):
    gap = len(arr) // 2

    while gap > 0:
        for i in range(gap, len(arr)):
            temp = arr[i]
            j = i

            while j >= gap and arr[j - gap] > temp:
                arr[j] = arr[j - gap]
                j -= gap

            arr[j] = temp

        gap //= 2

    return arr`,
        cpp: `void shellSort(vector<int>& arr) {
    for (int gap = static_cast<int>(arr.size()) / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < static_cast<int>(arr.size()); i++) {
            int temp = arr[i];
            int j = i;

            while (j >= gap && arr[j - gap] > temp) {
                arr[j] = arr[j - gap];
                j -= gap;
            }

            arr[j] = temp;
        }
    }
}`,
        java: `public void shellSort(int[] arr) {
    for (int gap = arr.length / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < arr.length; i++) {
            int temp = arr[i];
            int j = i;

            while (j >= gap && arr[j - gap] > temp) {
                arr[j] = arr[j - gap];
                j -= gap;
            }

            arr[j] = temp;
        }
    }
}`
    },
    timSort: {
        javascript: `function insertionSort(arr, left, right) {
    for (let i = left + 1; i <= right; i++) {
        const key = arr[i];
        let j = i - 1;

        while (j >= left && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }

        arr[j + 1] = key;
    }
}

function merge(arr, left, mid, right) {
    const leftPart = arr.slice(left, mid + 1);
    const rightPart = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    while (i < leftPart.length && j < rightPart.length) {
        if (leftPart[i] <= rightPart[j]) {
            arr[k++] = leftPart[i++];
        } else {
            arr[k++] = rightPart[j++];
        }
    }

    while (i < leftPart.length) arr[k++] = leftPart[i++];
    while (j < rightPart.length) arr[k++] = rightPart[j++];
}

function timSort(arr, minRun = 4) {
    for (let start = 0; start < arr.length; start += minRun) {
        const end = Math.min(start + minRun - 1, arr.length - 1);
        insertionSort(arr, start, end);
    }

    for (let size = minRun; size < arr.length; size *= 2) {
        for (let left = 0; left < arr.length; left += 2 * size) {
            const mid = Math.min(left + size - 1, arr.length - 1);
            const right = Math.min(left + 2 * size - 1, arr.length - 1);

            if (mid < right) {
                merge(arr, left, mid, right);
            }
        }
    }

    return arr;
}`,
        python: `def insertion_sort(arr, left, right):
    for i in range(left + 1, right + 1):
        key = arr[i]
        j = i - 1

        while j >= left and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1

        arr[j + 1] = key

def merge(arr, left, mid, right):
    left_part = arr[left:mid + 1]
    right_part = arr[mid + 1:right + 1]
    i = j = 0
    k = left

    while i < len(left_part) and j < len(right_part):
        if left_part[i] <= right_part[j]:
            arr[k] = left_part[i]
            i += 1
        else:
            arr[k] = right_part[j]
            j += 1
        k += 1

    while i < len(left_part):
        arr[k] = left_part[i]
        i += 1
        k += 1

    while j < len(right_part):
        arr[k] = right_part[j]
        j += 1
        k += 1

def tim_sort(arr, min_run=4):
    for start in range(0, len(arr), min_run):
        end = min(start + min_run - 1, len(arr) - 1)
        insertion_sort(arr, start, end)

    size = min_run
    while size < len(arr):
        for left in range(0, len(arr), 2 * size):
            mid = min(left + size - 1, len(arr) - 1)
            right = min(left + 2 * size - 1, len(arr) - 1)
            if mid < right:
                merge(arr, left, mid, right)
        size *= 2

    return arr`,
        cpp: `void insertionSort(vector<int>& arr, int left, int right) {
    for (int i = left + 1; i <= right; i++) {
        int key = arr[i];
        int j = i - 1;

        while (j >= left && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }

        arr[j + 1] = key;
    }
}

void merge(vector<int>& arr, int left, int mid, int right) {
    vector<int> leftPart(arr.begin() + left, arr.begin() + mid + 1);
    vector<int> rightPart(arr.begin() + mid + 1, arr.begin() + right + 1);
    int i = 0, j = 0, k = left;

    while (i < static_cast<int>(leftPart.size()) && j < static_cast<int>(rightPart.size())) {
        if (leftPart[i] <= rightPart[j]) {
            arr[k++] = leftPart[i++];
        } else {
            arr[k++] = rightPart[j++];
        }
    }

    while (i < static_cast<int>(leftPart.size())) arr[k++] = leftPart[i++];
    while (j < static_cast<int>(rightPart.size())) arr[k++] = rightPart[j++];
}

void timSort(vector<int>& arr, int minRun = 4) {
    for (int start = 0; start < static_cast<int>(arr.size()); start += minRun) {
        int end = min(start + minRun - 1, static_cast<int>(arr.size()) - 1);
        insertionSort(arr, start, end);
    }

    for (int size = minRun; size < static_cast<int>(arr.size()); size *= 2) {
        for (int left = 0; left < static_cast<int>(arr.size()); left += 2 * size) {
            int mid = min(left + size - 1, static_cast<int>(arr.size()) - 1);
            int right = min(left + 2 * size - 1, static_cast<int>(arr.size()) - 1);

            if (mid < right) {
                merge(arr, left, mid, right);
            }
        }
    }
}`,
        java: `public void insertionSort(int[] arr, int left, int right) {
    for (int i = left + 1; i <= right; i++) {
        int key = arr[i];
        int j = i - 1;

        while (j >= left && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }

        arr[j + 1] = key;
    }
}

public void merge(int[] arr, int left, int mid, int right) {
    int[] leftPart = Arrays.copyOfRange(arr, left, mid + 1);
    int[] rightPart = Arrays.copyOfRange(arr, mid + 1, right + 1);
    int i = 0, j = 0, k = left;

    while (i < leftPart.length && j < rightPart.length) {
        if (leftPart[i] <= rightPart[j]) {
            arr[k++] = leftPart[i++];
        } else {
            arr[k++] = rightPart[j++];
        }
    }

    while (i < leftPart.length) arr[k++] = leftPart[i++];
    while (j < rightPart.length) arr[k++] = rightPart[j++];
}

public void timSort(int[] arr, int minRun) {
    for (int start = 0; start < arr.length; start += minRun) {
        int end = Math.min(start + minRun - 1, arr.length - 1);
        insertionSort(arr, start, end);
    }

    for (int size = minRun; size < arr.length; size *= 2) {
        for (int left = 0; left < arr.length; left += 2 * size) {
            int mid = Math.min(left + size - 1, arr.length - 1);
            int right = Math.min(left + 2 * size - 1, arr.length - 1);

            if (mid < right) {
                merge(arr, left, mid, right);
            }
        }
    }
}`
    },
    sentinelLinearSearch: {
        javascript: `function sentinelLinearSearch(arr, target) {
    const n = arr.length;
    if (n === 0) return -1;

    const last = arr[n - 1];
    arr[n - 1] = target;

    let i = 0;
    while (arr[i] !== target) {
        i++;
    }

    arr[n - 1] = last;
    if (i < n - 1 || arr[n - 1] === target) {
        return i;
    }

    return -1;
}`,
        python: `def sentinel_linear_search(arr, target):
    n = len(arr)
    if n == 0:
        return -1

    last = arr[-1]
    arr[-1] = target

    i = 0
    while arr[i] != target:
        i += 1

    arr[-1] = last
    if i < n - 1 or arr[-1] == target:
        return i

    return -1`,
        cpp: `int sentinelLinearSearch(vector<int>& arr, int target) {
    int n = static_cast<int>(arr.size());
    if (n == 0) return -1;

    int last = arr[n - 1];
    arr[n - 1] = target;

    int i = 0;
    while (arr[i] != target) {
        i++;
    }

    arr[n - 1] = last;
    if (i < n - 1 || arr[n - 1] == target) {
        return i;
    }

    return -1;
}`,
        java: `public int sentinelLinearSearch(int[] arr, int target) {
    int n = arr.length;
    if (n == 0) return -1;

    int last = arr[n - 1];
    arr[n - 1] = target;

    int i = 0;
    while (arr[i] != target) {
        i++;
    }

    arr[n - 1] = last;
    if (i < n - 1 || arr[n - 1] == target) {
        return i;
    }

    return -1;
}`
    },
    zAlgorithm: {
        javascript: `function zAlgorithmSearch(text, pattern) {
    const concat = pattern + '$' + text;
    const z = new Array(concat.length).fill(0);
    let left = 0;
    let right = 0;

    for (let i = 1; i < concat.length; i++) {
        if (i <= right) {
            z[i] = Math.min(right - i + 1, z[i - left]);
        }

        while (i + z[i] < concat.length && concat[z[i]] === concat[i + z[i]]) {
            z[i]++;
        }

        if (i + z[i] - 1 > right) {
            left = i;
            right = i + z[i] - 1;
        }
    }

    const matches = [];
    for (let i = 0; i < z.length; i++) {
        if (z[i] === pattern.length) {
            matches.push(i - pattern.length - 1);
        }
    }

    return matches;
}`
        ,
        python: `def z_algorithm_search(text, pattern):
    concat = pattern + '$' + text
    z = [0] * len(concat)
    left = 0
    right = 0

    for i in range(1, len(concat)):
        if i <= right:
            z[i] = min(right - i + 1, z[i - left])

        while i + z[i] < len(concat) and concat[z[i]] == concat[i + z[i]]:
            z[i] += 1

        if i + z[i] - 1 > right:
            left = i
            right = i + z[i] - 1

    matches = []
    for i, value in enumerate(z):
        if value == len(pattern):
            matches.append(i - len(pattern) - 1)

    return matches`,
        cpp: `vector<int> zAlgorithmSearch(const string& text, const string& pattern) {
    string concat = pattern + "$" + text;
    vector<int> z(concat.size(), 0);
    int left = 0, right = 0;

    for (int i = 1; i < static_cast<int>(concat.size()); i++) {
        if (i <= right) {
            z[i] = min(right - i + 1, z[i - left]);
        }

        while (i + z[i] < static_cast<int>(concat.size()) && concat[z[i]] == concat[i + z[i]]) {
            z[i]++;
        }

        if (i + z[i] - 1 > right) {
            left = i;
            right = i + z[i] - 1;
        }
    }

    vector<int> matches;
    for (int i = 0; i < static_cast<int>(z.size()); i++) {
        if (z[i] == static_cast<int>(pattern.size())) {
            matches.push_back(i - static_cast<int>(pattern.size()) - 1);
        }
    }

    return matches;
}`,
        java: `public List<Integer> zAlgorithmSearch(String text, String pattern) {
    String concat = pattern + "$" + text;
    int[] z = new int[concat.length()];
    int left = 0, right = 0;

    for (int i = 1; i < concat.length(); i++) {
        if (i <= right) {
            z[i] = Math.min(right - i + 1, z[i - left]);
        }

        while (i + z[i] < concat.length() && concat.charAt(z[i]) == concat.charAt(i + z[i])) {
            z[i]++;
        }

        if (i + z[i] - 1 > right) {
            left = i;
            right = i + z[i] - 1;
        }
    }

    List<Integer> matches = new ArrayList<>();
    for (int i = 0; i < z.length; i++) {
        if (z[i] == pattern.length()) {
            matches.add(i - pattern.length() - 1);
        }
    }

    return matches;
}`
    },
    cocktailShakerSort: {
        javascript: `function cocktailShakerSort(arr) {
    let start = 0;
    let end = arr.length - 1;
    let swapped = true;

    while (swapped) {
        swapped = false;

        for (let i = start; i < end; i++) {
            if (arr[i] > arr[i + 1]) {
                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                swapped = true;
            }
        }

        if (!swapped) break;

        swapped = false;
        end--;

        for (let i = end - 1; i >= start; i--) {
            if (arr[i] > arr[i + 1]) {
                [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
                swapped = true;
            }
        }

        start++;
    }

    return arr;
}`,
        python: `def cocktail_shaker_sort(arr):
    start = 0
    end = len(arr) - 1
    swapped = True

    while swapped:
        swapped = False

        for i in range(start, end):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True

        if not swapped:
            break

        swapped = False
        end -= 1

        for i in range(end - 1, start - 1, -1):
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True

        start += 1

    return arr`,
        cpp: `void cocktailShakerSort(vector<int>& arr) {
    int start = 0;
    int end = static_cast<int>(arr.size()) - 1;
    bool swapped = true;

    while (swapped) {
        swapped = false;

        for (int i = start; i < end; i++) {
            if (arr[i] > arr[i + 1]) {
                swap(arr[i], arr[i + 1]);
                swapped = true;
            }
        }

        if (!swapped) break;

        swapped = false;
        end--;

        for (int i = end - 1; i >= start; i--) {
            if (arr[i] > arr[i + 1]) {
                swap(arr[i], arr[i + 1]);
                swapped = true;
            }
        }

        start++;
    }
}`,
        java: `public void cocktailShakerSort(int[] arr) {
    int start = 0;
    int end = arr.length - 1;
    boolean swapped = true;

    while (swapped) {
        swapped = false;

        for (int i = start; i < end; i++) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }

        if (!swapped) break;

        swapped = false;
        end--;

        for (int i = end - 1; i >= start; i--) {
            if (arr[i] > arr[i + 1]) {
                int temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
                swapped = true;
            }
        }

        start++;
    }
}`
    },
    combSort: {
        javascript: `function combSort(arr) {
    let gap = arr.length;
    let swapped = true;
    const shrink = 1.3;

    while (gap > 1 || swapped) {
        gap = Math.max(1, Math.floor(gap / shrink));
        swapped = false;

        for (let i = 0; i + gap < arr.length; i++) {
            if (arr[i] > arr[i + gap]) {
                [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
                swapped = true;
            }
        }
    }

    return arr;
}`,
        python: `def comb_sort(arr):
    gap = len(arr)
    swapped = True
    shrink = 1.3

    while gap > 1 or swapped:
        gap = max(1, int(gap / shrink))
        swapped = False

        for i in range(len(arr) - gap):
            if arr[i] > arr[i + gap]:
                arr[i], arr[i + gap] = arr[i + gap], arr[i]
                swapped = True

    return arr`,
        cpp: `void combSort(vector<int>& arr) {
    int gap = static_cast<int>(arr.size());
    bool swapped = true;
    const double shrink = 1.3;

    while (gap > 1 || swapped) {
        gap = max(1, static_cast<int>(gap / shrink));
        swapped = false;

        for (int i = 0; i + gap < static_cast<int>(arr.size()); i++) {
            if (arr[i] > arr[i + gap]) {
                swap(arr[i], arr[i + gap]);
                swapped = true;
            }
        }
    }
}`,
        java: `public void combSort(int[] arr) {
    int gap = arr.length;
    boolean swapped = true;
    double shrink = 1.3;

    while (gap > 1 || swapped) {
        gap = Math.max(1, (int) (gap / shrink));
        swapped = false;

        for (int i = 0; i + gap < arr.length; i++) {
            if (arr[i] > arr[i + gap]) {
                int temp = arr[i];
                arr[i] = arr[i + gap];
                arr[i + gap] = temp;
                swapped = true;
            }
        }
    }
}`
    },
    countingSort: {
        javascript: `function countingSort(arr) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const count = Array(max - min + 1).fill(0);
    const output = Array(arr.length);

    for (const value of arr) {
        count[value - min]++;
    }

    for (let i = 1; i < count.length; i++) {
        count[i] += count[i - 1];
    }

    for (let i = arr.length - 1; i >= 0; i--) {
        const value = arr[i];
        output[count[value - min] - 1] = value;
        count[value - min]--;
    }

    return output;
}`,
        python: `def counting_sort(arr):
    min_val = min(arr)
    max_val = max(arr)
    count = [0] * (max_val - min_val + 1)
    output = [0] * len(arr)

    for value in arr:
        count[value - min_val] += 1

    for i in range(1, len(count)):
        count[i] += count[i - 1]

    for i in range(len(arr) - 1, -1, -1):
        value = arr[i]
        output[count[value - min_val] - 1] = value
        count[value - min_val] -= 1

    return output`,
        cpp: `vector<int> countingSort(const vector<int>& arr) {
    int minVal = *min_element(arr.begin(), arr.end());
    int maxVal = *max_element(arr.begin(), arr.end());
    vector<int> count(maxVal - minVal + 1, 0);
    vector<int> output(arr.size());

    for (int value : arr) {
        count[value - minVal]++;
    }

    for (int i = 1; i < static_cast<int>(count.size()); i++) {
        count[i] += count[i - 1];
    }

    for (int i = static_cast<int>(arr.size()) - 1; i >= 0; i--) {
        int value = arr[i];
        output[count[value - minVal] - 1] = value;
        count[value - minVal]--;
    }

    return output;
}`,
        java: `public int[] countingSort(int[] arr) {
    int min = arr[0];
    int max = arr[0];
    for (int value : arr) {
        min = Math.min(min, value);
        max = Math.max(max, value);
    }

    int[] count = new int[max - min + 1];
    int[] output = new int[arr.length];

    for (int value : arr) {
        count[value - min]++;
    }

    for (int i = 1; i < count.length; i++) {
        count[i] += count[i - 1];
    }

    for (int i = arr.length - 1; i >= 0; i--) {
        int value = arr[i];
        output[count[value - min] - 1] = value;
        count[value - min]--;
    }

    return output;
}`
    },
    coinChangeWays: {
        javascript: `function coinChangeWays(coins, amount) {
    const n = coins.length;
    const dp = Array.from({ length: n + 1 }, () => Array(amount + 1).fill(0));

    for (let i = 0; i <= n; i++) {
        dp[i][0] = 1;
    }

    for (let i = 1; i <= n; i++) {
        for (let sum = 1; sum <= amount; sum++) {
            const exclude = dp[i - 1][sum];
            const include = sum >= coins[i - 1] ? dp[i][sum - coins[i - 1]] : 0;
            dp[i][sum] = exclude + include;
        }
    }

    return dp[n][amount];
}`,
        python: `def coin_change_ways(coins, amount):
    n = len(coins)
    dp = [[0] * (amount + 1) for _ in range(n + 1)]

    for i in range(n + 1):
        dp[i][0] = 1

    for i in range(1, n + 1):
        for total in range(1, amount + 1):
            exclude = dp[i - 1][total]
            include = dp[i][total - coins[i - 1]] if total >= coins[i - 1] else 0
            dp[i][total] = exclude + include

    return dp[n][amount]`,
        cpp: `int coinChangeWays(vector<int>& coins, int amount) {
    int n = static_cast<int>(coins.size());
    vector<vector<int>> dp(n + 1, vector<int>(amount + 1, 0));

    for (int i = 0; i <= n; i++) {
        dp[i][0] = 1;
    }

    for (int i = 1; i <= n; i++) {
        for (int sum = 1; sum <= amount; sum++) {
            int exclude = dp[i - 1][sum];
            int include = sum >= coins[i - 1] ? dp[i][sum - coins[i - 1]] : 0;
            dp[i][sum] = exclude + include;
        }
    }

    return dp[n][amount];
}`,
        java: `public int coinChangeWays(int[] coins, int amount) {
    int n = coins.length;
    int[][] dp = new int[n + 1][amount + 1];

    for (int i = 0; i <= n; i++) {
        dp[i][0] = 1;
    }

    for (int i = 1; i <= n; i++) {
        for (int sum = 1; sum <= amount; sum++) {
            int exclude = dp[i - 1][sum];
            int include = sum >= coins[i - 1] ? dp[i][sum - coins[i - 1]] : 0;
            dp[i][sum] = exclude + include;
        }
    }

    return dp[n][amount];
}`
    },
    floydCycle: {
        javascript: `function hasCycle(head) {
    let slow = head;
    let fast = head;

    while (fast && fast.next) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow === fast) {
            return true;
        }
    }

    return false;
}`,
        python: `def has_cycle(head):
    slow = head
    fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True

    return False`,
        cpp: `bool hasCycle(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;

    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;

        if (slow == fast) {
            return true;
        }
    }

    return false;
}`,
        java: `public boolean hasCycle(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;

    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow == fast) {
            return true;
        }
    }

    return false;
}`
    },
    editDistance: {
        javascript: `function editDistance(word1, word2) {
    const m = word1.length;
    const n = word2.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                );
            }
        }
    }

    return dp[m][n];
}`,
        python: `def edit_distance(word1, word2):
    m = len(word1)
    n = len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                )

    return dp[m][n]`,
        cpp: `int editDistance(string word1, string word2) {
    int m = static_cast<int>(word1.size());
    int n = static_cast<int>(word2.size());
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));

    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1[i - 1] == word2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + min({
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                });
            }
        }
    }

    return dp[m][n];
}`,
        java: `public int editDistance(String word1, String word2) {
    int m = word1.length();
    int n = word2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    Math.min(dp[i][j - 1], dp[i - 1][j - 1])
                );
            }
        }
    }

    return dp[m][n];
}`
    },
    eggDrop: {
        javascript: `function eggDrop(eggs, floors) {
    const dp = Array.from({ length: eggs + 1 }, () => Array(floors + 1).fill(0));

    for (let f = 1; f <= floors; f++) {
        dp[1][f] = f;
    }

    for (let e = 1; e <= eggs; e++) {
        dp[e][0] = 0;
        dp[e][1] = 1;
    }

    for (let e = 2; e <= eggs; e++) {
        for (let f = 2; f <= floors; f++) {
            dp[e][f] = Infinity;
            for (let x = 1; x <= f; x++) {
                const worstCase = 1 + Math.max(dp[e - 1][x - 1], dp[e][f - x]);
                dp[e][f] = Math.min(dp[e][f], worstCase);
            }
        }
    }

    return dp[eggs][floors];
}`,
        python: `def egg_drop(eggs, floors):
    dp = [[0] * (floors + 1) for _ in range(eggs + 1)]

    for f in range(1, floors + 1):
        dp[1][f] = f

    for e in range(1, eggs + 1):
        dp[e][0] = 0
        dp[e][1] = 1

    for e in range(2, eggs + 1):
        for f in range(2, floors + 1):
            dp[e][f] = float("inf")
            for x in range(1, f + 1):
                worst_case = 1 + max(dp[e - 1][x - 1], dp[e][f - x])
                dp[e][f] = min(dp[e][f], worst_case)

    return dp[eggs][floors]`,
        cpp: `int eggDrop(int eggs, int floors) {
    vector<vector<int>> dp(eggs + 1, vector<int>(floors + 1, 0));

    for (int f = 1; f <= floors; f++) {
        dp[1][f] = f;
    }

    for (int e = 1; e <= eggs; e++) {
        dp[e][0] = 0;
        dp[e][1] = 1;
    }

    for (int e = 2; e <= eggs; e++) {
        for (int f = 2; f <= floors; f++) {
            dp[e][f] = INT_MAX;
            for (int x = 1; x <= f; x++) {
                int worstCase = 1 + max(dp[e - 1][x - 1], dp[e][f - x]);
                dp[e][f] = min(dp[e][f], worstCase);
            }
        }
    }

    return dp[eggs][floors];
}`,
        java: `public int eggDrop(int eggs, int floors) {
    int[][] dp = new int[eggs + 1][floors + 1];

    for (int f = 1; f <= floors; f++) {
        dp[1][f] = f;
    }

    for (int e = 1; e <= eggs; e++) {
        dp[e][0] = 0;
        dp[e][1] = 1;
    }

    for (int e = 2; e <= eggs; e++) {
        for (int f = 2; f <= floors; f++) {
            dp[e][f] = Integer.MAX_VALUE;
            for (int x = 1; x <= f; x++) {
                int worstCase = 1 + Math.max(dp[e - 1][x - 1], dp[e][f - x]);
                dp[e][f] = Math.min(dp[e][f], worstCase);
            }
        }
    }

    return dp[eggs][floors];
}`
    },
    rabinKarp: {
        javascript: `function rabinKarpSearch(text, pattern) {
    const base = 256;
    const mod = 101;
    const m = pattern.length;
    const n = text.length;
    const matches = [];
    let patternHash = 0;
    let windowHash = 0;
    let highestBase = 1;

    for (let i = 0; i < m - 1; i++) {
        highestBase = (highestBase * base) % mod;
    }

    for (let i = 0; i < m; i++) {
        patternHash = (base * patternHash + pattern.charCodeAt(i)) % mod;
        windowHash = (base * windowHash + text.charCodeAt(i)) % mod;
    }

    for (let i = 0; i <= n - m; i++) {
        if (patternHash === windowHash) {
            let matched = true;
            for (let j = 0; j < m; j++) {
                if (text[i + j] !== pattern[j]) {
                    matched = false;
                    break;
                }
            }
            if (matched) matches.push(i);
        }

        if (i < n - m) {
            windowHash = (base * (windowHash - text.charCodeAt(i) * highestBase) + text.charCodeAt(i + m)) % mod;
            if (windowHash < 0) windowHash += mod;
        }
    }

    return matches;
}`,
        python: `def rabin_karp_search(text, pattern):
    base = 256
    mod = 101
    m = len(pattern)
    n = len(text)
    matches = []
    pattern_hash = 0
    window_hash = 0
    highest_base = 1

    for _ in range(m - 1):
        highest_base = (highest_base * base) % mod

    for i in range(m):
        pattern_hash = (base * pattern_hash + ord(pattern[i])) % mod
        window_hash = (base * window_hash + ord(text[i])) % mod

    for i in range(n - m + 1):
        if pattern_hash == window_hash:
            if text[i:i + m] == pattern:
                matches.append(i)

        if i < n - m:
            window_hash = (base * (window_hash - ord(text[i]) * highest_base) + ord(text[i + m])) % mod
            window_hash %= mod

    return matches`,
        cpp: `vector<int> rabinKarpSearch(const string& text, const string& pattern) {
    const int base = 256;
    const int mod = 101;
    int m = static_cast<int>(pattern.size());
    int n = static_cast<int>(text.size());
    vector<int> matches;
    int patternHash = 0;
    int windowHash = 0;
    int highestBase = 1;

    for (int i = 0; i < m - 1; i++) {
        highestBase = (highestBase * base) % mod;
    }

    for (int i = 0; i < m; i++) {
        patternHash = (base * patternHash + pattern[i]) % mod;
        windowHash = (base * windowHash + text[i]) % mod;
    }

    for (int i = 0; i <= n - m; i++) {
        if (patternHash == windowHash) {
            bool matched = true;
            for (int j = 0; j < m; j++) {
                if (text[i + j] != pattern[j]) {
                    matched = false;
                    break;
                }
            }
            if (matched) matches.push_back(i);
        }

        if (i < n - m) {
            windowHash = (base * (windowHash - text[i] * highestBase) + text[i + m]) % mod;
            if (windowHash < 0) windowHash += mod;
        }
    }

    return matches;
}`,
        java: `public List<Integer> rabinKarpSearch(String text, String pattern) {
    int base = 256;
    int mod = 101;
    int m = pattern.length();
    int n = text.length();
    List<Integer> matches = new ArrayList<>();
    int patternHash = 0;
    int windowHash = 0;
    int highestBase = 1;

    for (int i = 0; i < m - 1; i++) {
        highestBase = (highestBase * base) % mod;
    }

    for (int i = 0; i < m; i++) {
        patternHash = (base * patternHash + pattern.charAt(i)) % mod;
        windowHash = (base * windowHash + text.charAt(i)) % mod;
    }

    for (int i = 0; i <= n - m; i++) {
        if (patternHash == windowHash) {
            if (text.substring(i, i + m).equals(pattern)) {
                matches.add(i);
            }
        }

        if (i < n - m) {
            windowHash = (base * (windowHash - text.charAt(i) * highestBase) + text.charAt(i + m)) % mod;
            if (windowHash < 0) windowHash += mod;
        }
    }

    return matches;
}`
    },
    fastExponentiation: {
        javascript: `function fastExponentiation(base, exponent) {
    let result = 1;
    let currentBase = base;
    let currentExponent = exponent;

    while (currentExponent > 0) {
        if (currentExponent % 2 === 1) {
            result *= currentBase;
        }
        currentBase *= currentBase;
        currentExponent = Math.floor(currentExponent / 2);
    }

    return result;
}`,
        python: `def fast_exponentiation(base, exponent):
    result = 1
    current_base = base
    current_exponent = exponent

    while current_exponent > 0:
        if current_exponent % 2 == 1:
            result *= current_base
        current_base *= current_base
        current_exponent //= 2

    return result`,
        cpp: `long long fastExponentiation(long long base, long long exponent) {
    long long result = 1;
    long long currentBase = base;
    long long currentExponent = exponent;

    while (currentExponent > 0) {
        if (currentExponent % 2 == 1) {
            result *= currentBase;
        }
        currentBase *= currentBase;
        currentExponent /= 2;
    }

    return result;
}`,
        java: `public long fastExponentiation(long base, long exponent) {
    long result = 1;
    long currentBase = base;
    long currentExponent = exponent;

    while (currentExponent > 0) {
        if (currentExponent % 2 == 1) {
            result *= currentBase;
        }
        currentBase *= currentBase;
        currentExponent /= 2;
    }

    return result;
}`
    },
    jobSequencing: {
        javascript: `function jobSequencing(jobs) {
    jobs.sort((a, b) => b.profit - a.profit);
    const maxDeadline = Math.max(...jobs.map((job) => job.deadline));
    const slots = Array(maxDeadline).fill(null);
    let totalProfit = 0;

    for (const job of jobs) {
        for (let slot = Math.min(job.deadline, maxDeadline) - 1; slot >= 0; slot--) {
            if (!slots[slot]) {
                slots[slot] = job.id;
                totalProfit += job.profit;
                break;
            }
        }
    }

    return { slots, totalProfit };
}`,
        python: `def job_sequencing(jobs):
    jobs.sort(key=lambda job: job["profit"], reverse=True)
    max_deadline = max(job["deadline"] for job in jobs)
    slots = [None] * max_deadline
    total_profit = 0

    for job in jobs:
        for slot in range(min(job["deadline"], max_deadline) - 1, -1, -1):
            if slots[slot] is None:
                slots[slot] = job["id"]
                total_profit += job["profit"]
                break

    return slots, total_profit`,
        cpp: `pair<vector<string>, int> jobSequencing(vector<Job>& jobs) {
    sort(jobs.begin(), jobs.end(), [](const Job& a, const Job& b) {
        return a.profit > b.profit;
    });

    int maxDeadline = 0;
    for (const Job& job : jobs) {
        maxDeadline = max(maxDeadline, job.deadline);
    }

    vector<string> slots(maxDeadline, "");
    int totalProfit = 0;

    for (const Job& job : jobs) {
        for (int slot = min(job.deadline, maxDeadline) - 1; slot >= 0; slot--) {
            if (slots[slot].empty()) {
                slots[slot] = job.id;
                totalProfit += job.profit;
                break;
            }
        }
    }

    return {slots, totalProfit};
}`,
        java: `public Map<String, Object> jobSequencing(Job[] jobs) {
    Arrays.sort(jobs, (a, b) -> b.profit - a.profit);
    int maxDeadline = 0;
    for (Job job : jobs) {
        maxDeadline = Math.max(maxDeadline, job.deadline);
    }

    String[] slots = new String[maxDeadline];
    int totalProfit = 0;

    for (Job job : jobs) {
        for (int slot = Math.min(job.deadline, maxDeadline) - 1; slot >= 0; slot--) {
            if (slots[slot] == null) {
                slots[slot] = job.id;
                totalProfit += job.profit;
                break;
            }
        }
    }

    Map<String, Object> result = new HashMap<>();
    result.put("slots", slots);
    result.put("totalProfit", totalProfit);
    return result;
}`
    },
    kmp: {
        javascript: `function buildLps(pattern) {
    const lps = Array(pattern.length).fill(0);
    let length = 0;

    for (let i = 1; i < pattern.length; ) {
        if (pattern[i] === pattern[length]) {
            lps[i++] = ++length;
        } else if (length > 0) {
            length = lps[length - 1];
        } else {
            lps[i++] = 0;
        }
    }

    return lps;
}

function kmpSearch(text, pattern) {
    const lps = buildLps(pattern);
    const matches = [];
    let i = 0;
    let j = 0;

    while (i < text.length) {
        if (text[i] === pattern[j]) {
            i++;
            j++;
        }

        if (j === pattern.length) {
            matches.push(i - j);
            j = lps[j - 1];
        } else if (i < text.length && text[i] !== pattern[j]) {
            if (j > 0) j = lps[j - 1];
            else i++;
        }
    }

    return matches;
}`,
        python: `def build_lps(pattern):
    lps = [0] * len(pattern)
    length = 0
    i = 1

    while i < len(pattern):
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length > 0:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1

    return lps

def kmp_search(text, pattern):
    lps = build_lps(pattern)
    matches = []
    i = 0
    j = 0

    while i < len(text):
        if text[i] == pattern[j]:
            i += 1
            j += 1

        if j == len(pattern):
            matches.append(i - j)
            j = lps[j - 1]
        elif i < len(text) and text[i] != pattern[j]:
            if j > 0:
                j = lps[j - 1]
            else:
                i += 1

    return matches`,
        cpp: `vector<int> buildLps(const string& pattern) {
    vector<int> lps(pattern.size(), 0);
    int length = 0;

    for (int i = 1; i < static_cast<int>(pattern.size()); ) {
        if (pattern[i] == pattern[length]) {
            lps[i++] = ++length;
        } else if (length > 0) {
            length = lps[length - 1];
        } else {
            lps[i++] = 0;
        }
    }

    return lps;
}

vector<int> kmpSearch(const string& text, const string& pattern) {
    vector<int> lps = buildLps(pattern);
    vector<int> matches;
    int i = 0;
    int j = 0;

    while (i < static_cast<int>(text.size())) {
        if (text[i] == pattern[j]) {
            i++;
            j++;
        }

        if (j == static_cast<int>(pattern.size())) {
            matches.push_back(i - j);
            j = lps[j - 1];
        } else if (i < static_cast<int>(text.size()) && text[i] != pattern[j]) {
            if (j > 0) j = lps[j - 1];
            else i++;
        }
    }

    return matches;
}`,
        java: `public int[] buildLps(String pattern) {
    int[] lps = new int[pattern.length()];
    int length = 0;

    for (int i = 1; i < pattern.length(); ) {
        if (pattern.charAt(i) == pattern.charAt(length)) {
            lps[i++] = ++length;
        } else if (length > 0) {
            length = lps[length - 1];
        } else {
            lps[i++] = 0;
        }
    }

    return lps;
}

public List<Integer> kmpSearch(String text, String pattern) {
    int[] lps = buildLps(pattern);
    List<Integer> matches = new ArrayList<>();
    int i = 0;
    int j = 0;

    while (i < text.length()) {
        if (text.charAt(i) == pattern.charAt(j)) {
            i++;
            j++;
        }

        if (j == pattern.length()) {
            matches.add(i - j);
            j = lps[j - 1];
        } else if (i < text.length() && text.charAt(i) != pattern.charAt(j)) {
            if (j > 0) j = lps[j - 1];
            else i++;
        }
    }

    return matches;
}`
    },
    manacher: {
        javascript: `function longestPalindromeManacher(s) {
    const transformed = "^#" + s.split("").join("#") + "#$";
    const radius = Array(transformed.length).fill(0);
    let center = 0;
    let right = 0;

    for (let i = 1; i < transformed.length - 1; i++) {
        const mirror = 2 * center - i;
        if (i < right) {
            radius[i] = Math.min(right - i, radius[mirror]);
        }

        while (transformed[i + 1 + radius[i]] === transformed[i - 1 - radius[i]]) {
            radius[i]++;
        }

        if (i + radius[i] > right) {
            center = i;
            right = i + radius[i];
        }
    }

    let maxLen = 0;
    let centerIndex = 0;
    for (let i = 1; i < transformed.length - 1; i++) {
        if (radius[i] > maxLen) {
            maxLen = radius[i];
            centerIndex = i;
        }
    }

    const start = Math.floor((centerIndex - maxLen) / 2);
    return s.substring(start, start + maxLen);
}`,
        python: `def longest_palindrome_manacher(s):
    transformed = "^#" + "#".join(s) + "#$"
    radius = [0] * len(transformed)
    center = 0
    right = 0

    for i in range(1, len(transformed) - 1):
        mirror = 2 * center - i
        if i < right:
            radius[i] = min(right - i, radius[mirror])

        while transformed[i + 1 + radius[i]] == transformed[i - 1 - radius[i]]:
            radius[i] += 1

        if i + radius[i] > right:
            center = i
            right = i + radius[i]

    max_len = 0
    center_index = 0
    for i in range(1, len(transformed) - 1):
        if radius[i] > max_len:
            max_len = radius[i]
            center_index = i

    start = (center_index - max_len) // 2
    return s[start:start + max_len]`,
        cpp: `string longestPalindromeManacher(const string& s) {
    string transformed = "^#";
    for (char ch : s) {
        transformed += ch;
        transformed += '#';
    }
    transformed += '$';

    vector<int> radius(transformed.size(), 0);
    int center = 0;
    int right = 0;

    for (int i = 1; i < static_cast<int>(transformed.size()) - 1; i++) {
        int mirror = 2 * center - i;
        if (i < right) {
            radius[i] = min(right - i, radius[mirror]);
        }

        while (transformed[i + 1 + radius[i]] == transformed[i - 1 - radius[i]]) {
            radius[i]++;
        }

        if (i + radius[i] > right) {
            center = i;
            right = i + radius[i];
        }
    }

    int maxLen = 0;
    int centerIndex = 0;
    for (int i = 1; i < static_cast<int>(transformed.size()) - 1; i++) {
        if (radius[i] > maxLen) {
            maxLen = radius[i];
            centerIndex = i;
        }
    }

    int start = (centerIndex - maxLen) / 2;
    return s.substr(start, maxLen);
}`,
        java: `public String longestPalindromeManacher(String s) {
    StringBuilder transformed = new StringBuilder("^#");
    for (char ch : s.toCharArray()) {
        transformed.append(ch).append('#');
    }
    transformed.append('$');

    int[] radius = new int[transformed.length()];
    int center = 0;
    int right = 0;

    for (int i = 1; i < transformed.length() - 1; i++) {
        int mirror = 2 * center - i;
        if (i < right) {
            radius[i] = Math.min(right - i, radius[mirror]);
        }

        while (transformed.charAt(i + 1 + radius[i]) == transformed.charAt(i - 1 - radius[i])) {
            radius[i]++;
        }

        if (i + radius[i] > right) {
            center = i;
            right = i + radius[i];
        }
    }

    int maxLen = 0;
    int centerIndex = 0;
    for (int i = 1; i < transformed.length() - 1; i++) {
        if (radius[i] > maxLen) {
            maxLen = radius[i];
            centerIndex = i;
        }
    }

    int start = (centerIndex - maxLen) / 2;
    return s.substring(start, start + maxLen);
}`
    },
    matrixChain: {
        javascript: `function matrixChainOrder(dimensions) {
    const n = dimensions.length;
    const dp = Array.from({ length: n }, () => Array(n).fill(0));

    for (let len = 2; len < n; len++) {
        for (let i = 1; i < n - len + 1; i++) {
            const j = i + len - 1;
            dp[i][j] = Infinity;

            for (let k = i; k < j; k++) {
                const cost = dp[i][k] + dp[k + 1][j] + dimensions[i - 1] * dimensions[k] * dimensions[j];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }

    return dp[1][n - 1];
}`,
        python: `def matrix_chain_order(dimensions):
    n = len(dimensions)
    dp = [[0] * n for _ in range(n)]

    for length in range(2, n):
        for i in range(1, n - length + 1):
            j = i + length - 1
            dp[i][j] = float("inf")

            for k in range(i, j):
                cost = dp[i][k] + dp[k + 1][j] + dimensions[i - 1] * dimensions[k] * dimensions[j]
                dp[i][j] = min(dp[i][j], cost)

    return dp[1][n - 1]`,
        cpp: `int matrixChainOrder(vector<int>& dimensions) {
    int n = static_cast<int>(dimensions.size());
    vector<vector<int>> dp(n, vector<int>(n, 0));

    for (int len = 2; len < n; len++) {
        for (int i = 1; i < n - len + 1; i++) {
            int j = i + len - 1;
            dp[i][j] = INT_MAX;

            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j] + dimensions[i - 1] * dimensions[k] * dimensions[j];
                dp[i][j] = min(dp[i][j], cost);
            }
        }
    }

    return dp[1][n - 1];
}`,
        java: `public int matrixChainOrder(int[] dimensions) {
    int n = dimensions.length;
    int[][] dp = new int[n][n];

    for (int len = 2; len < n; len++) {
        for (int i = 1; i < n - len + 1; i++) {
            int j = i + len - 1;
            dp[i][j] = Integer.MAX_VALUE;

            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k + 1][j] + dimensions[i - 1] * dimensions[k] * dimensions[j];
                dp[i][j] = Math.min(dp[i][j], cost);
            }
        }
    }

    return dp[1][n - 1];
}`
    },
    rodCutting: {
        javascript: `function rodCutting(prices) {
    const n = prices.length;
    const dp = Array(n + 1).fill(0);

    for (let len = 1; len <= n; len++) {
        for (let cut = 1; cut <= len; cut++) {
            dp[len] = Math.max(dp[len], prices[cut - 1] + dp[len - cut]);
        }
    }

    return dp[n];
}`,
        python: `def rod_cutting(prices):
    n = len(prices)
    dp = [0] * (n + 1)

    for length in range(1, n + 1):
        for cut in range(1, length + 1):
            dp[length] = max(dp[length], prices[cut - 1] + dp[length - cut])

    return dp[n]`,
        cpp: `int rodCutting(vector<int>& prices) {
    int n = static_cast<int>(prices.size());
    vector<int> dp(n + 1, 0);

    for (int len = 1; len <= n; len++) {
        for (int cut = 1; cut <= len; cut++) {
            dp[len] = max(dp[len], prices[cut - 1] + dp[len - cut]);
        }
    }

    return dp[n];
}`,
        java: `public int rodCutting(int[] prices) {
    int n = prices.length;
    int[] dp = new int[n + 1];

    for (int len = 1; len <= n; len++) {
        for (int cut = 1; cut <= len; cut++) {
            dp[len] = Math.max(dp[len], prices[cut - 1] + dp[len - cut]);
        }
    }

    return dp[n];
}`
    },
    boyerMoore: {
        javascript: `function boyerMooreSearch(text, pattern) {
    const lastOccurrence = {};
    for (let i = 0; i < pattern.length; i++) {
        lastOccurrence[pattern[i]] = i;
    }

    const matches = [];
    let shift = 0;

    while (shift <= text.length - pattern.length) {
        let j = pattern.length - 1;

        while (j >= 0 && pattern[j] === text[shift + j]) {
            j--;
        }

        if (j < 0) {
            matches.push(shift);
            if (shift + pattern.length < text.length) {
                const nextChar = text[shift + pattern.length];
                shift += pattern.length - (lastOccurrence[nextChar] ?? -1);
            } else {
                shift += 1;
            }
        } else {
            const badCharIndex = lastOccurrence[text[shift + j]] ?? -1;
            shift += Math.max(1, j - badCharIndex);
        }
    }

    return matches;
}`,
        python: `def boyer_moore_search(text, pattern):
    last_occurrence = {}
    for i, ch in enumerate(pattern):
        last_occurrence[ch] = i

    matches = []
    shift = 0

    while shift <= len(text) - len(pattern):
        j = len(pattern) - 1

        while j >= 0 and pattern[j] == text[shift + j]:
            j -= 1

        if j < 0:
            matches.append(shift)
            if shift + len(pattern) < len(text):
                next_char = text[shift + len(pattern)]
                shift += len(pattern) - last_occurrence.get(next_char, -1)
            else:
                shift += 1
        else:
            bad_char_index = last_occurrence.get(text[shift + j], -1)
            shift += max(1, j - bad_char_index)

    return matches`,
        cpp: `vector<int> boyerMooreSearch(const string& text, const string& pattern) {
    unordered_map<char, int> lastOccurrence;
    for (int i = 0; i < static_cast<int>(pattern.size()); i++) {
        lastOccurrence[pattern[i]] = i;
    }

    vector<int> matches;
    int shift = 0;

    while (shift <= static_cast<int>(text.size()) - static_cast<int>(pattern.size())) {
        int j = static_cast<int>(pattern.size()) - 1;

        while (j >= 0 && pattern[j] == text[shift + j]) {
            j--;
        }

        if (j < 0) {
            matches.push_back(shift);
            if (shift + static_cast<int>(pattern.size()) < static_cast<int>(text.size())) {
                char nextChar = text[shift + pattern.size()];
                shift += pattern.size() - (lastOccurrence.count(nextChar) ? lastOccurrence[nextChar] : -1);
            } else {
                shift += 1;
            }
        } else {
            int badCharIndex = lastOccurrence.count(text[shift + j]) ? lastOccurrence[text[shift + j]] : -1;
            shift += max(1, j - badCharIndex);
        }
    }

    return matches;
}`,
        java: `public List<Integer> boyerMooreSearch(String text, String pattern) {
    Map<Character, Integer> lastOccurrence = new HashMap<>();
    for (int i = 0; i < pattern.length(); i++) {
        lastOccurrence.put(pattern.charAt(i), i);
    }

    List<Integer> matches = new ArrayList<>();
    int shift = 0;

    while (shift <= text.length() - pattern.length()) {
        int j = pattern.length() - 1;

        while (j >= 0 && pattern.charAt(j) == text.charAt(shift + j)) {
            j--;
        }

        if (j < 0) {
            matches.add(shift);
            if (shift + pattern.length() < text.length()) {
                char nextChar = text.charAt(shift + pattern.length());
                shift += pattern.length() - lastOccurrence.getOrDefault(nextChar, -1);
            } else {
                shift += 1;
            }
        } else {
            int badCharIndex = lastOccurrence.getOrDefault(text.charAt(shift + j), -1);
            shift += Math.max(1, j - badCharIndex);
        }
    }

    return matches;
}`
    }
};
