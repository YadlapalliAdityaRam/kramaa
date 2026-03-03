const {
    normalizeAndValidateTestCases
} = require('../utils/problemTestCaseValidator');

describe('problemTestCaseValidator', () => {
    it('coerces safe scalar and array values for inputs and outputs', () => {
        const parameters = [
            { name: 'nums', type: 'int', isArray: true, is2D: false },
            { name: 'target', type: 'int', isArray: false, is2D: false }
        ];

        const testCases = [
            {
                input: { nums: '[2,7,11,15]', target: '9' },
                output: '[0,1]'
            }
        ];

        const result = normalizeAndValidateTestCases(testCases, {
            parameters,
            returnType: 'int[]',
            allowCoercion: true,
            fieldPrefix: 'sampleTestCases'
        });

        expect(result.issues).toHaveLength(0);
        expect(result.normalizedTestCases[0].input).toEqual({
            nums: [2, 7, 11, 15],
            target: 9
        });
        expect(result.normalizedTestCases[0].output).toEqual([0, 1]);
    });

    it('coerces legacy single-parameter array wrapper', () => {
        const parameters = [
            { name: 'prices', type: 'int', isArray: true, is2D: false }
        ];
        const testCases = [
            {
                input: ['[7,1,5,3,6,4]'],
                output: '5'
            }
        ];

        const result = normalizeAndValidateTestCases(testCases, {
            parameters,
            returnType: 'int',
            allowCoercion: true,
            allowLegacySingleParameterWrap: true
        });

        expect(result.issues).toHaveLength(0);
        expect(result.normalizedTestCases[0].input).toEqual({ prices: [7, 1, 5, 3, 6, 4] });
        expect(result.normalizedTestCases[0].output).toBe(5);
    });

    it('fails malformed numeric values', () => {
        const parameters = [
            { name: 'target', type: 'int', isArray: false, is2D: false }
        ];
        const testCases = [{ input: { target: '9x' }, output: '0' }];

        const result = normalizeAndValidateTestCases(testCases, {
            parameters,
            returnType: 'int',
            allowCoercion: true
        });

        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues.some((issue) => issue.path.includes('target'))).toBe(true);
    });

    it('fails loudly when coercion is disabled', () => {
        const parameters = [
            { name: 'target', type: 'int', isArray: false, is2D: false }
        ];
        const testCases = [{ input: { target: '9' }, output: 9 }];

        const result = normalizeAndValidateTestCases(testCases, {
            parameters,
            returnType: 'int',
            allowCoercion: false
        });

        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues.some((issue) => issue.path.includes('target'))).toBe(true);
    });

    it('fails output type mismatch against declared returnType', () => {
        const parameters = [
            { name: 's', type: 'string', isArray: false, is2D: false }
        ];
        const testCases = [{ input: { s: 'abc' }, output: ['abc'] }];

        const result = normalizeAndValidateTestCases(testCases, {
            parameters,
            returnType: 'string',
            allowCoercion: true
        });

        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues.some((issue) => issue.path.includes('output'))).toBe(true);
    });

    it('coerces wrapped string literals during migration mode', () => {
        const parameters = [
            { name: 's', type: 'string', isArray: false, is2D: false }
        ];
        const testCases = [{ input: { s: '"hello"' }, output: '"olleh"' }];

        const result = normalizeAndValidateTestCases(testCases, {
            parameters,
            returnType: 'string',
            allowCoercion: true
        });

        expect(result.issues).toHaveLength(0);
        expect(result.normalizedTestCases[0].input).toEqual({ s: 'hello' });
        expect(result.normalizedTestCases[0].output).toBe('olleh');
    });

    it('rejects wrapped string literals in strict mode', () => {
        const parameters = [
            { name: 's', type: 'string', isArray: false, is2D: false }
        ];
        const testCases = [{ input: { s: 'hello' }, output: '"olleh"' }];

        const result = normalizeAndValidateTestCases(testCases, {
            parameters,
            returnType: 'string',
            allowCoercion: false
        });

        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues.some((issue) => issue.code === 'FORMATTED_STRING_LITERAL')).toBe(true);
    });
});
