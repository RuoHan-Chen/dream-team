import { safeExecute } from "./utils/safeExecute.js";
import { toFunctionToolName } from "./utils/tools.js";
import { getSchemaAndParserFromInputType } from "./utils/tools.js";
import { isZodObject } from "./utils/typeGuards.js";
import { ModelBehaviorError, UserError } from "./errors.js";
import logger from "./logger.js";
import { getCurrentSpan } from "./tracing/index.js";
import { toSmartString } from "./utils/smartString.js";
/**
 * Exposes a computer to the agent as a tool to be called
 *
 * @param options Additional configuration for the computer tool like specifying the location of your agent
 * @returns a computer tool definition
 */
export function computerTool(options) {
    return {
        type: 'computer',
        name: options.name ?? 'computer_use_preview',
        computer: options.computer,
    };
}
/**
 * Creates a hosted MCP tool definition.
 *
 * @param serverLabel - The label identifying the MCP server.
 * @param serverUrl - The URL of the MCP server.
 * @param requireApproval - Whether tool calls require approval.
 */
export function hostedMcpTool(options) {
    const providerData = typeof options.requireApproval === 'undefined' ||
        options.requireApproval === 'never'
        ? {
            type: 'mcp',
            server_label: options.serverLabel,
            server_url: options.serverUrl,
            require_approval: 'never',
            allowed_tools: toMcpAllowedToolsFilter(options.allowedTools),
            headers: options.headers,
        }
        : {
            type: 'mcp',
            server_label: options.serverLabel,
            server_url: options.serverUrl,
            allowed_tools: toMcpAllowedToolsFilter(options.allowedTools),
            headers: options.headers,
            require_approval: typeof options.requireApproval === 'string'
                ? 'always'
                : buildRequireApproval(options.requireApproval),
            on_approval: options.onApproval,
        };
    return {
        type: 'hosted_tool',
        name: 'hosted_mcp',
        providerData,
    };
}
/**
 * The default function to invoke when an error occurs while running the tool.
 *
 * Always returns `An error occurred while running the tool. Please try again. Error: <error details>`
 *
 * @param context An instance of the current RunContext
 * @param error The error that occurred
 */
function defaultToolErrorFunction(context, error) {
    const details = error instanceof Error ? error.toString() : String(error);
    return `An error occurred while running the tool. Please try again. Error: ${details}`;
}
/**
 * Exposes a function to the agent as a tool to be called
 *
 * @param options The options for the tool
 * @returns A new tool
 */
export function tool(options) {
    const name = options.name
        ? toFunctionToolName(options.name)
        : toFunctionToolName(options.execute.name);
    const toolErrorFunction = typeof options.errorFunction === 'undefined'
        ? defaultToolErrorFunction
        : options.errorFunction;
    if (!name) {
        throw new Error('Tool name cannot be empty. Either name your function or provide a name in the options.');
    }
    const strictMode = options.strict ?? true;
    if (!strictMode && isZodObject(options.parameters)) {
        throw new UserError('Strict mode is required for Zod parameters');
    }
    const { parser, schema: parameters } = getSchemaAndParserFromInputType(options.parameters, name);
    async function _invoke(runContext, input) {
        const [error, parsed] = await safeExecute(() => parser(input));
        if (error !== null) {
            if (logger.dontLogToolData) {
                logger.debug(`Invalid JSON input for tool ${name}`);
            }
            else {
                logger.debug(`Invalid JSON input for tool ${name}: ${input}`);
            }
            throw new ModelBehaviorError('Invalid JSON input for tool');
        }
        if (logger.dontLogToolData) {
            logger.debug(`Invoking tool ${name}`);
        }
        else {
            logger.debug(`Invoking tool ${name} with input ${input}`);
        }
        const result = await options.execute(parsed, runContext);
        const stringResult = toSmartString(result);
        if (logger.dontLogToolData) {
            logger.debug(`Tool ${name} completed`);
        }
        else {
            logger.debug(`Tool ${name} returned: ${stringResult}`);
        }
        return result;
    }
    async function invoke(runContext, input) {
        return _invoke(runContext, input).catch((error) => {
            if (toolErrorFunction) {
                const currentSpan = getCurrentSpan();
                currentSpan?.setError({
                    message: 'Error running tool (non-fatal)',
                    data: {
                        tool_name: name,
                        error: error.toString(),
                    },
                });
                return toolErrorFunction(runContext, error);
            }
            throw error;
        });
    }
    const needsApproval = typeof options.needsApproval === 'function'
        ? options.needsApproval
        : async () => typeof options.needsApproval === 'boolean'
            ? options.needsApproval
            : false;
    return {
        type: 'function',
        name,
        description: options.description,
        parameters,
        strict: strictMode,
        invoke,
        needsApproval,
    };
}
function buildRequireApproval(requireApproval) {
    const result = {};
    if (requireApproval.always) {
        result.always = { tool_names: requireApproval.always.toolNames };
    }
    if (requireApproval.never) {
        result.never = { tool_names: requireApproval.never.toolNames };
    }
    return result;
}
function toMcpAllowedToolsFilter(allowedTools) {
    if (typeof allowedTools === 'undefined') {
        return undefined;
    }
    if (Array.isArray(allowedTools)) {
        return { tool_names: allowedTools };
    }
    return { tool_names: allowedTools?.toolNames ?? [] };
}
//# sourceMappingURL=tool.js.map