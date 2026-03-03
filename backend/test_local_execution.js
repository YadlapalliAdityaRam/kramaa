const codeExecutor = require('./services/codeExecutor');

async function test() {
    console.log("Starting Local Execution Tests...");

    // 1. Javascript Test
    console.log("\n--- Testing Javascript ---");
    const jsCode = `
        function solution(input) {
            return "Hello JS: " + input.trim();
        }
    `;
    const jsRes = await codeExecutor.executeCode(jsCode, 'javascript', 'World');
    console.log("JS Result:", jsRes);

    // 2. Python Test
    console.log("\n--- Testing Python ---");
    const pyCode = `
def solution(input_str):
    return "Hello Python: " + input_str.strip()
`;
    const pyRes = await codeExecutor.executeCode(pyCode, 'python', 'World');
    console.log("Python Result:", pyRes);

    // 3. Java Test
    console.log("\n--- Testing Java ---");
    const javaCode = `
        public class Solution {
            public String run(String input) {
                return "Hello Java: " + input.trim();
            }
        }
    `;
    const javaRes = await codeExecutor.executeCode(javaCode, 'java', 'World');
    console.log("Java Result:", javaRes);

    // 4. C++ Test
    console.log("\n--- Testing C++ ---");
    const cppCode = `
        #include <string>
        using namespace std;
        class Solution {
        public:
            string run(string input) {
                // simple trim logic or just append
                // removing trailing newline is hard in pure C++ one liner without boost
                // just return logic
                return "Hello C++: " + input;
            }
        };
    `;
    const cppRes = await codeExecutor.executeCode(cppCode, 'cpp', 'World');
    console.log("C++ Result:", cppRes);

    // 5. C Test
    console.log("\n--- Testing C ---");
    const cCode = `
        #include <stdlib.h>
        #include <string.h>
        #include <stdio.h>

        char* solve(char* input) {
            char* res = malloc(100);
            sprintf(res, "Hello C: %s", input);
            return res;
        }
    `;
    const cRes = await codeExecutor.executeCode(cCode, 'c', 'World');
    console.log("C Result:", cRes);
}

test().catch(console.error);
