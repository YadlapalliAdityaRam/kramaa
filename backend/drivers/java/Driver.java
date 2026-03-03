import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.lang.reflect.Array;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Scanner;

public class Driver {
    private static final class JsonReader {
        private final String src;
        private int index;

        JsonReader(String src) {
            this.src = src == null ? "" : src;
            this.index = 0;
        }

        Object parse() {
            skipWhitespace();
            Object value = parseValue();
            skipWhitespace();
            return value;
        }

        private Object parseValue() {
            skipWhitespace();
            if (index >= src.length()) {
                return null;
            }

            char ch = src.charAt(index);
            if (ch == '"') return parseString();
            if (ch == '{') return parseObject();
            if (ch == '[') return parseArray();
            if (ch == 't' && matchKeyword("true")) return Boolean.TRUE;
            if (ch == 'f' && matchKeyword("false")) return Boolean.FALSE;
            if (ch == 'n' && matchKeyword("null")) return null;

            return parseNumber();
        }

        private Map<String, Object> parseObject() {
            Map<String, Object> map = new LinkedHashMap<>();
            index++; // {
            skipWhitespace();
            if (peek('}')) {
                index++;
                return map;
            }

            while (index < src.length()) {
                skipWhitespace();
                String key = parseString();
                skipWhitespace();
                consume(':');
                Object value = parseValue();
                map.put(key, value);
                skipWhitespace();
                if (peek('}')) {
                    index++;
                    break;
                }
                consume(',');
            }

            return map;
        }

        private List<Object> parseArray() {
            List<Object> list = new ArrayList<>();
            index++; // [
            skipWhitespace();
            if (peek(']')) {
                index++;
                return list;
            }

            while (index < src.length()) {
                Object value = parseValue();
                list.add(value);
                skipWhitespace();
                if (peek(']')) {
                    index++;
                    break;
                }
                consume(',');
            }

            return list;
        }

        private String parseString() {
            StringBuilder sb = new StringBuilder();
            consume('"');
            while (index < src.length()) {
                char ch = src.charAt(index++);
                if (ch == '"') break;
                if (ch == '\\' && index < src.length()) {
                    char esc = src.charAt(index++);
                    switch (esc) {
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case '/': sb.append('/'); break;
                        case 'b': sb.append('\b'); break;
                        case 'f': sb.append('\f'); break;
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        case 'u':
                            if (index + 4 <= src.length()) {
                                String hex = src.substring(index, index + 4);
                                index += 4;
                                try {
                                    sb.append((char) Integer.parseInt(hex, 16));
                                } catch (NumberFormatException ignore) {
                                    sb.append('?');
                                }
                            }
                            break;
                        default:
                            sb.append(esc);
                            break;
                    }
                } else {
                    sb.append(ch);
                }
            }
            return sb.toString();
        }

        private Object parseNumber() {
            int start = index;
            if (peek('-')) index++;
            while (index < src.length() && Character.isDigit(src.charAt(index))) index++;

            boolean isFractional = false;
            if (peek('.')) {
                isFractional = true;
                index++;
                while (index < src.length() && Character.isDigit(src.charAt(index))) index++;
            }

            if (peek('e') || peek('E')) {
                isFractional = true;
                index++;
                if (peek('+') || peek('-')) index++;
                while (index < src.length() && Character.isDigit(src.charAt(index))) index++;
            }

            String raw = src.substring(start, index);
            if (raw.isEmpty()) return 0L;

            try {
                if (isFractional) return Double.parseDouble(raw);
                return Long.parseLong(raw);
            } catch (NumberFormatException ignore) {
                return 0L;
            }
        }

        private void skipWhitespace() {
            while (index < src.length()) {
                char ch = src.charAt(index);
                if (ch == ' ' || ch == '\n' || ch == '\r' || ch == '\t') {
                    index++;
                } else {
                    break;
                }
            }
        }

        private boolean peek(char ch) {
            return index < src.length() && src.charAt(index) == ch;
        }

        private void consume(char ch) {
            if (peek(ch)) {
                index++;
            }
        }

        private boolean matchKeyword(String keyword) {
            if (src.regionMatches(index, keyword, 0, keyword.length())) {
                index += keyword.length();
                return true;
            }
            return false;
        }
    }

    private static String jsonEscape(String s) {
        if (s == null) return "";
        return s
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\t", "\\t")
            .replace("\r", "\\r");
    }

