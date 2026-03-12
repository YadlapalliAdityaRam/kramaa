export const generateBitManipulationSteps = (a, b, operation) => {
    const steps = [];
    const bitLength = 8;

    const toBinary = (num) => {
        let bin = (num >>> 0).toString(2);
        return bin.padStart(bitLength, '0').slice(-bitLength);
    };

    const binA = toBinary(a);
    const binB = toBinary(b);
    let result = 0;

    steps.push({
        type: 'init',
        description: `Converting inputs to 8-bit binary representation.`,
        a: a,
        b: b,
        binA: binA,
        binB: binB,
        activeBit: -1,
        resultBin: ' '.repeat(bitLength),
        operation: operation
    });

    if (operation === 'AND' || operation === 'OR' || operation === 'XOR') {
        let currentResultStr = ' '.repeat(bitLength).split('');
        for (let i = bitLength - 1; i >= 0; i--) {
            const bitA = parseInt(binA[i]);
            const bitB = parseInt(binB[i]);
            let resBit;

            let logicDesc = '';
            if (operation === 'AND') {
                resBit = bitA & bitB;
                logicDesc = `${bitA} AND ${bitB} → ${resBit} (Both must be 1)`;
            } else if (operation === 'OR') {
                resBit = bitA | bitB;
                logicDesc = `${bitA} OR ${bitB} → ${resBit} (At least one is 1)`;
            } else if (operation === 'XOR') {
                resBit = bitA ^ bitB;
                logicDesc = `${bitA} XOR ${bitB} → ${resBit} (Bits must be different)`;
            }

            currentResultStr[i] = resBit.toString();

            steps.push({
                type: 'compare',
                description: `Comparing bit at position ${bitLength - 1 - i}: ${logicDesc}`,
                a: a,
                b: b,
                binA: binA,
                binB: binB,
                activeBit: i,
                resultBin: currentResultStr.join(''),
                operation: operation
            });
        }

        switch (operation) {
            case 'AND': result = a & b; break;
            case 'OR': result = a | b; break;
            case 'XOR': result = a ^ b; break;
        }

    } else if (operation === 'NOT') {
        let currentResultStr = ' '.repeat(bitLength).split('');
        for (let i = bitLength - 1; i >= 0; i--) {
            const bitA = parseInt(binA[i]);
            const resBit = bitA === 1 ? 0 : 1;
            currentResultStr[i] = resBit.toString();

            steps.push({
                type: 'compare',
                description: `Flipping bit at position ${bitLength - 1 - i}: NOT ${bitA} → ${resBit}`,
                a: a,
                b: null,
                binA: binA,
                binB: null,
                activeBit: i,
                resultBin: currentResultStr.join(''),
                operation: operation
            });
        }
        result = (~a) & 0xFF;
    } else if (operation === 'LSHIFT') {
        const shiftAmount = b;
        steps.push({
            type: 'shift-start',
            description: `Preparing to left shift ${a} by ${shiftAmount} positions.`,
            a: a,
            b: shiftAmount,
            binA: binA,
            binB: null,
            activeBit: -1,
            resultBin: binA,
            operation: operation
        });

        result = (a << shiftAmount) & 0xFF;
        const resultBin = toBinary(result);

        steps.push({
            type: 'shift-end',
            description: `Shifted left. Vacated spots on the right are filled with 0s.`,
            a: a,
            b: shiftAmount,
            binA: binA,
            binB: null,
            activeBit: -1,
            resultBin: resultBin,
            operation: operation,
            shiftDir: 'left',
            shiftAmount: shiftAmount
        });

    } else if (operation === 'RSHIFT') {
        const shiftAmount = b;
        steps.push({
            type: 'shift-start',
            description: `Preparing to right shift ${a} by ${shiftAmount} positions.`,
            a: a,
            b: shiftAmount,
            binA: binA,
            binB: null,
            activeBit: -1,
            resultBin: binA,
            operation: operation
        });

        result = (a >> shiftAmount) & 0xFF;
        const resultBin = toBinary(result);

        steps.push({
            type: 'shift-end',
            description: `Shifted right. Bits on the right fell off, signs filled from left.`,
            a: a,
            b: shiftAmount,
            binA: binA,
            binB: null,
            activeBit: -1,
            resultBin: resultBin,
            operation: operation,
            shiftDir: 'right',
            shiftAmount: shiftAmount
        });
    }

    steps.push({
        type: 'complete',
        description: `Operation complete. Final result in decimal: ${result}`,
        a: a,
        b: b,
        binA: binA,
        binB: operation === 'NOT' || operation === 'LSHIFT' || operation === 'RSHIFT' ? null : binB,
        activeBit: -1,
        resultBin: toBinary(result),
        operation: operation,
        finalResult: result
    });

    return steps;
};
