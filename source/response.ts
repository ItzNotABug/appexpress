import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types';
import type {
    AppwriteContext,
    AppwriteResponse,
    AppwriteResponseObject,
} from './types';

/**
 * Represents the response object for returning, exiting the function.
 */
export default class AppExpressResponse {
    readonly #context: AppwriteContext;
    readonly #response: AppwriteResponse;
    #customHeaders: Record<string, string | number | boolean>;

    /**
     * Initializes a new instance of the `AppExpressResponse` class.
     *
     * @param context - The context provided by the executed `Appwrite Function`.
     */
    constructor(context: AppwriteContext) {
        this.#context = context;
        this.#response = context.res;

        // custom headers.
        this.#customHeaders = {};
    }

    /**
     * Add custom headers to send back to the source.
     *
     * **Note**: If you call `setHeaders` multiple times for a request,
     * remember that all the headers are combined when sent back to the source.
     *
     * **Also Note**: A duplicate header will be overridden with the value from the last call.
     *
     * @param headers - Custom headers to send back to the source.
     * @throws If the header value is not a string, number, or boolean.
     */
    setHeaders(
        headers: Record<string, string | number | boolean | unknown>,
    ): void {
        for (const [headerKey, value] of Object.entries(headers)) {
            if (
                typeof value !== 'string' &&
                typeof value !== 'number' &&
                typeof value !== 'boolean'
            ) {
                throw new Error(
                    `Custom headers only support values of type string, number or a boolean. Provided type for key '${headerKey}': ${typeof value}.`,
                );
            }

            this.#customHeaders[headerKey] = value;
        }
    }

    /**
     * Clear all the headers added via `setHeaders`.
     */
    clearHeaders(): void {
        this.#customHeaders = {};
    }

