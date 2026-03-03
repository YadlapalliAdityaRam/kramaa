import sys
import os
import io
import json
import time
import contextlib
import tracemalloc

# Ensure generated stdout/stderr are captured correctly
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')

import solution  # type: ignore[import-not-found]

func_name = os.environ.get('ALGOVERSE_FUNCTION_NAME')
class_name = os.environ.get('ALGOVERSE_CLASS_NAME')

if not func_name:
    sys.stderr.write("ALGOVERSE_FUNCTION_NAME environment variable not set\n")
    sys.exit(1)

# Retrieve the function or class method
if class_name and hasattr(solution, class_name):
    cls = getattr(solution, class_name)
    instance = cls()
    if not hasattr(instance, func_name):
        sys.stderr.write(f"Function '{func_name}' not found in class '{class_name}'\n")
        sys.exit(1)
    func = getattr(instance, func_name)
else:
    if not hasattr(solution, func_name):
        sys.stderr.write(f"Function '{func_name}' not found in solution.py\n")
        sys.exit(1)
    func = getattr(solution, func_name)

try:
    # Read entire stdin as JSON Batch
    input_data = sys.stdin.read()
    batch_inputs = json.loads(input_data)
    
    if not isinstance(batch_inputs, list):
        raise ValueError("Input must be a JSON array")

    results = []

    for inp in batch_inputs:
        tracemalloc.start()
        tracemalloc.reset_peak()
        start_time = time.time()
        memory_mb: float = 0.0
        try:
            # Simple heuristic: try JSON parse, else raw str
            arg = inp
            try:
                arg = json.loads(inp)
            except:
                pass

            captured_stdout = io.StringIO()
            with contextlib.redirect_stdout(captured_stdout):
                if isinstance(arg, dict):
                    # Unpack JSON object as keyword arguments
                    ret = func(**arg)
                elif isinstance(arg, list):
                    # Unpack JSON array as positional arguments
                    ret = func(*arg)
                else:
                    # Single argument
                    ret = func(arg)
            
            printed_output = captured_stdout.getvalue().strip()
            return_missing = ret is None

            if return_missing:
                out = ""
            else:
                try:
                    out = json.dumps(ret, ensure_ascii=False)
                except Exception:
                    out = json.dumps(str(ret), ensure_ascii=False)

            duration = (time.time() - start_time) * 1000 # ms
            _current, peak = tracemalloc.get_traced_memory()
            memory_mb = peak / (1024 * 1024)
            error_message = ""
            if printed_output:
                error_message = "Use return statement for final answer. Printed output is shown below."
            elif return_missing:
                error_message = "Function must return output using return statement."

            results.append({
                "stdout": out,
                "stderr": error_message,
                "printedOutput": printed_output,
                "returnMissing": return_missing,
                "time": duration,
                "memory": int(memory_mb * 1000) / 1000
            })
        except Exception as e:
            results.append({
                "stdout": "",
                "stderr": str(e),
                "printedOutput": "",
                "returnMissing": False,
                "time": 0,
                "memory": 0
            })
        finally:
            tracemalloc.stop()

    print(json.dumps(results))

except Exception as e:
    sys.stderr.write(f"Driver Error: {str(e)}\n")
    sys.exit(1)
