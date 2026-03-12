/**
 * Palindrome Partitioning Backtracking Algorithm
 * 
 * finds all possible ways to partition a string such that every substring is a palindrome.
 */

export const generatePalindromePartitioningSteps = (s) => {
    const steps = [];
    const results = [];
    const n = s.length;

    const isPalindrome = (str) => {
        let left = 0;
        let right = str.length - 1;
        while (left < right) {
            if (str[left] !== str[right]) return false;
            left++;
            right--;
        }
        return true;
    };

    const getSnapshot = (type, startIndex, currentSubstring, currentPartition, description) => ({
        type,
        startIndex,
        currentSubstring,
        currentPartition: [...currentPartition],
        remainingString: s.slice(startIndex),
        results: [...results],
        description
    });

    const backtrack = (start, currentPartition) => {
        // Base case: processed entire string
        if (start >= n) {
            results.push([...currentPartition]);
            steps.push(getSnapshot('success', start, '', currentPartition,
                `🎯 Reached the end of the string! Found a valid partition: [${currentPartition.join(', ')}].`
            ));
            return;
        }

        for (let end = start + 1; end <= n; end++) {
            const substring = s.slice(start, end);

            steps.push(getSnapshot('check', start, substring, currentPartition,
                `🔍 Checking if "${substring}" is a palindrome...`
            ));

            if (isPalindrome(substring)) {
                steps.push(getSnapshot('valid', start, substring, currentPartition,
                    `✅ "${substring}" is a palindrome! Adding it to our path and moving forward.`
                ));

                currentPartition.push(substring);
                backtrack(end, currentPartition);

                // Backtrack
                const popped = currentPartition.pop();
                steps.push(getSnapshot('backtrack', start, substring, currentPartition,
                    `🔙 Backtracking: Removing "${popped}" from current path to try other options.`
                ));
            } else {
                steps.push(getSnapshot('invalid', start, substring, currentPartition,
                    `❌ "${substring}" is not a palindrome. Skipping this option.`
                ));
            }
        }
    };

    steps.push(getSnapshot('info', 0, '', [],
        `📚 Palindrome Partitioning: Dividing "${s}" into substrings where each part is a palindrome.`
    ));

    backtrack(0, []);

    steps.push(getSnapshot('completed', n, '', [],
        `🏁 All possibilities explored! Found ${results.length} valid palindrome partitions.`
    ));

    return steps;
};
