const clampInt = (value, min, max) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.max(min, Math.min(max, Math.round(numeric)));
};

const toBinary8 = (value) => clampInt(value, 0, 255).toString(2).padStart(8, '0');

const normalizeInput = (input) => {
    if (Array.isArray(input) && input.length > 0) {
        return {
            number: clampInt(input[0], 0, 255),
            bitIndex: clampInt(input[1], 0, 7)
        };
    }

    if (input && typeof input === 'object') {
        return {
            number: clampInt(input.number, 0, 255),
            bitIndex: clampInt(input.bitIndex, 0, 7)
        };
    }

    return {
        number: 42,
        bitIndex: 2
    };
};

const buildStep = ({
    operation,
    description,
    number,
    bitIndex,
    mask = 0,
    resultText = '',
    previousNumber = null
}) => ({
    type: operation === 'completed' ? 'completed' : 'bit',
    operation,
    description,
    number,
    bitIndex,
    mask,
    binary: toBinary8(number),
    maskBinary: toBinary8(mask),
    previousNumber,
    previousBinary: previousNumber === null ? null : toBinary8(previousNumber),
    highlightBits: Number.isInteger(bitIndex) ? [bitIndex] : [],
    resultText
});

export const generateBitManipulationSteps = (input) => {
    const { number, bitIndex } = normalizeInput(input);
    const mask = 1 << bitIndex;
    const steps = [];

    steps.push(buildStep({
        operation: 'init',
        description: `Start with n = ${number} (${toBinary8(number)}) and bit index ${bitIndex}.`,
        number,
        bitIndex,
        mask,
        resultText: `Mask = 1 << ${bitIndex} = ${mask}`
    }));

    const isSet = (number & mask) !== 0;
    steps.push(buildStep({
        operation: 'check',
        description: `Check bit ${bitIndex}: n & mask = ${number & mask}.`,
        number,
        bitIndex,
        mask,
        resultText: `Bit ${bitIndex} is ${isSet ? 'SET (1)' : 'NOT SET (0)'}`
    }));

    const setResult = number | mask;
    steps.push(buildStep({
        operation: 'set',
        description: `Set bit ${bitIndex}: n | mask = ${setResult}.`,
        number: setResult,
        previousNumber: number,
        bitIndex,
        mask,
        resultText: `Set result = ${setResult}`
    }));

    const clearResult = number & ~mask;
    steps.push(buildStep({
        operation: 'clear',
        description: `Clear bit ${bitIndex}: n & ~mask = ${clearResult}.`,
        number: clearResult,
        previousNumber: number,
        bitIndex,
        mask,
        resultText: `Clear result = ${clearResult}`
    }));

    const toggleResult = number ^ mask;
    steps.push(buildStep({
        operation: 'toggle',
        description: `Toggle bit ${bitIndex}: n ^ mask = ${toggleResult}.`,
        number: toggleResult,
        previousNumber: number,
        bitIndex,
        mask,
        resultText: `Toggle result = ${toggleResult}`
    }));

    if (number === 0) {
        steps.push(buildStep({
            operation: 'count-result',
            description: 'Count set bits using n & (n - 1).',
            number,
            bitIndex,
            mask,
            resultText: 'Set bits count = 0'
        }));
    } else {
        let current = number;
        let count = 0;
        while (current > 0) {
            const next = current & (current - 1);
            count += 1;
            steps.push(buildStep({
                operation: 'count-step',
                description: `Count step ${count}: ${current} & (${current} - 1) = ${next}.`,
                number: next,
                previousNumber: current,
                bitIndex,
                mask,
                resultText: `Cleared one set bit. Count so far = ${count}`
            }));
            current = next;
        }
        steps.push(buildStep({
            operation: 'count-result',
            description: `Total set bits in ${number} = ${count}.`,
            number,
            bitIndex,
            mask,
            resultText: `Set bits count = ${count}`
        }));
    }

    const isPowerOfTwo = number > 0 && (number & (number - 1)) === 0;
    steps.push(buildStep({
        operation: 'power2',
        description: `Power-of-2 check: n > 0 and (n & (n - 1)) === 0.`,
        number,
        bitIndex,
        mask: number > 0 ? number - 1 : 0,
        resultText: `${number} is ${isPowerOfTwo ? '' : 'NOT '}a power of 2`
    }));

    steps.push(buildStep({
        operation: 'completed',
        description: 'Bit Manipulation walkthrough complete.',
        number,
        bitIndex,
        mask,
        resultText: 'Completed all core bit operations'
    }));

    return steps;
};

