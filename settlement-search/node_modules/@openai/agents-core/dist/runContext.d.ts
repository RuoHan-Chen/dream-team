import { RunToolApprovalItem } from './items';
import { UnknownContext } from './types';
import { Usage } from './usage';
type ApprovalRecord = {
    approved: boolean | string[];
    rejected: boolean | string[];
};
/**
 * A context object that is passed to the `Runner.run()` method.
 */
export declare class RunContext<TContext = UnknownContext> {
    #private;
    /**
     * The context object passed by you to the `Runner.run()`
     */
    context: TContext;
    /**
     * The usage of the agent run so far. For streamed responses, the usage will be stale until the
     * last chunk of the stream is processed.
     */
    usage: Usage;
    constructor(context?: TContext);
    /**
     * Check if a tool call has been approved.
     *
     * @param toolName - The name of the tool.
     * @param callId - The call ID of the tool call.
     * @returns `true` if the tool call has been approved, `false` if blocked and `undefined` if not yet approved or rejected.
     */
    isToolApproved({ toolName, callId }: {
        toolName: string;
        callId: string;
    }): boolean | undefined;
    /**
     * Approve a tool call.
     *
     * @param toolName - The name of the tool.
     * @param callId - The call ID of the tool call.
     */
    approveTool(approvalItem: RunToolApprovalItem, { alwaysApprove }?: {
        alwaysApprove?: boolean;
    }): void;
    /**
     * Reject a tool call.
     *
     * @param approvalItem - The tool approval item to reject.
     */
    rejectTool(approvalItem: RunToolApprovalItem, { alwaysReject }?: {
        alwaysReject?: boolean;
    }): void;
    toJSON(): {
        context: any;
        usage: Usage;
        approvals: Record<string, ApprovalRecord>;
    };
}
export {};
