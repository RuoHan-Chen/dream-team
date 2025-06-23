export function serializeTool(tool) {
    if (tool.type === 'function') {
        return {
            type: 'function',
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            strict: tool.strict,
        };
    }
    if (tool.type === 'computer') {
        return {
            type: 'computer',
            name: tool.name,
            environment: tool.computer.environment,
            dimensions: tool.computer.dimensions,
        };
    }
    return {
        type: 'hosted_tool',
        name: tool.name,
        providerData: tool.providerData,
    };
}
export function serializeHandoff(h) {
    return {
        toolName: h.toolName,
        toolDescription: h.toolDescription,
        inputJsonSchema: h.inputJsonSchema,
        strictJsonSchema: h.strictJsonSchema,
    };
}
//# sourceMappingURL=serialize.js.map