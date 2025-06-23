import { UserMessageItem, AssistantMessageItem, SystemMessageItem, HostedToolCallItem, FunctionCallItem, ComputerUseCallItem, FunctionCallResultItem, ComputerCallResultItem, ReasoningItem, UnknownItem } from './protocol';
/**
 * Context that is being passed around as part of the session is unknown
 */
export type UnknownContext = unknown;
/**
 * Agent is expected to output text
 */
export type TextOutput = 'text';
/**
 * Agent output items
 */
export type AgentOutputItem = UserMessageItem | AssistantMessageItem | SystemMessageItem | HostedToolCallItem | FunctionCallItem | ComputerUseCallItem | FunctionCallResultItem | ComputerCallResultItem | ReasoningItem | UnknownItem;
/**
 * Agent input
 */
export type AgentInputItem = UserMessageItem | AssistantMessageItem | SystemMessageItem | HostedToolCallItem | FunctionCallItem | ComputerUseCallItem | FunctionCallResultItem | ComputerCallResultItem | ReasoningItem | UnknownItem;
