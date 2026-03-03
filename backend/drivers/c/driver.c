#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <ctype.h>
#ifdef __linux__
#include <unistd.h>
#endif
#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#endif

#ifdef _WIN32
#include <io.h>
#define DUP _dup
#define DUP2 _dup2
#define CLOSE _close
#define FILENO _fileno
#else
#define DUP dup
#define DUP2 dup2
#define CLOSE close
#define FILENO fileno
#endif

#ifndef FUNC_NAME
#error "FUNC_NAME macro must be defined"
#endif

extern char* FUNC_NAME(char* input);

static char* dup_string(const char* s) {
    size_t len = s ? strlen(s) : 0;
    char* out = (char*)malloc(len + 1);
    if (!out) return NULL;
    if (len > 0) memcpy(out, s, len);
    out[len] = '\0';
    return out;
}

static char* read_all_stdin(void) {
    size_t cap = 4096;
    size_t len = 0;
    char* input = (char*)malloc(cap);
    if (!input) return NULL;
    input[0] = '\0';

    char buf[1024];
    while (fgets(buf, sizeof(buf), stdin)) {
        size_t l = strlen(buf);
        if (len + l + 1 >= cap) {
            cap *= 2;
            char* next = (char*)realloc(input, cap);
            if (!next) {
                free(input);
                return NULL;
            }
            input = next;
        }
        memcpy(input + len, buf, l);
        len += l;
        input[len] = '\0';
    }
    return input;
}

static void json_escape_print(const char* s) {
    if (!s) return;
    while (*s) {
        char c = *s++;
        if (c == '"') printf("\\\"");
        else if (c == '\\') printf("\\\\");
        else if (c == '\n') printf("\\n");
        else if (c == '\t') printf("\\t");
        else if (c == '\r') printf("\\r");
        else putchar(c);
    }
}

static char* read_stream_to_string(FILE* fp) {
    if (!fp) return dup_string("");
    if (fseek(fp, 0, SEEK_END) != 0) return dup_string("");
    long size = ftell(fp);
    if (size < 0) return dup_string("");
    rewind(fp);

    char* data = (char*)malloc((size_t)size + 1);
    if (!data) return dup_string("");
    size_t read = fread(data, 1, (size_t)size, fp);
    data[read] = '\0';
    return data;
}

static char* dup_range_trimmed(const char* start, const char* endExclusive) {
    if (!start || !endExclusive || endExclusive < start) return dup_string("");

    while (start < endExclusive && isspace((unsigned char)*start)) start++;
    while (endExclusive > start && isspace((unsigned char)*(endExclusive - 1))) endExclusive--;

    size_t len = (size_t)(endExclusive - start);
    char* out = (char*)malloc(len + 1);
    if (!out) return NULL;
    if (len > 0) memcpy(out, start, len);
    out[len] = '\0';
    return out;
}

static char* decode_json_string_literal(const char* token) {
    if (!token) return dup_string("");
    size_t len = strlen(token);
    if (len < 2 || token[0] != '"' || token[len - 1] != '"') {
        return dup_string(token);
    }

    size_t cap = len + 1;
    char* out = (char*)malloc(cap);
    if (!out) return NULL;

    size_t w = 0;
    int escape = 0;
    for (size_t i = 1; i + 1 < len; i++) {
        char c = token[i];
        if (escape) {
            if (c == 'n') c = '\n';
            else if (c == 't') c = '\t';
            else if (c == 'r') c = '\r';
            else if (c == 'b') c = '\b';
            else if (c == 'f') c = '\f';
            else if (c == 'u') c = '?';

            out[w++] = c;
            escape = 0;
            continue;
        }

        if (c == '\\') {
            escape = 1;
            continue;
        }

        out[w++] = c;
    }

    out[w] = '\0';
    return out;
}

static int add_parsed_item(char*** items, int* count, int* capacity, const char* start, const char* endExclusive) {
    char* token = dup_range_trimmed(start, endExclusive);
    if (!token) return 0;

    char* normalized = decode_json_string_literal(token);
    free(token);
    if (!normalized) return 0;

    if (*count >= *capacity) {
        int nextCap = (*capacity <= 0) ? 8 : (*capacity * 2);
        char** nextItems = (char**)realloc(*items, sizeof(char*) * (size_t)nextCap);
        if (!nextItems) {
            free(normalized);
            return 0;
        }
        *items = nextItems;
        *capacity = nextCap;
    }

    (*items)[*count] = normalized;
    (*count)++;
    return 1;
}

