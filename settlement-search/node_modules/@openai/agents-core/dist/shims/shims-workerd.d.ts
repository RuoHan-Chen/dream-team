import { AsyncLocalStorage as BuiltinAsyncLocalStorage } from 'node:async_hooks';
export { EventEmitter as RuntimeEventEmitter } from 'node:events';
import { Timeout, Timer } from './interface';
export { EventEmitter, EventEmitterEvents } from './interface';
declare global {
    interface ImportMeta {
        env?: Record<string, string | undefined>;
    }
}
export declare function loadEnv(): Record<string, string | undefined>;
export { randomUUID } from 'node:crypto';
export { Readable } from 'node:stream';
export declare const ReadableStream: {
    new (underlyingSource: UnderlyingByteSource, strategy?: {
        highWaterMark?: number;
    }): ReadableStream<Uint8Array>;
    new <R = any>(underlyingSource: UnderlyingDefaultSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>;
    new <R = any>(underlyingSource?: UnderlyingSource<R>, strategy?: QueuingStrategy<R>): ReadableStream<R>;
    prototype: ReadableStream;
};
export declare const ReadableStreamController: {
    new (): ReadableStreamDefaultController;
    prototype: ReadableStreamDefaultController;
};
export declare const TransformStream: {
    new <I = any, O = any>(transformer?: Transformer<I, O>, writableStrategy?: QueuingStrategy<I>, readableStrategy?: QueuingStrategy<O>): TransformStream<I, O>;
    prototype: TransformStream;
};
export declare class AsyncLocalStorage<T> extends BuiltinAsyncLocalStorage<T> {
    enterWith(context: T): void;
}
export declare function isBrowserEnvironment(): boolean;
export declare function isTracingLoopRunningByDefault(): boolean;
/**
 * Right now Cloudflare Workers does not support MCP
 */
export { MCPServerStdio, MCPServerStreamableHttp } from './mcp-server/browser';
export { clearTimeout, setTimeout } from 'node:timers';
declare class NodeTimer implements Timer {
    constructor();
    setTimeout(callback: () => any, ms: number): Timeout;
    clearTimeout(timeoutId: Timeout | string | number | undefined): void;
}
declare const timer: NodeTimer;
export { timer };
