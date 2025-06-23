import type { ZodObject } from 'zod/v3';
/**
 * Verifies that an input is a ZodObject without needing to have Zod at runtime since it's an
 * optional dependency.
 * @param input
 * @returns
 */
export declare function isZodObject(input: unknown): input is ZodObject<any>;
/**
 * Verifies that an input is an object with an `input` property.
 * @param input
 * @returns
 */
export declare function isAgentToolInput(input: unknown): input is {
    input: string;
};