    /**
     * Send an empty response,\
     * typically used when there's no need to send back any data to the source.
     */
    empty(): void {
        this.#wrapReturnForSource(
            this.#response.text('', 204, this.#customHeaders),
        );
    }

    /**
     * Send a JSON response back to the source.
     *
     * @param data - The JSON data to send.
     * @param statusCode - The HTTP status code.
     */
    json(data: unknown, statusCode: number = 200): void {
        this.#wrapReturnForSource(
            this.#response.json(data, statusCode, this.#customHeaders),
        );
    }

    /**
     * Redirect to a specified URL.
     *
     * @param url - The URL to redirect to.
     */
    redirect(url: string): void {
        this.#wrapReturnForSource(
            this.#response.redirect(url, 301, this.#customHeaders),
        );
    }

    /**
     * Send a response with a specific content type and status code.
     *
     * @param content - The response body to send.
     * @param statusCode - The HTTP status code.
     * @param contentType - The content type of the response.
     */
    text(
        content: unknown,
        statusCode: number = 200,
        contentType: string = 'text/plain',
    ): void {
        this.#wrapReturnForSource(
            this.#response.text(content as string, statusCode, {
                'content-type': contentType,
                ...this.#customHeaders,
            }),
        );
    }

    /**
     * Send a response with a specific content type and status code.
     *
     * @param content - The response body to send.
     * @param statusCode - The HTTP status code.
     * @param contentType - The content type of the response.
     *
     * @deprecated Use `text` instead.
     */
    send(
        content: unknown,
        statusCode: number = 200,
        contentType: string = 'text/plain',
    ): void {
        this.#wrapReturnForSource(
            this.#response.send(content, statusCode, {
                'content-type': contentType,
                ...this.#customHeaders,
            }),
        );
    }

    /**
     * Send content from a file as a response back to the source.
     *
     * @param contentOrPath - The file content or the path.
     * @param statusCode - The HTTP status code to send.
     * @param contentType - The content type of the response. If passing file path, content type is auto-decided.
     */
    binary(
        contentOrPath: Buffer | string,
        statusCode: number = 200,
        contentType: string = 'text/plain',
    ): void {
        try {
            if (typeof contentOrPath === 'string') {
                // file path > read its content.
                const detectedContentType = mime.lookup(contentOrPath);
                this.#customHeaders['content-type'] =
                    detectedContentType || contentType;

                this.#wrapForPromise(this.#readFile(contentOrPath), statusCode);
            } else {
                // direct read the content
                this.#customHeaders['content-type'] = contentType;
                this.#wrapForPromise(
                    new Promise((resolve) => resolve(contentOrPath)),
                    statusCode,
                );
            }
        } catch (error) {
            this.#context.error(`Failed to read binary file: ${error}`);
            this.text('Internal Server Error', 500, 'text/plain');
        }
    }

    /**
     * Render content from views using the pre-set engine.
     *
     * @param filePath - The name of the file to render.\
     * **Note: If you have set up multiple engines, use the file extension as well.**
     * @param options - The options for the rendering engine.
     * @param statusCode - The HTTP status code.
     */
    render(
        filePath: string,
        options: Record<string, unknown> = {},
        statusCode: number = 200,
    ): void {
        const engines = this.#response._engine ?? new Map();

        if (!engines.size) throw new Error('No view engine found.');

        let usablePath: string;
        let fileExtension = /(?:\.([^.]+))?$/.exec(filePath)?.[1];

        if (!fileExtension) {
            if (engines.size === 1) {
                fileExtension = engines.keys().next().value;
                usablePath = `${filePath}.${fileExtension}`;
            } else {
                throw new Error(
                    'You seem to have set multiple view engines; please use file paths with extension.',
                );
            }
        } else {
            usablePath = filePath;
        }

        try {
            usablePath = this.#usablePath(usablePath);
            const engineSettings = engines.get(fileExtension);

            // Handlebars engine requires default settings, originally supplied by express.
            // Note: If 'options' already includes a 'settings' object, it will be preserved.
            options.settings = options.settings || {};

            const promise = new Promise<string>((resolve, reject) => {
                engineSettings(
                    usablePath,
                    options,
                    function (error: any, content: string) {
                        if (error) reject(error);
                        else resolve(content);
                    },
                );
            });

            this.#customHeaders['content-type'] = 'text/html';
            this.#wrapReturnForSource(
                this.#response.binary(promise, statusCode, this.#customHeaders),
            );
        } catch (error) {
            this.#context.error(`Failed to render content: ${error}`);
            this.text('Internal Server Error', 500, 'text/plain');
        }
    }

    /**
     * Reads a file asynchronously and returns its contents as a Buffer.
     *
     * @param path - The path to the file relative to a base path.
     * @returns A promise that resolves with the file contents as a string or null if there was an error.
     */
    async #readFile(path: string): Promise<string> {
        const usablePath = this.#usablePath(path);

        try {
            return await fs.readFile(usablePath, 'utf8');
        } catch (error) {
            this.#context.error(`Failed to read file: ${error}`);
            throw error;
        }
    }

    /**
     * Builds and returns a directly usable path to the file.
     *
     * @param path - The base path of the file.
     * @returns The full usable path.
     */
    #usablePath(path: string): string {
        const filePath = this.#buildFilePath(path);
        return this.#basePath(filePath);
    }

    /**
     * Adds the views directory (if exists) as the correct prefix.
     *
     * @param fileName - The name of the file.
     * @returns The correct path for the given file.
     */
    #buildFilePath(fileName: string): string {
        return this.#response._views
            ? `${this.#response._views}/${fileName}`
            : `${fileName}`;
    }

    /**
     * Returns the base path where the function is running on the server.
     *
     * @param append - Any path to append to the base path
     * @returns The base path of the function directory.
     */
    #basePath(append: string = ''): string {
        return path.join(
            process.cwd(),
            `${this.#response._baseDirectory}`,
            `${append}`,
        );
    }

    /**
     * Helper function that wraps and returns back a Promise to render view.
     *
     * @param promise - Promise that returns a html string on completion.
     * @param statusCode - The HTTP status code.
     */
    #wrapForPromise(promise: Promise<any>, statusCode: number = 200) {
        let promiseDataType = this.#response.binary(promise, statusCode, {
            ...this.#customHeaders,
        });

        this.#wrapReturnForSource(promiseDataType);
    }

    /**
     * Wrap the return value for source.
     *
     * @param data - The data to wrap for safety.
     */
    #wrapReturnForSource(data: unknown): void {
        this.#checkIfAlreadyPrepared();

        this.#response.dynamic = data as AppwriteResponseObject;
    }

    /**
     * Prevents multiple responses from being sent for a single request.
     *
     * @throws Throws an error if there is an attempt to send a second response as it can lead to unexpected behavior.
     */
    #checkIfAlreadyPrepared(): void {
        if (this.#response.dynamic) {
            const error = new Error(
                'A response has already been prepared. Cannot initiate another response. ' +
                    'Did you call response methods like `response.send` or `response.json` multiple times in the same request handler?',
            );
            error.stack = '';
            throw error;
        }
    }
}
