#include <algorithm>
#include <chrono>
#include <cctype>
#include <cstring>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <tuple>
#include <type_traits>
#include <unordered_map>
#include <utility>
#include <vector>
#ifdef __linux__
#include <unistd.h>
#endif
#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#endif

#ifndef FUNC_NAME
#define FUNC_NAME solve
#endif

#include "solution.cpp"

struct JsonValue {
    enum class Type { Null, Bool, Number, String, Array, Object } type = Type::Null;
    bool boolValue = false;
    double numberValue = 0.0;
    std::string stringValue;
    std::vector<JsonValue> arrayValue;
    std::unordered_map<std::string, JsonValue> objectValue;
};

class JsonParser {
public:
    explicit JsonParser(const std::string& src) : src_(src), index_(0) {}

    JsonValue parse() {
        skipWhitespace();
        JsonValue value = parseValue();
        skipWhitespace();
        return value;
    }

private:
    const std::string& src_;
    size_t index_;

    JsonValue parseValue() {
        skipWhitespace();
        if (index_ >= src_.size()) return JsonValue{};

        char ch = src_[index_];
        if (ch == '"') return parseStringValue();
        if (ch == '{') return parseObjectValue();
        if (ch == '[') return parseArrayValue();
        if (matchKeyword("true")) {
            JsonValue v;
            v.type = JsonValue::Type::Bool;
            v.boolValue = true;
            return v;
        }
        if (matchKeyword("false")) {
            JsonValue v;
            v.type = JsonValue::Type::Bool;
            v.boolValue = false;
            return v;
        }
        if (matchKeyword("null")) {
            JsonValue v;
            v.type = JsonValue::Type::Null;
            return v;
        }
        return parseNumberValue();
    }

    JsonValue parseObjectValue() {
        JsonValue value;
        value.type = JsonValue::Type::Object;
        consume('{');
        skipWhitespace();
        if (peek('}')) {
            consume('}');
            return value;
        }

        while (index_ < src_.size()) {
            std::string key = parseString();
            skipWhitespace();
            consume(':');
            JsonValue item = parseValue();
            value.objectValue[key] = item;
            skipWhitespace();
            if (peek('}')) {
                consume('}');
                break;
            }
            consume(',');
        }

        return value;
    }

    JsonValue parseArrayValue() {
        JsonValue value;
        value.type = JsonValue::Type::Array;
        consume('[');
        skipWhitespace();
        if (peek(']')) {
            consume(']');
            return value;
        }

        while (index_ < src_.size()) {
            value.arrayValue.push_back(parseValue());
            skipWhitespace();
            if (peek(']')) {
                consume(']');
                break;
            }
            consume(',');
        }

        return value;
    }

    JsonValue parseStringValue() {
        JsonValue value;
        value.type = JsonValue::Type::String;
        value.stringValue = parseString();
        return value;
    }

    std::string parseString() {
        std::string out;
        consume('"');

        while (index_ < src_.size()) {
            char ch = src_[index_++];
            if (ch == '"') break;
            if (ch == '\\' && index_ < src_.size()) {
                char esc = src_[index_++];
                switch (esc) {
                    case '"': out.push_back('"'); break;
                    case '\\': out.push_back('\\'); break;
                    case '/': out.push_back('/'); break;
                    case 'b': out.push_back('\b'); break;
                    case 'f': out.push_back('\f'); break;
                    case 'n': out.push_back('\n'); break;
                    case 'r': out.push_back('\r'); break;
                    case 't': out.push_back('\t'); break;
                    case 'u': {
                        if (index_ + 4 <= src_.size()) {
                            std::string hex = src_.substr(index_, 4);
                            index_ += 4;
                            try {
                                int code = std::stoi(hex, nullptr, 16);
                                out.push_back(static_cast<char>(code));
                            } catch (...) {
                                out.push_back('?');
                            }
                        }
                        break;
                    }
                    default:
                        out.push_back(esc);
                        break;
                }
            } else {
                out.push_back(ch);
            }
        }

        return out;
    }

