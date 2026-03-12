/**
 * Fast Exponentiation (Binary Exponentiation)
 * 
 * Computes base^exp using repeated squaring.
 * Time Complexity: O(log exp)
 */

export const generateFastExpSteps = (baseInput, expInput) => {
    let base = BigInt(Math.max(Number(baseInput) || 3, 1));
    let exp = BigInt(Math.max(Number(expInput) || 13, 0));
    const MOD = BigInt(1000000007); // Default MOD for large results

    const steps = [];
    const binaryStr = exp.toString(2);
    const bits = binaryStr.split('').reverse(); // LSB to MSB

    let result = BigInt(1);
    let currentBase = base;
    let currentExp = exp;
    let stepCount = 0;

    const getSnapshot = (type, bitIdx, isOdd, description) => ({
        type,
        base: currentBase.toString(),
        exp: currentExp.toString(),
        result: result.toString(),
        bitIdx, // Current bit position being processed
        bits: [...bits],
        isOdd,
        description,
        stepCount
    });

    steps.push(getSnapshot('info', null, null,
        `📚 We want to calculate ${base}^${exp}. 
        The binary form of ${exp} is ${binaryStr}. 
        We'll process it bit by bit, from right to left.`
    ));

    while (currentExp > 0n) {
        const bit = currentExp % 2n;
        const bitIdx = stepCount;
        const isOdd = bit === 1n;

        // Step 1: Check the bit
        steps.push(getSnapshot('check-bit', bitIdx, isOdd,
            `🔍 Checking bit at position ${bitIdx}. 
            The bit is ${bit}. ${isOdd ? 'Since it is 1, we multiply the result by the current base.' : 'Since it is 0, we skip multiplying the result.'}`
        ));

        if (isOdd) {
            result = (result * currentBase) % MOD;
            steps.push(getSnapshot('multiply', bitIdx, isOdd,
                `🟢 Bit is 1! Multiplying result: 
                result = (result × currentBase) = ${result.toString()}.`
            ));
        }

        // Step 2: Square the base
        const oldBase = currentBase;
        currentBase = (currentBase * currentBase) % MOD;
        currentExp = currentExp / 2n;

        steps.push(getSnapshot('square', bitIdx, isOdd,
            `🔵 Squaring the base for the next step: 
            base = (${oldBase.toString()}²) = ${currentBase.toString()}. 
            Exponent is halved to ${currentExp.toString()}.`
        ));

        stepCount++;
    }

    steps.push(getSnapshot('completed', null, null,
        `🎯 Exponent reached 0. Calculation complete! 
        Final result (mod 10^9+7): ${result.toString()}.`
    ));

    return steps;
};
