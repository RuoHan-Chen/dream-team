import { UsageData } from "./types/protocol.mjs";
/**
 * Tracks token usage and request counts for an agent run.
 */
export class Usage {
    /**
     * The number of requests made to the LLM API.
     */
    requests;
    /**
     * The number of input tokens used across all requests.
     */
    inputTokens;
    /**
     * The number of output tokens used across all requests.
     */
    outputTokens;
    /**
     * The total number of tokens sent and received, across all requests.
     */
    totalTokens;
    /**
     * Details about the input tokens used across all requests.
     */
    inputTokensDetails = [];
    /**
     * Details about the output tokens used across all requests.
     */
    outputTokensDetails = [];
    constructor(input) {
        if (typeof input === 'undefined') {
            this.requests = 0;
            this.inputTokens = 0;
            this.outputTokens = 0;
            this.totalTokens = 0;
            this.inputTokensDetails = [];
            this.outputTokensDetails = [];
        }
        else {
            this.requests = input?.requests ?? 1;
            this.inputTokens = input?.inputTokens ?? 0;
            this.outputTokens = input?.outputTokens ?? 0;
            this.totalTokens = input?.totalTokens ?? 0;
            this.inputTokensDetails = input?.inputTokensDetails
                ? [input.inputTokensDetails]
                : [];
            this.outputTokensDetails = input?.outputTokensDetails
                ? [input.outputTokensDetails]
                : [];
        }
    }
    add(newUsage) {
        this.requests += newUsage.requests;
        this.inputTokens += newUsage.inputTokens;
        this.outputTokens += newUsage.outputTokens;
        this.totalTokens += newUsage.totalTokens;
        if (newUsage.inputTokensDetails) {
            // The type does not allow undefined, but it could happen runtime
            this.inputTokensDetails.push(...newUsage.inputTokensDetails);
        }
        if (newUsage.outputTokensDetails) {
            // The type does not allow undefined, but it could happen runtime
            this.outputTokensDetails.push(...newUsage.outputTokensDetails);
        }
    }
}
export { UsageData };
//# sourceMappingURL=usage.mjs.map