    JsonValue parseNumberValue() {
        JsonValue value;
        value.type = JsonValue::Type::Number;

        size_t start = index_;
        if (peek('-')) index_++;
        while (index_ < src_.size() && std::isdigit(static_cast<unsigned char>(src_[index_]))) index_++;

        if (peek('.')) {
            index_++;
            while (index_ < src_.size() && std::isdigit(static_cast<unsigned char>(src_[index_]))) index_++;
        }

        if (peek('e') || peek('E')) {
            index_++;
            if (peek('+') || peek('-')) index_++;
            while (index_ < src_.size() && std::isdigit(static_cast<unsigned char>(src_[index_]))) index_++;
        }

        std::string raw = src_.substr(start, index_ - start);
        if (raw.empty()) {
            value.numberValue = 0.0;
            return value;
        }

        try {
            value.numberValue = std::stod(raw);
        } catch (...) {
            value.numberValue = 0.0;
        }

        return value;
    }

    bool matchKeyword(const char* keyword) {
        size_t len = std::strlen(keyword);
        if (index_ + len > src_.size()) return false;
        if (src_.compare(index_, len, keyword) != 0) return false;
        index_ += len;
        return true;
    }

    bool peek(char ch) const {
        return index_ < src_.size() && src_[index_] == ch;
    }

    void consume(char ch) {
        if (peek(ch)) index_++;
    }

    void skipWhitespace() {
        while (index_ < src_.size()) {
            char ch = src_[index_];
            if (ch == ' ' || ch == '\n' || ch == '\r' || ch == '\t') {
                index_++;
            } else {
                break;
            }
        }
    }
};

std::string json_escape(const std::string& s) {
    std::string res;
    for (char c : s) {
        if (c == '"') res += "\\\"";
        else if (c == '\\') res += "\\\\";
        else if (c == '\n') res += "\\n";
        else if (c == '\t') res += "\\t";
        else if (c == '\r') res += "\\r";
        else res += c;
    }
    return res;
}

double current_memory_mb() {
#ifdef __linux__
    std::ifstream statm("/proc/self/statm");
    long size = 0;
    long resident = 0;
    if (statm >> size >> resident) {
        long pageSize = sysconf(_SC_PAGESIZE);
        if (pageSize > 0) {
            return (resident * static_cast<double>(pageSize)) / (1024.0 * 1024.0);
        }
    }
#endif
#ifdef _WIN32
    PROCESS_MEMORY_COUNTERS_EX counters;
    if (GetProcessMemoryInfo(
        GetCurrentProcess(),
        reinterpret_cast<PROCESS_MEMORY_COUNTERS*>(&counters),
        sizeof(counters)
    )) {
        return static_cast<double>(counters.WorkingSetSize) / (1024.0 * 1024.0);
    }
#endif
    return 0.0;
}

std::vector<std::string> parse_param_names() {
    std::vector<std::string> names;
    const char* raw = std::getenv("ALGOVERSE_PARAM_NAMES");
    if (!raw) return names;

    try {
        JsonValue parsed = JsonParser(raw).parse();
        if (parsed.type != JsonValue::Type::Array) return names;
        for (const JsonValue& item : parsed.arrayValue) {
            if (item.type == JsonValue::Type::String && !item.stringValue.empty()) {
                names.push_back(item.stringValue);
            }
        }
    } catch (...) {
        // Leave names empty.
    }

    return names;
}

const JsonValue* pick_arg_value(const JsonValue& input, const std::vector<std::string>& paramNames, size_t index) {
    if (input.type == JsonValue::Type::Object && index < paramNames.size()) {
        auto it = input.objectValue.find(paramNames[index]);
        if (it != input.objectValue.end()) return &it->second;
    }

    if (input.type == JsonValue::Type::Array && index < input.arrayValue.size()) {
        return &input.arrayValue[index];
    }

    if (index == 0) {
        return &input;
    }

    return nullptr;
}

template <typename T>
struct is_vector : std::false_type {};

template <typename T, typename Alloc>
struct is_vector<std::vector<T, Alloc>> : std::true_type {};

template <typename T>
T convert_json(const JsonValue& value);

