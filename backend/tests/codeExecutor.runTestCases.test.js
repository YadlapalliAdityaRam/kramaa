const codeExecutor = require('../services/codeExecutor');

describe('codeExecutor.runTestCases', () => {
    let originalExecuteBatch;

    beforeEach(() => {
        originalExecuteBatch = codeExecutor.executeBatch;
    });

    afterEach(() => {
        codeExecutor.executeBatch = originalExecuteBatch;
    });

    it('marks missing judge results as failed', async () => {
        const testCases = [{ input: { n: 1 }, output: 1 }];
        codeExecutor.executeBatch = jest.fn().mockResolvedValue([]);

        const results = await codeExecutor.runTestCases(
            'function solve(){}',
            'javascript',
            testCases,
            2000,
            { returnType: 'int' }
        );

        expect(results).toHaveLength(1);
        expect(results[0].passed).toBe(false);
        expect(results[0].error).toContain('inconsistent result count');
    });

    it('passes when result count matches and output is valid', async () => {
        const testCases = [{ input: { n: 1 }, output: 1 }];
        codeExecutor.executeBatch = jest.fn().mockResolvedValue([
            { stdout: '1', stderr: '', printedOutput: '', returnMissing: false, time: 1.2, memory: 10 }
        ]);

        const results = await codeExecutor.runTestCases(
            'function solve(n){ return n; }',
            'javascript',
            testCases,
            2000,
            { returnType: 'int' }
        );

        expect(results).toHaveLength(1);
        expect(results[0].passed).toBe(true);
        expect(results[0].error).toBe('');
    });

    it('fails all cases when return type contract is violated in any case', async () => {
        const testCases = [
            { input: { s: '()' }, output: true },
            { input: { s: '([)]' }, output: false }
        ];
        codeExecutor.executeBatch = jest.fn().mockResolvedValue([
            { stdout: '22', stderr: '', printedOutput: '', returnMissing: false, time: 1.1, memory: 10 },
            { stdout: 'false', stderr: '', printedOutput: '', returnMissing: false, time: 1.0, memory: 10 }
        ]);

        const results = await codeExecutor.runTestCases(
            'code',
            'python',
            testCases,
            2000,
            { returnType: 'boolean' }
        );

        expect(results).toHaveLength(2);
        expect(results[0].passed).toBe(false);
        expect(results[0].error).toContain('Return type mismatch');
        expect(results[1].passed).toBe(false);
        expect(results[1].error).toContain('Return type contract violated');
    });

    it('accepts plain string expected outputs for string return types', async () => {
        const testCases = [{ input: { s: '12345' }, output: '54321' }];
        codeExecutor.executeBatch = jest.fn().mockResolvedValue([
            { stdout: '"54321"', stderr: '', printedOutput: '', returnMissing: false, time: 1.1, memory: 10 }
        ]);

        const results = await codeExecutor.runTestCases(
            'code',
            'javascript',
            testCases,
            2000,
            { returnType: 'string' }
        );

        expect(results).toHaveLength(1);
        expect(results[0].passed).toBe(true);
        expect(results[0].error).toBe('');
    });

    it('runs serially and stops at first failure when enabled', async () => {
        const testCases = [
            { input: { n: 1 }, output: 1 },
            { input: { n: 2 }, output: 2 },
            { input: { n: 3 }, output: 3 }
        ];

        const runSpy = jest.spyOn(codeExecutor, 'runTestCases')
            .mockResolvedValueOnce([{ input: testCases[0].input, expectedOutput: 1, actualOutput: '1', passed: true, error: '' }])
            .mockResolvedValueOnce([{ input: testCases[1].input, expectedOutput: 2, actualOutput: '0', passed: false, error: 'Wrong Answer' }]);

        const results = await codeExecutor.runTestCasesSerial(
            'code',
            'javascript',
            testCases,
            2000,
            { returnType: 'int' },
            { stopOnFailure: true }
        );

        expect(runSpy).toHaveBeenCalledTimes(2);
        expect(results).toHaveLength(2);
        expect(results[0].testCaseNumber).toBe(1);
        expect(results[1].testCaseNumber).toBe(2);
        expect(results[1].passed).toBe(false);

        runSpy.mockRestore();
    });

    it('rejects stringified testcase inputs when parameters are typed', async () => {
        const results = await codeExecutor.executeBatch(
            'code',
            'python',
            [{ input: '["\\"z\\""]', output: '"z"' }],
            2000,
            {
                parameters: [{ name: 's', type: 'string', isArray: false, is2D: false }]
            }
        );

        expect(Array.isArray(results)).toBe(true);
        expect(results[0].status).toBe('error');
        expect(results[0].stderr).toContain('Invalid data type or structure');
    });
});