static int parse_json_batch_items(const char* json, char*** outItems, int* outCount) {
    *outItems = NULL;
    *outCount = 0;
    if (!json) return 0;

    const char* p = json;
    while (*p && *p != '[') p++;
    if (*p != '[') return 0;
    p++;

    int capacity = 8;
    char** items = (char**)malloc(sizeof(char*) * (size_t)capacity);
    if (!items) return 0;

    int count = 0;
    int depth = 0;
    int inString = 0;
    int escape = 0;
    const char* tokenStart = NULL;
    int closed = 0;

    for (; *p; p++) {
        char c = *p;

        if (!tokenStart) {
            if (isspace((unsigned char)c) || c == ',') continue;
            if (c == ']') {
                closed = 1;
                break;
            }
            tokenStart = p;
        }

        if (inString) {
            if (escape) {
                escape = 0;
            } else if (c == '\\') {
                escape = 1;
            } else if (c == '"') {
                inString = 0;
            }
            continue;
        }

        if (c == '"') {
            inString = 1;
            continue;
        }

        if (c == '[' || c == '{') {
            depth++;
            continue;
        }

        if (c == ']' || c == '}') {
            if (depth > 0) {
                depth--;
                continue;
            }
        }

        if (depth == 0 && (c == ',' || c == ']')) {
            if (!add_parsed_item(&items, &count, &capacity, tokenStart, p)) {
                for (int i = 0; i < count; i++) free(items[i]);
                free(items);
                return 0;
            }
            tokenStart = NULL;

            if (c == ']') {
                closed = 1;
                break;
            }
        }
    }

    if (!closed) {
        if (tokenStart) {
            const char* end = p;
            if (!add_parsed_item(&items, &count, &capacity, tokenStart, end)) {
                for (int i = 0; i < count; i++) free(items[i]);
                free(items);
                return 0;
            }
        } else {
            for (int i = 0; i < count; i++) free(items[i]);
            free(items);
            return 0;
        }
    }

    *outItems = items;
    *outCount = count;
    return 1;
}

static double current_memory_mb(void) {
#ifdef __linux__
    FILE* f = fopen("/proc/self/statm", "r");
    if (!f) return 0.0;
    long size = 0;
    long resident = 0;
    if (fscanf(f, "%ld %ld", &size, &resident) != 2) {
        fclose(f);
        return 0.0;
    }
    fclose(f);

    long pageSize = sysconf(_SC_PAGESIZE);
    if (pageSize <= 0) return 0.0;
    return (resident * (double)pageSize) / (1024.0 * 1024.0);
#endif
#ifdef _WIN32
    PROCESS_MEMORY_COUNTERS_EX counters;
    if (GetProcessMemoryInfo(
        GetCurrentProcess(),
        (PROCESS_MEMORY_COUNTERS*)&counters,
        sizeof(counters)
    )) {
        return (double)counters.WorkingSetSize / (1024.0 * 1024.0);
    }
#endif
    return 0.0;
}

int main(void) {
    char* rawInput = read_all_stdin();
    if (!rawInput) return 1;

    char** inputs = NULL;
    int count = 0;
    if (!parse_json_batch_items(rawInput, &inputs, &count)) {
        free(rawInput);
        printf("[]");
        return 0;
    }
    free(rawInput);

    printf("[");
    for (int i = 0; i < count; i++) {
        if (i > 0) printf(",");

        char* out = dup_string("");
        char* err = dup_string("");
        char* printedOutput = dup_string("");
        int returnMissing = 0;
        double beforeMemory = current_memory_mb();

        FILE* captureFile = tmpfile();
        int originalStdoutFd = -1;
        if (captureFile) {
            fflush(stdout);
            originalStdoutFd = DUP(FILENO(stdout));
            if (originalStdoutFd != -1) {
                DUP2(FILENO(captureFile), FILENO(stdout));
            }
        }

        clock_t start = clock();
        char* result = FUNC_NAME(inputs[i]);
        clock_t end = clock();
        double afterMemory = current_memory_mb();
        double memoryMb = beforeMemory > afterMemory ? beforeMemory : afterMemory;

        if (captureFile) {
            fflush(stdout);
            if (originalStdoutFd != -1) {
                DUP2(originalStdoutFd, FILENO(stdout));
                CLOSE(originalStdoutFd);
            }
            free(printedOutput);
            printedOutput = read_stream_to_string(captureFile);
            fclose(captureFile);
        }

        if (result) {
            free(out);
            out = dup_string(result);
        } else {
            returnMissing = 1;
        }

        if (printedOutput && printedOutput[0] != '\0') {
            free(err);
            err = dup_string("Use return statement for final answer. Printed output is shown below.");
            free(out);
            out = dup_string("");
        } else if (returnMissing) {
            free(err);
            err = dup_string("Function must return output using return statement.");
        }

        double elapsedMs = ((double)(end - start) * 1000.0) / CLOCKS_PER_SEC;

        printf("{\"stdout\":\"");
        json_escape_print(out ? out : "");
        printf("\",\"stderr\":\"");
        json_escape_print(err ? err : "");
        printf("\",\"printedOutput\":\"");
        json_escape_print(printedOutput ? printedOutput : "");
        printf("\",\"returnMissing\":%s", returnMissing ? "true" : "false");
        printf(",\"time\":%.3f,\"memory\":%.3f}", elapsedMs, memoryMb);

        free(out);
        free(err);
        free(printedOutput);
    }
    printf("]");

    for (int i = 0; i < count; i++) free(inputs[i]);
    free(inputs);
    return 0;
}