template <typename T>
std::enable_if_t<std::is_same_v<T, std::string>, T> convert_scalar_json(const JsonValue& value) {
    if (value.type == JsonValue::Type::String) return value.stringValue;
    if (value.type == JsonValue::Type::Number) {
        std::ostringstream oss;
        oss << std::setprecision(15) << value.numberValue;
        return oss.str();
    }
    if (value.type == JsonValue::Type::Bool) return value.boolValue ? "true" : "false";
    return "";
}

template <typename T>
std::enable_if_t<std::is_same_v<T, char>, T> convert_scalar_json(const JsonValue& value) {
    std::string text = convert_scalar_json<std::string>(value);
    return text.empty() ? '\0' : text[0];
}

template <typename T>
std::enable_if_t<std::is_same_v<T, bool>, T> convert_scalar_json(const JsonValue& value) {
    if (value.type == JsonValue::Type::Bool) return value.boolValue;
    if (value.type == JsonValue::Type::Number) return value.numberValue != 0.0;
    if (value.type == JsonValue::Type::String) return value.stringValue == "true";
    return false;
}

template <typename T>
std::enable_if_t<std::is_arithmetic_v<T> && !std::is_same_v<T, bool> && !std::is_same_v<T, char>, T>
convert_scalar_json(const JsonValue& value) {
    double num = 0.0;
    if (value.type == JsonValue::Type::Number) {
        num = value.numberValue;
    } else if (value.type == JsonValue::Type::Bool) {
        num = value.boolValue ? 1.0 : 0.0;
    } else if (value.type == JsonValue::Type::String) {
        try {
            num = std::stod(value.stringValue);
        } catch (...) {
            num = 0.0;
        }
    }
    return static_cast<T>(num);
}

template <typename T>
T convert_json(const JsonValue& value) {
    if constexpr (is_vector<T>::value) {
        using Inner = typename T::value_type;
        if (value.type != JsonValue::Type::Array) {
            throw std::runtime_error("Expected array input for vector argument.");
        }

        T out;
        out.reserve(value.arrayValue.size());
        for (const JsonValue& item : value.arrayValue) {
            out.push_back(convert_json<Inner>(item));
        }
        return out;
    } else {
        return convert_scalar_json<T>(value);
    }
}

template <typename T>
std::string stringify_value(const T& value);

template <typename T>
std::string stringify_scalar(const T& value) {
    if constexpr (std::is_same_v<T, std::string>) {
        return "\"" + json_escape(value) + "\"";
    } else if constexpr (std::is_same_v<T, char*>) {
        return value == nullptr ? "\"\"" : ("\"" + json_escape(std::string(value)) + "\"");
    } else if constexpr (std::is_same_v<T, const char*>) {
        return value == nullptr ? "\"\"" : ("\"" + json_escape(std::string(value)) + "\"");
    } else if constexpr (std::is_same_v<T, char>) {
        return "\"" + json_escape(std::string(1, value)) + "\"";
    } else if constexpr (std::is_same_v<T, bool>) {
        return value ? "true" : "false";
    } else {
        std::ostringstream oss;
        oss << value;
        return oss.str();
    }
}

template <typename T>
std::string stringify_value(const T& value) {
    if constexpr (is_vector<T>::value) {
        std::ostringstream oss;
        oss << "[";
        for (size_t i = 0; i < value.size(); i++) {
            if (i > 0) oss << ",";
            oss << stringify_value(value[i]);
        }
        oss << "]";
        return oss.str();
    } else {
        return stringify_scalar(value);
    }
}

template <typename MethodPtr>
struct method_traits;

template <typename C, typename R, typename... Args>
struct method_traits<R(C::*)(Args...)> {
    using return_type = R;
    using args_tuple = std::tuple<Args...>;
    static constexpr size_t arity = sizeof...(Args);
};

template <typename C, typename R, typename... Args>
struct method_traits<R(C::*)(Args...) const> {
    using return_type = R;
    using args_tuple = std::tuple<Args...>;
    static constexpr size_t arity = sizeof...(Args);
};

