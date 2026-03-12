/**
 * Euclidean GCD — Detailed step-by-step modulo reduction for visualization.
 */
export const generateGCDSteps = (aInput, bInput) => {
    let a = Math.max(Number(aInput) || 48, 1);
    let b = Math.max(Number(bInput) || 18, 0);

    // Ensure A is the larger number initially for better flow
    if (a < b) [a, b] = [b, a];

    const steps = [];
    const history = [];

    const getSnapshot = (type, currentA, currentB, r, q, description) => ({
        type,
        a: currentA,
        b: currentB,
        remainder: r,
        quotient: q,
        description,
        history: [...history]
    });

    steps.push(getSnapshot('info', a, b, null, null,
        `📚 We want to find the Greatest Common Divisor (GCD) of ${a} and ${b}. 
        The rule is: GCD(a, b) = GCD(b, a % b). We repeat this until b is 0.`
    ));

    while (b !== 0) {
        const q = Math.floor(a / b);
        const r = a % b;

        // Step 1: Show the division
        steps.push(getSnapshot('divide', a, b, r, q,
            `🔢 Divide ${a} by ${b}: 
            ${a} = ${q} × ${b} + ${r}. 
            The remainder is ${r}.`
        ));

        history.push({ a, b, q, r });

        // Step 2: Prepare for swap
        steps.push(getSnapshot('swap-prepare', a, b, r, q,
            `🔄 Now we replace ${a} with ${b}, and ${b} with the remainder ${r}. 
            GCD(${a}, ${b}) becomes GCD(${b}, ${r}).`
        ));

        a = b;
        b = r;

        // Step 3: Show new state
        steps.push(getSnapshot('update', a, b, null, null,
            `✨ Updated numbers: A = ${a}, B = ${b}.`
        ));
    }

    steps.push(getSnapshot('completed', a, b, null, null,
        `🎯 B is now 0! The last non-zero value, ${a}, is the Greatest Common Divisor.`
    ));

    return steps;
};
