import { Agent } from './agent';
import { Handoff } from './handoff';
import { RunItem, RunToolApprovalItem } from './items';
import { ModelResponse } from './model';
import { ComputerTool, FunctionTool, HostedMCPTool } from './tool';
import { AgentInputItem, UnknownContext } from './types';
import { StreamedRunResult } from './result';
import { z } from '@openai/zod/v3';
import * as protocol from './types/protocol';
type ToolRunHandoff = {
    toolCall: protocol.FunctionCallItem;
    handoff: Handoff;
};
type ToolRunFunction<TContext = UnknownContext> = {
    toolCall: protocol.FunctionCallItem;
    tool: FunctionTool<TContext>;
};
type ToolRunComputer = {
    toolCall: protocol.ComputerUseCallItem;
    computer: ComputerTool;
};
type ToolRunMCPApprovalRequest = {
    requestItem: RunToolApprovalItem;
    mcpTool: HostedMCPTool;
};
export type ProcessedResponse<TContext = UnknownContext> = {
    newItems: RunItem[];
    handoffs: ToolRunHandoff[];
    functions: ToolRunFunction<TContext>[];
    computerActions: ToolRunComputer[];
    mcpApprovalRequests: ToolRunMCPApprovalRequest[];
    toolsUsed: string[];
    hasToolsOrApprovalsToRun(): boolean;
};
export declare const nextStepSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"next_step_handoff">;
    newAgent: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    type: "next_step_handoff";
    newAgent?: any;
}, {
    type: "next_step_handoff";
    newAgent?: any;
}>, z.ZodObject<{
    type: z.ZodLiteral<"next_step_final_output">;
    output: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "next_step_final_output";
    output: string;
}, {
    type: "next_step_final_output";
    output: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"next_step_run_again">;
}, "strip", z.ZodTypeAny, {
    type: "next_step_run_again";
}, {
    type: "next_step_run_again";
}>, z.ZodObject<{
    type: z.ZodLiteral<"next_step_interruption">;
    data: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    type: "next_step_interruption";
    data: Record<string, any>;
}, {
    type: "next_step_interruption";
    data: Record<string, any>;
}>]>;
export type NextStep = z.infer<typeof nextStepSchema>;
declare class SingleStepResult {
    /**
     * The input items i.e. the items before run() was called. May be muted by handoff input filters
     */
    originalInput: string | AgentInputItem[];
    /**
     * The model response for the current step
     */
    modelResponse: ModelResponse;
    /**
     * The items before the current step was executed
     */
    preStepItems: RunItem[];
    /**
     * The items after the current step was executed
     */
    newStepItems: RunItem[];
    /**
     * The next step to execute
     */
    nextStep: NextStep;
    constructor(
    /**
     * The input items i.e. the items before run() was called. May be muted by handoff input filters
     */
    originalInput: string | AgentInputItem[], 
    /**
     * The model response for the current step
     */
    modelResponse: ModelResponse, 
    /**
     * The items before the current step was executed
     */
    preStepItems: RunItem[], 
    /**
     * The items after the current step was executed
     */
    newStepItems: RunItem[], 
    /**
     * The next step to execute
     */
    nextStep: NextStep);
    /**
     * The items generated during the agent run (i.e. everything generated after originalInput)
     */
    get generatedItems(): RunItem[];
}
export declare function addStepToRunResult(result: StreamedRunResult<any, any>, step: SingleStepResult): void;
export declare class AgentToolUseTracker {
    #private;
    addToolUse(agent: Agent<any, any>, toolNames: string[]): void;
    hasUsedTools(agent: Agent<any, any>): boolean;
    toJSON(): Record<string, string[]>;
}
export {};
