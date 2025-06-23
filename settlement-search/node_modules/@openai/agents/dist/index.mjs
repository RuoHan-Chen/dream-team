import { setDefaultModelProvider } from '@openai/agents-core';
import { OpenAIProvider } from '@openai/agents-openai';
import { setDefaultOpenAITracingExporter } from '@openai/agents-openai';
setDefaultModelProvider(new OpenAIProvider());
setDefaultOpenAITracingExporter();
export * from '@openai/agents-core';
export * from '@openai/agents-openai';
export * as realtime from '@openai/agents-realtime';
//# sourceMappingURL=index.mjs.map