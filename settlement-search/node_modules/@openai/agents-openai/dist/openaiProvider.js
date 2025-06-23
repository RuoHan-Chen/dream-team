import OpenAI from 'openai';
import { DEFAULT_OPENAI_MODEL, getDefaultOpenAIClient, getDefaultOpenAIKey, shouldUseResponsesByDefault, } from "./defaults.js";
import { OpenAIResponsesModel } from "./openaiResponsesModel.js";
import { OpenAIChatCompletionsModel } from "./openaiChatCompletionsModel.js";
/**
 * The provider of OpenAI's models (or Chat Completions compatible ones)
 */
export class OpenAIProvider {
    #client;
    #useResponses;
    #options;
    constructor(options = {}) {
        this.#options = options;
        if (this.#options.openAIClient) {
            if (this.#options.apiKey) {
                throw new Error('Cannot provide both apiKey and openAIClient');
            }
            if (this.#options.baseURL) {
                throw new Error('Cannot provide both baseURL and openAIClient');
            }
            this.#client = this.#options.openAIClient;
        }
        this.#useResponses = this.#options.useResponses;
    }
    /**
     * Lazy loads the OpenAI client to not throw an error if you don't have an API key set but
     * never actually use the client.
     */
    #getClient() {
        // If the constructor does not accept the OpenAI client,
        if (!this.#client) {
            this.#client =
                // this provider checks if there is the default client first,
                getDefaultOpenAIClient() ??
                    // and then manually creates a new one.
                    new OpenAI({
                        apiKey: this.#options.apiKey ?? getDefaultOpenAIKey(),
                        baseURL: this.#options.baseURL,
                        organization: this.#options.organization,
                        project: this.#options.project,
                    });
        }
        return this.#client;
    }
    async getModel(modelName) {
        const model = modelName || DEFAULT_OPENAI_MODEL;
        const useResponses = this.#useResponses ?? shouldUseResponsesByDefault();
        if (useResponses) {
            return new OpenAIResponsesModel(this.#getClient(), model);
        }
        return new OpenAIChatCompletionsModel(this.#getClient(), model);
    }
}
//# sourceMappingURL=openaiProvider.js.map