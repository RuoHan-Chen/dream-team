import { defaultProcessor } from "./processor.mjs";
import { generateTraceId } from "./utils.mjs";
export class Trace {
    type = 'trace';
    traceId;
    name;
    groupId = null;
    metadata;
    #processor;
    #started;
    constructor(options, processor) {
        this.traceId = options.traceId ?? generateTraceId();
        this.name = options.name ?? 'Agent workflow';
        this.groupId = options.groupId ?? null;
        this.metadata = options.metadata ?? {};
        this.#processor = processor ?? defaultProcessor();
        this.#started = options.started ?? false;
    }
    async start() {
        if (this.#started) {
            return;
        }
        this.#started = true;
        await this.#processor.onTraceStart(this);
    }
    async end() {
        if (!this.#started) {
            return;
        }
        this.#started = false;
        await this.#processor.onTraceEnd(this);
    }
    clone() {
        return new Trace({
            traceId: this.traceId,
            name: this.name,
            groupId: this.groupId ?? undefined,
            metadata: this.metadata,
            started: this.#started,
        });
    }
    toJSON() {
        return {
            object: this.type,
            id: this.traceId,
            workflow_name: this.name,
            group_id: this.groupId,
            metadata: this.metadata,
        };
    }
}
export class NoopTrace extends Trace {
    constructor() {
        super({});
    }
    async start() {
        return;
    }
    async end() {
        return;
    }
    toJSON() {
        return null;
    }
}
//# sourceMappingURL=traces.mjs.map