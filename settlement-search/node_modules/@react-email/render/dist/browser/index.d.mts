import { HtmlToTextOptions, SelectorDefinition } from 'html-to-text';
import { Options as Options$1 } from 'prettier';

type Options = {
    /**
     * @deprecated use {@link pretty} instead
     */
    pretty?: boolean;
} & ({
    plainText?: false;
} | {
    plainText?: true;
    /**
     * These are options you can pass down directly to the library we use for
     * converting the rendered email's HTML into plain text.
     *
     * @see https://github.com/html-to-text/node-html-to-text
     */
    htmlToTextOptions?: HtmlToTextOptions;
});

declare const plainTextSelectors: SelectorDefinition[];

declare const pretty: (str: string, options?: Options$1) => Promise<string>;

declare const render: (node: React.ReactNode, options?: Options) => Promise<string>;

/**
 * @deprecated use {@link render}
 */
declare const renderAsync: (element: React.ReactElement, options?: Options) => Promise<string>;

export { type Options, plainTextSelectors, pretty, render, renderAsync };
