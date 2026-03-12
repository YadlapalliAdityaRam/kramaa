export const generateSieveSteps = (limit = 100) => {
    const steps = [];
    const isPrimeArr = new Array(limit + 1).fill(true);
    isPrimeArr[0] = isPrimeArr[1] = false;

    // Helper to generate a full grid snapshot
    const generateSnapshot = (currentP = null, currentM = null) => {
        const grid = [];
        for (let i = 2; i <= limit; i++) {
            let status = 'active';
            if (!isPrimeArr[i]) status = 'multiple';
            else if (i < (currentP || 2) && isPrimeArr[i]) status = 'prime';

            // Overlays
            if (i === currentP) status = 'current-prime';
            if (i === currentM) status = 'current-multiple';

            grid.push({ value: i, status });
        }
        return grid;
    };

    steps.push({
        type: 'initialization',
        grid: generateSnapshot(),
        description: `Starting Sieve of Eratosthenes up to ${limit}. All numbers are initially candidates.`,
    });

    for (let p = 2; p * p <= limit; p++) {
        if (isPrimeArr[p]) {
            steps.push({
                type: 'found-prime',
                currentPrime: p,
                grid: generateSnapshot(p),
                description: `Found prime number ${p}. We will now mark its multiples as non-primes.`,
            });

            for (let m = p * p; m <= limit; m += p) {
                if (isPrimeArr[m]) {
                    isPrimeArr[m] = false;
                    steps.push({
                        type: 'crossing-out',
                        currentPrime: p,
                        currentMultiple: m,
                        grid: generateSnapshot(p, m),
                        description: `Crossing out ${m} because it's a multiple of ${p} (${p} × ${m / p}).`,
                    });
                }
            }
        }
    }

    // Final state
    steps.push({
        type: 'completed',
        grid: generateSnapshot(limit + 1), // Pass extra limit to clear any 'current' highlights
        description: `Complete! All remaining highlighted numbers are prime.`,
    });

    return steps;
};