    private static List<String> parseParamNames(String raw) {
        List<String> names = new ArrayList<>();
        if (raw == null || raw.trim().isEmpty()) return names;

        try {
            Object parsed = new JsonReader(raw).parse();
            if (parsed instanceof List) {
                List<?> list = (List<?>) parsed;
                for (Object item : list) {
                    if (item instanceof String && !((String) item).isEmpty()) {
                        names.add((String) item);
                    }
                }
            }
        } catch (Exception ignore) {
            // Use empty names as fallback.
        }

        return names;
    }

    private static Method resolveMethod(Class<?> cls, String funcName, int preferredArity) {
        Method fallback = null;
        for (Method method : cls.getDeclaredMethods()) {
            if (!method.getName().equals(funcName)) continue;
            if (preferredArity > 0 && method.getParameterCount() == preferredArity) {
                method.setAccessible(true);
                return method;
            }
            if (fallback == null) fallback = method;
        }

        if (fallback != null) {
            fallback.setAccessible(true);
        }
        return fallback;
    }

    private static Object getRawArg(Object inputValue, List<String> paramNames, int index) {
        if (inputValue instanceof Map && !paramNames.isEmpty()) {
            Map<?, ?> map = (Map<?, ?>) inputValue;
            String key = paramNames.get(index);
            return map.get(key);
        }

        if (inputValue instanceof List) {
            List<?> list = (List<?>) inputValue;
            return index < list.size() ? list.get(index) : null;
        }

        if (index == 0) {
            return inputValue;
        }

        return null;
    }

    private static Object convertToType(Object rawValue, Class<?> targetType) {
        if (targetType == Object.class) return rawValue;

        if (rawValue == null) {
            if (targetType.isPrimitive()) {
                if (targetType == boolean.class) return false;
                if (targetType == char.class) return '\0';
                return 0;
            }
            return null;
        }

        if (targetType.isArray()) {
            if (!(rawValue instanceof List)) {
                throw new IllegalArgumentException("Expected array input for " + targetType.getTypeName());
            }

            Class<?> componentType = targetType.getComponentType();
            List<?> rawList = (List<?>) rawValue;
            Object array = Array.newInstance(componentType, rawList.size());
            for (int i = 0; i < rawList.size(); i++) {
                Object converted = convertToType(rawList.get(i), componentType);
                Array.set(array, i, converted);
            }
            return array;
        }

        if (targetType == String.class) {
            return String.valueOf(rawValue);
        }

        if (targetType == char.class || targetType == Character.class) {
            String text = String.valueOf(rawValue);
            return text.isEmpty() ? '\0' : text.charAt(0);
        }

        if (targetType == boolean.class || targetType == Boolean.class) {
            if (rawValue instanceof Boolean) return rawValue;
            return Boolean.parseBoolean(String.valueOf(rawValue));
        }

        if (Number.class.isAssignableFrom(targetType) || targetType.isPrimitive()) {
            double num;
            if (rawValue instanceof Number) {
                num = ((Number) rawValue).doubleValue();
            } else {
                num = Double.parseDouble(String.valueOf(rawValue));
            }

            if (targetType == int.class || targetType == Integer.class) return (int) num;
            if (targetType == long.class || targetType == Long.class) return (long) num;
            if (targetType == short.class || targetType == Short.class) return (short) num;
            if (targetType == byte.class || targetType == Byte.class) return (byte) num;
            if (targetType == float.class || targetType == Float.class) return (float) num;
            if (targetType == double.class || targetType == Double.class) return num;
        }

        return rawValue;
    }

    private static String toOutputString(Object value) {
        if (value == null) return "";
        return toJsonValue(value);
    }

    private static String toJsonValue(Object value) {
        if (value == null) return "null";

        if (value instanceof String || value instanceof Character) {
            return "\"" + jsonEscape(String.valueOf(value)) + "\"";
        }

        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }

        if (value.getClass().isArray()) {
            int len = Array.getLength(value);
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < len; i++) {
                if (i > 0) sb.append(',');
                sb.append(toJsonValue(Array.get(value, i)));
            }
            sb.append(']');
            return sb.toString();
        }

        if (value instanceof List) {
            List<?> list = (List<?>) value;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(',');
                sb.append(toJsonValue(list.get(i)));
            }
            sb.append(']');
            return sb.toString();
        }

        if (value instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) value;
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (!first) sb.append(',');
                first = false;
                sb.append('"').append(jsonEscape(String.valueOf(entry.getKey()))).append('"').append(':');
                sb.append(toJsonValue(entry.getValue()));
            }
            sb.append('}');
            return sb.toString();
        }

        return "\"" + jsonEscape(String.valueOf(value)) + "\"";
    }

    public static void main(String[] args) {
        String functionName = System.getenv("ALGOVERSE_FUNCTION_NAME");
        if (functionName == null || functionName.trim().isEmpty()) {
            System.err.println("ALGOVERSE_FUNCTION_NAME not set");
            System.exit(1);
        }

        List<String> paramNames = parseParamNames(System.getenv("ALGOVERSE_PARAM_NAMES"));

        try (Scanner scanner = new Scanner(System.in)) {
            scanner.useDelimiter("\\A");
            String inputRaw = scanner.hasNext() ? scanner.next() : "[]";

            Object parsedBatch = new JsonReader(inputRaw).parse();
            List<?> batchInputs = parsedBatch instanceof List ? (List<?>) parsedBatch : new ArrayList<>();

            Class<?> solutionClass = Class.forName("Solution");
            Object solutionInstance = solutionClass.getDeclaredConstructor().newInstance();
            Method method = resolveMethod(solutionClass, functionName, paramNames.size());

            if (method == null) {
                System.err.println("Method '" + functionName + "' not found in Solution class.");
                System.exit(1);
            }

            Class<?>[] parameterTypes = method.getParameterTypes();

            PrintStream originalOut = System.out;
            originalOut.print("[");

            for (int i = 0; i < batchInputs.size(); i++) {
                if (i > 0) originalOut.print(",");

                String out = "";
                String err = "";
                String printedOutput = "";
                boolean returnMissing = false;

                ByteArrayOutputStream caseStdoutBuffer = new ByteArrayOutputStream();
                PrintStream caseStdout = new PrintStream(caseStdoutBuffer);

                Runtime runtimeRef = Runtime.getRuntime();
                long beforeMemory = runtimeRef.totalMemory() - runtimeRef.freeMemory();
                long start = System.nanoTime();

                try {
                    Object inputValue = batchInputs.get(i);
                    Object[] invokeArgs = new Object[parameterTypes.length];

                    for (int argIndex = 0; argIndex < parameterTypes.length; argIndex++) {
                        Object rawArg = getRawArg(inputValue, paramNames, argIndex);
                        invokeArgs[argIndex] = convertToType(rawArg, parameterTypes[argIndex]);
                    }

                    System.setOut(caseStdout);
                    Object result = method.invoke(solutionInstance, invokeArgs);
                    returnMissing = result == null;
                    if (!returnMissing) {
                        out = toOutputString(result);
                    }
                } catch (Exception e) {
                    Throwable cause = e.getCause() != null ? e.getCause() : e;
                    err = cause.toString();
                } finally {
                    caseStdout.flush();
                    System.setOut(originalOut);
                    printedOutput = caseStdoutBuffer.toString().trim();
                    caseStdout.close();
                }

                long end = System.nanoTime();
                double timeMs = (end - start) / 1e6;
                long afterMemory = runtimeRef.totalMemory() - runtimeRef.freeMemory();
                double memoryMb = Math.max(beforeMemory, afterMemory) / (1024.0 * 1024.0);

                if (err.isEmpty()) {
                    if (!printedOutput.isEmpty()) {
                        err = "Use return statement for final answer. Printed output is shown below.";
                        out = "";
                    } else if (returnMissing) {
                        err = "Function must return output using return statement.";
                    }
                }

                originalOut.print("{\"stdout\":\"" + jsonEscape(out) + "\",");
                originalOut.print("\"stderr\":\"" + jsonEscape(err) + "\",");
                originalOut.print("\"printedOutput\":\"" + jsonEscape(printedOutput) + "\",");
                originalOut.print("\"returnMissing\":" + (returnMissing ? "true" : "false") + ",");
                originalOut.print("\"time\":" + String.format(Locale.US, "%.3f", timeMs) + ",");
                originalOut.print("\"memory\":" + String.format(Locale.US, "%.3f", memoryMb) + "}");
            }

            originalOut.print("]");
        } catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}
