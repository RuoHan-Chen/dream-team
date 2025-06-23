import * as process from 'node:process';
import { AsyncLocalStorage as BuiltinAsyncLocalStorage } from 'node:async_hooks';
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
export const ReadableStream = globalThis.ReadableStream;
export const ReadableStreamController = globalThis.ReadableStreamDefaultController;
export const TransformStream = globalThis.TransformStream;
export class AsyncLocalStorage extends BuiltinAsyncLocalStorage {
    enterWith(context) {
        // Cloudflare workers does not support enterWith, so we need to use run instead
        super.run(context, () => { });
    }
}
export function isBrowserEnvironment() {
    return false;
}
export function isTracingLoopRunningByDefault() {
    // Cloudflare workers does not support triggering things like setTimeout outside of the
    // request context. So we don't run the trace export loop by default.
    return false;
}
export { MCPServerStdio, MCPServerStreamableHttp } from "./mcp-server/browser.js";
export { clearTimeout, setTimeout } from 'node:timers';
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
//# sourceMappingURL=shims-workerd.js.map