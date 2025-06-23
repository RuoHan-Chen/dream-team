import { Handoff } from '../handoff';
import { Tool } from '../tool';
import { SerializedHandoff, SerializedTool } from '../model';
export declare function serializeTool(tool: Tool<any>): SerializedTool;
export declare function serializeHandoff(h: Handoff): SerializedHandoff;
