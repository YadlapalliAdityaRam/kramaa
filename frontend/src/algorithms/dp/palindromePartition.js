// Palindrome Partitioning — DP table for minimum cuts + palindrome check matrix
export const generatePalindromePartitionSteps = (stringInput) => {
    const s = (typeof stringInput === 'string' && stringInput.length > 0) ? stringInput.slice(0, 8) : 'aab';
    const steps = [];
    const n = s.length;

    // Palindrome check table
    const isPalin = Array.from({ length: n }, () => Array(n).fill(false));
    for (let i = 0; i < n; i++) isPalin[i][i] = true;
    for (let len = 2; len <= n; len++) {
        for (let i = 0; i <= n - len; i++) {
            const j = i + len - 1;
            if (len === 2) isPalin[i][j] = s[i] === s[j];
            else isPalin[i][j] = s[i] === s[j] && isPalin[i + 1][j - 1];
        }
    }

    // Min cuts DP
    const dp = new Array(n).fill(0);
    const cellStates = {};
    const rowLabels = ['MinCuts'];
    const colLabels = s.split('');

    steps.push({
        type: 'dp',
        description: `📚 Palindrome Partitioning: Find minimum cuts so every substring is a palindrome. String: "${s}". dp[i] = min cuts for s[0..i].`,
        table: [[...dp]],
        cellStates: { ...cellStates },
        rowLabels, colLabels
    });

    for (let i = 0; i < n; i++) {
        if (isPalin[0][i]) {
            dp[i] = 0;
            cellStates[`0-${i}`] = 'filled';
            steps.push({
                type: 'dp',
                description: `✅ s[0..${i}]="${s.slice(0, i + 1)}" is a palindrome! dp[${i}] = 0 (no cuts needed).`,
                table: [[...dp]],
                cellStates: { ...cellStates },
                rowLabels, colLabels
            });
        } else {
            dp[i] = i; // worst case: cut every character
            cellStates[`0-${i}`] = 'computing';
            for (let j = 1; j <= i; j++) {
                if (isPalin[j][i]) {
                    steps.push({
                        type: 'dp',
                        description: `🔍 s[${j}..${i}]="${s.slice(j, i + 1)}" is palindrome. Cut before ${j}: dp[${i}] = min(${dp[i]}, dp[${j - 1}]+1) = min(${dp[i]}, ${dp[j - 1] + 1}).`,
                        table: [[...dp]],
                        cellStates: { ...cellStates },
                        rowLabels, colLabels
                    });
                    dp[i] = Math.min(dp[i], dp[j - 1] + 1);
                }
            }
            cellStates[`0-${i}`] = 'filled';
            steps.push({
                type: 'dp',
                description: `✅ dp[${i}] = ${dp[i]}. Min cuts for "${s.slice(0, i + 1)}".`,
                table: [[...dp]],
                cellStates: { ...cellStates },
                rowLabels, colLabels
            });
        }
    }

    cellStates[`0-${n - 1}`] = 'optimal-path';
    steps.push({
        type: 'dp-complete',
        description: `🎯 Minimum palindrome partition cuts for "${s}" = ${dp[n - 1]}.`,
        table: [[...dp]],
        cellStates: { ...cellStates },
        rowLabels, colLabels
    });
    return steps;
};
