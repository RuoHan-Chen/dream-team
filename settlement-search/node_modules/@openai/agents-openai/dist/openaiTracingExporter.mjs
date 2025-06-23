import { BatchTraceProcessor, setTraceProcessors, } from '@openai/agents-core';
import { getTracingExportApiKey, HEADERS } from "./defaults.mjs";
import logger from "./logger.mjs";
/**
 * A tracing exporter that exports traces to OpenAI's tracing API.
 */
export class OpenAITracingExporter {
    #options;
    constructor(options = {}) {
        this.#options = {
            apiKey: options.apiKey ?? undefined,
            organization: options.organization ?? '',
            project: options.project ?? '',
            endpoint: options.endpoint ?? 'https://api.openai.com/v1/traces/ingest',
            maxRetries: options.maxRetries ?? 3,
            baseDelay: options.baseDelay ?? 1000,
            maxDelay: options.maxDelay ?? 30000,
        };
    }
    async export(items, signal) {
        const apiKey = this.#options.apiKey ?? getTracingExportApiKey();
        if (!apiKey) {
            logger.error('No API key provided for OpenAI tracing exporter. Exports will be skipped');
            return;
        }
        const payload = {
            data: items.map((items) => items.toJSON()).filter((item) => !!item),
        };
        let attempts = 0;
        let delay = this.#options.baseDelay;
        while (attempts < this.#options.maxRetries) {
            try {
                const response = await fetch(this.#options.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                        'OpenAI-Beta': 'traces=v1',
                        ...HEADERS,
                    },
                    body: JSON.stringify(payload),
                    signal,
                });
                if (response.ok) {
                    logger.debug(`Exported ${payload.data.length} items`);
                    return;
                }
                if (response.status >= 400 && response.status < 500) {
                    logger.error(`[non-fatal] Tracing client error ${response.status}: ${await response.text()}`);
                    return;
                }
                logger.warn(`[non-fatal] Tracing: server error ${response.status}, retrying.`);
            }
            catch (error) {
                logger.error('[non-fatal] Tracing: request failed: ', error);
            }
            if (signal?.aborted) {
                logger.error('Tracing: request aborted');
                return;
            }
            const sleepTime = delay + Math.random() * 0.1 * delay; // 10% jitter
            await new Promise((resolve) => setTimeout(resolve, sleepTime));
            delay = Math.min(delay * 2, this.#options.maxDelay);
            attempts++;
        }
        logger.error(`Tracing: failed to export traces after ${this.#options.maxRetries} attempts`);
    }
}
/**
 * Sets the OpenAI Tracing exporter as the default exporter with a BatchTraceProcessor handling the
 * traces
 */
export function setDefaultOpenAITracingExporter() {
    const exporter = new OpenAITracingExporter();
    const processor = new BatchTraceProcessor(exporter);
    setTraceProcessors([processor]);
}
//# sourceMappingURL=openaiTracingExporter.mjs.map