template <size_t Index, typename ArgsTuple>
auto parse_arg_at(const JsonValue& input, const std::vector<std::string>& paramNames) {
    using raw_arg_type = std::tuple_element_t<Index, ArgsTuple>;
    using arg_type = std::decay_t<raw_arg_type>;

    const JsonValue* picked = pick_arg_value(input, paramNames, Index);
    if (!picked) {
        throw std::runtime_error("Missing input argument at index " + std::to_string(Index) + ".");
    }

    return convert_json<arg_type>(*picked);
}

template <typename MethodPtr, size_t... Is>
auto invoke_with_parsed_args_impl(
    Solution& solver,
    MethodPtr method,
    const JsonValue& input,
    const std::vector<std::string>& paramNames,
    std::index_sequence<Is...>
) {
    using traits = method_traits<MethodPtr>;
    using args_tuple = typename traits::args_tuple;
    return (solver.*method)(parse_arg_at<Is, args_tuple>(input, paramNames)...);
}

template <typename MethodPtr>
auto invoke_with_parsed_args(
    Solution& solver,
    MethodPtr method,
    const JsonValue& input,
    const std::vector<std::string>& paramNames
) {
    using traits = method_traits<MethodPtr>;
    return invoke_with_parsed_args_impl(
        solver,
        method,
        input,
        paramNames,
        std::make_index_sequence<traits::arity>{}
    );
}

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::stringstream buffer;
    buffer << std::cin.rdbuf();
    std::string inputRaw = buffer.str();

    JsonValue parsedBatch;
    try {
        parsedBatch = JsonParser(inputRaw).parse();
    } catch (...) {
        parsedBatch.type = JsonValue::Type::Array;
    }

    if (parsedBatch.type != JsonValue::Type::Array) {
        std::cout << "[]";
        return 0;
    }

    std::vector<std::string> paramNames = parse_param_names();
    Solution solver;
    auto method = &Solution::FUNC_NAME;
    using traits = method_traits<decltype(method)>;
    using return_type = typename traits::return_type;

    std::cout << "[";
    for (size_t i = 0; i < parsedBatch.arrayValue.size(); ++i) {
        if (i > 0) std::cout << ",";

        auto start = std::chrono::high_resolution_clock::now();
        double beforeMemory = current_memory_mb();
        std::string out;
        std::string err;
        std::string printedOutput;
        bool returnMissing = false;

        std::ostringstream capturedCout;
        std::streambuf* originalCoutBuf = std::cout.rdbuf(capturedCout.rdbuf());

        try {
            if constexpr (std::is_void_v<return_type>) {
                invoke_with_parsed_args(solver, method, parsedBatch.arrayValue[i], paramNames);
                returnMissing = true;
            } else {
                return_type result = invoke_with_parsed_args(solver, method, parsedBatch.arrayValue[i], paramNames);
                out = stringify_value(result);
            }
        } catch (const std::exception& ex) {
            err = ex.what();
        } catch (...) {
            err = "Runtime Error";
        }

        std::cout.rdbuf(originalCoutBuf);
        printedOutput = capturedCout.str();

        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> elapsed = end - start;
        double afterMemory = current_memory_mb();
        double memoryMb = std::max(beforeMemory, afterMemory);

        if (err.empty()) {
            if (!printedOutput.empty()) {
                err = "Use return statement for final answer. Printed output is shown below.";
                out.clear();
            } else if (returnMissing) {
                err = "Function must return output using return statement.";
            }
        }

        std::cout << "{\"stdout\":\"" << json_escape(out) << "\",";
        std::cout << "\"stderr\":\"" << json_escape(err) << "\",";
        std::cout << "\"printedOutput\":\"" << json_escape(printedOutput) << "\",";
        std::cout << "\"returnMissing\":" << (returnMissing ? "true" : "false") << ",";
        std::cout << "\"time\":" << std::fixed << std::setprecision(3) << elapsed.count() << ",";
        std::cout << "\"memory\":" << std::fixed << std::setprecision(3) << memoryMb << "}";
    }

    std::cout << "]" << std::endl;
    return 0;
}
