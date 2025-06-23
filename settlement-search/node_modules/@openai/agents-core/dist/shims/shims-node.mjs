import * as process from 'node:process';
export { EventEmitter as RuntimeEventEmitter } from 'node:events';
// Use function instead of exporting the value to prevent
// circular dependency resolution issues caused by other exports in '@openai/agents-core/_shims'
export function loadEnv() {
    if (typeof process === 'undefined' || typeof process.env === 'undefined') {
        if (typeof import.meta === 'object' &&
            typeof import.meta.env === 'object') {
            return import.meta.env;
        }
        return {};
    }
    return process.env;
}
export { randomUUID } from 'node:crypto';
export { Readable } from 'node:stream';
export { ReadableStream, TransformStream, } from 'node:stream/web';
export { AsyncLocalStorage } from 'node:async_hooks';
export function isTracingLoopRunningByDefault() {
    return true;
}
export function isBrowserEnvironment() {
    return false;
}
export { NodeMCPServerStdio as MCPServerStdio, NodeMCPServerStreamableHttp as MCPServerStreamableHttp, } from "./mcp-server/node.mjs";
export { clearTimeout } from 'node:timers';
class NodeTimer {
    constructor() { }
    setTimeout(callback, ms) {
        return setTimeout(callback, ms);
    }
    clearTimeout(timeoutId) {
        clearTimeout(timeoutId);
    }
}
const timer = new NodeTimer();
export { timer };
//# sourceMappingURL=shims-node.mjs.map