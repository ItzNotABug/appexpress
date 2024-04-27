import path from 'path';
import fs from 'fs/promises';

/**
 * Represents the response object for returning, exiting the function.
 */
class AppExpressResponse {
    /**
     * Initializes a new instance of the `AppExpressResponse` class.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    constructor(context) {
        this._context = context;
        this._response = context.res;

        /** @type {Object<string, string|number>} */
        this._customHeaders = {};
    }

    /**
     * Add custom headers to send back to the source.
     *
     * **Note**: If you call `setHeaders` multiple times for a request,
     * remember that all the headers are combined when sent back to the source.
     *
     * **Also Note**: A duplicate header will be overridden with the value from the last call.
     *
     * @param {Object<string, string|number>} headers - Custom headers to send back to the source.
     * @throws {Error} - If the header value is not a string or a number.
     */
    setHeaders(headers) {
        for (const [headerKey, value] of Object.entries(headers)) {
            if (typeof value !== 'string' && typeof value !== 'number') {
                throw new Error(
                    `Custom headers only support values of type string or number. Provided type for key '${headerKey}': ${typeof value}.`,
                );
            }

            this._customHeaders[headerKey] = value;
        }
    }

    /**
     * Clear all the headers added via `setHeaders`.
     */
    clearHeaders() {
        this._customHeaders = {};
    }

    /**
     * Send an empty response,\
     * typically used when there's no need to send back any data to the source.
     */
    empty() {
        return this.#wrapReturnForSafety(this._response.empty());
    }

    /**
     * Send a JSON response back to the source.
     *
     * @param {Object} data - The JSON data to send.
     */
    json(data) {
        return this.#wrapReturnForSafety(this._response.json(data));
    }

    /**
     * Redirect to a specified URL.
     *
     * @param {string} url - The URL to redirect to.
     */
    redirect(url) {
        return this.#wrapReturnForSafety(this._response.redirect(url));
    }

    /**
     * Send a response with a specific content type and status code.
     *
     * @param {any} content - The response body to send.
     * @param {number} statusCode=200 - The HTTP status code.
     * @param {string} contentType='text/plain' - The content type of the response.
     */
    send(content, statusCode = 200, contentType = 'text/plain') {
        return this.#wrapReturnForSafety(
            this._response.send(content, statusCode, {
                'content-type': contentType,
                ...this._customHeaders,
            }),
        );
    }

    /**
     * Send an HTML response back to the source which is rendered for the user.
     *
     * @param {string} stringHtml - The HTML string to send.
     * @param {number} statusCode=200 - The HTTP status code.
     */
    html(stringHtml, statusCode = 200) {
        return this.send(stringHtml, statusCode, 'text/html');
    }

    /**
     * Send HTML content from a file as a response back to the source which is rendered for the user.
     *
     * @param {string} filePath - The file path to read HTML from.
     * @param {number} statusCode=200 - The HTTP status code to send.
     * @returns {Promise<*>} - A promise that resolves when the file has been sent.
     */
    async htmlFromFile(filePath, statusCode = 200) {
        try {
            const htmlContent = await this.readFile(filePath, 'utf8');
            return this.html(htmlContent, statusCode);
        } catch (error) {
            this._context.error(`Failed to read HTML file: ${error}`);
            return this.send('Internal Server Error', 500, 'text/plain');
        }
    }

    /**
     * Render content from views using the pre-set engine.
     *
     * @param {string} filePath - The name of the file to render.\
     * **Note: If you have set up multiple engines, use the file extension as well.**
     * @param {{}} options - The options for the rendering engine.
     * @param {number} statusCode=200 - The HTTP status code.
     * @returns {Promise<*>} A promise that resolves when the view engine rendered content has been sent.
     */
    async render(filePath, options = {}, statusCode = 200) {
        const engines = this._response._engine ?? new Map();

        if (!engines.size) throw Error('No view engine found.');

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

            // currently used only for `hbs`.
            this.#handleEngineConfigs(engineSettings.options, options);

            const renderedContent = await new Promise((resolve, reject) => {
                engineSettings.engine(
                    usablePath,
                    options,
                    function (error, content) {
                        if (error) reject(error);
                        else resolve(content);
                    },
                );
            });

            return this.html(renderedContent, statusCode);
        } catch (error) {
            console.log(error);
            this._context.error(`Failed to render content: ${error}`);
            return this.send('Internal Server Error', 500, 'text/plain');
        }
    }

    /**
     * Reads a file asynchronously and returns its contents as a Buffer.
     *
     * @param {string} path - The path to the file relative to a base path.
     * @param {string|null} [encoding=null] - The encoding to use. If null, the function returns a Buffer.
     * @returns {Promise<string|Buffer|null>} - A promise that resolves with the file contents as a Buffer or as a string or null if there was an error.
     */
    async readFile(path, encoding = null) {
        const options = {};

        const usablePath = this.#usablePath(path);
        if (encoding) options.encoding = encoding;

        try {
            return await fs.readFile(usablePath, options);
        } catch (error) {
            this._context.error(`Failed to read file: ${error}`);
            return null;
        }
    }

    /**
     * Add configs to option settings.
     *
     * @param {Object} engineOptions - The user set options from view engine map.
     * @param {Object} options - The options where the engine options are copied to.
     */
    #handleEngineConfigs(engineOptions, options) {
        options.settings = { ...engineOptions };
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
        return this._response._views
            ? `${this._response._views}/${fileName}`
            : `${fileName}`;
    }

    /**
     * Returns the base path where the function is running on the server.
     *
     * See [here](https://github.com/open-runtimes/open-runtimes/blob/16bf063b60f1f2a150b6caa9afdd2d1786e7ca35/runtimes/node-18.0/src/server.js#L6) how the exact path is derived.
     * @param append='' - Any path to append to the base path
     * @returns {string} The base path of the function directory.
     */
    #basePath(append = '') {
        return path.join(process.cwd(), `./src/function/${append}`);
    }

    /**
     * Wrap the return value for safety.
     *
     * This is helpful if the developer ever forgets to use `return` in the `RequestHandler`.
     *
     * @param {any} data - The data to wrap for safety.
     * @returns {data} The same data but safely wrapped in a dynamic variable.
     */
    #wrapReturnForSafety(data) {
        this._response.dynamic = data;
        return this._response.dynamic;
    }
}

export default AppExpressResponse;
