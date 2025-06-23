import { z } from '@openai/zod/v3';
export declare const baseItemSchema: z.ZodObject<{
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    itemId: string;
}, {
    itemId: string;
}>;
export declare const realtimeMessageItemSchema: z.ZodDiscriminatedUnion<"role", [z.ZodObject<{
    itemId: z.ZodString;
    previousItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodLiteral<"message">;
    role: z.ZodLiteral<"system">;
    content: z.ZodArray<z.ZodObject<{
        type: z.ZodLiteral<"input_text">;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "input_text";
        text: string;
    }, {
        type: "input_text";
        text: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "message";
    itemId: string;
    role: "system";
    content: {
        type: "input_text";
        text: string;
    }[];
    previousItemId?: string | null | undefined;
}, {
    type: "message";
    itemId: string;
    role: "system";
    content: {
        type: "input_text";
        text: string;
    }[];
    previousItemId?: string | null | undefined;
}>, z.ZodObject<{
    itemId: z.ZodString;
    previousItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodLiteral<"message">;
    role: z.ZodLiteral<"user">;
    status: z.ZodEnum<["in_progress", "completed"]>;
    content: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"input_text">;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "input_text";
        text: string;
    }, {
        type: "input_text";
        text: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"input_audio">;
        audio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        transcript: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "input_audio";
        transcript: string | null;
        audio?: string | null | undefined;
    }, {
        type: "input_audio";
        transcript: string | null;
        audio?: string | null | undefined;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "message";
    status: "in_progress" | "completed";
    itemId: string;
    role: "user";
    content: ({
        type: "input_text";
        text: string;
    } | {
        type: "input_audio";
        transcript: string | null;
        audio?: string | null | undefined;
    })[];
    previousItemId?: string | null | undefined;
}, {
    type: "message";
    status: "in_progress" | "completed";
    itemId: string;
    role: "user";
    content: ({
        type: "input_text";
        text: string;
    } | {
        type: "input_audio";
        transcript: string | null;
        audio?: string | null | undefined;
    })[];
    previousItemId?: string | null | undefined;
}>, z.ZodObject<{
    itemId: z.ZodString;
    previousItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodLiteral<"message">;
    role: z.ZodLiteral<"assistant">;
    status: z.ZodEnum<["in_progress", "completed", "incomplete"]>;
    content: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"text">;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text";
        text: string;
    }, {
        type: "text";
        text: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"audio">;
        audio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        transcript: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        type: "audio";
        audio?: string | null | undefined;
        transcript?: string | null | undefined;
    }, {
        type: "audio";
        audio?: string | null | undefined;
        transcript?: string | null | undefined;
    }>]>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "message";
    status: "in_progress" | "completed" | "incomplete";
    itemId: string;
    role: "assistant";
    content: ({
        type: "text";
        text: string;
    } | {
        type: "audio";
        audio?: string | null | undefined;
        transcript?: string | null | undefined;
    })[];
    previousItemId?: string | null | undefined;
}, {
    type: "message";
    status: "in_progress" | "completed" | "incomplete";
    itemId: string;
    role: "assistant";
    content: ({
        type: "text";
        text: string;
    } | {
        type: "audio";
        audio?: string | null | undefined;
        transcript?: string | null | undefined;
    })[];
    previousItemId?: string | null | undefined;
}>]>;
export declare const realtimeToolCallItem: z.ZodObject<{
    itemId: z.ZodString;
    previousItemId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    type: z.ZodLiteral<"function_call">;
    status: z.ZodEnum<["in_progress", "completed"]>;
    arguments: z.ZodString;
    name: z.ZodString;
    output: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "function_call";
    name: string;
    status: "in_progress" | "completed";
    output: string | null;
    itemId: string;
    arguments: string;
    previousItemId?: string | null | undefined;
}, {
    type: "function_call";
    name: string;
    status: "in_progress" | "completed";
    output: string | null;
    itemId: string;
    arguments: string;
    previousItemId?: string | null | undefined;
}>;
export type RealtimeBaseItem = z.infer<typeof baseItemSchema>;
export type RealtimeMessageItem = z.infer<typeof realtimeMessageItemSchema>;
export type RealtimeToolCallItem = z.infer<typeof realtimeToolCallItem>;
export type RealtimeItem = RealtimeMessageItem | RealtimeToolCallItem;
