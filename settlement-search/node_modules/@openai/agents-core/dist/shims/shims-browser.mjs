/// <reference lib="dom" />
// Use function instead of exporting the value to prevent
// circular dependency resolution issues caused by other exports in '@openai/agents-core/_shims'
export function loadEnv() {
    return {};
}
export class BrowserEventEmitter {
    #target = new EventTarget();
    on(type, listener) {
        this.#target.addEventListener(type, ((event) => listener(...(event.detail ?? []))));
        return this;
    }
    off(type, listener) {
        this.#target.removeEventListener(type, ((event) => listener(...(event.detail ?? []))));
        return this;
    }
    emit(type, ...args) {
        const event = new CustomEvent(type, { detail: args });
        return this.#target.dispatchEvent(event);
    }
    once(type, listener) {
        const handler = (...args) => {
            this.off(type, handler);
            listener(...args);
        };
        this.on(type, handler);
        return this;
    }
}
export { BrowserEventEmitter as RuntimeEventEmitter };
export const randomUUID = crypto.randomUUID.bind(crypto);
export const Readable = class Readable {
    constructor() { }
    pipeTo(_destination, _options) { }
    pipeThrough(_transform, _options) { }
};
export const ReadableStream = globalThis.ReadableStream;
export const ReadableStreamController = globalThis.ReadableStreamDefaultController;
export const TransformStream = globalThis.TransformStream;
export class AsyncLocalStorage {
    context = null;
    constructor() { }
    run(context, fn) {
        this.context = context;
        return fn();
    }
    getStore() {
        return this.context;
    }
    enterWith(context) {
        this.context = context;
    }
}
export function isBrowserEnvironment() {
    return true;
}
export function isTracingLoopRunningByDefault() {
    return false;
}
export { MCPServerStdio, MCPServerStreamableHttp } from "./mcp-server/browser.mjs";
class BrowserTimer {
    constructor() { }
    setTimeout(callback, ms) {
        const timeout = setTimeout(callback, ms);
        timeout.ref =
            typeof timeout.ref === 'function' ? timeout.ref : () => timeout;
        timeout.unref =
            typeof timeout.unref === 'function' ? timeout.unref : () => timeout;
        timeout.hasRef =
            typeof timeout.hasRef === 'function' ? timeout.hasRef : () => true;
        timeout.refresh =
            typeof timeout.refresh === 'function' ? timeout.refresh : () => timeout;
        return timeout;
    }
    clearTimeout(timeoutId) {
        window.clearTimeout(timeoutId);
    }
}
const timer = new BrowserTimer();
export { timer };
//# sourceMappingURL=shims-browser.mjs.map