// noinspection JSUnusedGlobalSymbols

import path from 'path';
import fs from 'fs/promises';

/**
 * Represents the response object for returning, exiting the function.
 */
class AppExpressResponse {
    /** @type AppwriteFunctionContext */
    #context;

    /** @type Object */
    #response;

    /** @type {Object<string, string|number>} */
    #customHeaders;

    /**
     * Initializes a new instance of the `AppExpressResponse` class.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    constructor(context) {
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
     * @param {Object<string, string|number|boolean>} headers - Custom headers to send back to the source.
     * @throws {Error} - If the header value is not a string or a number.
     */
    setHeaders(headers) {
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
    clearHeaders() {
        this.#customHeaders = {};
    }

    /**
     * Send an empty response,\
     * typically used when there's no need to send back any data to the source.
     */
    empty() {
        this.#wrapReturnForSource(
            this.#response.send('', 204, this.#customHeaders),
        );
    }

    /**
     * Send a JSON response back to the source.
     *
     * @param {Object} data - The JSON data to send.
     * @param {number} statusCode=200 - The HTTP status code.
     */
    json(data, statusCode = 200) {
        this.#wrapReturnForSource(
            this.#response.json(data, statusCode, this.#customHeaders),
        );
    }

    /**
     * Redirect to a specified URL.
     *
     * @param {string} url - The URL to redirect to.
     */
    redirect(url) {
        this.#wrapReturnForSource(
            this.#response.redirect(url, 301, this.#customHeaders),
        );
    }

    /**
     * Send a response with a specific content type and status code.
     *
     * @param {any} content - The response body to send.
     * @param {number} statusCode=200 - The HTTP status code.
     * @param {string} contentType='text/plain' - The content type of the response.
     */
    send(content, statusCode = 200, contentType = 'text/plain') {
        this.#wrapReturnForSource(
            this.#response.send(content, statusCode, {
                'content-type': contentType,
                ...this.#customHeaders,
            }),
        );
    }

    /**
     * Send an HTML response back to the source which is rendered for the user.
     *
     * @param {string} html - The HTML string to send.
     * @param {number} statusCode=200 - The HTTP status code.
     *
     * @deprecated - Use `send(content, statusCode, 'text/html')` instead.\
     * This method will be removed in the upcoming versions.
     */
    html(html, statusCode = 200) {
        this.send(html, statusCode, 'text/html');
    }

    /**
     * Send HTML content from a file as a response back to the source which is rendered for the user.
     *
     * @param {string} filePath - The file path to read HTML from.
     * @param {number} statusCode=200 - The HTTP status code to send.
     */
    sendFile(filePath, statusCode = 200) {
        try {
            const promise = this.#readFile(filePath);
            this.#wrapForPromise(promise, statusCode);
        } catch (error) {
            this.#context.error(`Failed to read HTML file: ${error}`);
            this.send('Internal Server Error', 500, 'text/plain');
        }
    }

    /**
     * Render content from views using the pre-set engine.
     *
     * @param {string} filePath - The name of the file to render.\
     * **Note: If you have set up multiple engines, use the file extension as well.**
     * @param {Object} options - The options for the rendering engine.
     * @param {number} statusCode=200 - The HTTP status code.
     */
    render(filePath, options = {}, statusCode = 200) {
        const engines = this.#response._engine ?? new Map();

        if (!engines.size) throw new Error('No view engine found.');

        let usablePath;
        let fileExtension = /(?:\.([^.]+))?$/.exec(filePath)[1];

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

            const promise = new Promise((resolve, reject) => {
                engineSettings(usablePath, options, function (error, content) {
                    if (error) reject(error);
                    else resolve(content);
                });
            });

            this.#wrapForPromise(promise, statusCode);
        } catch (error) {
            this.#context.error(`Failed to render content: ${error}`);
            this.send('Internal Server Error', 500, 'text/plain');
        }
    }

    /**
     * Reads a file asynchronously and returns its contents as a Buffer.
     *
     * @param {string} path - The path to the file relative to a base path.
     * @returns {Promise<string|null>} - A promise that resolves with the file contents as a string or null if there was an error.
     */
    async #readFile(path) {
        const usablePath = this.#usablePath(path);

        try {
            return await fs.readFile(usablePath, 'utf8');
        } catch (error) {
            this.#context.error(`Failed to read file: ${error}`);
            return null;
        }
    }

    /**
     * Builds and returns a directly usable path to the file.
     *
     * @param {string} path - The base path of the file.
     * @returns {string} The full usable path.
     */
    #usablePath(path) {
        const filePath = this.#buildFilePath(path);
        return this.#basePath(filePath);
    }

    /**
     * Adds the views directory (if exists) as the correct prefix.
     *
     * @param {string} fileName - The name of the file.
     * @returns {string} The correct path for the given file.
     */
    #buildFilePath(fileName) {
        return this.#response._views
            ? `${this.#response._views}/${fileName}`
            : `${fileName}`;
    }

    /**
     * Returns the base path where the function is running on the server.
     *
     * @param append='' - Any path to append to the base path
     * @returns {string} The base path of the function directory.
     */
    #basePath(append = '') {
        return path.join(
            process.cwd(),
            `${this.#response._baseDirectory}`,
            `${append}`,
        );
    }

    /**
     * Helper function that wraps and returns back a Promise to render view.
     *
     * @param {Promise<any>} promise - Promise that returns a html string on completion.
     * @param {number} statusCode=200 - The HTTP status code.
     */
    #wrapForPromise(promise, statusCode) {
        const promiseDataType = this.#response.send(promise, statusCode, {
            'content-type': 'text/html',
            ...this.#customHeaders,
        });

        this.#wrapReturnForSource(promiseDataType);
    }

    /**
     * Wrap the return value for source.
     *
     * @param {any} data - The data to wrap for safety.
     */
    #wrapReturnForSource(data) {
        this.#checkIfAlreadyPrepared();

        this.#response.dynamic = data;
    }

    /**
     * Prevents multiple responses from being sent for a single request.
     *
     * @throws {Error} - Throws an error if there is an attempt to send a second response as it can lead to unexpected behavior.
     */
    #checkIfAlreadyPrepared() {
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

export default AppExpressResponse;
