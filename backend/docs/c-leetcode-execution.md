# LeetCode-Style C Execution (Judge-Safe)

## 1) User Contract
- User must implement only the configured function signature.
- User must not define `main()`.
- User must return result via `return`.
- User must not parse input JSON.

## 2) Execution Flow
```text
Problem Metadata (functionName, parameters, returnType)
        |
Submission + Test Cases (JSON)
        |
Node Backend
  - Validate test case types
  - Build exact C signature contract
  - Validate user code:
      * no main()
      * signature exact match
      * restricted APIs blocked
  - Generate driver.c with native C values per test case
        |
Compile
  gcc -std=c11 -O2 -Wall -Werror -o app driver.c solution.c
        |
Run inside sandbox container/runner
        |
Driver emits JSON result array:
  [{ stdout, stderr, printedOutput, time, memory, returnMissing }, ...]
        |
Judge output validator (exact / unordered / float / any-valid)
        |
Verdict
```

## 3) Dynamic Driver Responsibilities
- Convert JSON test case input to native C variables.
- Call user function with exact ABI-safe signature.
- Convert return values to JSON text.
- Capture accidental `printf` output as `printedOutput`.
- Return per-case structured result.

## 4) Supported Parameter/Return Shapes
- Scalars: `int`, `double`, `bool`, `string`
- Arrays: `int[]`, `double[]`, `bool[]`, `string[]`
- Matrices: `int[][]`, `double[][]`, `bool[][]`, `string[][]`
- Multiple parameters with generated size/col-size arguments.

## 5) Sample Generated Signature
Given:
- `returnType = int[]`
- `parameters = [{name: "k", type: "int"}, {name: "arr", type: "int", isArray: true}]`

Generated C contract:
```c
int* kthLargest(int k, int* arr, int arrSize, int* returnSize);
```

## 6) Security Strategy
- Pre-compile static checks reject restricted APIs:
  - `system`, `fork`, `exec*`, `popen`, file/network primitives.
- Reject user-defined `main()`.
- Compile with warnings-as-errors.
- Execute inside isolated container pool.
- Enforce execution timeout and runtime error mapping.

