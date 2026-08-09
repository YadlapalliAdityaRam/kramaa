import { algorithmList } from '../src/data/algorithmsData.js';

const baseUrl = process.env.VISUALIZER_BASE_URL || 'http://127.0.0.1:5173';
const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9222';
const navigationDelay = Number(process.env.VISUALIZER_AUDIT_DELAY || 1400);
const requestTimeout = Number(process.env.VISUALIZER_AUDIT_TIMEOUT || 8000);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const createTarget = async (url) => {
    const response = await fetch(`${cdpUrl}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    if (!response.ok) {
        throw new Error(`Could not create a Chrome target: ${response.status} ${response.statusText}`);
    }
    return response.json();
};

const closeTarget = async (targetId) => {
    if (!targetId) return;
    await fetch(`${cdpUrl}/json/close/${targetId}`).catch(() => undefined);
};

class CdpClient {
    constructor(url) {
        this.socket = new WebSocket(url);
        this.nextId = 1;
        this.pending = new Map();
        this.events = [];

        this.socket.addEventListener('message', (event) => {
            const payload = JSON.parse(event.data);
            if (payload.id) {
                const request = this.pending.get(payload.id);
                if (!request) return;
                this.pending.delete(payload.id);
                if (payload.error) request.reject(new Error(payload.error.message));
                else request.resolve(payload.result);
                return;
            }
            this.events.push(payload);
        });
    }

    async connect() {
        if (this.socket.readyState === WebSocket.OPEN) return;
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timed out connecting to Chrome DevTools.')), requestTimeout);
            this.socket.addEventListener('open', resolve, { once: true });
            this.socket.addEventListener('error', () => reject(new Error('Could not connect to Chrome DevTools.')), { once: true });
            this.socket.addEventListener('open', () => clearTimeout(timeout), { once: true });
            this.socket.addEventListener('error', () => clearTimeout(timeout), { once: true });
        });
    }

    send(method, params = {}) {
        const id = this.nextId;
        this.nextId += 1;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`Timed out waiting for ${method}.`));
            }, requestTimeout);
            this.pending.set(id, { resolve, reject });
            this.socket.send(JSON.stringify({ id, method, params }));
            const pending = this.pending.get(id);
            this.pending.set(id, {
                ...pending,
                resolve: (result) => {
                    clearTimeout(timeout);
                    resolve(result);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
        });
    }

    async evaluate(expression) {
        const result = await this.send('Runtime.evaluate', {
            expression,
            awaitPromise: true,
            returnByValue: true
        });
        if (result.exceptionDetails) {
            throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed.');
        }
        return result.result.value;
    }

    close() {
        this.socket.close();
    }
}

const inspectPage = `(() => {
    const visible = (element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 2 && rect.height > 2;
    };
    const representativeSelectors = [
        'svg', 'canvas', '.array-bar', '.grid-cell', '.dp-cell', '.bit-cell',
        '.activity-bar', '.string-match-cell', '.visualizer-node', '.tree-node',
        '.graph-node', '.node-circle', '.cell'
    ];
    const representativeCount = representativeSelectors.reduce(
        (count, selector) => count + Array.from(document.querySelectorAll(selector)).filter(visible).length,
        0
    );
    const stage = document.querySelector('.visualizer-canvas, .visualizer-container, .visualizer-ui, main');
    const stageRect = stage?.getBoundingClientRect();
    return {
        title: document.title,
        bodyText: document.body.innerText.slice(0, 500),
        hasAppError: Boolean(document.querySelector('[data-testid="app-error-boundary"]')),
        hasVisualizer: Boolean(document.querySelector('.visualizer-ui, [class*="visualizer"]')),
        representativeCount,
        stageWidth: Math.round(stageRect?.width || 0),
        stageHeight: Math.round(stageRect?.height || 0)
    };
})()`;

const auditRoute = async (path) => {
    const target = await createTarget(`${baseUrl}${path}`);
    const client = new CdpClient(target.webSocketDebuggerUrl);
    try {
        await client.connect();
        await client.send('Runtime.enable');
        await client.send('Page.enable');
        await wait(navigationDelay);
        const snapshot = await client.evaluate(inspectPage);
        const runtimeErrors = client.events
            .filter((event) => event.method === 'Runtime.exceptionThrown')
            .map((event) => event.params.exceptionDetails.text || 'Uncaught runtime error');
        const consoleErrors = client.events
            .filter((event) => event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error')
            .map((event) => event.params.args.map((argument) => argument.value || argument.description || '').join(' '));

        return {
            path,
            ...snapshot,
            errors: [...runtimeErrors, ...consoleErrors].filter(Boolean)
        };
    } finally {
        client.close();
        await closeTarget(target.id);
    }
};

const routes = [...new Set(algorithmList.map((algorithm) => algorithm.path))];
const reports = [];
for (const path of routes) {
    try {
        const report = await auditRoute(path);
        reports.push(report);
        const status = report.errors.length || !report.hasVisualizer || report.representativeCount === 0 ? 'FAIL' : 'PASS';
        console.log(`${status} ${path} | visual=${report.representativeCount} | errors=${report.errors.length}`);
    } catch (error) {
        const report = { path, representativeCount: 0, hasVisualizer: false, errors: [error.message] };
        reports.push(report);
        console.log(`FAIL ${path} | visual=0 | errors=1`);
        console.log(`  ${error.message}`);
    }
}

const failures = reports.filter((report) => (
    report.errors.length > 0 || !report.hasVisualizer || report.representativeCount === 0
));

for (const report of failures) {
    report.errors.forEach((error) => console.log(`  ${error}`));
}

if (failures.length) {
    console.error(`Visualizer audit failed: ${failures.length}/${reports.length} routes need attention.`);
    process.exit(1);
}

console.log(`Visualizer audit passed: ${reports.length} routes rendered a visible representation without runtime errors.`);
