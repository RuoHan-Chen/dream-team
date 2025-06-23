import { TracingProcessor } from './processor';
export type TraceOptions = {
    traceId?: string;
    name?: string;
    groupId?: string;
    metadata?: Record<string, any>;
    started?: boolean;
};
export declare class Trace {
    #private;
    type: "trace";
    traceId: string;
    name: string;
    groupId: string | null;
    metadata?: Record<string, any>;
    constructor(options: TraceOptions, processor?: TracingProcessor);
    start(): Promise<void>;
    end(): Promise<void>;
    clone(): Trace;
    toJSON(): object | null;
}
export declare class NoopTrace extends Trace {
    constructor();
    start(): Promise<void>;
    end(): Promise<void>;
    toJSON(): object | null;
}
